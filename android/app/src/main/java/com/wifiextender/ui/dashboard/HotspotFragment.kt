package com.wifiextender.ui.dashboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiConfiguration
import android.net.wifi.WifiManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.LinearLayout
import androidx.appcompat.app.AlertDialog
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.google.android.material.snackbar.Snackbar
import com.wifiextender.R
import com.wifiextender.databinding.FragmentHotspotBinding

class HotspotFragment : Fragment() {

    private var _binding: FragmentHotspotBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by activityViewModels()

    private val handler = Handler(Looper.getMainLooper())
    private var uptimeSeconds = 0
    private var uptimeRunnable: Runnable? = null
    private var devicePollRunnable: Runnable? = null
    private var autoCheckRunnable: Runnable? = null
    private var isHotspotActive = false

    // Custom hotspot config
    private var hotspotSsid = "Extendra-WiFi"
    private var hotspotPassword = "extendra123"

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentHotspotBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        setUiStopped()

        binding.btnToggleHotspot.setOnClickListener {
            if (isHotspotActive) stopHotspot()
            else showHotspotConfigDialog()
        }

        binding.btnCopySsid.setOnClickListener {
            copyToClipboard("SSID", binding.tvSsid.text.toString())
        }
        binding.btnCopyPassword.setOnClickListener {
            copyToClipboard("Password", binding.tvPassword.text.toString())
        }

        viewModel.devices.observe(viewLifecycleOwner) { devices ->
            if (_binding == null) return@observe
            val count = devices.count { !it.blocked }
            binding.tvConnectedCount.text = "$count device${if (count != 1) "s" else ""} connected"
        }

        updateWifiSource()
    }

    private fun updateWifiSource() {
        try {
            val wm = requireContext().applicationContext
                .getSystemService(Context.WIFI_SERVICE) as WifiManager
            @Suppress("DEPRECATION")
            val ssid = wm.connectionInfo?.ssid?.removePrefix("\"")?.removeSuffix("\"") ?: ""
            if (ssid.isNotEmpty() && ssid != "<unknown ssid>") {
                binding.tvWifiSource.text = ssid
            }
        } catch (_: Exception) {}
    }

    /**
     * Show dialog to configure SSID and password, then start hotspot
     */
    private fun showHotspotConfigDialog() {
        val layout = LinearLayout(requireContext()).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(60, 20, 60, 20)
        }

        val ssidInput = EditText(requireContext()).apply {
            hint = "Hotspot Name (SSID)"
            setText(hotspotSsid)
        }

        val passInput = EditText(requireContext()).apply {
            hint = "Password (min 8 chars)"
            setText(hotspotPassword)
        }

        layout.addView(ssidInput)
        layout.addView(passInput)

        AlertDialog.Builder(requireContext())
            .setTitle("📡 Configure Hotspot")
            .setView(layout)
            .setPositiveButton("Start") { _, _ ->
                val ssid = ssidInput.text.toString().trim()
                val pass = passInput.text.toString().trim()
                if (ssid.isEmpty()) {
                    showSnack("❌ SSID cannot be empty")
                    return@setPositiveButton
                }
                if (pass.length < 8) {
                    showSnack("❌ Password must be at least 8 characters")
                    return@setPositiveButton
                }
                hotspotSsid = ssid
                hotspotPassword = pass
                startHotspot(ssid, pass)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    @Suppress("DEPRECATION")
    private fun startHotspot(ssid: String, password: String) {
        val wm = requireContext().applicationContext
            .getSystemService(Context.WIFI_SERVICE) as WifiManager

        binding.btnToggleHotspot.text = "Starting..."
        binding.btnToggleHotspot.isEnabled = false

        try {
            // Set custom config via reflection
            val config = WifiConfiguration().apply {
                SSID = ssid
                preSharedKey = password
                allowedAuthAlgorithms.set(WifiConfiguration.AuthAlgorithm.SHARED)
                allowedProtocols.set(WifiConfiguration.Protocol.RSN)
                allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK)
                allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.CCMP)
                allowedGroupCiphers.set(WifiConfiguration.GroupCipher.CCMP)
            }
            try {
                wm.javaClass.getDeclaredMethod("setWifiApConfiguration", WifiConfiguration::class.java)
                    .apply { isAccessible = true }.invoke(wm, config)
            } catch (_: Exception) {}

            // Try startWifiAp
            Thread {
                Thread.sleep(500)
                var started = false
                try {
                    started = wm.javaClass.getDeclaredMethod("startWifiAp", WifiConfiguration::class.java)
                        .apply { isAccessible = true }.invoke(wm, config) as? Boolean ?: false
                } catch (_: Exception) {}

                handler.post {
                    if (_binding == null) return@post
                    if (started || isSystemHotspotOn()) {
                        isHotspotActive = true
                        setUiStarted(ssid, password)
                        startUptimeTimer()
                        startDevicePolling()
                        showSnack("✅ Hotspot '$ssid' started!")
                    } else {
                        // Open Quick Settings panel — user flips ONE toggle
                        binding.btnToggleHotspot.text = "▶  Start Hotspot"
                        binding.btnToggleHotspot.isEnabled = true
                        openHotspotToggle()
                        startAutoCheck(ssid, password)
                    }
                }
            }.start()
        } catch (_: Exception) {
            binding.btnToggleHotspot.text = "▶  Start Hotspot"
            binding.btnToggleHotspot.isEnabled = true
            openHotspotToggle()
            startAutoCheck(ssid, password)
        }
    }

    private fun openHotspotToggle() {
        // Show a non-blocking snackbar — no dialog popup
        if (_binding != null) {
            Snackbar.make(binding.root, "Flip the hotspot toggle → app auto-detects in 1 sec!", Snackbar.LENGTH_LONG)
                .setAction("Open") {
                    try {
                        val intent = Intent()
                        intent.setClassName("com.android.settings", "com.android.settings.TetherSettings")
                        startActivity(intent)
                    } catch (_: Exception) {
                        startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS))
                    }
                }.show()
        }
    }

    private fun startAutoCheck(ssid: String, password: String) {
        autoCheckRunnable?.let { handler.removeCallbacks(it) }
        var checks = 0
        autoCheckRunnable = object : Runnable {
            override fun run() {
                if (isHotspotActive || _binding == null) return
                checks++
                if (isSystemHotspotOn()) {
                    isHotspotActive = true
                    setUiStarted(ssid, password)
                    startUptimeTimer()
                    startDevicePolling()
                    showSnack("✅ Hotspot '$ssid' is active!")
                    autoCheckRunnable = null
                } else if (checks < 30) {
                    handler.postDelayed(this, 2000)
                } else {
                    handler.post {
                        if (_binding != null) {
                            binding.btnToggleHotspot.text = "▶  Start Hotspot"
                            binding.btnToggleHotspot.isEnabled = true
                        }
                    }
                }
            }
        }
        handler.postDelayed(autoCheckRunnable!!, 2000)
    }

    override fun onResume() {
        super.onResume()
        updateWifiSource()
        if (!isHotspotActive && isSystemHotspotOn()) {
            isHotspotActive = true
            setUiStarted(hotspotSsid, hotspotPassword)
            if (uptimeRunnable == null) startUptimeTimer()
            if (devicePollRunnable == null) startDevicePolling()
        }
    }

    private fun stopHotspot() {
        try {
            val wm = requireContext().applicationContext
                .getSystemService(Context.WIFI_SERVICE) as WifiManager
            val stopMethod = wm.javaClass.getDeclaredMethod("stopWifiAp")
            stopMethod.isAccessible = true
            stopMethod.invoke(wm)
        } catch (_: Exception) {
            showSnackWithAction("Turn OFF hotspot in Settings.", "Open") {
                startActivity(Intent(Settings.ACTION_WIRELESS_SETTINGS))
            }
        }
        isHotspotActive = false
        setUiStopped()
        stopUptimeTimer()
        stopDevicePolling()
        autoCheckRunnable?.let { handler.removeCallbacks(it) }
    }

    private fun isSystemHotspotOn(): Boolean {
        return try {
            val wm = requireContext().applicationContext
                .getSystemService(Context.WIFI_SERVICE) as WifiManager
            wm.javaClass.getDeclaredMethod("isWifiApEnabled")
                .apply { isAccessible = true }.invoke(wm) as? Boolean ?: false
        } catch (_: Exception) { false }
    }

    private fun setUiStarted(ssid: String, password: String) {
        if (_binding == null) return
        binding.btnToggleHotspot.isEnabled = true
        binding.btnToggleHotspot.text = "⏹  Stop Hotspot"
        binding.btnToggleHotspot.setBackgroundColor(ContextCompat.getColor(requireContext(), R.color.red_500))
        binding.tvHotspotStatus.text = "🟢 Hotspot Active"
        binding.tvHotspotStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.green_500))
        binding.cardHotspotInfo.visibility = View.VISIBLE
        binding.tvSsid.text = ssid
        binding.tvPassword.text = password.ifEmpty { "(open network)" }
    }

    private fun setUiStopped() {
        if (_binding == null) return
        binding.btnToggleHotspot.isEnabled = true
        binding.btnToggleHotspot.text = "▶  Start Hotspot"
        binding.btnToggleHotspot.setBackgroundColor(ContextCompat.getColor(requireContext(), R.color.brand_primary))
        binding.tvHotspotStatus.text = "⚫ Hotspot Inactive"
        binding.tvHotspotStatus.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_secondary))
        binding.cardHotspotInfo.visibility = View.GONE
        binding.tvUptime.text = "00:00:00"
        binding.tvConnectedCount.text = "0 devices"
        uptimeSeconds = 0
    }

    private fun startUptimeTimer() {
        uptimeSeconds = 0
        uptimeRunnable = object : Runnable {
            override fun run() {
                if (_binding == null) return
                uptimeSeconds++
                val h = uptimeSeconds / 3600
                val m = (uptimeSeconds % 3600) / 60
                val s = uptimeSeconds % 60
                binding.tvUptime.text = "%02d:%02d:%02d".format(h, m, s)
                handler.postDelayed(this, 1000)
            }
        }
        handler.post(uptimeRunnable!!)
    }

    private fun stopUptimeTimer() {
        uptimeRunnable?.let { handler.removeCallbacks(it) }
        uptimeRunnable = null
    }

    private fun startDevicePolling() {
        viewModel.scanAndReportDevices(requireContext())
        devicePollRunnable = object : Runnable {
            override fun run() {
                if (isHotspotActive) {
                    viewModel.scanAndReportDevices(requireContext())
                    handler.postDelayed(this, 8000)
                }
            }
        }
        handler.postDelayed(devicePollRunnable!!, 3000)
    }

    private fun stopDevicePolling() {
        devicePollRunnable?.let { handler.removeCallbacks(it) }
        devicePollRunnable = null
    }

    private fun copyToClipboard(label: String, text: String) {
        val cb = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cb.setPrimaryClip(ClipData.newPlainText(label, text))
        showSnack("$label copied!")
    }

    private fun showSnack(msg: String) {
        if (_binding != null) Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
    }

    private fun showSnackWithAction(msg: String, action: String, onClick: () -> Unit) {
        if (_binding != null)
            Snackbar.make(binding.root, msg, Snackbar.LENGTH_INDEFINITE)
                .setAction(action) { onClick() }.show()
    }

    override fun onDestroyView() {
        stopUptimeTimer()
        stopDevicePolling()
        autoCheckRunnable?.let { handler.removeCallbacks(it) }
        super.onDestroyView()
        _binding = null
    }
}
