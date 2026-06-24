package com.wifiextender.ui.dashboard

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.wifiextender.R
import com.wifiextender.databinding.FragmentDevicesBinding
import com.wifiextender.ui.dashboard.adapter.ConnectedClientAdapter
import com.wifiextender.utils.ConnectedClient
import com.wifiextender.utils.HotspotManager
import com.wifiextender.utils.HotspotRealtimeMonitor

class DevicesFragment : Fragment() {

    private var _binding: FragmentDevicesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by activityViewModels()
    private lateinit var adapter: ConnectedClientAdapter
    private lateinit var hotspotManager: HotspotManager
    private lateinit var realtimeMonitor: HotspotRealtimeMonitor
    private val handler = Handler(Looper.getMainLooper())
    private var pollRunnable: Runnable? = null
    private var locationHintShown = false
    private var discoverInFlight = false

    private val clientListener: (List<ConnectedClient>) -> Unit = listener@{ clients ->
        activity?.runOnUiThread {
            if (_binding == null) return@runOnUiThread
            applyClientDisplay(clients)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDevicesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        hotspotManager = HotspotManager.getInstance(requireContext())
        realtimeMonitor = HotspotRealtimeMonitor.getInstance(requireContext())

        adapter = ConnectedClientAdapter()
        binding.rvDevices.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDevices.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener { refreshDevices(force = true) }

        viewModel.hotspotActive.observe(viewLifecycleOwner) { active ->
            if (active != true) applyClientDisplay(emptyList())
        }

        viewModel.deviceScanComplete.observe(viewLifecycleOwner) { done ->
            if (done == true) binding.swipeRefresh.isRefreshing = false
        }

        viewModel.subscription.observe(viewLifecycleOwner) { sub ->
            val max = sub?.plan?.maxDevices ?: sub?.maxDevices ?: 0
            val unlimited = sub?.plan?.unlimitedDevices == true || max < 0
            binding.tvDeviceLimit.text = when {
                unlimited -> "Plan limit: ∞ Unlimited devices"
                max > 0 -> "Plan limit: $max device${if (max != 1) "s" else ""}"
                else -> "Plan limit: Subscribe to a plan"
            }
            binding.tvDeviceLimit.setTextColor(
                ContextCompat.getColor(
                    requireContext(),
                    if (unlimited || max > 0) R.color.brand_primary else R.color.text_secondary
                )
            )
        }

        viewModel.error.observe(viewLifecycleOwner) { err ->
            if (err != null) {
                Snackbar.make(binding.root, err, Snackbar.LENGTH_SHORT).show()
                viewModel.clearError()
            }
        }

        viewModel.upgradeRequired.observe(viewLifecycleOwner) { msg ->
            if (msg != null) {
                showUpgradeDialog(parseUpgradeMessage(msg))
                viewModel.clearUpgradeRequired()
            }
        }

        viewModel.loadHome()
        handler.post { refreshIfSharing() }
    }

    override fun onResume() {
        super.onResume()
        hotspotManager.syncHotspotStateFromSystem()
        viewModel.setHotspotActive(hotspotManager.isHotspotOn())
        hotspotManager.ensureClientListeners()
        hotspotManager.addClientListener(clientListener)
        realtimeMonitor.addListener(clientListener)
        realtimeMonitor.start()
        realtimeMonitor.forceRefresh()
        checkLocationServices()
        refreshIfSharing()
        startDevicePolling()
    }

    override fun onPause() {
        hotspotManager.removeClientListener(clientListener)
        realtimeMonitor.removeListener(clientListener)
        stopDevicePolling()
        super.onPause()
    }

    private fun isHotspotSharing(): Boolean =
        hotspotManager.isHotspotOn() || viewModel.hotspotActive.value == true

    private fun startDevicePolling() {
        stopDevicePolling()
        pollRunnable = object : Runnable {
            override fun run() {
                if (_binding != null) refreshIfSharing()
                handler.postDelayed(this, REFRESH_MS)
            }
        }
        handler.postDelayed(pollRunnable!!, REFRESH_MS)
    }

    private fun stopDevicePolling() {
        pollRunnable?.let { handler.removeCallbacks(it) }
        pollRunnable = null
    }

    private fun refreshDevices(force: Boolean) {
        if (_binding == null) return
        if (!isHotspotSharing()) {
            applyClientDisplay(emptyList())
            binding.swipeRefresh.isRefreshing = false
            Snackbar.make(binding.root, "Turn on hotspot first to see connected devices.", Snackbar.LENGTH_LONG).show()
            return
        }
        if (force) binding.swipeRefresh.isRefreshing = true
        if (!hasScanPermission()) requestScanPermissions()
        discoverAndDisplay(forceDeep = true)
    }

    private fun refreshIfSharing() {
        if (!isHotspotSharing()) {
            applyClientDisplay(emptyList())
            return
        }
        discoverAndDisplay()
    }

    private fun discoverAndDisplay(forceDeep: Boolean = false) {
        if (_binding == null || discoverInFlight || !isHotspotSharing()) return
        discoverInFlight = true
        Thread {
            try {
                val discovered = hotspotManager.getRealtimeHotspotClients(deepScan = forceDeep)
                handler.post {
                    discoverInFlight = false
                    if (_binding == null) return@post
                    applyClientDisplay(discovered)
                    binding.swipeRefresh.isRefreshing = false
                }
            } catch (_: Exception) {
                handler.post {
                    discoverInFlight = false
                    if (_binding != null) {
                        applyClientDisplay(hotspotManager.getCurrentConnectedClients())
                        binding.swipeRefresh.isRefreshing = false
                    }
                }
            }
        }.start()
    }

    /** Fresh scan only — never merge stale API/cache lists (fixes disconnected devices still showing). */
    private fun applyClientDisplay(incoming: List<ConnectedClient>) {
        if (_binding == null) return
        if (!isHotspotSharing()) {
            adapter.submitList(emptyList())
            binding.tvOnline.text = "Connected: 0"
            binding.tvBlocked.text = "Blocked: 0"
            binding.tvEmpty.visibility = View.VISIBLE
            binding.rvDevices.visibility = View.GONE
            return
        }

        val display = incoming.ifEmpty { hotspotManager.getCurrentConnectedClients() }
        adapter.submitList(display.toList())
        binding.tvOnline.text = "Connected: ${display.size}"
        binding.tvBlocked.text = "Blocked: 0"
        val showEmpty = display.isEmpty()
        binding.tvEmpty.visibility = if (showEmpty) View.VISIBLE else View.GONE
        binding.rvDevices.visibility = if (showEmpty) View.GONE else View.VISIBLE
    }

    private fun checkLocationServices() {
        if (!hasScanPermission()) return
        if (!hotspotManager.isLocationServicesEnabled() && !locationHintShown) {
            locationHintShown = true
            Snackbar.make(
                binding.root,
                "Turn ON Location in phone Settings — required to detect connected devices.",
                Snackbar.LENGTH_LONG
            ).setAction("Settings") {
                startActivity(android.content.Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS))
            }.show()
        }
    }

    private fun parseUpgradeMessage(raw: String): String {
        return try {
            val json = org.json.JSONObject(raw)
            json.optString("message", raw)
        } catch (_: Exception) {
            raw
        }.replace("UPGRADE_REQUIRED: ", "")
    }

    private fun showUpgradeDialog(message: String) {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("⚠️ Device Limit Reached")
            .setMessage("$message\n\nUpgrade your plan to connect more devices.")
            .setPositiveButton("Upgrade Plan") { _, _ ->
                val nav = activity?.findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_nav)
                nav?.selectedItemId = R.id.nav_subscription
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun hasScanPermission(): Boolean {
        val ctx = requireContext()
        val fine = androidx.core.content.ContextCompat.checkSelfPermission(
            ctx, android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        if (fine) return true
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            return androidx.core.content.ContextCompat.checkSelfPermission(
                ctx, android.Manifest.permission.NEARBY_WIFI_DEVICES
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        return androidx.core.content.ContextCompat.checkSelfPermission(
            ctx, android.Manifest.permission.ACCESS_COARSE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED
    }

    private fun requestScanPermissions() {
        val perms = mutableListOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            perms.add(android.Manifest.permission.NEARBY_WIFI_DEVICES)
        }
        requestPermissions(perms.toTypedArray(), 2001)
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 2001 && grantResults.any { it == android.content.pm.PackageManager.PERMISSION_GRANTED }) {
            discoverAndDisplay(forceDeep = true)
        }
    }

    override fun onDestroyView() {
        stopDevicePolling()
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val REFRESH_MS = 3_000L
    }
}
