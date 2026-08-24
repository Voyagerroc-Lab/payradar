package com.example.payradar.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.payradar.model.AuthUser
import com.example.payradar.model.Payment
import com.example.payradar.model.SyncPayload
import com.example.payradar.model.SyncState
import com.example.payradar.model.VaultSettings
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID

class AuthRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("payradar_auth_prefs", Context.MODE_PRIVATE)

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val _currentUser = MutableStateFlow<AuthUser?>(readCurrentUser())
    val currentUser: StateFlow<AuthUser?> = _currentUser.asStateFlow()

    private val _syncState = MutableStateFlow(SyncState.IDLE)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    private val _lastSyncTimestamp = MutableStateFlow(prefs.getLong("last_sync_time", 0L))
    val lastSyncTimestamp: StateFlow<Long> = _lastSyncTimestamp.asStateFlow()

    private fun readCurrentUser(): AuthUser? {
        val userJson = prefs.getString("current_user", null) ?: return null
        return try {
            json.decodeFromString<AuthUser>(userJson)
        } catch (_: Exception) {
            null
        }
    }

    suspend fun signUp(email: String, pass: String, displayName: String): Result<AuthUser> {
        val normalizedEmail = email.trim().lowercase()
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(normalizedEmail).matches()) {
            return Result.failure(IllegalArgumentException("INVALID_EMAIL"))
        }
        if (pass.length < 6) {
            return Result.failure(IllegalArgumentException("SHORT_PASSWORD"))
        }

        // Check if user exists
        val existingUsers = getRegisteredUsers()
        if (existingUsers.any { it.email.equals(normalizedEmail, ignoreCase = true) }) {
            return Result.failure(IllegalArgumentException("USER_EXISTS"))
        }

        val salt = generateSalt()
        val hash = hashPassword(pass, salt)
        val uid = "usr_" + UUID.randomUUID().toString().take(12)

        val newUser = AuthUser(
            uid = uid,
            email = normalizedEmail,
            displayName = displayName.ifBlank { normalizedEmail.substringBefore("@") },
            lastSyncTime = System.currentTimeMillis(),
            createdAt = System.currentTimeMillis()
        )

        // Save credential
        saveUserCredential(normalizedEmail, hash, salt, newUser)

        // Set as current user
        setCurrentUser(newUser)
        return Result.success(newUser)
    }

    suspend fun signIn(email: String, pass: String): Result<AuthUser> {
        val normalizedEmail = email.trim().lowercase()
        val stored = getUserCredential(normalizedEmail)
            ?: return Result.failure(IllegalArgumentException("INVALID_CREDENTIALS"))

        val expectedHash = hashPassword(pass, stored.salt)
        if (expectedHash != stored.hash) {
            return Result.failure(IllegalArgumentException("INVALID_CREDENTIALS"))
        }

        val updatedUser = stored.user.copy(lastSyncTime = System.currentTimeMillis())
        setCurrentUser(updatedUser)
        return Result.success(updatedUser)
    }

    suspend fun signInWithGoogle(customEmail: String? = null, customName: String? = null): Result<AuthUser> {
        // Mock / Quick Google Sign In
        val email = customEmail?.trim()?.lowercase() ?: "demo.user@gmail.com"
        val name = customName?.ifBlank { null } ?: "Google User"
        val uid = "goog_" + UUID.randomUUID().toString().take(12)

        val existing = getUserCredential(email)?.user
        val user = existing ?: AuthUser(
            uid = uid,
            email = email,
            displayName = name,
            lastSyncTime = System.currentTimeMillis(),
            createdAt = System.currentTimeMillis()
        )

        if (existing == null) {
            val salt = generateSalt()
            val hash = hashPassword("google_oauth_pass", salt)
            saveUserCredential(email, hash, salt, user)
        }

        setCurrentUser(user)
        return Result.success(user)
    }

    fun signOut() {
        prefs.edit().remove("current_user").apply()
        _currentUser.value = null
    }

    private fun setCurrentUser(user: AuthUser) {
        val userString = json.encodeToString(user)
        prefs.edit()
            .putString("current_user", userString)
            .putLong("last_sync_time", user.lastSyncTime)
            .apply()
        _currentUser.value = user
        _lastSyncTimestamp.value = user.lastSyncTime
    }

    // Cloud Data Sync Simulation & Snapshot Storage
    suspend fun syncWithCloud(
        payments: List<Payment>,
        vaultSettings: VaultSettings
    ): Result<SyncPayload> {
        val user = _currentUser.value ?: return Result.failure(IllegalStateException("NO_USER"))
        _syncState.value = SyncState.SYNCING

        // Simulate cloud network latency (300ms)
        delay(400)

        val now = System.currentTimeMillis()
        val payload = SyncPayload(
            userEmail = user.email,
            timestamp = now,
            payments = payments,
            vaultSettings = vaultSettings
        )

        // Save cloud snapshot per email in shared preferences
        val snapshotJson = json.encodeToString(payload)
        prefs.edit()
            .putString("cloud_snapshot_${user.email}", snapshotJson)
            .putLong("last_sync_time", now)
            .apply()

        val updatedUser = user.copy(lastSyncTime = now)
        setCurrentUser(updatedUser)
        _syncState.value = SyncState.SUCCESS
        delay(1200)
        _syncState.value = SyncState.IDLE

        return Result.success(payload)
    }

    fun getCloudSnapshot(email: String): SyncPayload? {
        val jsonString = prefs.getString("cloud_snapshot_$email", null) ?: return null
        return try {
            json.decodeFromString<SyncPayload>(jsonString)
        } catch (_: Exception) {
            null
        }
    }

    private data class CredentialRecord(
        val hash: String,
        val salt: String,
        val user: AuthUser
    )

    private fun saveUserCredential(email: String, hash: String, salt: String, user: AuthUser) {
        val userJson = json.encodeToString(user)
        prefs.edit()
            .putString("cred_hash_$email", hash)
            .putString("cred_salt_$email", salt)
            .putString("cred_user_$email", userJson)
            .apply()
    }

    private fun getUserCredential(email: String): CredentialRecord? {
        val hash = prefs.getString("cred_hash_$email", null) ?: return null
        val salt = prefs.getString("cred_salt_$email", null) ?: return null
        val userJson = prefs.getString("cred_user_$email", null) ?: return null
        val user = try {
            json.decodeFromString<AuthUser>(userJson)
        } catch (_: Exception) {
            return null
        }
        return CredentialRecord(hash, salt, user)
    }

    private fun getRegisteredUsers(): List<AuthUser> {
        val all = prefs.all
        val users = mutableListOf<AuthUser>()
        for ((key, value) in all) {
            if (key.startsWith("cred_user_") && value is String) {
                try {
                    users.add(json.decodeFromString<AuthUser>(value))
                } catch (_: Exception) {}
            }
        }
        return users
    }

    private fun generateSalt(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun hashPassword(password: String, salt: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val input = "$salt:$password".toByteArray(Charsets.UTF_8)
        val digest = md.digest(input)
        return digest.joinToString("") { "%02x".format(it) }
    }
}
