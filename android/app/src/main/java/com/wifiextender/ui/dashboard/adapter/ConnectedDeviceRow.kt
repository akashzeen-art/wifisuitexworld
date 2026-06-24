package com.wifiextender.ui.dashboard.adapter

import com.wifiextender.utils.ConnectedClient

/** Devices tab row — live hotspot client plus optional server device id for block/unblock. */
data class ConnectedDeviceRow(
    val client: ConnectedClient,
    val deviceId: Long?,
    val blocked: Boolean
)
