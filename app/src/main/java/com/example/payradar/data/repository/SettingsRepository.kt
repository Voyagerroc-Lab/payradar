package com.example.payradar.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.AppPrefs
import com.example.payradar.model.AppTheme
import com.example.payradar.model.VaultSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.MessageDigest
import java.security.SecureRandom

class SettingsRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("payradar_prefs", Context.MODE_PRIVATE)

    private val _appPrefs = MutableStateFlow(readAppPrefs())
    val appPrefs: StateFlow<AppPrefs> = _appPrefs.asStateFlow()

    private val _vaultSettings = MutableStateFlow(readVaultSettings())
    val vaultSettings: StateFlow<VaultSettings> = _vaultSettings.asStateFlow()

    private fun readAppPrefs(): AppPrefs {
        val lang = prefs.getString("language", "tr") ?: "tr"
        val theme = prefs.getString("theme", "auto") ?: "auto"
        val lockEnabled = prefs.getBoolean("lockEnabled", false)
        val autoLock = prefs.getInt("autoLockMinutes", 5)
        val pinHash = prefs.getString("pinHash", "") ?: ""
        val pinSalt = prefs.getString("pinSalt", "") ?: ""

        return AppPrefs(
            language = AppLanguage.fromCode(lang),
            theme = AppTheme.fromCode(theme),
            lockEnabled = lockEnabled,
            autoLockMinutes = autoLock,
            pinHash = pinHash,
            pinSalt = pinSalt
        )
    }

    private fun readVaultSettings(): VaultSettings {
        val reminderDays = prefs.getInt("reminderDays", 3)
        val notifications = prefs.getBoolean("notificationsEnabled", false)
        val usd = prefs.getFloat("usdTry", 42.0f).toDouble()
        val eur = prefs.getFloat("eurTry", 48.0f).toDouble()
        val updated = prefs.getLong("updatedAt", System.currentTimeMillis())

        return VaultSettings(
            reminderDays = reminderDays,
            notificationsEnabled = notifications,
            usdTry = usd,
            eurTry = eur,
            updatedAt = updated
        )
    }

    fun updateLanguage(lang: AppLanguage) {
        prefs.edit().putString("language", lang.code).apply()
        _appPrefs.value = _appPrefs.value.copy(language = lang)
    }

    fun updateTheme(theme: AppTheme) {
        prefs.edit().putString("theme", theme.code).apply()
        _appPrefs.value = _appPrefs.value.copy(theme = theme)
    }

    fun updateAutoLock(minutes: Int) {
        prefs.edit().putInt("autoLockMinutes", minutes).apply()
        _appPrefs.value = _appPrefs.value.copy(autoLockMinutes = minutes)
    }

    fun updateVaultSettings(settings: VaultSettings) {
        prefs.edit()
            .putInt("reminderDays", settings.reminderDays)
            .putBoolean("notificationsEnabled", settings.notificationsEnabled)
            .putFloat("usdTry", settings.usdTry.toFloat())
            .putFloat("eurTry", settings.eurTry.toFloat())
            .putLong("updatedAt", System.currentTimeMillis())
            .apply()
        _vaultSettings.value = settings.copy(updatedAt = System.currentTimeMillis())
    }

    fun setPin(pin: String): Boolean {
        if (pin.length !in 4..8 || !pin.all { it.isDigit() }) return false
        val salt = generateSalt()
        val hash = hashPin(pin, salt)
        prefs.edit()
            .putBoolean("lockEnabled", true)
            .putString("pinHash", hash)
            .putString("pinSalt", salt)
            .apply()
        _appPrefs.value = _appPrefs.value.copy(
            lockEnabled = true,
            pinHash = hash,
            pinSalt = salt
        )
        return true
    }

    fun verifyPin(pin: String): Boolean {
        val currentHash = _appPrefs.value.pinHash
        val currentSalt = _appPrefs.value.pinSalt
        if (currentHash.isEmpty() || currentSalt.isEmpty()) return false
        val calculated = hashPin(pin, currentSalt)
        return calculated == currentHash
    }

    fun disableLock(pin: String): Boolean {
        if (!verifyPin(pin)) return false
        prefs.edit()
            .putBoolean("lockEnabled", false)
            .putString("pinHash", "")
            .putString("pinSalt", "")
            .apply()
        _appPrefs.value = _appPrefs.value.copy(
            lockEnabled = false,
            pinHash = "",
            pinSalt = ""
        )
        return true
    }

    fun changePin(oldPin: String, newPin: String): Boolean {
        if (!verifyPin(oldPin)) return false
        return setPin(newPin)
    }

    fun wipeAllData() {
        prefs.edit().clear().apply()
        _appPrefs.value = AppPrefs()
        _vaultSettings.value = VaultSettings()
    }

    private fun generateSalt(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return bytes.joinToString("") { "%02x".format(it) }
    }

    private fun hashPin(pin: String, salt: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val input = "$salt:$pin".toByteArray(Charsets.UTF_8)
        val digest = md.digest(input)
        return digest.joinToString("") { "%02x".format(it) }
    }
}
