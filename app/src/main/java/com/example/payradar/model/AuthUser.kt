package com.example.payradar.model

import kotlinx.serialization.Serializable

@Serializable
data class AuthUser(
    val uid: String,
    val email: String,
    val displayName: String = "",
    val photoUrl: String? = null,
    val lastSyncTime: Long = System.currentTimeMillis(),
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class SyncPayload(
    val userEmail: String,
    val timestamp: Long = System.currentTimeMillis(),
    val payments: List<Payment> = emptyList(),
    val vaultSettings: VaultSettings = VaultSettings(),
    val appTheme: String = "auto",
    val appLanguage: String = "tr"
)

enum class SyncState {
    IDLE,
    SYNCING,
    SUCCESS,
    ERROR
}
