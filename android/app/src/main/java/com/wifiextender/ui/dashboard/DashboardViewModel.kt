package com.wifiextender.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DashboardViewModel : ViewModel() {

    private val api get() = RetrofitClient.apiService

    private val _subscription = MutableLiveData<Subscription?>()
    val subscription: LiveData<Subscription?> = _subscription

    private val _licenses = MutableLiveData<List<License>>()
    val licenses: LiveData<List<License>> = _licenses

    private val _deviceStats = MutableLiveData<DeviceStats?>()
    val deviceStats: LiveData<DeviceStats?> = _deviceStats

    private val _devices = MutableLiveData<List<Device>>()
    val devices: LiveData<List<Device>> = _devices

    private val _plans = MutableLiveData<List<Plan>>()
    val plans: LiveData<List<Plan>> = _plans

    private val _allSubs = MutableLiveData<List<Subscription>>()
    val allSubs: LiveData<List<Subscription>> = _allSubs

    private val _loading = MutableLiveData<Boolean>()
    val loading: LiveData<Boolean> = _loading

    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error

    private val _requestResult = MutableLiveData<String?>()
    val requestResult: LiveData<String?> = _requestResult

    // Device limit upgrade alert
    private val _upgradeRequired = MutableLiveData<String?>()
    val upgradeRequired: LiveData<String?> = _upgradeRequired

    fun loadHome() {
        _loading.value = true
        viewModelScope.launch {
            try {
                val subResp   = api.getSubscriptions()
                val licResp   = api.getLicenses()
                val statsResp = api.getDeviceStats()
                if (subResp.isSuccessful)   _subscription.value = subResp.body()?.find { it.active }
                if (licResp.isSuccessful)   _licenses.value = licResp.body() ?: emptyList()
                if (statsResp.isSuccessful) _deviceStats.value = statsResp.body()
            } catch (e: Exception) {
                _error.value = "Failed to load data"
            } finally {
                _loading.value = false
            }
        }
    }

    fun loadDevices() {
        viewModelScope.launch {
            try {
                val resp = api.getDevices()
                if (resp.isSuccessful) _devices.value = resp.body() ?: emptyList()
                else _devices.value = emptyList()
            } catch (e: Exception) {
                _devices.value = emptyList()
            }
        }
    }

    fun scanAndReportDevices(context: android.content.Context) {
        viewModelScope.launch {
            try {
                val found = scanNetworkDevices()
                if (found.isNotEmpty()) {
                    try {
                        val resp = api.reportDevicesBulk(BulkDeviceReport(found))
                        if (!resp.isSuccessful) {
                            val errorBody = resp.errorBody()?.string() ?: ""
                            if (errorBody.contains("UPGRADE_REQUIRED") || resp.code() == 403) {
                                _upgradeRequired.postValue(errorBody)
                            }
                        }
                    } catch (_: Exception) {}
                }
            } catch (_: Exception) {}
            try {
                val resp = api.getDevices()
                if (resp.isSuccessful) _devices.value = resp.body() ?: emptyList()
                else _devices.value = emptyList()
            } catch (_: Exception) {
                _devices.value = emptyList()
            }
        }
    }

    private suspend fun scanNetworkDevices(): List<DeviceReport> {
        return withContext(Dispatchers.IO) {
            val found = mutableListOf<DeviceReport>()
            try {
                val ownIps = mutableSetOf<String>()
                try {
                    java.net.NetworkInterface.getNetworkInterfaces()?.toList()?.forEach { iface ->
                        iface.inetAddresses?.toList()?.forEach { addr ->
                            ownIps.add(addr.hostAddress ?: "")
                        }
                    }
                } catch (_: Exception) {}

                val arpFile = java.io.File("/proc/net/arp")
                if (arpFile.exists()) {
                    arpFile.readLines().drop(1).forEach { line ->
                        val parts = line.trim().split("\\s+".toRegex())
                        if (parts.size >= 6) {
                            val ip    = parts[0]
                            val flags = parts[2]
                            val mac   = parts[3]
                            if (flags == "0x2"
                                && mac != "00:00:00:00:00:00"
                                && mac.length == 17
                                && !ownIps.contains(ip)) {
                                found.add(DeviceReport(
                                    macAddress = mac,
                                    deviceName = ip,
                                    ipAddress  = ip,
                                    deviceType = "UNKNOWN",
                                    online     = true
                                ))
                            }
                        }
                    }
                }
            } catch (_: Exception) {}
            found
        }
    }

    fun toggleBlock(deviceId: Long) {
        viewModelScope.launch {
            try {
                val resp = api.toggleBlock(deviceId)
                if (resp.isSuccessful) {
                    val updated = resp.body() ?: return@launch
                    _devices.value = _devices.value?.map { if (it.id == deviceId) updated else it }
                }
            } catch (e: Exception) {
                _error.value = "Failed to update device"
            }
        }
    }

    fun loadPlansAndSubs() {
        viewModelScope.launch {
            try {
                val planResp = api.getPlans()
                val subResp  = api.getSubscriptions()
                val licResp  = api.getLicenses()
                if (planResp.isSuccessful) _plans.value = planResp.body() ?: emptyList()
                if (subResp.isSuccessful)  _allSubs.value = subResp.body() ?: emptyList()
                if (licResp.isSuccessful)  _licenses.value = licResp.body() ?: emptyList()
            } catch (e: Exception) {
                _error.value = "Failed to load plans"
            }
        }
    }

    fun requestPlan(planId: Long) {
        viewModelScope.launch {
            try {
                val resp = api.requestPlan(planId)
                if (resp.isSuccessful) {
                    _requestResult.value = "✅ Plan activated! Your license key is ready."
                    loadPlansAndSubs()
                    loadHome()
                } else {
                    _requestResult.value = "Failed to activate plan"
                }
            } catch (e: Exception) {
                _requestResult.value = "Network error. Please try again."
            }
        }
    }

    fun clearRequestResult() { _requestResult.value = null }
    fun clearError() { _error.value = null }
    fun clearUpgradeRequired() { _upgradeRequired.value = null }
}
