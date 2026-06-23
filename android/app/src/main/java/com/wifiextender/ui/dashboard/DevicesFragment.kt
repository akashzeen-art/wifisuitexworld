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
import com.wifiextender.ui.dashboard.adapter.DeviceAdapter
import com.wifiextender.utils.ConnectedClient
import com.wifiextender.utils.HotspotManager
import com.wifiextender.utils.HotspotRealtimeMonitor

class DevicesFragment : Fragment() {

    private var _binding: FragmentDevicesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by activityViewModels()
    private lateinit var adapter: DeviceAdapter
    private lateinit var hotspotManager: HotspotManager
    private val handler = Handler(Looper.getMainLooper())
    private var pollRunnable: Runnable? = null
    private var locationHintShown = false

    private val clientListener: (List<ConnectedClient>) -> Unit = listener@{ clients ->
        if (clients.isEmpty()) return@listener
        activity?.runOnUiThread {
            if (_binding != null) viewModel.publishLocalClients(requireContext(), clients)
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDevicesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        hotspotManager = HotspotManager.getInstance(requireContext())

        adapter = DeviceAdapter { device ->
            viewModel.toggleBlock(device.id)
        }
        binding.rvDevices.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDevices.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener {
            refreshDevices(force = true)
        }

        viewModel.devices.observe(viewLifecycleOwner) { devices ->
            val online = devices.filter { it.online && !it.blocked }
            adapter.submitList(devices.sortedByDescending { it.online && !it.blocked })
            binding.tvOnline.text = "Online: ${online.size}"
            binding.tvBlocked.text = "Blocked: ${devices.count { it.blocked }}"
            binding.tvEmpty.visibility = if (devices.isEmpty()) View.VISIBLE else View.GONE
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
        refreshDevices(force = false)
    }

    override fun onResume() {
        super.onResume()
        hotspotManager.ensureClientListeners()
        hotspotManager.addClientListener(clientListener)
        HotspotRealtimeMonitor.getInstance(requireContext()).addListener(clientListener)
        refreshDevices(force = false)
        startDevicePolling()
    }

    override fun onPause() {
        hotspotManager.removeClientListener(clientListener)
        HotspotRealtimeMonitor.getInstance(requireContext()).removeListener(clientListener)
        stopDevicePolling()
        super.onPause()
    }

    private fun startDevicePolling() {
        stopDevicePolling()
        pollRunnable = object : Runnable {
            override fun run() {
                if (_binding != null && (hotspotManager.isHotspotLikelyActive() || viewModel.hotspotActive.value == true)) {
                    refreshDevices(force = false)
                }
                handler.postDelayed(this, 8_000)
            }
        }
        handler.postDelayed(pollRunnable!!, 5_000)
    }

    private fun stopDevicePolling() {
        pollRunnable?.let { handler.removeCallbacks(it) }
        pollRunnable = null
    }

    private fun refreshDevices(force: Boolean) {
        if (_binding == null) return
        binding.swipeRefresh.isRefreshing = true
        val hotspotOn = hotspotManager.isHotspotLikelyActive() ||
            viewModel.hotspotActive.value == true
        if (hotspotOn) {
            hotspotManager.userHotspotActive = true
            hotspotManager.ensurePhoneSsidListener()
            if (!hasLocationPermission()) {
                requestLocationPermission()
                if (!locationHintShown) {
                    locationHintShown = true
                    Snackbar.make(
                        binding.root,
                        "Allow Location permission for this app (Settings → Apps → WiFiExtender → Permissions).",
                        Snackbar.LENGTH_LONG
                    ).show()
                }
            }
            viewModel.scanAndReportDevices(requireContext(), forceRefresh = force, showUserErrors = force)
        } else {
            viewModel.loadDevices()
            binding.swipeRefresh.isRefreshing = false
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

    private fun hasLocationPermission(): Boolean =
        androidx.core.content.ContextCompat.checkSelfPermission(
            requireContext(), android.Manifest.permission.ACCESS_FINE_LOCATION
        ) == android.content.pm.PackageManager.PERMISSION_GRANTED

    private fun requestLocationPermission() {
        requestPermissions(
            arrayOf(
                android.Manifest.permission.ACCESS_FINE_LOCATION,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ),
            2001
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 2001 && grantResults.any { it == android.content.pm.PackageManager.PERMISSION_GRANTED }) {
            refreshDevices(force = true)
        }
    }

    override fun onDestroyView() {
        stopDevicePolling()
        super.onDestroyView()
        _binding = null
    }
}
