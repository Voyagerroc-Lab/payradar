package com.example.payradar.model

import kotlinx.serialization.Serializable

@Serializable
enum class CategoryId(val id: String, val emoji: String, val colorHex: Long) {
    KONUT("konut", "🏠", 0xFFE5484D),
    ULASIM("ulasim", "🚗", 0xFF0091FF),
    FATURALAR("faturalar", "🧾", 0xFFF76B15),
    ABONELIK("abonelik", "📺", 0xFF8E4EC6),
    EGITIM("egitim", "📚", 0xFFFFB224),
    SAGLIK("saglik", "💪", 0xFF30A46C),
    SIGORTA("sigorta", "🛡️", 0xFF05A2C2),
    OYUN("oyun", "🎮", 0xFF7D6EE0),
    DIGER("diger", "📦", 0xFF8D8D8D);

    companion object {
        fun fromId(id: String): CategoryId =
            entries.find { it.id.equals(id, ignoreCase = true) } ?: DIGER
    }
}

@Serializable
enum class Currency(val code: String, val symbol: String) {
    TRY("TRY", "₺"),
    USD("USD", "$"),
    EUR("EUR", "€");

    companion object {
        fun fromCode(code: String): Currency =
            entries.find { it.code.equals(code, ignoreCase = true) } ?: TRY
    }
}

@Serializable
enum class BillingCycle(val code: String) {
    WEEKLY("weekly"),
    MONTHLY("monthly"),
    QUARTERLY("quarterly"),
    YEARLY("yearly");

    companion object {
        fun fromCode(code: String): BillingCycle =
            entries.find { it.code.equals(code, ignoreCase = true) } ?: MONTHLY
    }
}

@Serializable
enum class AppLanguage(val code: String, val displayName: String) {
    TR("tr", "Türkçe"),
    EN("en", "English");

    companion object {
        fun fromCode(code: String): AppLanguage =
            entries.find { it.code.equals(code, ignoreCase = true) } ?: TR
    }
}

@Serializable
enum class AppTheme(val code: String) {
    AUTO("auto"),
    LIGHT("light"),
    DARK("dark");

    companion object {
        fun fromCode(code: String): AppTheme =
            entries.find { it.code.equals(code, ignoreCase = true) } ?: AUTO
    }
}

@Serializable
data class PricePoint(
    val date: String,
    val price: Double
)

@Serializable
data class Payment(
    val id: String,
    val name: String,
    val price: Double,
    val currency: Currency = Currency.TRY,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val nextPaymentDate: String, // yyyy-MM-dd
    val categoryId: CategoryId = CategoryId.ABONELIK,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val priceHistory: List<PricePoint> = emptyList(),
    val isTrial: Boolean = false
)

data class CancelGuide(
    val id: String,
    val displayName: String,
    val displayNameEn: String? = null,
    val aliases: List<String>,
    val steps: List<String>,
    val stepsEn: List<String>? = null,
    val cancelUrl: String? = null,
    val tip: String? = null,
    val tipEn: String? = null
)

data class AppPrefs(
    val language: AppLanguage = AppLanguage.TR,
    val theme: AppTheme = AppTheme.AUTO,
    val lockEnabled: Boolean = false,
    val autoLockMinutes: Int = 5, // 0 = never
    val pinHash: String = "",
    val pinSalt: String = ""
)

data class VaultSettings(
    val reminderDays: Int = 3,
    val notificationsEnabled: Boolean = false,
    val usdTry: Double = 42.0,
    val eurTry: Double = 48.0,
    val updatedAt: Long = System.currentTimeMillis()
)
