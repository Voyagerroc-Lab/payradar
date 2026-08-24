package com.example.payradar.ui.components

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.ShowChart
import androidx.compose.material.icons.filled.Update
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.CategoryId
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.GuidesData
import com.example.payradar.model.Payment
import com.example.payradar.ui.theme.Danger
import com.example.payradar.ui.theme.DangerSoft
import com.example.payradar.ui.theme.Success
import com.example.payradar.ui.theme.SuccessSoft
import com.example.payradar.ui.theme.Warning
import com.example.payradar.ui.theme.WarningSoft

@Composable
fun PaymentCardItem(
    payment: Payment,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onShowGuide: () -> Unit,
    onShowHistory: () -> Unit,
    onAdvanceDate: () -> Unit,
    lang: AppLanguage,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val category = payment.categoryId
    val categoryColor = Color(category.colorHex)
    val days = FormatUtils.daysUntil(payment.nextPaymentDate)
    val hasGuide = GuidesData.findGuide(payment.name) != null || payment.categoryId == CategoryId.ABONELIK

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("payment_item_${payment.id}"),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Avatar with initial and category emoji
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(categoryColor.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = payment.name.firstOrNull()?.uppercase() ?: "?",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = categoryColor
                            )
                        )
                        Text(
                            text = category.emoji,
                            fontSize = 11.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.width(12.dp))

                // Info
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = payment.name,
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            ),
                            color = MaterialTheme.colorScheme.onSurface,
                            maxLines = 1,
                            modifier = Modifier.weight(1f, fill = false)
                        )

                        // Category chip
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            border = BorderStroke(1.dp, categoryColor.copy(alpha = 0.5f)),
                            color = categoryColor.copy(alpha = 0.08f)
                        ) {
                            Text(
                                text = "${category.emoji} ${AppStrings.t("cat.${category.id}", lang)}",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                color = categoryColor,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }

                        if (payment.categoryId == CategoryId.KREDI && (payment.bankName != null || payment.currentInstallment != null)) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                            ) {
                                val loanText = buildString {
                                    payment.bankName?.let { append(it) }
                                    if (payment.currentInstallment != null && payment.totalInstallments != null) {
                                        if (isNotEmpty()) append(" • ")
                                        val badge = AppStrings.t(
                                            "form.installmentBadge",
                                            lang,
                                            mapOf("current" to payment.currentInstallment, "total" to payment.totalInstallments)
                                        )
                                        append(badge)
                                    }
                                }
                                Text(
                                    text = "🏦 $loanText",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        if (payment.categoryId == CategoryId.CEK_SENET && (payment.checkNumber != null || payment.payee != null)) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFF7C3AED).copy(alpha = 0.12f)
                            ) {
                                val checkText = buildString {
                                    payment.checkNumber?.let { append("No: $it") }
                                    payment.payee?.let {
                                        if (isNotEmpty()) append(" • ")
                                        append(it)
                                    }
                                }
                                Text(
                                    text = "📜 $checkText",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = Color(0xFF7C3AED),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        if (payment.isTrial && days >= 0) {
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = WarningSoft
                            ) {
                                Text(
                                    text = "🎁 ${AppStrings.t("card.trial", lang)}",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = Warning,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // Price & cycle
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = FormatUtils.formatMoney(payment.price, payment.currency),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            ),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = AppStrings.t("suffix.${payment.billingCycle.code}", lang),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    // Date & Status text
                    Text(
                        text = "${AppStrings.t("card.nextPayment", lang)} ${FormatUtils.formatDate(payment.nextPaymentDate, lang)}",
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.5.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Days status badge on top right
                PaymentDaysBadge(days = days, isTrial = payment.isTrial, lang = lang)
            }

            // Notes if available
            if (!payment.notes.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = payment.notes,
                        style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.5.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Action buttons row
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (hasGuide) {
                        OutlinedButton(
                            onClick = onShowGuide,
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = ButtonDefaults.ContentPadding,
                            modifier = Modifier
                                .height(32.dp)
                                .testTag("guide_btn_${payment.id}")
                        ) {
                            Icon(
                                imageVector = Icons.Default.MenuBook,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = AppStrings.t("card.guide", lang),
                                fontSize = 11.sp
                            )
                        }
                    }

                    // Advance date button
                    IconButton(
                        onClick = onAdvanceDate,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("advance_btn_${payment.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Update,
                            contentDescription = AppStrings.t("card.advance", lang),
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // Price history chart button
                    IconButton(
                        onClick = onShowHistory,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("history_btn_${payment.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.ShowChart,
                            contentDescription = "Price Chart",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Share
                    IconButton(
                        onClick = {
                            val cycleText = AppStrings.t("suffix.${payment.billingCycle.code}", lang)
                            val shareText = if (payment.notes.isNullOrBlank()) {
                                "${payment.name}: ${FormatUtils.formatMoney(payment.price, payment.currency)}$cycleText"
                            } else {
                                "${payment.name}: ${FormatUtils.formatMoney(payment.price, payment.currency)}$cycleText\n${payment.notes}"
                            }
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, shareText)
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, payment.name))
                        },
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("share_btn_${payment.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = AppStrings.t("aria.share", lang, mapOf("name" to payment.name)),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // Edit
                    IconButton(
                        onClick = onEdit,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("edit_btn_${payment.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = AppStrings.t("aria.edit", lang, mapOf("name" to payment.name)),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // Delete
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier
                            .size(32.dp)
                            .testTag("delete_btn_${payment.id}")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = AppStrings.t("aria.delete", lang, mapOf("name" to payment.name)),
                            tint = Danger,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentDaysBadge(days: Long, isTrial: Boolean, lang: AppLanguage) {
    val (bgColor, textColor, text) = when {
        days < 0 -> Triple(DangerSoft, Danger, AppStrings.t("card.overdueShort", lang))
        days == 0L -> Triple(DangerSoft, Danger, AppStrings.t("card.todayShort", lang))
        days <= 7L -> Triple(WarningSoft, Warning, "$days${AppStrings.t("card.dayUnit", lang)}")
        else -> Triple(SuccessSoft, Success, "$days${AppStrings.t("card.dayUnit", lang)}")
    }

    Surface(
        shape = RoundedCornerShape(8.dp),
        color = bgColor
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.bodySmall.copy(
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp
            ),
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
