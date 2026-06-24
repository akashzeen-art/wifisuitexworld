package com.wifiextender.data.prefs

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.wifiextender.data.model.LicenseActivateResponse

class LicenseManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("wifi_extender_license", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun saveActivation(key: String, response: LicenseActivateResponse) {
        prefs.edit()
            .putString(KEY_LICENSE, formatKey(key))
            .putBoolean(KEY_VALID, true)
            .putBoolean(KEY_ACTIVATED_ONCE, true)
            .putString(KEY_DATA, gson.toJson(response))
            .commit()
    }

    fun getLicenseKey(): String? = prefs.getString(KEY_LICENSE, null)

    fun getLicenseData(): LicenseActivateResponse? {
        val json = prefs.getString(KEY_DATA, null) ?: return null
        return try {
            gson.fromJson(json, LicenseActivateResponse::class.java)
        } catch (_: Exception) {
            null
        }
    }

    fun isLicenseValid(): Boolean =
        prefs.getBoolean(KEY_VALID, false) && !getLicenseKey().isNullOrBlank()

    /** True after first successful activation on this device — skip license screen on later logins. */
    fun hasCompletedActivation(): Boolean =
        prefs.getBoolean(KEY_ACTIVATED_ONCE, false) || isLicenseValid()

    fun clear() {
        prefs.edit().clear().commit()
    }

    fun formatKey(raw: String): String {
        val clean = raw.replace("-", "").uppercase()
        return clean.chunked(4).joinToString("-")
    }

    companion object {
        private const val KEY_LICENSE = "license_key"
        private const val KEY_VALID = "license_valid"
        private const val KEY_DATA = "license_data"
        private const val KEY_ACTIVATED_ONCE = "license_activated_once"
    }
}
