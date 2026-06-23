package com.wifiextender.data.api

import android.content.Context
import com.wifiextender.BuildConfig

object ApiConfig {

    private const val PREFS = "wifi_extender_prefs"
    private const val KEY_BASE_URL = "api_base_url"

    private val productionUrl: String
        get() = normalize(BuildConfig.BASE_URL)

    fun getBaseUrl(context: Context): String {
        ensureProductionUrl(context)
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val saved = prefs.getString(KEY_BASE_URL, null)?.trim().orEmpty()
        return normalize(saved.ifBlank { productionUrl })
    }

    /** Force production API and migrate any old localhost/dev URLs saved on device. */
    fun ensureProductionUrl(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val saved = prefs.getString(KEY_BASE_URL, null)?.trim().orEmpty()
        if (saved.isBlank() || isLegacyLocalUrl(saved)) {
            prefs.edit().putString(KEY_BASE_URL, productionUrl).apply()
        }
    }

    fun normalize(url: String): String {
        var value = url.trim()
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "https://$value"
        }
        if (!value.endsWith("/")) value += "/"
        return value
    }

    private fun isLegacyLocalUrl(url: String): Boolean {
        val lower = url.lowercase()
        return lower.contains("localhost") ||
            lower.contains("127.0.0.1") ||
            lower.contains("10.0.2.2") ||
            lower.contains(":8080") ||
            lower.contains(":8017") ||
            lower.contains(":8018") ||
            lower.matches(Regex("http://192\\.168\\.\\d+\\.\\d+.*"))
    }
}
