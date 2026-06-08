package com.wifiextender.data.api

import com.wifiextender.BuildConfig
import com.wifiextender.data.prefs.TokenManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {

    private lateinit var tokenManager: TokenManager

    fun init(tm: TokenManager) { tokenManager = tm }

    private val authInterceptor = Interceptor { chain ->
        val token = tokenManager.getAccessToken()
        val req = if (token != null)
            chain.request().newBuilder().addHeader("Authorization", "Bearer $token").build()
        else chain.request()
        chain.proceed(req)
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    val apiService: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
