package com.wifiextender.utils

import android.content.Context
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log
import java.lang.reflect.Method

data class HotspotInfo(
    val ssid: String,
    val password: String,
    val isActive: Boolean
)

class HotspotManager(private val context: Context) {

    private val wifiManager: WifiManager =
        context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

    var isActive: Boolean = false
        private set

    private var currentSsid: String = ""
    private var currentPassword: String = ""
    private var reservedChannel: AutoCloseable? = null

    fun setActive(ssid: String, password: String) {
        isActive = true
        currentSsid = ssid
        currentPassword = password
    }

    fun setInactive() {
        isActive = false
        currentSsid = ""
        currentPassword = ""
        reservedChannel?.close()
        reservedChannel = null
    }

    fun getCurrentInfo(): HotspotInfo? {
        if (!isActive) return null
        return HotspotInfo(currentSsid, currentPassword, true)
    }

    /**
     * Try to start hotspot programmatically with custom SSID and password.
     * Returns true if started successfully, false if manual setup is needed.
     */
    fun startHotspot(ssid: String, password: String, callback: (Boolean, String) -> Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startHotspotAndroid8Plus(ssid, password, callback)
        } else {
            startHotspotLegacy(ssid, password, callback)
        }
    }

    /**
     * Android 8+ — tries reflection first, then falls back to dialog
     */
    @Suppress("DEPRECATION")
    private fun startHotspotAndroid8Plus(ssid: String, password: String, callback: (Boolean, String) -> Unit) {
        // Try reflection to set config and start hotspot (works on many devices)
        if (trySetHotspotConfig(ssid, password)) {
            val started = tryStartHotspot()
            if (started) {
                setActive(ssid, password)
                callback(true, "Hotspot started: $ssid")
                return
            }
        }
        // Cannot start programmatically - need user to do it manually
        callback(false, "Please enable hotspot manually")
    }

    /**
     * Android < 8 — direct reflection control
     */
    @Suppress("DEPRECATION")
    private fun startHotspotLegacy(ssid: String, password: String, callback: (Boolean, String) -> Unit) {
        try {
            if (trySetHotspotConfig(ssid, password)) {
                val started = tryStartHotspot()
                if (started) {
                    setActive(ssid, password)
                    callback(true, "Hotspot started: $ssid")
                    return
                }
            }
            callback(false, "Please enable hotspot manually in Settings.")
        } catch (e: Exception) {
            callback(false, "Cannot start hotspot automatically. Please enable in Settings.")
        }
    }

    /**
     * Stop hotspot via reflection
     */
    fun stopHotspot(): Boolean {
        return try {
            reservedChannel?.close()
            reservedChannel = null
            val method: Method = wifiManager.javaClass.getDeclaredMethod("stopWifiAp")
            method.isAccessible = true
            method.invoke(wifiManager)
            setInactive()
            true
        } catch (_: Exception) {
            setInactive()
            false
        }
    }

    /**
     * Check if hotspot is ON via reflection
     */
    fun isHotspotOn(): Boolean {
        return try {
            val method: Method = wifiManager.javaClass.getDeclaredMethod("isWifiApEnabled")
            method.isAccessible = true
            method.invoke(wifiManager) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    /**
     * Try to set hotspot config with custom SSID/password via reflection
     */
    @Suppress("DEPRECATION")
    private fun trySetHotspotConfig(ssid: String, password: String): Boolean {
        return try {
            val config = WifiConfiguration().apply {
                SSID = ssid
                preSharedKey = password
                allowedAuthAlgorithms.set(WifiConfiguration.AuthAlgorithm.SHARED)
                allowedProtocols.set(WifiConfiguration.Protocol.RSN)
                allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK)
                allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.CCMP)
                allowedGroupCiphers.set(WifiConfiguration.GroupCipher.CCMP)
            }
            val method: Method = wifiManager.javaClass.getDeclaredMethod(
                "setWifiApConfiguration", WifiConfiguration::class.java
            )
            method.isAccessible = true
            method.invoke(wifiManager, config) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    /**
     * Try to start hotspot via reflection
     */
    @Suppress("DEPRECATION")
    private fun tryStartHotspot(): Boolean {
        return try {
            val method: Method = wifiManager.javaClass.getDeclaredMethod(
                "startWifiAp", WifiConfiguration::class.java
            )
            method.isAccessible = true
            method.invoke(wifiManager, null) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    /**
     * Read current hotspot SSID/password via reflection
     */
    @Suppress("DEPRECATION")
    fun readHotspotInfo(): Pair<String, String>? {
        return try {
            val method: Method = wifiManager.javaClass.getDeclaredMethod("getWifiApConfiguration")
            method.isAccessible = true
            val config = method.invoke(wifiManager) ?: return null
            val ssid = config.javaClass.getDeclaredField("SSID").apply { isAccessible = true }.get(config) as? String ?: return null
            val pass = try {
                config.javaClass.getDeclaredField("preSharedKey").apply { isAccessible = true }.get(config) as? String ?: ""
            } catch (_: Exception) { "" }
            Pair(ssid.removePrefix("\"").removeSuffix("\""), pass.removePrefix("\"").removeSuffix("\""))
        } catch (_: Exception) { readSoftApConfig() }
    }

    private fun readSoftApConfig(): Pair<String, String>? {
        return try {
            val config = wifiManager.javaClass.getDeclaredMethod("getSoftApConfiguration")
                .apply { isAccessible = true }.invoke(wifiManager) ?: return null
            val ssid = config.javaClass.getDeclaredMethod("getSsid")
                .apply { isAccessible = true }.invoke(config) as? String ?: return null
            val pass = try {
                config.javaClass.getDeclaredMethod("getPassphrase")
                    .apply { isAccessible = true }.invoke(config) as? String ?: ""
            } catch (_: Exception) { "" }
            Pair(ssid, pass)
        } catch (_: Exception) { null }
    }
}
