package com.wifiextender.ui.dashboard

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.wifiextender.databinding.FragmentDevicesBinding
import com.wifiextender.ui.dashboard.adapter.DeviceAdapter

class DevicesFragment : Fragment() {

    private var _binding: FragmentDevicesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DashboardViewModel by activityViewModels()
    private lateinit var adapter: DeviceAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDevicesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = DeviceAdapter { device ->
            viewModel.toggleBlock(device.id)
        }
        binding.rvDevices.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDevices.adapter = adapter

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.scanAndReportDevices(requireContext())
        }

        viewModel.devices.observe(viewLifecycleOwner) { devices ->
            binding.swipeRefresh.isRefreshing = false
            adapter.submitList(devices)
            binding.tvOnline.text  = "Online: ${devices.count { it.online && !it.blocked }}"
            binding.tvBlocked.text = "Blocked: ${devices.count { it.blocked }}"
            binding.tvEmpty.visibility = if (devices.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(viewLifecycleOwner) { err ->
            if (err != null) {
                Snackbar.make(binding.root, err, Snackbar.LENGTH_SHORT).show()
                viewModel.clearError()
            }
        }

        viewModel.upgradeRequired.observe(viewLifecycleOwner) { msg ->
            if (msg != null) {
                androidx.appcompat.app.AlertDialog.Builder(requireContext())
                    .setTitle("⚠️ Device Limit Reached")
                    .setMessage(msg.replace("UPGRADE_REQUIRED: ", "") + "\n\nUpgrade your plan to connect more devices.")
                    .setPositiveButton("Upgrade Plan") { _, _ ->
                        val nav = activity?.findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(com.wifiextender.R.id.bottom_nav)
                        nav?.selectedItemId = com.wifiextender.R.id.nav_subscription
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
                viewModel.clearUpgradeRequired()
            }
        }

        viewModel.scanAndReportDevices(requireContext())
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
