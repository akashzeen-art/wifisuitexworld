package com.wifiextender.ui.dashboard.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wifiextender.R
import com.wifiextender.databinding.ItemDeviceBinding
import com.wifiextender.utils.ConnectedClient
import com.wifiextender.utils.DeviceNameResolver

/** Devices tab — same ConnectedClient rows as Hotspot tab (MAC + name + IP). */
class ConnectedClientAdapter : ListAdapter<ConnectedClient, ConnectedClientAdapter.ViewHolder>(DiffCallback) {

    inner class ViewHolder(private val binding: ItemDeviceBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(client: ConnectedClient) {
            val macLine = DeviceNameResolver.formatMacAddressDisplay(client.macAddress, client.ipAddress)
            val label = DeviceNameResolver.formatDeviceLabel(
                client.name, client.vendor, client.ipAddress, client.macAddress ?: macLine
            )

            binding.tvDeviceName.text = macLine
            binding.tvDeviceName.visibility = View.VISIBLE

            val subtitle = when {
                label != "Unknown Device" && !label.startsWith("Device ·") &&
                    !label.equals(macLine, ignoreCase = true) -> label
                !client.vendor.isNullOrBlank() -> client.vendor
                !client.ipAddress.isNullOrBlank() -> "IP: ${client.ipAddress}"
                else -> ""
            }
            binding.tvMacAddress.text = subtitle
            binding.tvMacAddress.visibility = if (subtitle.isNotEmpty()) View.VISIBLE else View.GONE

            binding.tvIpAddress.text = "IP: ${client.ipAddress ?: "—"}"
            binding.tvIpAddress.visibility = View.VISIBLE

            val type = DeviceNameResolver.inferDeviceCategory(client.name, client.vendor)
                ?: client.vendor
                ?: "Connected device"
            binding.tvDeviceType.text = type

            val vendor = client.vendor?.trim().orEmpty()
            if (vendor.isNotEmpty() && !subtitle.contains(vendor, ignoreCase = true)) {
                binding.tvVendor.text = vendor
                binding.tvVendor.visibility = View.VISIBLE
            } else {
                binding.tvVendor.visibility = View.GONE
            }

            binding.tvStatus.text = "Connected"
            binding.tvStatus.setTextColor(ContextCompat.getColor(binding.root.context, R.color.green_500))
            binding.viewStatusDot.setBackgroundColor(ContextCompat.getColor(binding.root.context, R.color.green_500))
            binding.tvBandwidth.visibility = View.GONE
            binding.btnBlock.visibility = View.GONE
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemDeviceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object DiffCallback : DiffUtil.ItemCallback<ConnectedClient>() {
        private fun stableKey(c: ConnectedClient): String {
            val mac = c.macAddress?.trim()?.uppercase()?.replace('-', ':')
                ?.takeIf { it.length == 17 && it != "00:00:00:00:00:00" }
            val ip = c.ipAddress?.trim().orEmpty()
            return when {
                mac != null -> "mac:$mac"
                ip.isNotEmpty() -> "ip:$ip"
                c.name.isNotBlank() -> "name:${c.name}"
                else -> "anon:${c.hashCode()}"
            }
        }

        override fun areItemsTheSame(a: ConnectedClient, b: ConnectedClient) =
            stableKey(a) == stableKey(b) || a == b

        override fun areContentsTheSame(a: ConnectedClient, b: ConnectedClient) = a == b
    }
}
