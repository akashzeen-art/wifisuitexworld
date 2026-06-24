package com.wifiextender.ui.dashboard.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.wifiextender.R
import com.wifiextender.data.model.Device
import com.wifiextender.databinding.ItemDeviceBinding
import com.wifiextender.utils.DeviceNameResolver

class DeviceAdapter(
    private val onBlockToggle: (Device) -> Unit
) : ListAdapter<Device, DeviceAdapter.ViewHolder>(DiffCallback) {

    inner class ViewHolder(private val binding: ItemDeviceBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(device: Device) {
            val resolvedMac = DeviceNameResolver.preferMacAddress(device.macAddress, ip = device.ipAddress)
            val macLine = DeviceNameResolver.formatMacAddressDisplay(resolvedMac, device.ipAddress)
            val label = DeviceNameResolver.formatDeviceLabel(
                deviceName = device.deviceName,
                vendor = device.vendor,
                ip = device.ipAddress,
                mac = resolvedMac.ifBlank { device.macAddress }
            )
            binding.tvDeviceName.text = if (macLine != "—") macLine else "MAC unavailable"
            val nameLine = device.deviceName?.trim().orEmpty()
            val subtitle = when {
                nameLine.isNotEmpty() && nameLine != "Unknown Device" &&
                    !nameLine.equals(macLine, ignoreCase = true) -> nameLine
                macLine == "—" && !device.ipAddress.isNullOrBlank() ->
                    "Detecting MAC · IP: ${device.ipAddress}"
                device.deviceType.isNotBlank() && device.deviceType != "UNKNOWN" -> device.deviceType
                !device.ipAddress.isNullOrBlank() -> "IP: ${device.ipAddress}"
                else -> ""
            }
            binding.tvMacAddress.text = subtitle
            binding.tvMacAddress.visibility = if (subtitle.isNotEmpty()) View.VISIBLE else View.GONE
            binding.tvIpAddress.text = "IP: ${device.ipAddress ?: "—"}"
            binding.tvDeviceType.text = when {
                device.deviceType.isNotBlank() && device.deviceType != "UNKNOWN" -> device.deviceType
                else -> device.vendor ?: "Connected"
            }

            val vendor = device.vendor?.trim().orEmpty()
            if (vendor.isNotEmpty() && !label.contains(vendor, ignoreCase = true)) {
                binding.tvVendor.text = vendor
                binding.tvVendor.visibility = View.VISIBLE
            } else {
                binding.tvVendor.text = ""
                binding.tvVendor.visibility = View.GONE
            }

            val (statusText, statusColor) = when {
                device.blocked -> Pair("Blocked", R.color.red_500)
                device.online  -> Pair("Connected", R.color.green_500)
                else           -> Pair("Offline", R.color.gray_400)
            }
            binding.tvStatus.text = statusText
            binding.tvStatus.setTextColor(ContextCompat.getColor(binding.root.context, statusColor))
            binding.viewStatusDot.setBackgroundColor(ContextCompat.getColor(binding.root.context, statusColor))
            binding.tvBandwidth.text = "${formatBytes(device.bytesReceived)} ↓  ${formatBytes(device.bytesSent)} ↑"

            binding.btnBlock.text = if (device.blocked) "Unblock" else "Block"
            binding.btnBlock.setBackgroundColor(
                ContextCompat.getColor(binding.root.context,
                    if (device.blocked) R.color.green_500 else R.color.red_500)
            )
            binding.btnBlock.setOnClickListener { onBlockToggle(device) }
        }

        private fun formatBytes(bytes: Long): String = when {
            bytes < 1024        -> "$bytes B"
            bytes < 1024 * 1024 -> "${"%.1f".format(bytes / 1024.0)} KB"
            else                -> "${"%.1f".format(bytes / 1024.0 / 1024.0)} MB"
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemDeviceBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) = holder.bind(getItem(position))

    companion object DiffCallback : DiffUtil.ItemCallback<Device>() {
        override fun areItemsTheSame(a: Device, b: Device) =
            a.macAddress.uppercase() == b.macAddress.uppercase()
        override fun areContentsTheSame(a: Device, b: Device) = a == b
    }
}
