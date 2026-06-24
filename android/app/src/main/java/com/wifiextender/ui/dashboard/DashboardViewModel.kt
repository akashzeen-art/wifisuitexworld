package com.wifiextender.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.model.*
import com.wifiextender.utils.DeviceNameResolver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DashboardViewModel : ViewModel() {

    private val api get() = RetrofitClient.apiService

    private val _subscription = MutableLiveData<Subscription?>()
    val subscription: LiveData<Subscription?> = _subscription

    private val _licenses = MutableLiveData<List<License>>()
    val licenses: LiveData<List<License>> = _licenses

    private val _deviceStats = MutableLiveData<DeviceStats?>()
    val deviceStats: LiveData<DeviceStats?> = _deviceStats

    private val _devices = MutableLiveData<List<Device>>()
    val devices: LiveData<List<Device>> = _devices

    private val _plans = MutableLiveData<List<Plan>>()
    val plans: LiveData<List<Plan>> = _plans

    private val _allSubs = MutableLiveData<List<Subscription>>()
    val allSubs: LiveData<List<Subscription>> = _allSubs

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _requestResult = MutableLiveData<String?>()
    val requestResult: LiveData<String?> = _requestResult

    // Device limit upgrade alert
    private val _upgradeRequired = MutableLiveData<String?>()
    val upgradeRequired: LiveData<String?> = _upgradeRequired

    private val _deviceScanComplete = MutableLiveData(false)
    val deviceScanComplete: LiveData<Boolean> = _deviceScanComplete

    private val _hotspotActive = MutableLiveData(false)
    val hotspotActive: LiveData<Boolean> = _hotspotActive

    private val _liveClients = MutableLiveData<List<com.wifiextender.utils.ConnectedClient>>(emptyList())
    val liveClients: LiveData<List<com.wifiextender.utils.ConnectedClient>> = _liveClients

    private var monitoringAttached = false
    private var lastApiSyncAt = 0L
    private var appContext: android.content.Context? = null
    private var lastDisplayedDevices: List<Device> = emptyList()

    fun setHotspotActive(active: Boolean) {
        _hotspotActive.postValue(active)
        appContext?.let { ctx ->
            val hm = com.wifiextender.utils.HotspotManager.getInstance(ctx)
            val monitor = com.wifiextender.utils.HotspotRealtimeMonitor.getInstance(ctx)
            if (active) {
                hm.userHotspotActive = true
                monitor.forceRefresh()
            } else {
                hm.markHotspotStopped()
                monitor.clearSnapshot()
                _liveClients.postValue(emptyList())
            }
        }
    }

    /** Production real-time device sync — call once from MainActivity. */
    fun startRealtimeDeviceMonitoring(context: android.content.Context) {
        if (monitoringAttached) return
        monitoringAttached = true
        appContext = context.applicationContext
        val monitor = com.wifiextender.utils.HotspotRealtimeMonitor.getInstance(context)
        monitor.addListener { clients ->
            publishLocalClients(context.applicationContext, clients)
            val hm = com.wifiextender.utils.HotspotManager.getInstance(context)
            val hotspotOn = _hotspotActive.value == true || hm.isHotspotLikelyActive()
            if (hotspotOn && clients.isNotEmpty()) {
                val now = System.currentTimeMillis()
                if (now - lastApiSyncAt > 30_000) {
                    lastApiSyncAt = now
                    scanAndReportDevices(context.applicationContext, forceRefresh = false, showUserErrors = false)
                }
            }
        }
        monitor.start()
    }

    fun loadHome() {
        _loading.value = true
        viewModelScope.launch {
            var partialFailure = false
            try {
                try {
                    val subResp = api.getActiveSubscription()
                    _subscription.value = when {
                        subResp.isSuccessful -> subResp.body()
                        subResp.code() == 404 -> null
                        else -> _subscription.value
                    }
                } catch (e: Exception) {
                    partialFailure = true
                    _subscription.value = null
                }

                try {
                    val licResp = api.getLicenses()
                    if (licResp.isSuccessful) {
                        _licenses.value = licResp.body() ?: emptyList()
                    }
                } catch (e: Exception) {
                    partialFailure = true
                    _licenses.value = emptyList()
                }

                try {
                    val statsResp = api.getDeviceStats()
                    if (statsResp.isSuccessful) {
                        mergeDeviceStatsWithLocal(statsResp.body())
                    }
                } catch (e: Exception) {
                    partialFailure = true
                }

                if (partialFailure) {
                    _error.value = "Could not reach server for some data. Local hotspot scan still works."
                }
            } finally {
                _loading.value = false
            }
        }
    }

    /** Keep local hotspot scan counts visible on Home even when API stats lag. */
    private fun mergeDeviceStatsWithLocal(fromApi: DeviceStats?) {
        val localOnline = _arpDeviceCount.value ?: 0
        if (fromApi == null) {
            if (localOnline > 0) {
                _deviceStats.value = DeviceStats(
                    total = localOnline.toLong(),
                    online = localOnline.toLong(),
                    blocked = 0,
                    offline = 0,
                    totalBytesSent = 0,
                    totalBytesReceived = 0
                )
            }
            return
        }
        val online = maxOf(fromApi.online, localOnline.toLong())
        val total = maxOf(fromApi.total, online)
        _deviceStats.value = fromApi.copy(
            online = online,
            total = total,
            offline = maxOf(0, total - online - fromApi.blocked)
        )
    }

    private fun updateLocalDeviceStats(onlineCount: Int) {
        if (onlineCount <= 0) return
        _arpDeviceCount.postValue(onlineCount)
        mergeDeviceStatsWithLocal(_deviceStats.value)
    }

    fun loadDevices() {
        viewModelScope.launch {
            try {
                val resp = api.getDevices()
                if (resp.isSuccessful) _devices.value = resp.body() ?: emptyList()
                else _devices.value = emptyList()
            } catch (e: Exception) {
                _devices.value = emptyList()
            }
        }
    }

    // Direct ARP device count — no backend needed
    private val _arpDeviceCount = MutableLiveData<Int>(0)
    val arpDeviceCount: LiveData<Int> = _arpDeviceCount

    fun scanAndReportDevices(
        context: android.content.Context,
        forceRefresh: Boolean = false,
        showUserErrors: Boolean = false
    ) {
        viewModelScope.launch {
            _deviceScanComplete.postValue(false)
            try {
                val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(context)
                if (hotspotManager.syncHotspotStateFromSystem()) {
                    _hotspotActive.postValue(true)
                } else if (_hotspotActive.value == true) {
                    hotspotManager.userHotspotActive = true
                }
                if (forceRefresh) hotspotManager.invalidateClientScanCache()

                val discovered = withContext(Dispatchers.IO) {
                    hotspotManager.ensureClientListeners()
                    hotspotManager.discoverConnectedClients(deepScan = true)
                }
                val systemClients = withContext(Dispatchers.Main) {
                    hotspotManager.getCurrentConnectedClients()
                }
                val clients = hotspotManager.mergeConnectedClientsForDisplay(discovered, systemClients, _liveClients.value.orEmpty())
                _liveClients.postValue(clients)

                val reports = buildDeviceReports(clients, hotspotManager)
                updateLocalDeviceStats(reports.size)

                val existingByMac = _devices.value.orEmpty().associateBy { it.macAddress.uppercase() }
                val localDisplay = clientsToDevices(clients, hotspotManager, existingByMac)
                if (localDisplay.isNotEmpty()) {
                    lastDisplayedDevices = localDisplay
                    _devices.postValue(localDisplay)
                } else if (!hotspotManager.isHotspotLikelyActive() && _hotspotActive.value != true) {
                    // Only clear when hotspot is definitely off
                    _devices.postValue(emptyList())
                    lastDisplayedDevices = emptyList()
                }

                if (reports.isEmpty()) {
                    if (showUserErrors && hotspotManager.isHotspotLikelyActive()) {
                        _error.postValue(
                            "No devices detected yet. Keep hotspot on, wait 30s, then pull down to refresh."
                        )
                    }
                    return@launch
                }

                try {
                    val resp = api.reportDevicesBulk(BulkDeviceReport(reports))
                    if (!resp.isSuccessful) {
                        val errorBody = resp.errorBody()?.string() ?: ""
                        when {
                            errorBody.contains("No active subscription") ->
                                { /* local list already shown */ }
                            errorBody.contains("UPGRADE_REQUIRED") || resp.code() == 403 || resp.code() == 409 ->
                                _upgradeRequired.postValue(errorBody.ifBlank { "Device limit reached for your plan." })
                            else ->
                                _error.postValue("Could not sync devices to server. Showing local scan.")
                        }
                    } else {
                        val fromBulk = resp.body() ?: emptyList()
                        val merged = mergeWithLiveScan(reports, fromBulk)
                        val existingByMac = merged.associateBy { it.macAddress.uppercase() }
                        _devices.postValue(
                            when {
                                merged.isNotEmpty() -> merged
                                reports.isNotEmpty() -> reports.toDeviceList(existingByMac)
                                else -> _devices.value ?: emptyList()
                            }
                        )
                    }
                } catch (_: Exception) {
                    _error.postValue("Could not sync devices to server. Showing local scan.")
                }
            } catch (e: Exception) {
                if (showUserErrors) {
                    _error.postValue("Device scan failed. Try again in a few seconds.")
                }
            } finally {
                _deviceScanComplete.postValue(true)
            }
        }
    }

    fun publishLocalClients(context: android.content.Context, clients: List<com.wifiextender.utils.ConnectedClient>) {
        val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(context)
        hotspotManager.assumeHotspotSharingActive()
        if (hotspotManager.syncHotspotStateFromSystem()) {
            _hotspotActive.postValue(true)
        }

        val effectiveClients = hotspotManager.mergeConnectedClientsForDisplay(
            clients,
            hotspotManager.getCurrentConnectedClients(),
            _liveClients.value.orEmpty()
        )
        if (effectiveClients.isEmpty()) {
            _liveClients.postValue(emptyList())
        } else {
            _liveClients.postValue(effectiveClients)
        }

        val reports = buildDeviceReports(effectiveClients, hotspotManager)
        updateLocalDeviceStats(maxOf(reports.size, effectiveClients.size))

        val existingByMac = _devices.value.orEmpty().associateBy { it.macAddress.uppercase() }
        val display = mapClientsForDevicesTab(context, effectiveClients, existingByMac)
        if (display.isNotEmpty()) {
            lastDisplayedDevices = display
            _devices.postValue(display)
        }
    }

    /** Devices tab — convert ConnectedClient list (same as Hotspot tab). */
    fun mapClientsForDevicesTab(
        context: android.content.Context,
        clients: List<com.wifiextender.utils.ConnectedClient>,
        existingByMac: Map<String, Device> = emptyMap()
    ): List<Device> {
        val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(context)
        val merged = hotspotManager.mergeConnectedClientsForDisplay(
            clients,
            hotspotManager.getCurrentConnectedClients()
        )
        return clientsToDevices(merged, hotspotManager, existingByMac).filter { !it.blocked }
    }

    /** Fast local-only scan for Devices tab — no API call. */
    fun scanLocalDevicesOnly(context: android.content.Context) {
        viewModelScope.launch {
            try {
                val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(context)
                hotspotManager.assumeHotspotSharingActive()
                hotspotManager.syncHotspotStateFromSystem()
                _hotspotActive.postValue(true)
                val clients = withContext(Dispatchers.IO) {
                    hotspotManager.discoverConnectedClients(deepScan = true)
                }
                publishLocalClients(context, clients)
            } catch (_: Exception) {
            }
        }
    }

    /** Devices tab — live scan + API + last-known cache. */
    fun buildDisplayDevices(
        clients: List<com.wifiextender.utils.ConnectedClient>,
        apiDevices: List<Device>,
        hotspotOn: Boolean,
        context: android.content.Context
    ): List<Device> {
        val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(context)
        val existingByMac = apiDevices.associateBy { it.macAddress.uppercase() }
        val mergedClients = hotspotManager.mergeConnectedClientsForDisplay(
            clients,
            hotspotManager.getCurrentConnectedClients(),
            _liveClients.value.orEmpty()
        )
        val fromLive = mapClientsForDevicesTab(context, mergedClients, existingByMac)
        if (fromLive.isNotEmpty()) {
            lastDisplayedDevices = fromLive
            return fromLive
        }
        if (lastDisplayedDevices.isNotEmpty() && (hotspotOn || hotspotManager.isHotspotLikelyActive())) {
            return lastDisplayedDevices
        }
        return apiDevices.filter { it.online && !it.blocked }
    }

    private fun clientsToDevices(
        clients: List<com.wifiextender.utils.ConnectedClient>,
        hotspotManager: com.wifiextender.utils.HotspotManager,
        existingByMac: Map<String, Device> = emptyMap()
    ): List<Device> {
        return clients.mapNotNull { client ->
            val mac = resolveClientMac(client, hotspotManager) ?: return@mapNotNull null

            val macKey = mac.uppercase()
            val prev = existingByMac[macKey]
                ?: client.ipAddress?.trim()?.takeIf { it.isNotEmpty() }?.let { ip ->
                    existingByMac.values.firstOrNull { it.ipAddress?.trim() == ip }
                }
            val label = DeviceNameResolver.formatDeviceLabel(
                client.name, client.vendor, client.ipAddress, mac
            )
            val deviceType = DeviceNameResolver.inferDeviceCategory(client.name, client.vendor)
                ?: client.vendor?.let { if (it in listOf("Apple", "Samsung", "Xiaomi", "Google", "Dell", "HP", "Lenovo")) it else "UNKNOWN" }
                ?: if (!client.ipAddress.isNullOrBlank()) "Connected device" else "UNKNOWN"
            val displayName = when {
                label != "Unknown Device" && !label.startsWith("Device ·") -> label
                deviceType != "UNKNOWN" -> deviceType
                !client.ipAddress.isNullOrBlank() -> "Device at ${client.ipAddress}"
                else -> label
            }

            Device(
                id = prev?.id ?: macKey.hashCode().toLong().let { if (it < 0) -it else it },
                macAddress = mac,
                deviceName = displayName,
                deviceType = deviceType,
                ipAddress = client.ipAddress,
                vendor = client.vendor ?: DeviceNameResolver.lookupVendor(mac),
                signalStrength = null,
                blocked = prev?.blocked ?: false,
                online = true,
                bytesSent = prev?.bytesSent ?: 0,
                bytesReceived = prev?.bytesReceived ?: 0,
                totalBytes = prev?.totalBytes ?: 0,
                lastSeen = null,
                connectedAt = null
            )
        }
    }

    private fun resolveClientMac(
        client: com.wifiextender.utils.ConnectedClient,
        hotspotManager: com.wifiextender.utils.HotspotManager
    ): String? {
        val direct = client.macAddress?.trim()?.uppercase()?.replace('-', ':')
        if (DeviceNameResolver.isValidMac(direct)) return direct
        val resolved = hotspotManager.resolveMacForReport(client.ipAddress, client.macAddress)
        if (DeviceNameResolver.isValidMac(resolved)) return resolved
        return client.ipAddress?.trim()?.takeIf { it.isNotEmpty() }?.let {
            DeviceNameResolver.pseudoMacFromIp(it)
        }
    }

    private fun buildDeviceReports(
        clients: List<com.wifiextender.utils.ConnectedClient>,
        hotspotManager: com.wifiextender.utils.HotspotManager
    ): List<DeviceReport> {
        return clients.mapNotNull { client ->
            val mac = resolveClientMac(client, hotspotManager) ?: return@mapNotNull null
            val displayName = DeviceNameResolver.formatDeviceLabel(
                deviceName = client.name,
                vendor = client.vendor,
                ip = client.ipAddress,
                mac = mac
            )
            val deviceType = DeviceNameResolver.inferDeviceCategory(client.name, client.vendor)
                ?: client.vendor?.let { if (it in listOf("Apple", "Samsung", "Xiaomi", "Google")) it else "UNKNOWN" }
                ?: "UNKNOWN"
            DeviceReport(
                macAddress = mac,
                deviceName = displayName,
                ipAddress = client.ipAddress,
                vendor = client.vendor ?: DeviceNameResolver.lookupVendor(mac),
                deviceType = deviceType,
                online = true
            )
        }
    }

    private fun List<DeviceReport>.toDeviceList(existingByMac: Map<String, Device> = emptyMap()): List<Device> =
        map { d ->
            val macKey = d.macAddress.uppercase()
            val prev = existingByMac[macKey]
                ?: d.ipAddress?.trim()?.takeIf { it.isNotEmpty() }?.let { ip ->
                    existingByMac.values.firstOrNull { existing ->
                        existing.ipAddress?.trim() == ip ||
                            DeviceNameResolver.pseudoMacMatchesIp(existing.macAddress, ip) ||
                            existing.ipAddress?.let { ip2 ->
                                DeviceNameResolver.pseudoMacMatchesIp(d.macAddress, ip2)
                            } == true
                    }
                }
            val stableId = prev?.id ?: macKey.hashCode().toLong().let { if (it < 0) -it else it }
            Device(
                id = stableId,
                macAddress = d.macAddress,
                deviceName = d.deviceName ?: DeviceNameResolver.formatDeviceLabel(null, d.vendor, d.ipAddress, d.macAddress),
                deviceType = d.deviceType,
                ipAddress = d.ipAddress,
                vendor = d.vendor,
                signalStrength = null,
                blocked = prev?.blocked ?: false,
                online = d.online,
                bytesSent = prev?.bytesSent ?: 0,
                bytesReceived = prev?.bytesReceived ?: 0,
                totalBytes = prev?.totalBytes ?: 0,
                lastSeen = null,
                connectedAt = null
            )
        }

    /** Merge API devices with live hotspot scan — currently connected devices stay Online. */
    private fun mergeWithLiveScan(local: List<DeviceReport>, fromApi: List<Device>): List<Device> {
        val hotspotOn = isHotspotSessionActive()
        if (local.isEmpty()) {
            return if (hotspotOn) {
                fromApi.filter { it.online && !it.blocked }
            } else {
                fromApi
            }
        }

        val localDevices = local.toDeviceList(fromApi.associateBy { it.macAddress.uppercase() })
        if (fromApi.isEmpty()) return localDevices

        val localByMac = local.associateBy { it.macAddress.uppercase() }
        val localByIp = local.mapNotNull { r ->
            r.ipAddress?.trim()?.takeIf { it.isNotEmpty() }?.let { ip -> ip to r }
        }.toMap()
        val matchedLocalMacs = mutableSetOf<String>()
        val matchedIps = mutableSetOf<String>()

        val merged = fromApi.mapNotNull { apiDevice ->
            val ipKey = apiDevice.ipAddress?.trim()
            val scanned = localByMac[apiDevice.macAddress.uppercase()]
                ?: ipKey?.let { localByIp[it] }
                ?: ipKey?.let { ip ->
                    local.firstOrNull { report ->
                        DeviceNameResolver.pseudoMacMatchesIp(apiDevice.macAddress, ip) ||
                            report.ipAddress?.trim() == ip
                    }
                }

            if (scanned != null) {
                matchedLocalMacs.add(scanned.macAddress.uppercase())
                ipKey?.let { matchedIps.add(it) }
                scanned.ipAddress?.trim()?.let { matchedIps.add(it) }
                val localName = scanned.deviceName.orEmpty()
                val apiName = apiDevice.deviceName.orEmpty()
                val betterName = if (DeviceNameResolver.nameQuality(localName) > DeviceNameResolver.nameQuality(apiName)) {
                    localName
                } else {
                    DeviceNameResolver.formatDeviceLabel(
                        apiName,
                        apiDevice.vendor ?: scanned.vendor,
                        apiDevice.ipAddress ?: scanned.ipAddress,
                        apiDevice.macAddress
                    )
                }
                apiDevice.copy(
                    macAddress = DeviceNameResolver.preferMacAddress(
                        scanned.macAddress,
                        apiDevice.macAddress,
                        ip = apiDevice.ipAddress ?: scanned.ipAddress
                    ).ifBlank { apiDevice.macAddress },
                    deviceName = betterName,
                    vendor = apiDevice.vendor ?: scanned.vendor,
                    ipAddress = apiDevice.ipAddress ?: scanned.ipAddress,
                    deviceType = if (scanned.deviceType != "UNKNOWN") scanned.deviceType else apiDevice.deviceType,
                    online = true
                )
            } else if (hotspotOn && !apiDevice.online) {
                null
            } else {
                apiDevice
            }
        }

        val localOnly = localDevices.filter { ld ->
            ld.macAddress.uppercase() !in matchedLocalMacs &&
                ld.ipAddress?.trim() !in matchedIps
        }
        return merged + localOnly
    }

    private fun isHotspotSessionActive(): Boolean {
        if (_hotspotActive.value == true) return true
        val ctx = appContext ?: return false
        return com.wifiextender.utils.HotspotManager.getInstance(ctx).isHotspotLikelyActive()
    }

    fun toggleBlock(deviceId: Long) {
        viewModelScope.launch {
            try {
                val resp = api.toggleBlock(deviceId)
                if (resp.isSuccessful) {
                    val updated = resp.body() ?: return@launch
                    _devices.value = _devices.value?.map { if (it.id == deviceId) updated else it }
                }
            } catch (e: Exception) {
                _error.value = "Failed to update device"
            }
        }
    }

    fun loadPlansAndSubs() {
        viewModelScope.launch {
            try {
                val planResp = api.getPlans()
                val subResp  = api.getSubscriptions()
                val licResp  = api.getLicenses()
                val activeSub = api.getActiveSubscription()
                if (planResp.isSuccessful) _plans.value = planResp.body() ?: emptyList()
                if (subResp.isSuccessful)  _allSubs.value = subResp.body() ?: emptyList()
                if (licResp.isSuccessful)  _licenses.value = licResp.body() ?: emptyList()
                if (activeSub.isSuccessful) _subscription.value = activeSub.body()
                else _subscription.value = null
            } catch (e: Exception) {
                _error.value = "Failed to load plans"
            }
        }
    }

    fun requestPlan(planId: Long) {
        viewModelScope.launch {
            try {
                val resp = api.requestPlan(planId)
                if (resp.isSuccessful) {
                    _requestResult.value = "✅ Plan activated! Your license key is ready."
                    loadPlansAndSubs()
                    loadHome()
                } else {
                    _requestResult.value = "Failed to activate plan"
                }
            } catch (e: Exception) {
                _requestResult.value = "Network error. Please try again."
            }
        }
    }

    fun clearRequestResult() { _requestResult.value = null }
    fun clearError() { _error.value = null }
    fun clearUpgradeRequired() { _upgradeRequired.value = null }

    /** Sync real device hotspot SSID/password to backend when hotspot becomes active */
    fun syncHotspotCredentials(ssid: String, password: String, maxClients: Int) {
        if (ssid.isBlank() || password.length < 8) return
        viewModelScope.launch {
            try {
                val activeResp = api.getActiveHotspot()
                val body = mapOf(
                    "ssid" to ssid,
                    "password" to password,
                    "maxClients" to maxClients.coerceAtLeast(1)
                )
                if (activeResp.isSuccessful && activeResp.body() != null) {
                    val id = (activeResp.body()!!["id"] as? Number)?.toLong() ?: return@launch
                    api.updateHotspot(id, body)
                } else {
                    val createResp = api.createHotspot(body)
                    if (createResp.isSuccessful) {
                        val id = (createResp.body()?.get("id") as? Number)?.toLong() ?: return@launch
                        api.startHotspotById(id)
                    }
                }
            } catch (_: Exception) {}
        }
    }
}
