package com.example.owntext

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.telephony.SubscriptionManager
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.UUID

class MainActivity : ComponentActivity() {

    private val anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbXFtZW9jZXdmaHNtdHppdnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NDc3OTEsImV4cCI6MjA5ODMyMzc5MX0.AWQTSVzbz02XLtwFMuv_XCSPzoVjCm4U-cHVxyNixb4"
    private val supabaseUrl = "https://himqmeocewfhsmtzivzd.supabase.co"
    private val client = OkHttpClient()

    private val requestPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val smsGranted = permissions[Manifest.permission.SEND_SMS] ?: false
            if (!smsGranted) {
                Toast.makeText(this, "SMS Permission is required!", Toast.LENGTH_LONG).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Request Permissions
        val permissions = mutableListOf(Manifest.permission.SEND_SMS, Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_PHONE_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        
        if (permissions.any { ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED }) {
            requestPermissionLauncher.launch(permissions.toTypedArray())
        }

        setContent {
            MaterialTheme(colorScheme = darkColorScheme()) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF0F172A) // Deep blue-gray background
                ) {
                    AppContent()
                }
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun AppContent() {
        val scope = rememberCoroutineScope()
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        var isLoading by remember { mutableStateOf(false) }
        var isServiceRunning by remember { mutableStateOf(false) }
        var passwordVisible by remember { mutableStateOf(false) }
        
        val prefs = getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
        var savedJwt by remember { mutableStateOf(prefs.getString("JWT", null)) }
        var savedDeviceId by remember { mutableStateOf(prefs.getString("DEVICE_ID", null)) }
        
        // Stats
        var sentCount by remember { mutableIntStateOf(prefs.getInt("STATS_SENT", 0)) }
        var failedCount by remember { mutableIntStateOf(prefs.getInt("STATS_FAILED", 0)) }
        
        // SIM Selection
        var selectedSim by remember { mutableIntStateOf(prefs.getInt("SELECTED_SIM", -1)) }
        var activeSims by remember { mutableIntStateOf(0) }
        
        LaunchedEffect(Unit) {
            // Check active sims
            if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                    val subManager = getSystemService(SubscriptionManager::class.java)
                    activeSims = subManager?.activeSubscriptionInfoCount ?: 0
                }
            }
            
            while(true) {
                sentCount = prefs.getInt("STATS_SENT", 0)
                failedCount = prefs.getInt("STATS_FAILED", 0)
                delay(2000)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = if (savedJwt == null) Arrangement.Center else Arrangement.Top,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Premium Logo Header
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6))))
                    .padding(20.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.fillMaxSize()
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text("OwnText", style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.Bold, color = Color.White))
            Text("By Sadi", style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFA78BFA), letterSpacing = 2.sp))
            
            Spacer(modifier = Modifier.height(48.dp))

            if (savedJwt == null) {
                // Login Form (Glassmorphism style)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(24.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Welcome Back", style = MaterialTheme.typography.titleLarge, color = Color.White)
                        Text("Sign in to connect device", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text("Email") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF6366F1),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.2f)
                            )
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            label = { Text("Password") },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            trailingIcon = {
                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(
                                        imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = "Toggle password visibility"
                                    )
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFF6366F1),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.2f)
                            )
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    isLoading = true
                                    login(email, password)
                                    isLoading = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1)),
                            enabled = !isLoading
                        ) {
                            Text(if (isLoading) "Connecting..." else "Connect Device", fontSize = 16.sp)
                        }
                    }
                }
            } else {
                // Dashboard
                
                // Status Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (isServiceRunning) Color(0xFF10B981) else Color(0xFFEF4444))
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                if (isServiceRunning) "Gateway Online" else "Gateway Offline",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Messages Sent", color = Color.Gray, fontSize = 12.sp)
                                Text("$sentCount", color = Color(0xFF10B981), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Failed", color = Color.Gray, fontSize = 12.sp)
                                Text("$failedCount", color = Color(0xFFEF4444), fontSize = 24.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // SIM Selection Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.05f)),
                    shape = RoundedCornerShape(20.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("SIM Preference", style = MaterialTheme.typography.titleMedium, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedButton(
                                onClick = { 
                                    selectedSim = -1
                                    prefs.edit().putInt("SELECTED_SIM", -1).apply()
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (selectedSim == -1) Color(0xFF6366F1).copy(alpha = 0.2f) else Color.Transparent
                                ),
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (selectedSim == -1) Color(0xFF6366F1) else Color.Gray)
                            ) {
                                Text("Default", color = if (selectedSim == -1) Color.White else Color.Gray)
                            }
                            OutlinedButton(
                                onClick = { 
                                    if (activeSims >= 1) {
                                        selectedSim = 0
                                        prefs.edit().putInt("SELECTED_SIM", 0).apply()
                                    } else {
                                        Toast.makeText(this@MainActivity, "SIM 1 not detected", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (selectedSim == 0) Color(0xFF6366F1).copy(alpha = 0.2f) else Color.Transparent
                                ),
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (selectedSim == 0) Color(0xFF6366F1) else Color.Gray)
                            ) {
                                Text("SIM 1", color = if (selectedSim == 0) Color.White else Color.Gray)
                            }
                            OutlinedButton(
                                onClick = { 
                                    if (activeSims >= 2) {
                                        selectedSim = 1
                                        prefs.edit().putInt("SELECTED_SIM", 1).apply()
                                    } else {
                                        Toast.makeText(this@MainActivity, "SIM 2 not detected", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.outlinedButtonColors(
                                    containerColor = if (selectedSim == 1) Color(0xFF6366F1).copy(alpha = 0.2f) else Color.Transparent
                                ),
                                border = androidx.compose.foundation.BorderStroke(1.dp, if (selectedSim == 1) Color(0xFF6366F1) else Color.Gray)
                            ) {
                                Text("SIM 2", color = if (selectedSim == 1) Color.White else Color.Gray)
                            }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Primary Action Button
                Button(
                    onClick = {
                        if (isServiceRunning) {
                            stopService(Intent(this@MainActivity, SmsBackgroundService::class.java))
                            isServiceRunning = false
                        } else {
                            val intent = Intent(this@MainActivity, SmsBackgroundService::class.java).apply {
                                putExtra("JWT_TOKEN", savedJwt)
                                putExtra("DEVICE_ID", savedDeviceId)
                            }
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                startForegroundService(intent)
                            } else {
                                startService(intent)
                            }
                            isServiceRunning = true
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isServiceRunning) Color(0xFFEF4444) else Color(0xFF10B981)
                    )
                ) {
                    Icon(
                        imageVector = if (isServiceRunning) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isServiceRunning) "Stop Gateway" else "Start Gateway", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Battery Opt Button
                OutlinedButton(
                    onClick = {
                        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !pm.isIgnoringBatteryOptimizations(packageName)) {
                            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                data = Uri.parse("package:$packageName")
                            }
                            startActivity(intent)
                        } else {
                            Toast.makeText(this@MainActivity, "Battery Optimization is already disabled for this app!", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.BatteryStd, contentDescription = null, tint = Color.Gray)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Disable Battery Opt (Recommended)", color = Color.Gray)
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                TextButton(
                    onClick = {
                        prefs.edit().clear().apply()
                        savedJwt = null
                        if (isServiceRunning) {
                            stopService(Intent(this@MainActivity, SmsBackgroundService::class.java))
                            isServiceRunning = false
                        }
                    }
                ) {
                    Text("Logout Device", color = Color.Gray)
                }
            }
        }
    }

    private suspend fun login(email: String, pass: String) {
        withContext(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("email", email)
                    put("password", pass)
                }.toString()
                
                val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())
                
                val request = Request.Builder()
                    .url("$supabaseUrl/auth/v1/token?grant_type=password")
                    .post(body)
                    .addHeader("apikey", anonKey)
                    .build()

                client.newCall(request).execute().use { response ->
                    val respStr = response.body?.string()
                    if (response.isSuccessful && respStr != null) {
                        val obj = JSONObject(respStr)
                        val token = obj.getString("access_token")
                        val user = obj.getJSONObject("user")
                        val userId = user.getString("id")
                        
                        registerDevice(token, userId)
                    } else {
                        val err = respStr ?: response.code.toString()
                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@MainActivity, "Login Failed: $err", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private suspend fun registerDevice(token: String, userId: String) {
        val prefs = getSharedPreferences("OwnTextPrefs", Context.MODE_PRIVATE)
        var dId = prefs.getString("DEVICE_ID", null)
        if (dId == null) {
            dId = UUID.randomUUID().toString()
        }

        val json = JSONObject().apply {
            put("id", dId)
            put("user_id", userId)
            put("device_name", "${Build.MANUFACTURER} ${Build.MODEL}")
            put("is_online", true)
        }.toString()

        val body = json.toRequestBody("application/json; charset=utf-8".toMediaType())

        // Use upsert
        val request = Request.Builder()
            .url("$supabaseUrl/rest/v1/devices")
            .post(body)
            .addHeader("apikey", anonKey)
            .addHeader("Authorization", "Bearer $token")
            .addHeader("Prefer", "resolution=merge-duplicates")
            .build()

        client.newCall(request).execute().use { response ->
            if (response.isSuccessful) {
                prefs.edit()
                    .putString("JWT", token)
                    .putString("DEVICE_ID", dId)
                    .apply()
                    
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Device Registered!", Toast.LENGTH_SHORT).show()
                    recreate() // Reload UI
                }
            } else {
                val err = response.body?.string() ?: response.code.toString()
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Device Reg Failed: $err", Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
