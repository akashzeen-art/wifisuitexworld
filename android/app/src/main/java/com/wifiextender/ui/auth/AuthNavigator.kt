package com.wifiextender.ui.auth

import android.content.Context
import android.content.Intent
import com.wifiextender.data.prefs.LicenseManager
import com.wifiextender.data.prefs.TokenManager
import com.wifiextender.ui.dashboard.MainActivity

object AuthNavigator {

    fun destinationAfterAuth(context: Context): Intent {
        val tokenManager = TokenManager(context)
        if (!tokenManager.isLoggedIn()) {
            return Intent(context, LoginActivity::class.java)
        }
        val licenseManager = LicenseManager(context)
        return if (licenseManager.hasCompletedActivation()) {
            Intent(context, MainActivity::class.java)
        } else {
            Intent(context, LicenseActivity::class.java)
        }
    }
}
