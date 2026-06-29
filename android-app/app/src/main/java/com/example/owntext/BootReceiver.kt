package com.example.owntext

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Device booted. Starting SmsBackgroundService...")
            
            val prefs = context.getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
            val jwtToken = prefs.getString("JWT", null)
            val deviceId = prefs.getString("DEVICE_ID", null)

            // Start only if the user is logged in
            if (jwtToken != null && deviceId != null) {
                val serviceIntent = Intent(context, SmsBackgroundService::class.java).apply {
                    putExtra("JWT_TOKEN", jwtToken)
                    putExtra("DEVICE_ID", deviceId)
                }
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
