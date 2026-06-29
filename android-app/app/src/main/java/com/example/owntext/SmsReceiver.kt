package com.example.owntext

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class SmsReceiver : BroadcastReceiver() {

    private val client = OkHttpClient()
    private val supabaseUrl = "https://himqmeocewfhsmtzivzd.supabase.co"
    private val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbXFtZW9jZXdmaHNtdHppdnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDc3OTEsImV4cCI6MjA5ODMyMzc5MX0.AWQTSVzbz02XLtwFMuv_XCSPzoVjCm4U-cHVxyNixb4"

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            
            // Build the full message body if it's multipart
            var sender = ""
            val fullMessage = StringBuilder()
            
            for (msg in messages) {
                if (msg != null) {
                    sender = msg.originatingAddress ?: "Unknown"
                    fullMessage.append(msg.messageBody)
                }
            }

            Log.d("SmsReceiver", "Received SMS from: $sender, Body: $fullMessage")

            val prefs = context.getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
            val jwtToken = prefs.getString("JWT", null)
            val deviceId = prefs.getString("DEVICE_ID", null)

            if (jwtToken != null && deviceId != null && sender.isNotEmpty()) {
                // Determine user ID from token payload or fetch from DB?
                // Actually, we can just POST to REST API and the RLS will infer user_id from JWT
                // Wait, messages table has `user_id` as NOT NULL. 
                // We don't have user_id in prefs? Let's decode it from JWT.
                val userId = decodeUserIdFromJwt(jwtToken)
                if (userId != null) {
                    postReceivedSmsToSupabase(jwtToken, deviceId, userId, sender, fullMessage.toString())
                }
            }
        }
    }
    
    private fun decodeUserIdFromJwt(token: String): String? {
        try {
            val parts = token.split(".")
            if (parts.size == 3) {
                val payload = String(android.util.Base64.decode(parts[1], android.util.Base64.URL_SAFE))
                val json = JSONObject(payload)
                return json.optString("sub") // Sub is usually the user ID in Supabase
            }
        } catch (e: Exception) {
            Log.e("SmsReceiver", "Error decoding JWT", e)
        }
        return null
    }

    private fun postReceivedSmsToSupabase(token: String, deviceId: String, userId: String, sender: String, message: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val json = JSONObject().apply {
                    put("user_id", userId)
                    put("device_id", deviceId)
                    put("recipient", sender) // Storing sender in recipient column for inbound
                    put("message_body", message)
                    put("status", "delivered")
                    put("direction", "inbound")
                }.toString()

                val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())

                val request = Request.Builder()
                    .url("$supabaseUrl/rest/v1/messages")
                    .post(body)
                    .addHeader("apikey", anonKey)
                    .addHeader("Authorization", "Bearer $token")
                    .build()

                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        Log.d("SmsReceiver", "Successfully posted inbound SMS to Supabase.")
                    } else {
                        Log.e("SmsReceiver", "Failed to post inbound SMS. Code: ${response.code}")
                    }
                }
            } catch (e: Exception) {
                Log.e("SmsReceiver", "Error posting inbound SMS", e)
            }
        }
    }
}
