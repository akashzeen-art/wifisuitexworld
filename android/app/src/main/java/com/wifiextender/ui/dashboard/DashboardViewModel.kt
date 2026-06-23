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

    private var monitoringAttached = false
    private var lastApiSyncAt = 0L
    private var appContext: android.content.Context? = null

    fun setHotspotActive(active: Boolean) {
        _hotspotActive.postValue(active)
        if (active) {
            appContext?.let { ctx ->
                com.wifiextender.utils.HotspotManager.getInstance(ctx).userHotspotActive = true
                com.wifiextender.utils.HotspotRealtimeMonitor.getInstance(ctx).forceRefresh()
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
            if (clients.isNotEmpty()) {
                publishLocalClients(context.applicationContext, clients)
            }
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
            try {
                val subResp   = api.getActiveSubscription()
                val licResp   = api.getLicenses()
                val statsResp = api.getDeviceStats()
                if (subResp.isSuccessful)   _subscription.value = subResp.body()
                else _subscription.value = null
                if (licResp.isSuccessful)   _licenses.value = licResp.body() ?: emptyList()
                if (statsResp.isSuccessful) _deviceStats.value = statsResp.body()
            } catch (e: Exception) {
                _error.value = "Failed to load data"
            } finally {
                _loading.value = false
            }
        }
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
                if (_hotspotActive.value == true) hotspotManager.userHotspotActive = true
                if (forceRefresh) hotspotManager.invalidateClientScanCache()

                val clients = withContext(Dispatchers.IO) {
                    hotspotManager.ensureClientListeners()
                    hotspotManager.discoverConnectedClients(deepScan = true)
                }

                val reports = buildDeviceReports(clients, hotspotManager)
                if (reports.isNotEmpty()) {
                    _arpDeviceCount.postValue(reports.size)
                    _devices.postValue(reports.toDeviceList())
                } else if (showUserErrors && hotspotManager.isHotspotLikelyActive()) {
                    _error.postValue(
                        "Connected device not detected yet. Wait 30s, then open Devices tab and pull down to refresh."
                    )
                }

                if (reports.isEmpty()) return@launch

                try {
                    val resp = api.reportDevicesBulk(BulkDeviceReport(reports))
                    if (!resp.isSuccessful) {
                        val errorBody = resp.errorBody()?.string() ?: ""
                        when {
                            errorBody.contains("UPGRADE_REQUIRED") || resp.code() == 403 || resp.code() == 409 ->
                                _upgradeRequired.postValue(errorBody.ifBlank { "Device limit reached for your plan." })
                            else ->
                                _error.postValue("Could not sync devices to server. Showing local scan.")
                        }
                    } else {
                        val fromBulk = resp.body() ?: emptyList()
                        val merged = mergeWithLiveScan(reports, fromBulk)
                        if (merged.isNotEmpty()) {
                            _devices.postValue(merged)
                        }
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
        val reports = buildDeviceReports(clients, com.wifiextender.utils.HotspotManager.getInstance(context))
        if (reports.isNotEmpty()) {
            _arpDeviceCount.postValue(reports.size)
            _devices.postValue(reports.toDeviceList())
        }
    }

    private fun buildDeviceReports(
        clients: List<com.wifiextender.utils.ConnectedClient>,
        hotspotManager: com.wifiextender.utils.HotspotManager
    ): List<DeviceReport> {
        return clients.mapNotNull { client ->
            val mac = hotspotManager.resolveMacForReport(client.ipAddress, client.macAddress)
                ?: return@mapNotNull null
            val displayName = DeviceNameResolver.formatDeviceLabel(
                deviceName = client.name,
                vendor = client.vendor,
                ip = client.ipAddress,
                mac = mac
            )
            DeviceReport(
                macAddress = mac,
                deviceName = displayName,
                ipAddress = client.ipAddress,
                vendor = client.vendor ?: DeviceNameResolver.lookupVendor(mac),
                deviceType = "UNKNOWN",
                online = true
            )
        }
    }

    private fun List<DeviceReport>.toDeviceList(): List<Device> =
        mapIndexed { index, d ->
            Device(
                id = index.toLong(),
                macAddress = d.macAddress,
                deviceName = d.deviceName ?: DeviceNameResolver.formatDeviceLabel(null, d.vendor, d.ipAddress, d.macAddress),
                deviceType = d.deviceType,
                ipAddress = d.ipAddress,
                vendor = d.vendor,
                signalStrength = null,
                blocked = false,
                online = d.online,
                bytesSent = 0,
                bytesReceived = 0,
                totalBytes = 0,
                lastSeen = null,
                connectedAt = null
            )
        }

    /** Merge API devices with live hotspot scan — currently connected devices stay Online. */
    private fun mergeWithLiveScan(local: List<DeviceReport>, fromApi: List<Device>): List<Device> {
        if (local.isEmpty()) {
            return if (_hotspotActive.value == true) {
                fromApi.filter { it.online && !it.blocked }
            } else {
                fromApi
            }
        }

        val localDevices = local.toDeviceList()
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
                    deviceName = betterName,
                    vendor = apiDevice.vendor ?: scanned.vendor,
                    ipAddress = apiDevice.ipAddress ?: scanned.ipAddress,
                    online = true
                )
            } else if (_hotspotActive.value == true && !apiDevice.online) {
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
