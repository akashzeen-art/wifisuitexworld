package com.wifiextender.utils

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.ConnectivityManager
import androidx.core.content.ContextCompat
import android.content.SharedPreferences
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import java.lang.reflect.Method
import java.lang.reflect.Proxy
import java.net.Inet4Address
import java.net.InetAddress
import java.net.NetworkInterface
import java.security.MessageDigest
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executor
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.net.Socket
import java.net.InetSocketAddress

data class HotspotInfo(
    val ssid: String,
    val password: String,
    val clientCount: Int,
    val connectedClients: List<ConnectedClient>,
    val isActive: Boolean
)

data class ConnectedClient(
    val name: String,
    val macAddress: String?,
    val ipAddress: String?,
    val vendor: String? = null
)

sealed class HotspotApplyResult {
    data object Success : HotspotApplyResult()
    data object NeedsHotspotRestart : HotspotApplyResult()
    data class Failed(val message: String) : HotspotApplyResult()
}

class HotspotManager(private val context: Context) {

    private val wifiManager: WifiManager =
        context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    private val prefs: SharedPreferences =
        context.getSharedPreferences("hotspot_prefs", Context.MODE_PRIVATE)

    /** Latest SSID reported by the phone (SoftAp callback / system read) */
    @Volatile
    private var phoneSsidCache: String? = null

    @Volatile
    private var softApClientsCache: List<ConnectedClient> = emptyList()

    @Volatile
    private var tetheringClientsCache: List<ConnectedClient> = emptyList()

    private var softApCallbackRegistered = false
    private var tetheringCallbackRegistered = false
    private val softApCallbackExecutor: Executor by lazy {
        val thread = android.os.HandlerThread("SoftApCallback").apply { start() }
        Executor { runnable -> android.os.Handler(thread.looper).post(runnable) }
    }
    @Volatile private var lastDumpsysAt = 0L
    @Volatile private var cachedDumpsysClients: List<ConnectedClient> = emptyList()
    @Volatile private var subnetScanInProgress = false
    @Volatile private var subnetScanCache: List<ConnectedClient> = emptyList()
    @Volatile private var lastSubnetScanAt = 0L
    @Volatile private var stableHotspotClients: List<ConnectedClient> = emptyList()
    private val subnetScanLock = Any()
    private var systemReadBlocked: Boolean? = null
    private val clientListeners =
        java.util.concurrent.CopyOnWriteArrayList<(List<ConnectedClient>) -> Unit>()
    private val deviceNamePrefs: SharedPreferences =
        context.getSharedPreferences(PREFS_DEVICE_NAMES, Context.MODE_PRIVATE)

    init {
        loadStableClientsFromPrefs()
    }

    private fun getCachedDeviceName(mac: String?): String? {
        if (mac.isNullOrBlank()) return null
        return deviceNamePrefs.getString(mac.uppercase(), null)
    }

    private fun cacheDeviceName(mac: String?, name: String) {
        if (mac.isNullOrBlank() || !DeviceNameResolver.isRealHostname(name)) return
        deviceNamePrefs.edit().putString(mac.uppercase(), name.trim()).apply()
    }

    companion object {
        private const val TAG = "HotspotManager"
        private const val WIFI_AP_STATE_ENABLED = 13
        private const val KEY_CONFIRMED_SSID = "confirmed_phone_ssid"
        private const val PREFS_DEVICE_NAMES = "device_name_cache"
        private const val KEY_STABLE_CLIENTS = "stable_hotspot_clients"
        private const val IP_MAC_PREFIX = "ipmac_"

        @Volatile
        private var instance: HotspotManager? = null

        fun getInstance(context: Context): HotspotManager {
            val appContext = context.applicationContext
            return instance ?: synchronized(this) {
                instance ?: HotspotManager(appContext).also { instance = it }
            }
        }
    }

    /** Set from Hotspot tab when user starts hotspot — helps detection when system APIs lie. */
    @Volatile
    var userHotspotActive: Boolean = false

    /** Only mark sharing active when hardware hotspot is actually on. */
    fun assumeHotspotSharingActive() {
        if (isHotspotOn()) userHotspotActive = true
    }

    /** User tapped Stop — clear app state so UI and device lists reset immediately. */
    fun markHotspotStopped() {
        userHotspotActive = false
        clearHotspotClientCaches()
    }

    fun clearHotspotClientCaches() {
        tetheringClientsCache = emptyList()
        softApClientsCache = emptyList()
        stableHotspotClients = emptyList()
        subnetScanCache = emptyList()
        cachedDumpsysClients = emptyList()
        lastSubnetScanAt = 0L
        lastDumpsysAt = 0L
        prefs.edit().remove(KEY_STABLE_CLIENTS).apply()
    }

    private fun <T> runOnMainThread(block: () -> T): T {
        if (Looper.myLooper() == Looper.getMainLooper()) return block()
        val holder = arrayOfNulls<Any>(1)
        var error: Exception? = null
        val latch = CountDownLatch(1)
        Handler(Looper.getMainLooper()).post {
            try {
                holder[0] = block()
            } catch (e: Exception) {
                error = e
            } finally {
                latch.countDown()
            }
        }
        latch.await(8, TimeUnit.SECONDS)
        error?.let { throw it }
        @Suppress("UNCHECKED_CAST")
        return holder[0] as T
    }

    /** System SoftAp / Tethering APIs — must run on main thread. */
    private fun readSystemApiClientsOnMainThread(): List<ConnectedClient> {
        return runOnMainThread {
            ensureClientListeners()
            refreshTetheringClientsCache()
            val found = LinkedHashMap<String, ConnectedClient>()
            fun absorb(list: List<ConnectedClient>) {
                list.forEach { c ->
                    val key = c.macAddress?.uppercase() ?: c.ipAddress?.trim().orEmpty()
                    if (key.isNotBlank()) found[key] = c
                }
            }
            absorb(tetheringClientsCache)
            absorb(softApClientsCache)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                readClientsViaTetheringManager()?.let { absorb(it) }
            }
            absorb(readClientsViaSoftApApi())
            absorb(readClientsViaWifiManagerProbe())
            found.values.toList()
        }
    }

    fun isLocationServicesEnabled(): Boolean {
        return try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return false
            lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
        } catch (_: Exception) {
            false
        }
    }

    // ── Hotspot on/off ────────────────────────────────────────────────────────

    fun isHotspotOn(): Boolean {
        if (isWifiApEnabledReflection()) return true
        if (isWifiApStateEnabled()) return true
        if (getTetheredInterfaceNames().isNotEmpty()) return true
        if (getHotspotApIpv4AddressesRelaxed().isNotEmpty()) return true
        return false
    }

    /** Hotspot hardware on — use for start/stop UI, not cached client lists. */
    fun isHotspotLikelyActive(): Boolean {
        if (isHotspotOn()) return true
        if (userHotspotActive && (hasTetheredInterfaces() || getHotspotApIpv4AddressesRelaxed().isNotEmpty())) {
            return true
        }
        return false
    }

    /** True when phone is sharing WiFi (hotspot / tethering interfaces up). */
    fun hasTetheredInterfaces(): Boolean = getTetheredInterfaceNames().isNotEmpty()

    /**
     * Detect hotspot from system (Settings toggle, tethered ifaces).
     * Call before device scans — sets [userHotspotActive] when sharing is on.
     */
    fun syncHotspotStateFromSystem(): Boolean {
        val active = isHotspotOn() ||
            hasTetheredInterfaces() ||
            isWifiApStateEnabled() ||
            getHotspotApIpv4AddressesRelaxed().isNotEmpty()
        if (active) {
            userHotspotActive = true
        } else {
            userHotspotActive = false
        }
        return active
    }

    /** Same client list the Hotspot tab uses — system APIs on main thread first. */
    fun getCurrentConnectedClients(): List<ConnectedClient> {
        val merged = LinkedHashMap<String, ConnectedClient>()
        fun put(client: ConnectedClient) {
            val key = client.macAddress?.uppercase()?.takeIf { it.length == 17 }
                ?: client.ipAddress?.trim().orEmpty()
            if (key.isNotBlank()) merged[key] = client
        }
        readSystemApiClientsOnMainThread().forEach { put(it) }
        if (merged.isNotEmpty()) return merged.values.toList()
        getLastKnownClients().forEach { put(it) }
        return merged.values.toList()
    }

    /** Last successfully discovered hotspot clients — only while hotspot is on. */
    fun getLastKnownClients(): List<ConnectedClient> {
        if (!isHotspotOn() && !userHotspotActive) return emptyList()
        if (stableHotspotClients.isNotEmpty()) return stableHotspotClients
        return readConnectedClientsFast()
    }

    /** Live clients for Hotspot / Devices tabs — system APIs first, then deep scan. */
    fun getRealtimeHotspotClients(deepScan: Boolean = true): List<ConnectedClient> {
        if (!isHotspotOn() && !syncHotspotStateFromSystem()) return emptyList()
        val system = readSystemApiClientsOnMainThread()
        if (system.isNotEmpty() && !deepScan) return system
        return discoverConnectedClients(deepScan = deepScan)
    }

    private fun mergeConnectedClients(vararg lists: List<ConnectedClient>): List<ConnectedClient> {
        val merged = LinkedHashMap<String, ConnectedClient>()
        lists.forEach { list ->
            list.forEach { client ->
                val key = client.macAddress?.uppercase()?.takeIf { it.length == 17 }
                    ?: client.ipAddress?.trim().orEmpty()
                if (key.isBlank()) return@forEach
                val existing = merged[key]
                merged[key] = if (existing == null) client else pickBetterClient(existing, client)
            }
        }
        return merged.values.toList()
    }

    /** Never drop Hotspot-tab clients when a background scan returns empty. */
    fun mergeConnectedClientsForDisplay(vararg lists: List<ConnectedClient>): List<ConnectedClient> =
        mergeConnectedClients(*lists)

    private fun canProbeForClients(): Boolean =
        isHotspotLikelyActive() ||
            hasTetheredInterfaces() ||
            getHotspotApIpv4AddressesRelaxed().isNotEmpty() ||
            getHotspotSubnetPrefixes().isNotEmpty() ||
            userHotspotActive

    private fun isWifiApEnabledReflection(): Boolean {
        return try {
            val m: Method = wifiManager.javaClass.getDeclaredMethod("isWifiApEnabled")
            m.isAccessible = true
            m.invoke(wifiManager) as? Boolean ?: false
        } catch (_: Exception) {
            false
        }
    }

    private fun isWifiApStateEnabled(): Boolean {
        return try {
            val method = wifiManager.javaClass.getMethod("getWifiApState")
            val state = method.invoke(wifiManager) as? Int ?: return false
            state == WIFI_AP_STATE_ENABLED
        } catch (_: Exception) {
            false
        }
    }

    private fun getTetheredInterfaceNames(): List<String> {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val method = cm.javaClass.getMethod("getTetheredIfaces")
            @Suppress("UNCHECKED_CAST")
            val ifaces = method.invoke(cm) as? Array<String>
            ifaces?.filter { it.isNotBlank() }?.toList() ?: emptyList()
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun ensurePhoneSsidListener() {
        ensureClientListeners()
    }

    fun addClientListener(listener: (List<ConnectedClient>) -> Unit) {
        clientListeners.add(listener)
    }

    fun removeClientListener(listener: (List<ConnectedClient>) -> Unit) {
        clientListeners.remove(listener)
    }

    private fun notifyClientListeners() {
        if (clientListeners.isEmpty()) return
        softApCallbackExecutor.execute {
            val snapshot = discoverConnectedClients(deepScan = false)
            clientListeners.forEach { listener ->
                try {
                    listener(snapshot)
                } catch (_: Exception) {
                }
            }
        }
    }

    private fun mergeClientCaches(clients: List<ConnectedClient>): List<ConnectedClient> {
        val merged = LinkedHashMap<String, ConnectedClient>()
        clients.forEach { client ->
            val key = client.macAddress?.uppercase() ?: client.ipAddress ?: return@forEach
            merged[key] = client
        }
        return merged.values.toList()
    }

    /** Register system callbacks for connected hotspot clients (only reliable path on MIUI). */
    fun ensureClientListeners() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return
        registerSoftApClientCallback()
        registerTetheringClientCallback()
        refreshTetheringClientsCache()
    }

    private fun mainExecutor(): Executor =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) context.mainExecutor
        else Executor { it.run() }

    private fun registerSoftApClientCallback() {
        if (softApCallbackRegistered) return
        try {
            val callbackClass = Class.forName("android.net.wifi.WifiManager\$SoftApCallback")
            val callback = Proxy.newProxyInstance(callbackClass.classLoader, arrayOf(callbackClass)) { _, method, args ->
                when (method.name) {
                    "onStateChanged" -> {
                        val state = args?.getOrNull(0) as? Int
                        if (state == WIFI_AP_STATE_ENABLED) {
                            refreshPhoneSsidCache()
                            refreshTetheringClientsCache()
                        }
                    }
                    "onConnectedClientsChanged" -> {
                        val clients = args?.lastOrNull() as? Collection<*>
                        updateSoftApClientsCacheFromReflection(clients)
                        Log.d(TAG, "onConnectedClientsChanged: ${clients?.size ?: 0}")
                    }
                }
                null
            }
            wifiManager.javaClass
                .getMethod("registerSoftApCallback", Executor::class.java, callbackClass)
                .invoke(wifiManager, softApCallbackExecutor, callback)
            softApCallbackRegistered = true
            refreshPhoneSsidCache()
            refreshTetheringClientsCache()
            Log.d(TAG, "SoftApCallback registered")
        } catch (e: Exception) {
            Log.w(TAG, "SoftApCallback failed: ${e.javaClass.simpleName}: ${e.message}")
        }
    }

    private fun registerTetheringClientCallback() {
        if (tetheringCallbackRegistered) return
        try {
            val tm = context.getSystemService("tethering") ?: return
            val callbackClass = Class.forName("android.net.TetheringManager\$TetheringEventCallback")
            val callback = Proxy.newProxyInstance(callbackClass.classLoader, arrayOf(callbackClass)) { _, method, args ->
                if (method.name == "onClientsChanged" && args != null && args.isNotEmpty()) {
                    @Suppress("UNCHECKED_CAST")
                    val clients = args[0] as? Collection<*>
                    updateTetheringClientsCacheFromReflection(clients)
                    Log.d(TAG, "onClientsChanged: ${clients?.size ?: 0}")
                }
                null
            }
            (tm as Any).javaClass
                .getMethod("registerTetheringEventCallback", Executor::class.java, callbackClass)
                .invoke(tm, softApCallbackExecutor, callback)
            tetheringCallbackRegistered = true
            Log.d(TAG, "TetheringEventCallback registered")
        } catch (e: Exception) {
            Log.w(TAG, "TetheringEventCallback failed: ${e.javaClass.simpleName}: ${e.message}")
        }
    }

    private fun updateTetheringClientsCache(clients: List<ConnectedClient>) {
        tetheringClientsCache = clients
        Log.d(TAG, "Tethering clients cache: ${clients.size}")
    }

    private fun updateSoftApClientsCache(clients: List<ConnectedClient>) {
        softApClientsCache = clients
        Log.d(TAG, "SoftAp clients updated: ${clients.size}")
    }

    private fun updateTetheringClientsCacheFromReflection(clients: Collection<*>?) {
        if (clients == null) return
        tetheringClientsCache = clients.mapNotNull { item -> item?.let { parseTetheredClient(it) } }
        tetheringClientsCache.forEach { c ->
            val mac = c.macAddress ?: return@forEach
            c.ipAddress?.let { cacheIpMacMapping(it, mac) }
        }
        Log.d(TAG, "Tethering clients cache: ${tetheringClientsCache.size}")
        notifyClientListeners()
    }

    private fun updateSoftApClientsCacheFromReflection(clients: Collection<*>?) {
        if (clients == null) return
        softApClientsCache = clients.mapNotNull { item -> item?.let { parseWifiClient(it) } }
        softApClientsCache.forEach { c ->
            val mac = c.macAddress ?: return@forEach
            c.ipAddress?.let { cacheIpMacMapping(it, mac) }
        }
        Log.d(TAG, "SoftAp clients updated: ${softApClientsCache.size}")
        notifyClientListeners()
    }

    private fun refreshTetheringClientsCache() {
        readClientsViaTetheringManager()?.let { clients ->
            if (clients.isNotEmpty()) {
                tetheringClientsCache = clients
                Log.d(TAG, "getTetheredClients: ${clients.size}")
            }
        }
        readClientsViaSoftApApi().let { clients ->
            if (clients.isNotEmpty()) {
                softApClientsCache = clients
                Log.d(TAG, "getConnectedSoftApClients: ${clients.size}")
            }
        }
    }

    /** MIUI/Xiaomi blocks getSoftApConfiguration for third-party apps */
    fun isSystemSsidReadBlocked(): Boolean {
        systemReadBlocked?.let { return it }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            systemReadBlocked = false
            return false
        }
        val blocked = try {
            wifiManager.javaClass.getMethod("getSoftApConfiguration").invoke(wifiManager)
            false
        } catch (e: java.lang.reflect.InvocationTargetException) {
            e.targetException is SecurityException
        } catch (_: SecurityException) {
            true
        } catch (e: Exception) {
            Log.w(TAG, "SSID read probe: ${e.javaClass.simpleName}")
            true
        }
        systemReadBlocked = blocked
        Log.d(TAG, "System SSID read blocked=$blocked")
        return blocked
    }

    fun getConfirmedSsid(): String = prefs.getString(KEY_CONFIRMED_SSID, "") ?: ""

    fun saveConfirmedSsid(ssid: String) {
        prefs.edit().putString(KEY_CONFIRMED_SSID, ssid).apply()
        phoneSsidCache = ssid
        saveLastSsid(ssid)
    }

    fun needsManualSsidEntry(): Boolean =
        readSsidFromPhoneInternal() == null && getConfirmedSsid().isEmpty()

    private fun refreshPhoneSsidCache() {
        readSsidFromPhoneInternal()?.let {
            phoneSsidCache = it
            saveConfirmedSsid(it)
        }
    }

    /**
     * SSID to show in the UI — auto-read from phone when possible,
     * otherwise the name the user confirmed from phone Settings (MIUI).
     */
    fun readDisplaySsid(): String {
        ensurePhoneSsidListener()
        readSsidFromPhone()?.let { return it }
        return getConfirmedSsid()
    }

    fun readSsid(): String = readDisplaySsid()

    /** Raw phone read — skips prefs entirely */
    fun readSsidFromPhone(): String? {
        phoneSsidCache?.takeIf { isValidSsid(it) }?.let { return it }
        return readSsidFromPhoneInternal()?.also { cacheAndReturn(it) }
    }

    private fun readSsidFromPhoneInternal(): String? {
        readSsidDirectApi()?.let { return it }
        readSsidFromSoftApReflection()?.let { return it }
        readSsidFromConfigDump()?.let { return it }
        readSsidFromSettings()?.let { return it }
        readSsidViaWifiApConfig()?.let { return it }
        return null
    }

    // ── Full info snapshot ────────────────────────────────────────────────────

    fun readHotspotInfo(): HotspotInfo {
        ensurePhoneSsidListener()
        val ssid = readDisplaySsid()
        val pass = readPasswordForSsid(ssid)
        val clients = readConnectedClientsFast()
        return HotspotInfo(
            ssid             = ssid,
            password         = pass,
            clientCount      = clients.size,
            connectedClients = clients,
            isActive         = isHotspotOn()
        )
    }

    private fun cacheAndReturn(ssid: String): String {
        phoneSsidCache = ssid
        saveConfirmedSsid(ssid)
        return ssid
    }

    @Suppress("NewApi")
    private fun readSsidDirectApi(): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
        return try {
            val config = wifiManager.javaClass.getMethod("getSoftApConfiguration")
                .invoke(wifiManager) ?: return null
            for (methodName in listOf("getSsid", "getWifiSsid")) {
                try {
                    val value = config.javaClass.getMethod(methodName).invoke(config)
                    parseSsidValue(value)?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }
            parseSsidFromConfigDump(config.toString())
        } catch (e: Exception) {
            Log.w(TAG, "readSsidDirectApi failed: ${e.message}")
            null
        }
    }

    private fun readSsidFromSoftApReflection(): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
        return try {
            val config = wifiManager.javaClass.getMethod("getSoftApConfiguration")
                .invoke(wifiManager) ?: return null

            for (methodName in listOf("getSsid", "getWifiSsid")) {
                try {
                    val value = config.javaClass.getMethod(methodName).invoke(config)
                    parseSsidValue(value)?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }

            for (fieldName in listOf("mSSID", "SSID", "mSsid", "ssid")) {
                try {
                    val field = config.javaClass.getDeclaredField(fieldName)
                    field.isAccessible = true
                    parseSsidValue(field.get(config))?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }
            null
        } catch (_: Exception) { null }
    }

    /** Parse SSID from SoftApConfiguration.toString() — works on MIUI when getters return null */
    private fun readSsidFromConfigDump(): String? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
        return try {
            val config = wifiManager.javaClass.getMethod("getSoftApConfiguration")
                .invoke(wifiManager) ?: return null
            parseSsidFromConfigDump(config.toString())
        } catch (_: Exception) { null }
    }

    private fun parseSsidFromConfigDump(dump: String): String? {
        val patterns = listOf(
            Regex("""mCurrentSoftApConfiguration\.SSID:\s*"?([^"\n,}]+)"?"""),
            Regex("""\bSSID[=:\s]+"?([^",}\n]+)"?""", RegexOption.IGNORE_CASE),
            Regex("""mSSID[=:\s]+"?([^",}\n]+)"?""")
        )
        for (pattern in patterns) {
            pattern.find(dump)?.groupValues?.get(1)?.cleanSsid()
                ?.takeIf { isValidSsid(it) }?.let { return it }
        }
        return null
    }

    private fun parseSsidValue(value: Any?): String? {
        if (value == null) return null
        when (value) {
            is String -> return value.cleanSsid()
            is CharSequence -> return value.toString().cleanSsid()
        }
        if (value.javaClass.name.contains("WifiSsid", ignoreCase = true)) {
            for (methodName in listOf("getUtf8Text", "toString")) {
                try {
                    val text = if (methodName == "getUtf8Text") {
                        value.javaClass.getMethod(methodName).invoke(value) as? String
                    } else value.toString()
                    text?.cleanSsid()?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }
        }
        return parseSsidFromConfigDump(value.toString())
    }

    private fun isValidSsid(ssid: String): Boolean {
        return ssid.isNotBlank() &&
            ssid != "<unknown ssid>" &&
            ssid != "null" &&
            ssid != "0x" &&
            ssid != "—" &&
            !ssid.equals("My Hotspot", ignoreCase = true) &&
            !ssid.equals("Detecting SSID...", ignoreCase = true)
    }

    private fun readSsidFromSettings(): String? {
        val keys = listOf(
            "wifi_ap_ssid", "wifi_tether_ssid", "softap_ssid", "wifi_hotspot_ssid",
            "soft_ap_wifi_ssid", "default_wifi_ap_ssid", "wifi_ap_ssid_override",
            "ap_ssid", "tether_ssid", "wifi_ap_name", "wifi_ap_ssid_config"
        )
        val readers = listOf(
            { k: String -> Settings.System.getString(context.contentResolver, k) },
            { k: String -> Settings.Global.getString(context.contentResolver, k) },
            { k: String -> Settings.Secure.getString(context.contentResolver, k) }
        )
        for (read in readers) {
            for (key in keys) {
                try {
                    read(key)?.cleanSsid()?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }
        }
        return null
    }

    @Suppress("DEPRECATION")
    private fun readSsidViaWifiApConfig(): String? {
        return try {
            val m = wifiManager.javaClass.getDeclaredMethod("getWifiApConfiguration")
            m.isAccessible = true
            val config = m.invoke(wifiManager) ?: return null
            for (fieldName in listOf("SSID", "ssid", "mSSID")) {
                try {
                    val field = config.javaClass.getDeclaredField(fieldName)
                    field.isAccessible = true
                    parseSsidValue(field.get(config))?.takeIf { isValidSsid(it) }?.let { return it }
                } catch (_: Exception) {}
            }
            null
        } catch (_: Exception) { null }
    }

    private fun readSoftApPassphrase(): String? {
        return try {
            val config = wifiManager.javaClass.getMethod("getSoftApConfiguration")
                .invoke(wifiManager) ?: return null
            (config.javaClass.getMethod("getPassphrase").invoke(config) as? String)
                ?.trim()?.ifEmpty { null }
        } catch (_: Exception) { null }
    }

    // ── Password ──────────────────────────────────────────────────────────────

    fun readPassword(): String = readPasswordForSsid(readSsid())

    fun readPasswordForSsid(ssid: String): String {
        if (ssid.isNotEmpty()) {
            readSoftApPassphrase()?.let { pass ->
                savePasswordForSsid(ssid, pass)
                return pass
            }
            readPasswordViaWifiApConfig()?.let { pass ->
                savePasswordForSsid(ssid, pass)
                return pass
            }
            prefs.getString(pwdKey(ssid), null)?.let { return it }
        }
        return prefs.getString("saved_password", "") ?: ""
    }

    @Suppress("DEPRECATION")
    private fun readPasswordViaWifiApConfig(): String? {
        return try {
            val m = wifiManager.javaClass.getDeclaredMethod("getWifiApConfiguration")
            m.isAccessible = true
            val config = m.invoke(wifiManager) ?: return null
            (config.javaClass.getDeclaredField("preSharedKey")
                .apply { isAccessible = true }.get(config) as? String)
                ?.trim()?.ifEmpty { null }
        } catch (_: Exception) { null }
    }

    fun savePasswordForSsid(ssid: String, password: String) {
        prefs.edit()
            .putString(pwdKey(ssid), password)
            .putString("saved_password", password)
            .apply()
    }

    fun saveSsid(ssid: String) {
        phoneSsidCache = ssid
        saveLastSsid(ssid)
    }

    // ── Write to phone ────────────────────────────────────────────────────────

    fun applyHotspotConfig(ssid: String, password: String): HotspotApplyResult {
        if (ssid.isBlank()) return HotspotApplyResult.Failed("SSID is required")
        if (password.length < 8) return HotspotApplyResult.Failed("Password must be at least 8 characters")

        val wasActive = isHotspotOn()
        var applied = false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            applied = applyViaSoftApConfiguration(ssid, password)
        }
        if (!applied) {
            applied = applyViaWifiApConfiguration(ssid, password)
        }
        writeHotspotToSettings(ssid, password)

        saveSsid(ssid)
        savePasswordForSsid(ssid, password)
        phoneSsidCache = null
        refreshPhoneSsidCache()

        val actualSsid = readSsidFromPhone() ?: ""
        if (actualSsid.isNotEmpty() && !actualSsid.equals(ssid, ignoreCase = true)) {
            phoneSsidCache = actualSsid
            return HotspotApplyResult.Failed(
                "Phone hotspot is still \"$actualSsid\". MIUI blocks apps from renaming it — change the name in Settings."
            )
        }

        return when {
            !applied -> HotspotApplyResult.Failed(
                "Open hotspot Settings on your phone and set the name to \"$ssid\"."
            )
            wasActive -> HotspotApplyResult.NeedsHotspotRestart
            else -> HotspotApplyResult.Success
        }
    }

    fun restartHotspot(): Boolean {
        return try {
            val method = wifiManager.javaClass.getDeclaredMethod(
                "setWifiApEnabled", java.lang.Boolean.TYPE
            )
            method.isAccessible = true
            method.invoke(wifiManager, false)
            Thread.sleep(800)
            method.invoke(wifiManager, true) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    /** Turn off phone hotspot via system API (may require user to confirm on some OEMs). */
    fun stopHotspot(): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    val tm = context.getSystemService("tethering")
                    if (tm != null) {
                        val stopMethod = tm.javaClass.methods.firstOrNull {
                            it.name == "stopTethering" && it.parameterTypes.size == 1
                        }
                        if (stopMethod != null) {
                            stopMethod.invoke(tm, 0) // ConnectivityManager.TETHERING_WIFI
                            Thread.sleep(600)
                            if (!isHotspotOn()) return true
                        }
                    }
                } catch (_: Exception) {}
            }
            val method = wifiManager.javaClass.getDeclaredMethod(
                "setWifiApEnabled", java.lang.Boolean.TYPE
            )
            method.isAccessible = true
            method.invoke(wifiManager, false) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    fun startHotspot(): Boolean {
        return try {
            val method = wifiManager.javaClass.getDeclaredMethod(
                "setWifiApEnabled", java.lang.Boolean.TYPE
            )
            method.isAccessible = true
            method.invoke(wifiManager, true) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    fun openPhoneHotspotSettings(): Boolean {
        val intents = listOf(
            Intent().setClassName("com.android.settings", "com.android.settings.MiuiTetherSettings"),
            Intent().setClassName("com.android.settings", "com.android.settings.TetherSettings"),
            Intent(Settings.ACTION_WIRELESS_SETTINGS),
            Intent(Settings.ACTION_SETTINGS)
        )
        for (intent in intents) {
            try {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return true
            } catch (_: Exception) {}
        }
        return false
    }

    private fun applyViaSoftApConfiguration(ssid: String, password: String): Boolean {
        return try {
            val softApClass = Class.forName("android.net.wifi.SoftApConfiguration")
            val builderClass = Class.forName("android.net.wifi.SoftApConfiguration\$Builder")
            val currentConfig = wifiManager.javaClass.getMethod("getSoftApConfiguration")
                .invoke(wifiManager)
            val builder = if (currentConfig != null) {
                builderClass.getConstructor(softApClass).newInstance(currentConfig)
            } else {
                builderClass.getConstructor().newInstance()
            }
            val securityType = softApClass.getField("SECURITY_TYPE_WPA2_PSK").getInt(null)
            builderClass.getMethod("setSsid", String::class.java).invoke(builder, ssid)
            builderClass.getMethod(
                "setPassphrase", String::class.java, Int::class.javaPrimitiveType
            ).invoke(builder, password, securityType)
            val newConfig = builderClass.getMethod("build").invoke(builder)
            val setMethod = wifiManager.javaClass.getMethod("setSoftApConfiguration", softApClass)
            setMethod.invoke(wifiManager, newConfig) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    @Suppress("DEPRECATION")
    private fun applyViaWifiApConfiguration(ssid: String, password: String): Boolean {
        return try {
            val getMethod = wifiManager.javaClass.getDeclaredMethod("getWifiApConfiguration")
            getMethod.isAccessible = true
            val config = getMethod.invoke(wifiManager)
                ?: Class.forName("android.net.wifi.WifiConfiguration").newInstance()
            val configClass = config.javaClass
            for (fieldName in listOf("SSID", "ssid")) {
                try {
                    val field = configClass.getDeclaredField(fieldName)
                    field.isAccessible = true
                    field.set(config, "\"$ssid\"")
                    break
                } catch (_: Exception) {}
            }
            try {
                val keyField = configClass.getDeclaredField("preSharedKey")
                keyField.isAccessible = true
                keyField.set(config, password)
            } catch (_: Exception) {}
            val setMethod = wifiManager.javaClass.getDeclaredMethod(
                "setWifiApConfiguration", Class.forName("android.net.wifi.WifiConfiguration")
            )
            setMethod.isAccessible = true
            setMethod.invoke(wifiManager, config) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    private fun writeHotspotToSettings(ssid: String, password: String) {
        val ssidKeys = listOf(
            "wifi_ap_ssid", "soft_ap_wifi_ssid", "wifi_tether_ssid",
            "softap_ssid", "wifi_hotspot_ssid"
        )
        val passKeys = listOf(
            "wifi_ap_passwd", "wifi_ap_password", "wifi_ap_passphrase", "wifi_tether_password"
        )
        for (key in ssidKeys) {
            try { Settings.System.putString(context.contentResolver, key, ssid) } catch (_: Exception) {}
            try { Settings.Global.putString(context.contentResolver, key, ssid) } catch (_: Exception) {}
        }
        for (key in passKeys) {
            try { Settings.System.putString(context.contentResolver, key, password) } catch (_: Exception) {}
            try { Settings.Global.putString(context.contentResolver, key, password) } catch (_: Exception) {}
        }
    }

    private fun saveLastSsid(ssid: String) {
        prefs.edit().putString("last_ssid", ssid).apply()
    }

    private fun pwdKey(ssid: String): String {
        val hash = MessageDigest.getInstance("SHA-256")
            .digest(ssid.toByteArray())
            .joinToString("") { "%02x".format(it) }
        return "pwd_$hash"
    }

    // ── Connected clients ─────────────────────────────────────────────────────

    fun readConnectedClients(includeSubnetScan: Boolean = false): List<ConnectedClient> {
        ensureClientListeners()
        val dumpsysHints = readDumpsysClientHints()
        val dhcpHints = readDhcpLeaseHints()
        val merged = LinkedHashMap<String, ConnectedClient>()

        fun enrich(raw: ConnectedClient): ConnectedClient {
            val mac = raw.macAddress?.uppercase()?.takeIf { it.length == 17 }
            val hint = mac?.let { dumpsysHints[it] }
            val dhcp = mac?.let { dhcpHints[it] }
            val hostname = listOf(raw.name, hint?.first, dhcp?.first)
                .firstOrNull { DeviceNameResolver.isRealHostname(it) }
            val ip = raw.ipAddress ?: hint?.second ?: dhcp?.second
            val vendor = DeviceNameResolver.lookupVendor(mac)
            val name = DeviceNameResolver.resolveDisplayName(
                mac = mac,
                ip = ip,
                hostname = hostname,
                cachedName = mac?.let { getCachedDeviceName(it) },
                vendor = vendor
            )
            if (hostname != null && mac != null) cacheDeviceName(mac, hostname)
            return ConnectedClient(name = name, macAddress = mac, ipAddress = ip, vendor = vendor)
        }

        fun add(raw: ConnectedClient) {
            val mac = raw.macAddress?.uppercase()?.takeIf { it.length == 17 }
            val key = mac ?: raw.ipAddress?.takeIf { it.isNotBlank() } ?: return
            val enriched = enrich(raw.copy(macAddress = mac ?: raw.macAddress))
            val existing = merged[key]
            merged[key] = if (existing == null) enriched else pickBetterClient(existing, enriched)
        }

        // 1. System API caches (TetheringEventCallback + SoftApCallback)
        tetheringClientsCache.forEach { add(it) }
        softApClientsCache.forEach { add(it) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            readClientsViaTetheringManager()?.forEach { add(it) }
        }
        readClientsViaSoftApApi().forEach { add(it) }
        readClientsViaWifiManagerProbe().forEach { add(it) }
        dhcpHints.forEach { (mac, pair) ->
            add(ConnectedClient(name = pair.first.orEmpty(), macAddress = mac, ipAddress = pair.second))
        }
        readCachedDumpsysClients(forceRefresh = includeSubnetScan).forEach { add(it) }
        readClientsFromArp().forEach { add(it) }
        readClientsFromArpAggressive().forEach { add(it) }
        readClientsFromIpNeighOnAp().forEach { add(it) }

        if (includeSubnetScan && canProbeForClients()) {
            scanHotspotSubnetClients(supplementExisting = countRealClients(merged.values) > 0).forEach { add(it) }
            readClientsFromArpAggressive().forEach { add(it) }
            readClientsFromIpNeighOnAp().forEach { add(it) }
            readCachedDumpsysClients(forceRefresh = true).forEach { add(it) }
        }
        if (merged.isEmpty() && stableHotspotClients.isNotEmpty() && isHotspotLikelyActive()) {
            stableHotspotClients.forEach { add(it) }
        }

        val activePrefixes = getHotspotSubnetPrefixes().toSet()
        val hotspotActive = isHotspotLikelyActive()
        val result = merged.values
            .filter { client ->
                val ip = client.ipAddress
                when {
                    client.macAddress != null -> true
                    ip == null -> false
                    DeviceNameResolver.isHotspotClientIp(ip) -> true
                    activePrefixes.any { prefix -> ip.startsWith("$prefix.") } -> true
                    DeviceNameResolver.isLikelyHotspotSubnetIp(ip) && hotspotActive -> true
                    else -> false
                }
            }
            .toList()

        if (result.isNotEmpty()) {
            stableHotspotClients = result
            persistStableClients(result)
        } else if (stableHotspotClients.isNotEmpty() && canProbeForClients()) {
            Log.d(TAG, "readConnectedClients: using stable cache (${stableHotspotClients.size})")
            return stableHotspotClients
        }

        Log.d(TAG, "readConnectedClients: ${result.size} device(s) ${result.map { "${it.ipAddress}/${it.macAddress}" }} " +
            "(tethering=${tetheringClientsCache.size} softAp=${softApClientsCache.size} subnet=$includeSubnetScan)")
        return result
    }

    /** Lightweight read for UI — caches + ARP/neigh/dumpsys, no subnet sweep. */
    fun readConnectedClientsFast(): List<ConnectedClient> {
        ensureClientListeners()
        val merged = LinkedHashMap<String, ConnectedClient>()
        fun add(raw: ConnectedClient) {
            val mac = raw.macAddress?.uppercase()?.takeIf { it.length == 17 }
            val key = mac ?: raw.ipAddress?.takeIf { it.isNotBlank() } ?: return
            merged[key] = raw
        }
        tetheringClientsCache.forEach { add(it) }
        softApClientsCache.forEach { add(it) }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            readClientsViaTetheringManager()?.forEach { add(it) }
        }
        readClientsViaSoftApApi().forEach { add(it) }
        readClientsFromIpNeighOnAp().forEach { add(it) }
        readClientsFromArpAggressive().forEach { add(it) }
        readClientsFromArp().forEach { add(it) }
        readCachedDumpsysClients(forceRefresh = false).forEach { add(it) }
        readDhcpLeaseHints().forEach { (mac, pair) ->
            add(ConnectedClient(name = pair.first.orEmpty(), macAddress = mac, ipAddress = pair.second))
        }
        if (merged.isNotEmpty()) return merged.values.toList()
        if (stableHotspotClients.isNotEmpty()) return stableHotspotClients
        return emptyList()
    }

    private fun readCachedDumpsysClients(forceRefresh: Boolean = false): List<ConnectedClient> {
        val now = System.currentTimeMillis()
        if (!forceRefresh && now - lastDumpsysAt < 30_000 && cachedDumpsysClients.isNotEmpty()) {
            return cachedDumpsysClients
        }
        val found = (readClientsFromDumpsysTethering() + readClientsFromDumpsysWifi() + readClientsFromDumpsysConnectivity())
            .distinctBy { it.macAddress ?: it.ipAddress }
        if (found.isNotEmpty()) {
            cachedDumpsysClients = found
            lastDumpsysAt = now
        }
        return found
    }

    /** True when system callbacks supplied clients (not subnet guess). */
    fun hasReliableClientSource(): Boolean =
        tetheringClientsCache.isNotEmpty() || softApClientsCache.isNotEmpty()

    /** Probe only the hotspot AP subnet (wlan1 / ap0), never the phone's STA WiFi (wlan0). */
    private fun scanHotspotSubnetClients(supplementExisting: Boolean = false): List<ConnectedClient> {
        if (subnetScanInProgress) return subnetScanCache.ifEmpty { stableHotspotClients }
        synchronized(subnetScanLock) {
            if (subnetScanInProgress) return subnetScanCache.ifEmpty { stableHotspotClients }
            val now = System.currentTimeMillis()
            if (!supplementExisting && subnetScanCache.isNotEmpty() && now - lastSubnetScanAt < 30_000) {
                return subnetScanCache
            }
            subnetScanInProgress = true
            lastSubnetScanAt = now
            try {
                val arpFirst = (readClientsFromArpAggressive() + readClientsFromIpNeighOnAp())
                    .distinctBy { it.macAddress ?: it.ipAddress }
                val merged = LinkedHashMap<String, ConnectedClient>()
                arpFirst.forEach { c ->
                    val key = c.macAddress?.uppercase() ?: c.ipAddress ?: return@forEach
                    merged[key] = c
                }

                val localIps = getHotspotApIpv4AddressesRelaxed()
                val prefixes = (getHotspotSubnetPrefixes() + OemBrandDetector.preferredSubnetPrefixes())
                    .distinct()
                    .take(10)
                val scanPrefixes = prefixes.ifEmpty { OemBrandDetector.preferredSubnetPrefixes().take(10) }

                val systemCount = readSystemReportedClientCount()
                val shouldPing = supplementExisting ||
                    arpFirst.size < maxOf(systemCount, 1) ||
                    scanPrefixes.isNotEmpty()
                if (shouldPing) {
                    val skipIps = localIps.toSet()
                    val found = java.util.Collections.synchronizedList(mutableListOf<ConnectedClient>())
                    val pool = Executors.newFixedThreadPool(32)

                    val hostOrder = (2..254).sortedBy { host ->
                        when {
                            host in 100..200 -> 0
                            host in 2..60 -> 1
                            else -> 2
                        }
                    }

                    for (prefix in scanPrefixes) {
                        for (host in hostOrder) {
                            val ip = "$prefix.$host"
                            if (ip in skipIps || host == 1) continue
                            pool.submit {
                                if (isHostReachable(ip) || pingHost(ip)) {
                                    found.add(ConnectedClient(name = "", macAddress = null, ipAddress = ip))
                                }
                            }
                        }
                    }
                    pool.shutdown()
                    try {
                        pool.awaitTermination(25, TimeUnit.SECONDS)
                    } catch (_: InterruptedException) {
                        pool.shutdownNow()
                    }

                    val arpByIp = readClientsFromArpAggressive().associateBy { it.ipAddress }
                    val dhcpByIp = readDhcpLeasesByIp()
                    found.distinctBy { it.ipAddress }.forEach { client ->
                        val ip = client.ipAddress ?: return@forEach
                        val arp = arpByIp[ip]
                        val dhcp = dhcpByIp[ip]
                        val key = arp?.macAddress?.uppercase() ?: ip
                        val enriched = enrichClient(
                            client.copy(
                                macAddress = arp?.macAddress ?: dhcp?.second,
                                name = dhcp?.first.orEmpty(),
                                vendor = arp?.vendor
                            ),
                            dhcpByIp
                        )
                        merged[key] = if (merged.containsKey(key)) pickBetterClient(merged[key]!!, enriched) else enriched
                    }
                }

                arpFirst.forEach { c ->
                    val key = c.macAddress?.uppercase() ?: c.ipAddress ?: return@forEach
                    val enriched = enrichClient(c, readDhcpLeasesByIp())
                    merged[key] = if (merged.containsKey(key)) pickBetterClient(merged[key]!!, enriched) else enriched
                }

                val result = reconcileClientsByIp(merged.values)
                    .filter { client ->
                        client.macAddress != null ||
                            (client.ipAddress != null && isLikelyHotspotClientIp(client.ipAddress!!))
                    }
                if (result.isNotEmpty()) {
                    subnetScanCache = result
                    stableHotspotClients = result
                    persistStableClients(result)
                }
                Log.d(TAG, "subnet scan on $scanPrefixes: ${result.size} device(s) supplement=$supplementExisting")
                return result.ifEmpty { stableHotspotClients }
            } finally {
                subnetScanInProgress = false
            }
        }
    }

    private fun isLikelyHotspotClientIp(ip: String): Boolean {
        if (ip.isBlank()) return false
        val local = getHotspotApIpv4AddressesRelaxed().toSet()
        if (ip in local) return false
        val parts = ip.split(".")
        if (parts.size == 4 && parts[3] == "1") return false
        val prefixes = getHotspotSubnetPrefixes()
        if (prefixes.any { prefix -> ip.startsWith("$prefix.") }) return true
        return DeviceNameResolver.isHotspotClientIp(ip) ||
            (isHotspotLikelyActive() && DeviceNameResolver.isLikelyHotspotSubnetIp(ip))
    }

    private fun isWifiStaConnected(): Boolean {
        return try {
            @Suppress("DEPRECATION")
            val info = wifiManager.connectionInfo ?: return false
            info.networkId != -1 && info.ipAddress != 0
        } catch (_: Exception) {
            false
        }
    }

    private fun isApInterfaceName(name: String): Boolean = isApInterfaceNameRelaxed(name)

    private fun isApInterfaceNameRelaxed(name: String): Boolean {
        if (DeviceNameResolver.isHotspotApInterface(name)) return true
        val lower = name.lowercase()
        if (lower == "wlan0" && !isWifiStaConnected()) return true
        if (lower.startsWith("p2p") && isHotspotLikelyActive()) return true
        return isHotspotInterface(lower)
    }

    /** IPs on the soft-AP interface — does not require isWifiApEnabled reflection. */
    private fun getHotspotApIpv4AddressesRelaxed(): List<String> {
        return try {
            NetworkInterface.getNetworkInterfaces().toList()
                .filter { it.isUp && !it.isLoopback }
                .filter { iface -> isApInterfaceNameRelaxed(iface.name) }
                .flatMap { iface ->
                    iface.inetAddresses.toList()
                        .filterIsInstance<Inet4Address>()
                        .filter { !it.isLoopbackAddress }
                        .mapNotNull { it.hostAddress }
                }
                .distinct()
        } catch (e: Exception) {
            Log.w(TAG, "getHotspotApIpv4AddressesRelaxed: ${e.message}")
            emptyList()
        }
    }

    /** IPs on the soft-AP interface — includes wlan0 when it acts as hotspot. */
    private fun getHotspotApIpv4Addresses(): List<String> {
        val relaxed = getHotspotApIpv4AddressesRelaxed()
        if (relaxed.isNotEmpty()) return relaxed
        return try {
            NetworkInterface.getNetworkInterfaces().toList()
                .filter { it.isUp && !it.isLoopback }
                .filter { iface -> isHotspotLikelyActive() && isApInterfaceName(iface.name) }
                .flatMap { iface ->
                    iface.inetAddresses.toList()
                        .filterIsInstance<Inet4Address>()
                        .filter { !it.isLoopbackAddress }
                        .mapNotNull { it.hostAddress }
                }
                .distinct()
        } catch (e: Exception) {
            Log.w(TAG, "getHotspotApIpv4Addresses: ${e.message}")
            emptyList()
        }
    }

    private fun getHotspotSubnetPrefixes(): List<String> {
        val prefixes = linkedSetOf<String>()
        getHotspotApIpv4AddressesRelaxed().forEach { ip ->
            val parts = ip.split(".")
            if (parts.size == 4) prefixes.add(parts.take(3).joinToString("."))
        }
        try {
            NetworkInterface.getNetworkInterfaces().toList()
                .filter { it.isUp && !it.isLoopback }
                .filter { isApInterfaceNameRelaxed(it.name) }
                .forEach { iface ->
                    iface.inetAddresses.toList().forEach { addr ->
                        if (addr is Inet4Address && !addr.isLoopbackAddress) {
                            val ip = addr.hostAddress ?: return@forEach
                            val parts = ip.split(".")
                            if (parts.size == 4) prefixes.add(parts.take(3).joinToString("."))
                        }
                    }
                }
        } catch (_: Exception) {
        }
        if (userHotspotActive || hasTetheredInterfaces() || isHotspotOn() || isHotspotLikelyActive()) {
            OemBrandDetector.preferredSubnetPrefixes().forEach { prefixes.add(it) }
        }
        if (prefixes.isNotEmpty()) return prefixes.toList()
        return OemBrandDetector.preferredSubnetPrefixes()
    }

    /** How many clients the phone OS reports (Settings / dumpsys). */
    fun readSystemReportedClientCount(): Int {
        refreshTetheringClientsCache()
        val cached = tetheringClientsCache.size + softApClientsCache.size
        if (cached > 0) return cached
        return try {
            val dump = DumpsysClientParser.runDumpsys(arrayOf("dumpsys", "tethering"))
            listOf(
                Regex("""(?i)connected\s+clients?:\s*(\d+)"""),
                Regex("""(?i)num\s+clients?:\s*(\d+)"""),
                Regex("""(?i)client\s+count[:\s]+(\d+)"""),
                Regex("""(?i)stations?:\s*(\d+)""")
            ).firstNotNullOfOrNull { regex ->
                regex.find(dump)?.groupValues?.get(1)?.toIntOrNull()?.takeIf { it in 1..64 }
            } ?: DumpsysClientParser.parseAll(dump).size
        } catch (_: Exception) {
            0
        }
    }

    private fun pingHost(ip: String): Boolean {
        return try {
            val proc = Runtime.getRuntime().exec(arrayOf("/system/bin/ping", "-c", "1", "-W", "1", ip))
            proc.waitFor(2, TimeUnit.SECONDS) && proc.exitValue() == 0
        } catch (_: Exception) {
            false
        }
    }

    private fun isHostReachable(ip: String): Boolean {
        for (port in intArrayOf(443, 80, 53, 8080, 8443, 6200, 5555)) {
            try {
                Socket().use { it.connect(InetSocketAddress(ip, port), 350) }
                return true
            } catch (_: Exception) {}
        }
        try {
            if (InetAddress.getByName(ip).isReachable(600)) return true
        } catch (_: Exception) {}
        return false
    }

    fun hasWifiScanPermission(): Boolean = hasWifiScanPermissionInternal()

    private fun hasWifiScanPermissionInternal(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val nearby = ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.NEARBY_WIFI_DEVICES
            ) == PackageManager.PERMISSION_GRANTED
            if (nearby) return true
        }
        val fine = ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val coarse = ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        return fine || coarse
    }

    private fun hasLocationForWifiClients(): Boolean = hasWifiScanPermissionInternal()

    private fun readClientsFromDumpsysTethering(): List<ConnectedClient> {
        return try {
            val proc = Runtime.getRuntime().exec(arrayOf("dumpsys", "tethering"))
            val output = buildString {
                append(proc.inputStream.bufferedReader().readText())
                append(proc.errorStream.bufferedReader().readText())
            }
            proc.waitFor()
            if (output.contains("Permission Denial", ignoreCase = true)) {
                return emptyList()
            }
            val parsed = DeviceNameResolver.parseTetheringClientInformation(output) +
                DeviceNameResolver.parseTetheringBpfHotspotIps(output)
            if (parsed.isNotEmpty()) {
                Log.d(TAG, "dumpsys tethering: ${parsed.size} client(s)")
            }
            parsed.distinctBy { it.macAddress ?: it.ipAddress }
        } catch (e: Exception) {
            Log.w(TAG, "dumpsys tethering: ${e.message}")
            emptyList()
        }
    }

    /** Try every WifiManager method that may return connected SoftAp clients. */
    private fun readClientsViaWifiManagerProbe(): List<ConnectedClient> {
        val results = mutableListOf<ConnectedClient>()
        for (method in wifiManager.javaClass.methods) {
            if (method.parameterCount != 0) continue
            val name = method.name
            if (!name.contains("Client", ignoreCase = true) &&
                !name.contains("Station", ignoreCase = true) &&
                !name.contains("SoftAp", ignoreCase = true)
            ) continue
            if (name.contains("register", ignoreCase = true) ||
                name.contains("unregister", ignoreCase = true)
            ) continue
            try {
                val value = method.invoke(wifiManager) ?: continue
                when (value) {
                    is Collection<*> -> value.mapNotNullTo(results) { it?.let { parseWifiClient(it) } }
                    is Int -> if (name.contains("Client") && value in 1..32) {
                        Log.d(TAG, "$name returned count=$value")
                    }
                }
            } catch (_: Exception) {}
        }
        return results.distinctBy { it.macAddress ?: it.ipAddress }
    }

    private fun readClientsFromIpNeighOnAp(): List<ConnectedClient> {
        val apIfaces = LinkedHashSet(OemBrandDetector.preferredApInterfaces())
        if (isHotspotLikelyActive() && !isWifiStaConnected()) {
            apIfaces.add("wlan0")
        }
        val activePrefixes = getHotspotSubnetPrefixes().toSet()
        val found = mutableListOf<ConnectedClient>()
        for (iface in apIfaces) {
            try {
                val proc = Runtime.getRuntime().exec(arrayOf("ip", "neigh", "show", "dev", iface))
                val lines = proc.inputStream.bufferedReader().readLines()
                proc.waitFor()
                lines.forEach { line -> parseIpNeighLine(line, activePrefixes)?.let { found.add(it) } }
            } catch (_: Exception) {}
        }
        if (found.isEmpty()) {
            try {
                val proc = Runtime.getRuntime().exec(arrayOf("ip", "neigh", "show"))
                proc.inputStream.bufferedReader().readLines().forEach { line ->
                    parseIpNeighLine(line, activePrefixes)?.let { found.add(it) }
                }
                proc.waitFor()
            } catch (_: Exception) {}
        }
        if (found.isNotEmpty()) Log.d(TAG, "ip neigh: ${found.size} client(s)")
        return found.distinctBy { it.macAddress ?: it.ipAddress }
    }

    private fun parseIpNeighLine(line: String, activePrefixes: Set<String> = emptySet()): ConnectedClient? {
        val parts = line.trim().split("\\s+".toRegex())
        if (parts.size < 5) return null
        val ip = parts[0]
        val onHotspotSubnet = DeviceNameResolver.isHotspotClientIp(ip) ||
            DeviceNameResolver.isLikelyHotspotSubnetIp(ip) ||
            activePrefixes.any { prefix -> ip.startsWith("$prefix.") }
        if (!onHotspotSubnet) return null
        val macIdx = parts.indexOfFirst { it == "lladdr" } + 1
        if (macIdx <= 0 || macIdx >= parts.size) return null
        val mac = parts[macIdx].uppercase()
        val state = parts.last()
        if (state == "FAILED" || mac == "00:00:00:00:00:00") return null
        if (!mac.matches(Regex("""([0-9A-F]{2}:){5}[0-9A-F]{2}"""))) return null
        return ConnectedClient(name = "", macAddress = mac, ipAddress = ip, vendor = DeviceNameResolver.lookupVendor(mac))
    }

    private fun parseTetheredClient(client: Any): ConnectedClient? {
        return parseTetheredClientReflection(client)
    }

    private fun parseTetheredClientReflection(client: Any): ConnectedClient? {
        return try {
            val macRaw = client.javaClass.methods.firstOrNull { it.name == "getMacAddress" }
                ?.invoke(client)
            val mac = macRaw?.toString()?.let { normalizeMac(it) }

            val addresses = client.javaClass.methods.firstOrNull { it.name == "getAddresses" }
                ?.invoke(client) as? Collection<*>
            val ip = addresses?.firstOrNull()?.let { addr ->
                val inet = addr.javaClass.methods.firstOrNull { it.name == "getAddress" }?.invoke(addr)
                    ?: addr.javaClass.methods.firstOrNull { it.name == "getHostname" }?.invoke(addr)
                when (inet) {
                    is java.net.InetAddress -> inet.hostAddress
                    else -> inet?.toString()?.removePrefix("/")
                }
            }

            val hostname = client.javaClass.methods.firstOrNull { it.name == "getHostname" }
                ?.invoke(client) as? String

            if (mac.isNullOrBlank() && ip.isNullOrBlank()) return null

            ConnectedClient(
                name = hostname?.takeIf { DeviceNameResolver.isRealHostname(it) } ?: "",
                macAddress = mac,
                ipAddress = ip,
                vendor = DeviceNameResolver.lookupVendor(mac)
            )
        } catch (e: Exception) {
            Log.w(TAG, "parseTetheredClient failed: ${e.message}")
            null
        }
    }

    private fun parseWifiClient(client: Any): ConnectedClient? {
        return parseWifiClientReflection(client)
    }

    private fun parseWifiClientReflection(client: Any): ConnectedClient? {
        return try {
            val macRaw = client.javaClass.methods.firstOrNull { it.name == "getMacAddress" }
                ?.invoke(client) ?: return null
            val mac = normalizeMac(macRaw.toString()) ?: return null

            val ip = client.javaClass.methods.firstOrNull { it.name == "getInetAddress" }
                ?.invoke(client)?.let { inet ->
                    when (inet) {
                        is java.net.InetAddress -> inet.hostAddress
                        else -> inet.javaClass.methods.firstOrNull { m -> m.name == "getHostAddress" }
                            ?.invoke(inet) as? String
                    }
                }

            val hostname = client.javaClass.methods.firstOrNull {
                it.name == "getHostname" || it.name == "getName"
            }?.invoke(client) as? String

            ConnectedClient(
                name = hostname?.takeIf { DeviceNameResolver.isRealHostname(it) } ?: "",
                macAddress = mac,
                ipAddress = ip,
                vendor = DeviceNameResolver.lookupVendor(mac)
            )
        } catch (e: Exception) {
            Log.w(TAG, "parseWifiClient failed: ${e.message}")
            null
        }
    }

    private fun normalizeMac(raw: String): String? {
        val cleaned = raw.uppercase()
            .replace("-", ":")
            .trim()
        val macRegex = Regex("""([0-9A-F]{2}:){5}[0-9A-F]{2}""")
        return macRegex.find(cleaned)?.value
    }

    /** WifiManager.getConnectedSoftApClients() — official API */
    private fun readClientsViaSoftApApi(): List<ConnectedClient> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return emptyList()
        if (!hasLocationForWifiClients()) {
            Log.w(TAG, "Location off — SoftAp client API may return empty")
        }
        for (methodName in listOf("getConnectedSoftApClients", "getConnectedClients")) {
            try {
                val method = wifiManager.javaClass.getMethod(methodName)
                @Suppress("UNCHECKED_CAST")
                val clients = method.invoke(wifiManager) as? Collection<*> ?: continue
                val parsed = clients.mapNotNull { item -> item?.let { parseWifiClient(it) } }
                Log.d(TAG, "$methodName: ${parsed.size} client(s)")
                if (parsed.isNotEmpty()) return parsed
            } catch (e: Exception) {
                Log.w(TAG, "$methodName: ${e.javaClass.simpleName}: ${e.message}")
            }
        }
        return emptyList()
    }

    private fun readClientsFromDumpsysWifi(): List<ConnectedClient> {
        return try {
            val proc = Runtime.getRuntime().exec(arrayOf("dumpsys", "wifi"))
            val output = proc.inputStream.bufferedReader().readText()
            proc.waitFor()
            DeviceNameResolver.parseDumpsysWifiClients(output)
        } catch (_: Exception) { emptyList() }
    }

    private fun readClientsFromIpNeigh(): List<ConnectedClient> {
        return try {
            val proc = Runtime.getRuntime().exec(arrayOf("ip", "neigh", "show"))
            val lines = proc.inputStream.bufferedReader().readLines()
            proc.waitFor()
            lines.mapNotNull { line ->
                val parts = line.trim().split("\\s+".toRegex())
                if (parts.size < 5) return@mapNotNull null
                val ip = parts[0]
                if (!DeviceNameResolver.isHotspotClientIp(ip) &&
                    !DeviceNameResolver.isLikelyHotspotSubnetIp(ip)
                ) return@mapNotNull null
                val macIdx = parts.indexOfFirst { it == "lladdr" } + 1
                if (macIdx <= 0 || macIdx >= parts.size) return@mapNotNull null
                val mac = parts[macIdx].uppercase()
                val state = parts.last()
                if (state == "FAILED" || mac == "00:00:00:00:00:00") return@mapNotNull null
                if (!mac.matches(Regex("""([0-9A-F]{2}:){5}[0-9A-F]{2}"""))) return@mapNotNull null
                ConnectedClient(name = "", macAddress = mac, ipAddress = ip)
            }.also { clients ->
                if (clients.isNotEmpty()) Log.d(TAG, "ip neigh: ${clients.size} client(s)")
            }
        } catch (e: Exception) {
            Log.w(TAG, "ip neigh failed: ${e.message}")
            emptyList()
        }
    }

    private fun pickBetterClient(a: ConnectedClient, b: ConnectedClient): ConnectedClient {
        val better = if (DeviceNameResolver.nameQuality(b.name) > DeviceNameResolver.nameQuality(a.name)) b else a
        val worse = if (better === b) a else b
        return better.copy(
            macAddress = better.macAddress ?: worse.macAddress,
            ipAddress = better.ipAddress ?: worse.ipAddress,
            vendor = better.vendor ?: worse.vendor ?: DeviceNameResolver.lookupVendor(better.macAddress ?: worse.macAddress)
        )
    }

    private fun enrichClient(raw: ConnectedClient, dhcpByIp: Map<String, Pair<String?, String?>> = emptyMap()): ConnectedClient {
        val mac = raw.macAddress?.uppercase()?.takeIf { it.length == 17 }
            ?: raw.ipAddress?.trim()?.takeIf { it.isNotBlank() }?.let { ip ->
                prefs.getString("$IP_MAC_PREFIX$ip", null)?.uppercase()?.takeIf { it.length == 17 }
            }
        val dhcp = raw.ipAddress?.let { dhcpByIp[it] }
        val hostname = listOf(
            raw.name,
            dhcp?.first,
            raw.ipAddress?.let { DeviceNameResolver.resolveReverseHostname(it) }
        ).firstOrNull { DeviceNameResolver.isRealHostname(it) }
        val ip = raw.ipAddress ?: dhcp?.second
        val vendor = raw.vendor ?: DeviceNameResolver.lookupVendor(mac)
        val name = DeviceNameResolver.resolveDisplayName(
            mac = mac,
            ip = ip,
            hostname = hostname,
            cachedName = mac?.let { getCachedDeviceName(it) },
            vendor = vendor
        )
        if (hostname != null && mac != null) cacheDeviceName(mac, hostname)
        return ConnectedClient(name = name, macAddress = mac, ipAddress = ip, vendor = vendor)
    }

    /** Collapse IP-only and MAC-only entries for the same host. */
    private fun reconcileClientsByIp(clients: Collection<ConnectedClient>): List<ConnectedClient> {
        val byIp = LinkedHashMap<String, ConnectedClient>()
        val noIp = mutableListOf<ConnectedClient>()
        clients.forEach { client ->
            val ip = client.ipAddress?.trim()
            if (ip.isNullOrBlank()) {
                noIp.add(client)
                return@forEach
            }
            val existing = byIp[ip]
            byIp[ip] = if (existing == null) client else pickBetterClient(existing, client)
        }
        val merged = byIp.values.toMutableList()
        noIp.forEach { orphan ->
            val match = merged.firstOrNull { other ->
                other.macAddress != null && orphan.macAddress != null &&
                    other.macAddress == orphan.macAddress
            }
            if (match != null) {
                val idx = merged.indexOf(match)
                merged[idx] = pickBetterClient(match, orphan)
            } else {
                merged.add(orphan)
            }
        }
        return merged.distinctBy { it.macAddress?.uppercase() ?: it.ipAddress }
    }

    private fun readDhcpLeasesByIp(): Map<String, Pair<String?, String?>> {
        val byMac = readDhcpLeaseHints()
        val byIp = LinkedHashMap<String, Pair<String?, String?>>()
        byMac.forEach { (mac, hostIp) ->
            val ip = hostIp.second?.trim().orEmpty()
            if (ip.isNotEmpty()) byIp[ip] = hostIp.first to mac
        }
        return byIp
    }

    private fun readDumpsysClientHints(): Map<String, Pair<String?, String?>> {
        val hints = mutableMapOf<String, Pair<String?, String?>>()
        for (cmd in listOf(
            arrayOf("dumpsys", "tethering"),
            arrayOf("dumpsys", "connectivity"),
            arrayOf("dumpsys", "wifi")
        )) {
            try {
                val proc = Runtime.getRuntime().exec(cmd)
                val output = proc.inputStream.bufferedReader().readText()
                proc.waitFor()
                DeviceNameResolver.parseDumpsysClients(output).forEach { (mac, triple) ->
                    hints[mac] = triple.first to triple.second
                }
            } catch (_: Exception) {}
        }
        return hints
    }

    private fun readDhcpLeaseHints(): Map<String, Pair<String?, String?>> {
        for (path in OemBrandDetector.dhcpLeasePaths()) {
            try {
                val file = java.io.File(path)
                if (!file.canRead()) continue
                return DeviceNameResolver.parseDhcpLeases(file.readText()).mapValues { it.value }
            } catch (_: Exception) {}
        }
        return emptyMap()
    }

    fun readClientCount(): Int {
        refreshTetheringClientsCache()
        val cached = mergeClientCaches(tetheringClientsCache + softApClientsCache)
        if (cached.isNotEmpty()) return cached.size
        val scanned = readConnectedClientsFast()
        if (scanned.isNotEmpty()) return scanned.size
        return stableHotspotClients.size
    }

    /** Pull clients from system tethering/SoftAp APIs — matches phone Settings count. */
    fun readSystemConnectedClients(): List<ConnectedClient> {
        val discovered = discoverConnectedClients(deepScan = false)
        if (discovered.isNotEmpty()) return discovered
        return readConnectedClientsFast()
    }

    /** @see readSystemReportedClientCount */
    fun readSystemTetheringClientCount(): Int = readSystemReportedClientCount()

    /** Best-effort discovery — dumpsys + system APIs + ARP; used by Hotspot and Devices tabs. */
    fun discoverConnectedClients(deepScan: Boolean = true): List<ConnectedClient> {
        syncHotspotStateFromSystem()
        val systemApiClients = readSystemApiClientsOnMainThread()
        val dhcpByIp = readDhcpLeasesByIp()
        val systemCount = readSystemReportedClientCount()

        val merged = LinkedHashMap<String, ConnectedClient>()
        fun add(raw: ConnectedClient) {
            val enriched = enrichClient(raw, dhcpByIp)
            val mac = enriched.macAddress?.uppercase()?.takeIf { it.length == 17 }
            val key = mac ?: enriched.ipAddress?.takeIf { it.isNotBlank() } ?: return
            if (isGatewayOrLocalIp(enriched.ipAddress) && mac == null) return
            val existing = merged[key]
            merged[key] = if (existing == null) enriched else pickBetterClient(existing, enriched)
            if (mac != null && !enriched.ipAddress.isNullOrBlank()) cacheIpMacMapping(enriched.ipAddress!!, mac)
        }

        systemApiClients.forEach { add(it) }
        readFreshDumpsysClients().forEach { add(it) }
        readDhcpLeaseHints().forEach { (mac, pair) ->
            add(ConnectedClient(name = pair.first.orEmpty(), macAddress = mac, ipAddress = pair.second))
        }
        readClientsFromIpNeighOnAp().forEach { add(it) }
        readClientsFromIpNeigh().forEach { add(it) }
        readClientsFromArpAggressive().forEach { add(it) }
        readClientsFromArp().forEach { add(it) }

        if (deepScan) {
            scanHotspotSubnetClients(supplementExisting = merged.isNotEmpty()).forEach { add(it) }
            readFreshDumpsysClients().forEach { add(it) }
            readClientsFromArpAggressive().forEach { add(it) }
            readClientsFromIpNeighOnAp().forEach { add(it) }
            readDhcpLeaseHints().forEach { (mac, pair) ->
                add(ConnectedClient(name = pair.first.orEmpty(), macAddress = mac, ipAddress = pair.second))
            }
        }

        if (merged.isEmpty() && stableHotspotClients.isNotEmpty() && isHotspotOn()) {
            return stableHotspotClients.map { enrichClient(it, dhcpByIp) }
        }

        var result = reconcileClientsByIp(merged.values)
            .filter { client ->
                !isGatewayOrLocalIp(client.ipAddress) &&
                    (client.macAddress != null || !client.ipAddress.isNullOrBlank())
            }

        if (result.size < systemCount && deepScan && (isHotspotLikelyActive() || systemCount > 0)) {
            invalidateClientScanCache()
            scanHotspotSubnetClients(supplementExisting = true).forEach { add(it) }
            result = reconcileClientsByIp(merged.values)
                .filter { client ->
                    !isGatewayOrLocalIp(client.ipAddress) &&
                        (client.macAddress != null || !client.ipAddress.isNullOrBlank())
                }
        }

        if (result.isEmpty() && systemCount > 0) {
            DumpsysClientParser.collectFromAllSources()
                .filter { !isGatewayOrLocalIp(it.ipAddress) }
                .forEach { add(it) }
            result = reconcileClientsByIp(merged.values)
                .filter { client ->
                    !isGatewayOrLocalIp(client.ipAddress) &&
                        (client.macAddress != null || !client.ipAddress.isNullOrBlank())
                }
        }

        if (result.isNotEmpty()) {
            stableHotspotClients = result
            persistStableClients(result)
        } else if (isHotspotOn()) {
            stableHotspotClients = emptyList()
            prefs.edit().remove(KEY_STABLE_CLIENTS).apply()
        }
        Log.d(TAG, "discoverConnectedClients: ${result.size} device(s) deep=$deepScan system=$systemCount api=${systemApiClients.size}")
        return result
    }

    private fun readFreshDumpsysClients(): List<ConnectedClient> {
        val found = DumpsysClientParser.collectFromAllSources().distinctBy { it.macAddress ?: it.ipAddress }
        if (found.isNotEmpty()) {
            cachedDumpsysClients = found
            lastDumpsysAt = System.currentTimeMillis()
        }
        return found
    }

    fun getDetectedPhoneBrand(): String = OemBrandDetector.displayName()

    fun startRealtimeMonitoring(listener: (List<ConnectedClient>) -> Unit) {
        val monitor = HotspotRealtimeMonitor.getInstance(context)
        monitor.addListener(listener)
        monitor.start()
    }

    fun stopRealtimeMonitoring(listener: (List<ConnectedClient>) -> Unit) {
        HotspotRealtimeMonitor.getInstance(context).removeListener(listener)
    }

    fun forceRealtimeRefresh() {
        HotspotRealtimeMonitor.getInstance(context).forceRefresh()
    }

    /** Fast scan first; full scan when phone hotspot shows clients but ARP is empty. */
    fun readConnectedClientsForDisplay(): List<ConnectedClient> {
        val system = readSystemApiClientsOnMainThread()
        if (system.isNotEmpty()) return system
        val fast = readConnectedClientsFast()
        if (fast.isNotEmpty()) return fast
        return discoverConnectedClients(deepScan = true)
    }

    fun cacheIpMacMapping(ip: String, mac: String) {
        val normalized = mac.uppercase().replace('-', ':')
        if (normalized.length != 17 || normalized == "00:00:00:00:00:00") return
        // Skip only our synthetic IP-derived MACs, not real private/randomized client MACs
        if (normalized == DeviceNameResolver.pseudoMacFromIp(ip).uppercase()) return
        prefs.edit().putString("$IP_MAC_PREFIX$ip", normalized).apply()
    }

    fun resolveMacForReport(ip: String?, mac: String?): String? {
        val realMac = mac?.trim()?.uppercase()?.replace('-', ':')?.takeIf {
            it.length == 17 && it != "00:00:00:00:00:00" &&
                it != ip?.let { addr -> DeviceNameResolver.pseudoMacFromIp(addr).uppercase() }
        }
        if (realMac != null) {
            ip?.let { cacheIpMacMapping(it, realMac) }
            return realMac
        }
        ip?.trim()?.takeIf { it.isNotBlank() }?.let { cached ->
            prefs.getString("$IP_MAC_PREFIX$cached", null)?.let { return it }
        }
        return mac?.trim()?.uppercase()?.replace('-', ':')?.takeIf { it.length == 17 }
            ?: ip?.takeIf { it.isNotBlank() }?.let { DeviceNameResolver.pseudoMacFromIp(it) }
    }

    fun invalidateClientScanCache() {
        lastSubnetScanAt = 0L
        lastDumpsysAt = 0L
        subnetScanCache = emptyList()
        cachedDumpsysClients = emptyList()
    }

    /** Background poll may run a subnet sweep when fast paths found nothing. */
    fun shouldRunThrottledSubnetScan(): Boolean {
        if (!isHotspotLikelyActive()) return false
        return System.currentTimeMillis() - lastSubnetScanAt > 45_000
    }

    private fun readClientsViaTetheringManager(): List<ConnectedClient>? {
        return try {
            val tm = context.getSystemService("tethering") ?: return null
            val method = (tm as Any).javaClass.methods.firstOrNull {
                it.name == "getTetheredClients" || it.name == "getConnectedTetheringClients"
            } ?: return null
            @Suppress("UNCHECKED_CAST")
            val clients = method.invoke(tm) as? Collection<*> ?: return emptyList()
            clients.mapNotNull { item -> item?.let { parseTetheredClient(it) } }
                .distinctBy { it.macAddress ?: it.ipAddress ?: it.name }
        } catch (e: Exception) {
            Log.w(TAG, "getTetheredClients: ${e.javaClass.simpleName}: ${e.message}")
            null
        }
    }

    private fun parseClientViaReflection(client: Any): ConnectedClient? {
        return try {
            val mac = client.javaClass.methods.firstOrNull { it.name == "getMacAddress" }
                ?.invoke(client)?.toString()?.let { normalizeMac(it) }
            val addresses = client.javaClass.methods.firstOrNull { it.name == "getAddresses" }
                ?.invoke(client) as? Collection<*>
            val ip = addresses?.firstOrNull()?.let { addr ->
                addr.javaClass.methods.firstOrNull { it.name == "getHostAddress" }
                    ?.invoke(addr) as? String
            }
            val hostname = client.javaClass.methods.firstOrNull { it.name == "getHostname" }
                ?.invoke(client) as? String
            val vendor = DeviceNameResolver.lookupVendor(mac)
            if (mac.isNullOrBlank()) return null
            ConnectedClient(
                name = hostname?.takeIf { DeviceNameResolver.isRealHostname(it) } ?: "",
                macAddress = mac,
                ipAddress = ip,
                vendor = vendor
            )
        } catch (_: Exception) { null }
    }

    private fun readClientsFromArpAggressive(): List<ConnectedClient> {
        if (!hasWifiScanPermissionInternal()) return emptyList()
        val phoneIps = getHotspotApIpv4AddressesRelaxed().toSet()
        val activePrefixes = getHotspotSubnetPrefixes().toSet()
        return try {
            val arpFile = java.io.File("/proc/net/arp")
            if (!arpFile.canRead()) return emptyList()
            arpFile.readLines().drop(1).mapNotNull { line ->
                val p = line.trim().split("\\s+".toRegex())
                if (p.size < 4) return@mapNotNull null
                val ip = p[0]
                val mac = p[3].uppercase()
                if (ip in phoneIps) return@mapNotNull null
                if (mac == "00:00:00:00:00:00" || mac.length != 17) return@mapNotNull null
                if (!mac.matches(Regex("""([0-9A-F]{2}:){5}[0-9A-F]{2}"""))) return@mapNotNull null
                val onSubnet = isLikelyHotspotClientIp(ip) ||
                    DeviceNameResolver.isLikelyHotspotSubnetIp(ip) ||
                    activePrefixes.any { prefix -> ip.startsWith("$prefix.") } ||
                    userHotspotActive
                if (!onSubnet) return@mapNotNull null
                ConnectedClient(
                    name = "",
                    macAddress = mac,
                    ipAddress = ip,
                    vendor = DeviceNameResolver.lookupVendor(mac)
                )
            }.distinctBy { it.macAddress ?: it.ipAddress }.also { clients ->
                if (clients.isNotEmpty()) Log.d(TAG, "arp aggressive: ${clients.size} client(s)")
            }
        } catch (e: Exception) {
            Log.w(TAG, "arp aggressive: ${e.message}")
            emptyList()
        }
    }

    private fun readClientsFromArp(): List<ConnectedClient> {
        return try {
            val arpFile = java.io.File("/proc/net/arp")
            if (!arpFile.canRead()) return emptyList()
            arpFile.readLines().drop(1).mapNotNull { line ->
                val p = line.trim().split("\\s+".toRegex())
                if (p.size < 4) return@mapNotNull null
                val ip = p[0]
                val flags = p.getOrNull(2) ?: ""
                val mac = p[3]
                val iface = if (p.size >= 6) p[5] else ""
                val complete = flags == "0x2" || flags == "0x6" || flags == "0x0" || flags == "0x4"
                val onHotspot = isApInterfaceName(iface) ||
                    DeviceNameResolver.isHotspotClientIp(ip) ||
                    DeviceNameResolver.isLikelyHotspotSubnetIp(ip)
                if (onHotspot && complete && mac != "00:00:00:00:00:00" && mac.length == 17) {
                    ConnectedClient(
                        name = "",
                        macAddress = mac.uppercase(),
                        ipAddress = ip,
                        vendor = DeviceNameResolver.lookupVendor(mac.uppercase())
                    )
                } else null
            }.distinctBy { it.macAddress ?: it.ipAddress }.also { clients ->
                if (clients.isNotEmpty()) Log.d(TAG, "arp: ${clients.size} client(s)")
            }
        } catch (e: Exception) {
            Log.w(TAG, "arp: ${e.message}")
            emptyList()
        }
    }

    private fun isHotspotInterface(iface: String): Boolean {
        if (iface.isBlank()) return false
        val lower = iface.lowercase()
        return lower.startsWith("ap") ||
            lower.contains("ap_br") ||
            lower.startsWith("swlan") ||
            lower.startsWith("rndis") ||
            lower.startsWith("bond") ||
            (lower.startsWith("wlan") && lower != "wlan0")
    }

    private fun isGatewayOrLocalIp(ip: String?): Boolean {
        if (ip.isNullOrBlank()) return false
        if (ip in getHotspotApIpv4AddressesRelaxed().toSet()) return true
        val parts = ip.split(".")
        return parts.size == 4 && parts[3] == "1"
    }

    private fun countRealClients(clients: Collection<ConnectedClient>): Int =
        clients.count { client ->
            !isGatewayOrLocalIp(client.ipAddress) &&
                (client.macAddress != null || !client.ipAddress.isNullOrBlank())
        }

    private fun persistStableClients(clients: List<ConnectedClient>) {
        val encoded = clients.joinToString("\n") { c ->
            listOf(
                c.macAddress.orEmpty(),
                c.ipAddress.orEmpty(),
                c.name.replace("\n", " ")
            ).joinToString("\t")
        }
        prefs.edit().putString(KEY_STABLE_CLIENTS, encoded).apply()
    }

    private fun loadStableClientsFromPrefs() {
        val raw = prefs.getString(KEY_STABLE_CLIENTS, null) ?: return
        val loaded = raw.lineSequence().mapNotNull { line ->
            val parts = line.split("\t")
            if (parts.size < 2) return@mapNotNull null
            val mac = parts[0].takeIf { it.length == 17 }
            val ip = parts[1].takeIf { it.isNotBlank() }
            val name = parts.getOrNull(2).orEmpty()
            if (mac == null && ip == null) return@mapNotNull null
            ConnectedClient(name = name, macAddress = mac, ipAddress = ip)
        }.toList()
        if (loaded.isNotEmpty()) stableHotspotClients = loaded
    }

    private fun readClientsFromDumpsysConnectivity(): List<ConnectedClient> {
        return try {
            val proc = Runtime.getRuntime().exec(arrayOf("dumpsys", "connectivity"))
            val output = buildString {
                append(proc.inputStream.bufferedReader().readText())
                append(proc.errorStream.bufferedReader().readText())
            }
            proc.waitFor()
            DeviceNameResolver.parseDumpsysClients(output).map { (mac, triple) ->
                ConnectedClient(
                    name = triple.first.orEmpty(),
                    macAddress = mac,
                    ipAddress = triple.second,
                    vendor = DeviceNameResolver.lookupVendor(mac)
                )
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun String.cleanSsid(): String? =
        removePrefix("\"").removeSuffix("\"").trim().ifEmpty { null }
}
