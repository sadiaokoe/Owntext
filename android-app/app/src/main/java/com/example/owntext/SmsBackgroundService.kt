package com.example.owntext

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

class SmsBackgroundService : Service() {
    private val CHANNEL_ID = "SmsGatewayServiceChannel"
    private var serviceJob: Job? = null
    private val client = OkHttpClient()

    private var jwtToken: String? = null
    private var deviceId: String? = null
    private val supabaseUrl = "https://himqmeocewfhsmtzivzd.supabase.co"
    private val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbXFtZW9jZXdmaHNtdHppdnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDc3OTEsImV4cCI6MjA5ODMyMzc5MX0.AWQTSVzbz02XLtwFMuv_XCSPzoVjCm4U-cHVxyNixb4"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        jwtToken = intent?.getStringExtra("JWT_TOKEN")
        deviceId = intent?.getStringExtra("DEVICE_ID")

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("OwnText Gateway")
            .setContentText("Listening for pending messages...")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .build()

        startForeground(1, notification)

        serviceJob?.cancel()
        serviceJob = CoroutineScope(Dispatchers.IO).launch {
            while (isActive) {
                try {
                    pollMessages()
                    updateDeviceStatus()
                } catch (e: Exception) {
                    Log.e("OwnText", "Error polling messages", e)
                }
                delay(5000) // Poll every 5 seconds
            }
        }

        return START_STICKY
    }

    private fun pollMessages() {
        if (jwtToken == null || deviceId == null) return

        val request = Request.Builder()
            .url("$supabaseUrl/rest/v1/messages?device_id=eq.$deviceId&status=eq.queued&select=*")
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $jwtToken")
            .build()

        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                val responseBody = response.body?.string()
                if (responseBody != null && responseBody != "[]") {
                    val messages = JSONArray(responseBody)
                    for (i in 0 until messages.length()) {
                        val msg = messages.getJSONObject(i)
                        val id = msg.getString("id")
                        val to = msg.getString("recipient")
                        val body = msg.getString("message_body")
                        sendSms(id, to, body)
                    }
                }
            }
        }
    }

    private fun sendSms(id: String, to: String, body: String) {
        try {
            val prefs = getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
            val selectedSim = prefs.getInt("SELECTED_SIM", -1) // -1 means default, 0 is SIM1, 1 is SIM2
            
            val subscriptionManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                getSystemService(android.telephony.SubscriptionManager::class.java)
            } else null

            var smsManager: SmsManager? = null
            
            if (selectedSim != -1 && subscriptionManager != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                try {
                    val activeSubs = subscriptionManager.activeSubscriptionInfoList
                    if (activeSubs != null && selectedSim < activeSubs.size) {
                        val subId = activeSubs[selectedSim].subscriptionId
                        smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            getSystemService(SmsManager::class.java)?.createForSubscriptionId(subId)
                        } else {
                            SmsManager.getSmsManagerForSubscriptionId(subId)
                        }
                    }
                } catch (e: SecurityException) {
                    Log.e("OwnText", "No permission for Subscriptions")
                }
            }

            if (smsManager == null) {
                smsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    getSystemService(SmsManager::class.java)
                } else {
                    SmsManager.getDefault()
                }
            }
            
            smsManager!!.sendTextMessage(to, null, body, null, null)
            updateMessageStatus(id, "sent")
            
            val sentCount = prefs.getInt("STATS_SENT", 0)
            prefs.edit().putInt("STATS_SENT", sentCount + 1).apply()
            
        } catch (e: Exception) {
            Log.e("OwnText", "Failed to send SMS", e)
            updateMessageStatus(id, "failed")
            
            val prefs = getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
            val failedCount = prefs.getInt("STATS_FAILED", 0)
            prefs.edit().putInt("STATS_FAILED", failedCount + 1).apply()
        }
    }

    private fun updateMessageStatus(id: String, status: String) {
        if (jwtToken == null) return

        val json = JSONObject().apply { put("status", status) }.toString()
        val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url("$supabaseUrl/rest/v1/messages?id=eq.$id")
            .patch(body)
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $jwtToken")
            .build()

        client.newCall(request).execute().close()
    }

    private fun updateDeviceStatus() {
        if (jwtToken == null || deviceId == null) return

        val json = JSONObject().apply { 
            put("is_online", true) 
        }
        
        val currentIso = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.format(java.util.Date())
        
        json.put("last_seen_at", currentIso)

        val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url("$supabaseUrl/rest/v1/devices?id=eq.$deviceId")
            .patch(body)
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $jwtToken")
            .build()

        client.newCall(request).execute().close()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob?.cancel()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "SMS Gateway Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(serviceChannel)
        }
    }
}
