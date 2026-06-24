package com.wifiextender.utils

import android.content.Context
import android.os.Build
import android.provider.Settings
import java.security.MessageDigest

object MachineIdUtil {

    fun getMachineId(context: Context): String {
        val androidId = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )?.trim().orEmpty()
        val raw = "android|$androidId|${Build.MANUFACTURER}|${Build.MODEL}|${Build.DEVICE}"
        val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }.take(32)
    }

    fun getMachineLabel(context: Context): String {
        val brand = Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        return "$brand ${Build.MODEL}"
    }
}
