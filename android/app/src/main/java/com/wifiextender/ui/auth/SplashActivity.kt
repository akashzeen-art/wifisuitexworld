package com.wifiextender.ui.auth

import android.annotation.SuppressLint
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.wifiextender.data.api.ApiConfig
import com.wifiextender.data.api.RetrofitClient
import com.wifiextender.data.prefs.TokenManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(com.wifiextender.R.layout.activity_splash)
        ApiConfig.ensureProductionUrl(this)
        val tokenManager = TokenManager(this)
        if (tokenManager.isLoggedIn()) {
            RetrofitClient.init(tokenManager, this)
            RetrofitClient.resetApi()
        }

        lifecycleScope.launch {
            delay(1000)
            startActivity(
                AuthNavigator.destinationAfterAuth(this@SplashActivity)
                    .addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            finish()
        }
    }
}
