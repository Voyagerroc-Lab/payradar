package com.example.payradar.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.Currency
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import com.example.payradar.model.VaultSettings

@Composable
fun SummaryCards(
    payments: List<Payment>,
    vaultSettings: VaultSettings,
    lang: AppLanguage,
    modifier: Modifier = Modifier
) {
    val monthly = payments.sumOf { FormatUtils.toTryPerMonth(it, vaultSettings.usdTry, vaultSettings.eurTry) }
    val yearly = monthly * 12.0

    val upcoming = payments
        .map { it to FormatUtils.daysUntil(it.nextPaymentDate) }
        .filter { it.second >= 0 }
        .minByOrNull { it.second }

    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SummaryItem(
                label = AppStrings.t("summary.monthly", lang),
                value = FormatUtils.formatMoney(monthly, Currency.TRY),
                modifier = Modifier.weight(1f)
            )
            SummaryItem(
                label = AppStrings.t("summary.yearly", lang),
                value = FormatUtils.formatMoney(yearly, Currency.TRY),
                modifier = Modifier.weight(1f)
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            SummaryItem(
                label = AppStrings.t("summary.active", lang),
                value = payments.size.toString(),
                modifier = Modifier.weight(1f)
            )
            SummaryItem(
                label = AppStrings.t("summary.next", lang),
                value = upcoming?.first?.name ?: "—",
                subValue = upcoming?.let { describeDays(it.second, lang) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun SummaryItem(
    label: String,
    value: String,
    subValue: String? = null,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    letterSpacing = (-0.3).sp
                ),
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            if (subValue != null) {
                Text(
                    text = subValue,
                    style = MaterialTheme.typography.bodySmall.copy(
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    color = MaterialTheme.colorScheme.primary,
                    maxLines = 1
                )
            }
        }
    }
}

private fun describeDays(days: Long, lang: AppLanguage): String {
    return when (days) {
        0L -> AppStrings.t("time.renewsToday", lang)
        1L -> AppStrings.t("time.renewsTomorrow", lang)
        else -> AppStrings.t("time.daysLeft", lang, mapOf("n" to days))
    }
}
