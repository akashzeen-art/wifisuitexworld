package com.wifiextender.ui.auth

import android.content.Context
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.model.LicenseActivateRequest
import com.wifiextender.data.model.LicenseValidateRequest
import com.wifiextender.data.model.Plan
import com.wifiextender.data.prefs.LicenseManager
import com.wifiextender.utils.MachineIdUtil
import kotlinx.coroutines.launch

sealed class LicenseUiState {
    object Idle : LicenseUiState()
    object Loading : LicenseUiState()
    data class Activated(val message: String) : LicenseUiState()
    data class Error(val message: String) : LicenseUiState()
}

class LicenseViewModel : ViewModel() {

    private val _state = MutableLiveData<LicenseUiState>(LicenseUiState.Idle)
    val state: LiveData<LicenseUiState> = _state

    private val _plans = MutableLiveData<List<Plan>>(emptyList())
    val plans: LiveData<List<Plan>> = _plans

    fun loadPlans() {
        viewModelScope.launch {
            try {
                val resp = RetrofitClient.apiService.getPlans()
                if (resp.isSuccessful) {
                    _plans.value = resp.body()?.filter { it.active } ?: emptyList()
                }
            } catch (_: Exception) {
            }
        }
    }

    fun activateLicense(context: Context, rawKey: String) {
        val key = LicenseManager(context).formatKey(rawKey)
        if (key.replace("-", "").length < 16) {
            _state.value = LicenseUiState.Error("Enter a valid license key")
            return
        }
        _state.value = LicenseUiState.Loading
        viewModelScope.launch {
            try {
                val machineId = MachineIdUtil.getMachineId(context)
                val machineLabel = MachineIdUtil.getMachineLabel(context)
                val resp = RetrofitClient.apiService.activateLicense(
                    LicenseActivateRequest(key, machineId, machineLabel)
                )
                if (resp.isSuccessful && resp.body()?.success == true) {
                    val body = resp.body()!!
                    LicenseManager(context).saveActivation(key, body)
                    _state.value = LicenseUiState.Activated(body.message ?: "License activated!")
                } else {
                    val msg = resp.errorBody()?.string()?.let { parseMessage(it) }
                        ?: "Activation failed. Check your license key."
                    _state.value = LicenseUiState.Error(msg)
                }
            } catch (_: Exception) {
                _state.value = LicenseUiState.Error("Cannot reach server. Check your internet.")
            }
        }
    }

    fun requestPlanAndActivate(context: Context, plan: Plan) {
        _state.value = LicenseUiState.Loading
        viewModelScope.launch {
            try {
                val request = RetrofitClient.apiService.requestPlan(plan.id)
                if (!request.isSuccessful) {
                    _state.value = LicenseUiState.Error("Could not activate plan")
                    return@launch
                }
                val licenses = RetrofitClient.apiService.getLicenses()
                val key = licenses.body()
                    ?.firstOrNull { it.status == "ACTIVE" && !it.expired }
                    ?.licenseKey
                if (key.isNullOrBlank()) {
                    _state.value = LicenseUiState.Error("Plan activated but no license key found. Try entering key manually.")
                    return@launch
                }
                activateLicense(context, key)
            } catch (_: Exception) {
                _state.value = LicenseUiState.Error("Network error. Please try again.")
            }
        }
    }

    fun validateStoredLicense(context: Context, onValid: () -> Unit, onInvalid: () -> Unit) {
        val licenseManager = LicenseManager(context)
        val key = licenseManager.getLicenseKey() ?: run {
            onInvalid()
            return
        }
        viewModelScope.launch {
            try {
                val machineId = MachineIdUtil.getMachineId(context)
                val resp = RetrofitClient.apiService.validateLicense(
                    LicenseValidateRequest(key, machineId)
                )
                if (resp.isSuccessful && resp.body()?.success == true) {
                    resp.body()?.let { licenseManager.saveActivation(key, it) }
                    onValid()
                } else {
                    licenseManager.clear()
                    onInvalid()
                }
            } catch (_: Exception) {
                if (licenseManager.isLicenseValid()) onValid() else onInvalid()
            }
        }
    }

    private fun parseMessage(raw: String): String {
        return try {
            org.json.JSONObject(raw).optString("message", raw)
        } catch (_: Exception) {
            raw
        }
    }
}
