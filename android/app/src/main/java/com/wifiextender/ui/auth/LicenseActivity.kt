package com.wifiextender.ui.auth

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.snackbar.Snackbar
import com.wifiextender.data.api.ApiConfig
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.model.Plan
import com.wifiextender.data.prefs.LicenseManager
import com.wifiextender.data.prefs.TokenManager
import com.wifiextender.databinding.ActivityLicenseBinding
import com.wifiextender.ui.dashboard.MainActivity
import com.wifiextender.ui.dashboard.adapter.PlanAdapter
import com.wifiextender.utils.MachineIdUtil

class LicenseActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLicenseBinding
    private lateinit var tokenManager: TokenManager
    private val viewModel: LicenseViewModel by viewModels()
    private var planAdapter: PlanAdapter? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLicenseBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tokenManager = TokenManager(this)
        if (!tokenManager.isLoggedIn()) {
            goToLogin()
            return
        }

        RetrofitClient.init(tokenManager, this)
        ApiConfig.ensureProductionUrl(this)
        RetrofitClient.resetApi()

        if (LicenseManager(this).hasCompletedActivation()) {
            goToMain()
            return
        }

        binding.tvMachineLabel.text = "Device: ${MachineIdUtil.getMachineLabel(this)}"
        binding.rvPlans.layoutManager = LinearLayoutManager(this)

        planAdapter = PlanAdapter(currentPlanId = null) { plan -> confirmPlan(plan) }
        binding.rvPlans.adapter = planAdapter

        binding.btnActivate.setOnClickListener {
            val key = binding.etLicenseKey.text?.toString().orEmpty()
            viewModel.activateLicense(this, key)
        }

        binding.tvSignOut.setOnClickListener { signOut() }

        viewModel.plans.observe(this) { plans ->
            planAdapter?.submitList(plans)
        }

        viewModel.state.observe(this) { state ->
            when (state) {
                is LicenseUiState.Loading -> setLoading(true)
                is LicenseUiState.Activated -> {
                    setLoading(false)
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_SHORT).show()
                    binding.root.postDelayed({ goToMain() }, 1200)
                }
                is LicenseUiState.Error -> {
                    setLoading(false)
                    Snackbar.make(binding.root, state.message, Snackbar.LENGTH_LONG).show()
                }
                is LicenseUiState.Idle -> setLoading(false)
            }
        }

        viewModel.loadPlans()
    }

    private fun confirmPlan(plan: Plan) {
        val devices = if (plan.unlimitedDevices) "Unlimited" else plan.maxDevices.toString()
        val duration = when {
            plan.lifetime -> "Lifetime"
            plan.durationDays != null -> "${plan.durationDays} days"
            else -> "—"
        }
        AlertDialog.Builder(this)
            .setTitle("Activate ${plan.name}?")
            .setMessage("Devices: $devices\nDuration: $duration\n\nYour license will be activated on this phone.")
            .setPositiveButton("Activate") { _, _ ->
                viewModel.requestPlanAndActivate(this, plan)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun setLoading(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnActivate.isEnabled = !loading
    }

    private fun signOut() {
        LicenseManager(this).clear()
        tokenManager.clear()
        goToLogin()
    }

    private fun goToMain() {
        startActivity(Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK))
        finish()
    }

    private fun goToLogin() {
        startActivity(Intent(this, LoginActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK or Intent.FLAG_ACTIVITY_NEW_TASK))
        finish()
    }
}
