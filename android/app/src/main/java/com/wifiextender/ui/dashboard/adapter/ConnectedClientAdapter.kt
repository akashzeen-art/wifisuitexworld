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
import com.wifiextender.utils.DeviceNameResolver

/** Devices tab — ConnectedClient rows with optional block/unblock. */
class ConnectedClientAdapter(
    private val onBlockToggle: (Long) -> Unit
) : ListAdapter<ConnectedDeviceRow, ConnectedClientAdapter.ViewHolder>(DiffCallback) {

    inner class ViewHolder(private val binding: ItemDeviceBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(row: ConnectedDeviceRow) {
            val client = row.client
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

            val (statusText, statusColor) = when {
                row.blocked -> Pair("Blocked", R.color.red_500)
                else -> Pair("Connected", R.color.green_500)
            }
            binding.tvStatus.text = statusText
            binding.tvStatus.setTextColor(ContextCompat.getColor(binding.root.context, statusColor))
            binding.viewStatusDot.setBackgroundColor(ContextCompat.getColor(binding.root.context, statusColor))
            binding.tvBandwidth.visibility = View.GONE

            val deviceId = row.deviceId
            if (deviceId != null) {
                binding.btnBlock.visibility = View.VISIBLE
                binding.btnBlock.text = if (row.blocked) "Unblock" else "Block"
                binding.btnBlock.setOnClickListener { onBlockToggle(deviceId) }
            } else {
                binding.btnBlock.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemDeviceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object DiffCallback : DiffUtil.ItemCallback<ConnectedDeviceRow>() {
        private fun stableKey(row: ConnectedDeviceRow): String {
            val c = row.client
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

        override fun areItemsTheSame(a: ConnectedDeviceRow, b: ConnectedDeviceRow) =
            stableKey(a) == stableKey(b)

        override fun areContentsTheSame(a: ConnectedDeviceRow, b: ConnectedDeviceRow) = a == b
    }
}
