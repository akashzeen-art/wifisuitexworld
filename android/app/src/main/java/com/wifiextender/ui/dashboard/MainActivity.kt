package com.wifiextender.ui.dashboard

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.wifiextender.R
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.prefs.LicenseManager
import com.wifiextender.data.prefs.TokenManager
import com.wifiextender.databinding.ActivityMainBinding
import com.wifiextender.ui.auth.LoginActivity

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    lateinit var tokenManager: TokenManager
    private lateinit var dashboardViewModel: DashboardViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)
        RetrofitClient.init(tokenManager, this)
        com.wifiextender.data.api.ApiConfig.ensureProductionUrl(this)
        RetrofitClient.resetApi()

        if (!tokenManager.isLoggedIn()) {
            goToLogin()
            return
        }

        if (!LicenseManager(this).hasCompletedActivation()) {
            startActivity(Intent(this, com.wifiextender.ui.auth.LicenseActivity::class.java))
            finish()
            return
        }

        com.wifiextender.utils.HotspotManager.getInstance(applicationContext).ensureClientListeners()

        dashboardViewModel = ViewModelProvider(this)[DashboardViewModel::class.java]
        val hotspotManager = com.wifiextender.utils.HotspotManager.getInstance(applicationContext)
        if (hotspotManager.syncHotspotStateFromSystem()) {
            dashboardViewModel.setHotspotActive(true)
        }
        dashboardViewModel.startRealtimeDeviceMonitoring(applicationContext)

        requestScanPermissionsIfNeeded()
        setupBottomNavigation(savedInstanceState)
    }

    private fun requestScanPermissionsIfNeeded() {
        val perms = mutableListOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            perms.add(android.Manifest.permission.NEARBY_WIFI_DEVICES)
        }
        val missing = perms.filter {
            androidx.core.content.ContextCompat.checkSelfPermission(this, it) !=
                android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            androidx.core.app.ActivityCompat.requestPermissions(this, missing.toTypedArray(), 1001)
        }
    }

    private fun setupBottomNavigation(savedInstanceState: Bundle?) {
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .add(R.id.fragment_container, HomeFragment(), TAG_HOME)
                .commitNow()
        }

        binding.bottomNav.selectedItemId = R.id.nav_home
        binding.bottomNav.setOnItemSelectedListener { item ->
            showTab(item.itemId)
            true
        }
    }

    private fun showTab(itemId: Int): Fragment {
        val tag = tabTag(itemId)
        var fragment = supportFragmentManager.findFragmentByTag(tag)
        val tx = supportFragmentManager.beginTransaction()
        supportFragmentManager.fragments.forEach { existing ->
            if (existing.isAdded && existing.tag != tag) {
                tx.hide(existing)
            }
        }
        if (fragment == null) {
            fragment = newFragmentFor(itemId)
            tx.add(R.id.fragment_container, fragment, tag)
        } else {
            tx.show(fragment)
        }
        tx.commitNow()
        return fragment
    }

    private fun tabTag(itemId: Int): String = when (itemId) {
        R.id.nav_home -> TAG_HOME
        R.id.nav_hotspot -> TAG_HOTSPOT
        R.id.nav_devices -> TAG_DEVICES
        R.id.nav_subscription -> TAG_SUBSCRIPTION
        R.id.nav_profile -> TAG_PROFILE
        else -> TAG_HOME
    }

    private fun newFragmentFor(itemId: Int): Fragment = when (itemId) {
        R.id.nav_hotspot -> HotspotFragment()
        R.id.nav_devices -> DevicesFragment()
        R.id.nav_subscription -> SubscriptionFragment()
        R.id.nav_profile -> ProfileFragment()
        else -> HomeFragment()
    }

    fun logout() {
        LicenseManager(this).clear()
        tokenManager.clear()
        goToLogin()
    }

    private fun goToLogin() {
        startActivity(Intent(this, LoginActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK))
        finish()
    }

    companion object {
        private const val TAG_HOME = "home"
        private const val TAG_HOTSPOT = "hotspot"
        private const val TAG_DEVICES = "devices"
        private const val TAG_SUBSCRIPTION = "subscription"
        private const val TAG_PROFILE = "profile"
    }
}
