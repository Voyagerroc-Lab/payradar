package com.example.payradar.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint
import com.example.payradar.ui.theme.Danger
import com.example.payradar.ui.theme.DangerSoft
import com.example.payradar.ui.theme.IndigoPrimary
import com.example.payradar.ui.theme.Success
import com.example.payradar.ui.theme.SuccessSoft
import kotlin.math.roundToInt

@Composable
fun PriceChartDialog(
    payment: Payment,
    onDismiss: () -> Unit,
    lang: AppLanguage
) {
    val points = payment.priceHistory + PricePoint(
        date = FormatUtils.todayISO(),
        price = payment.price
    )

    val firstPrice = points.firstOrNull()?.price ?: payment.price
    val currentPrice = payment.price
    val diff = currentPrice - firstPrice
    val pct = if (firstPrice > 0) ((diff / firstPrice) * 100).roundToInt() else 0

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 6.dp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .fillMaxWidth()
            ) {
                Text(
                    text = AppStrings.t("chart.title", lang, mapOf("name" to payment.name)),
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                RoundedCornerShape(10.dp)
                            )
                            .padding(12.dp)
                    ) {
                        Text(
                            text = AppStrings.t("chart.current", lang),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = FormatUtils.formatMoney(currentPrice, payment.currency),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        )
                    }

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(
                                if (pct > 0) DangerSoft else if (pct < 0) SuccessSoft else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f),
                                RoundedCornerShape(10.dp)
                            )
                            .padding(12.dp)
                    ) {
                        Text(
                            text = AppStrings.t("chart.change", lang),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (pct > 0) "▲ +$pct%" else if (pct < 0) "▼ $pct%" else "0%",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = if (pct > 0) Danger else if (pct < 0) Success else MaterialTheme.colorScheme.onSurface
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Line Chart Canvas
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .background(
                            MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f),
                            RoundedCornerShape(12.dp)
                        )
                        .padding(16.dp)
                ) {
                    Canvas(modifier = Modifier.matchParentSize()) {
                        val width = size.width
                        val height = size.height

                        val prices = points.map { it.price }
                        val minPrice = (prices.minOrNull() ?: 0.0) * 0.85
                        val maxPrice = (prices.maxOrNull() ?: 100.0) * 1.15
                        val range = if (maxPrice > minPrice) maxPrice - minPrice else 1.0

                        // Grid lines
                        drawLine(
                            color = Color.LightGray.copy(alpha = 0.4f),
                            start = Offset(0f, height * 0.25f),
                            end = Offset(width, height * 0.25f),
                            strokeWidth = 1.dp.toPx()
                        )
                        drawLine(
                            color = Color.LightGray.copy(alpha = 0.4f),
                            start = Offset(0f, height * 0.75f),
                            end = Offset(width, height * 0.75f),
                            strokeWidth = 1.dp.toPx()
                        )

                        if (points.size == 1) {
                            // Single point
                            val cx = width / 2f
                            val cy = height / 2f
                            drawCircle(
                                color = IndigoPrimary,
                                radius = 6.dp.toPx(),
                                center = Offset(cx, cy)
                            )
                        } else {
                            val stepX = width / (points.size - 1)
                            val path = Path()

                            points.forEachIndexed { i, p ->
                                val x = i * stepX
                                val normY = ((p.price - minPrice) / range).toFloat()
                                val y = height - (normY * height)
                                if (i == 0) {
                                    path.moveTo(x, y)
                                } else {
                                    path.lineTo(x, y)
                                }
                            }

                            drawPath(
                                path = path,
                                color = IndigoPrimary,
                                style = Stroke(width = 3.dp.toPx())
                            )

                            // Draw circles on data points
                            points.forEachIndexed { i, p ->
                                val x = i * stepX
                                val normY = ((p.price - minPrice) / range).toFloat()
                                val y = height - (normY * height)
                                drawCircle(
                                    color = IndigoPrimary,
                                    radius = 5.dp.toPx(),
                                    center = Offset(x, y)
                                )
                                drawCircle(
                                    color = Color.White,
                                    radius = 2.5.dp.toPx(),
                                    center = Offset(x, y)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Price points list
                Column(
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    points.forEach { pt ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = FormatUtils.formatDate(pt.date, lang),
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = FormatUtils.formatMoney(pt.price, payment.currency),
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onDismiss,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("chart_close_button")
                ) {
                    Text(AppStrings.t("action.cancel", lang))
                }
            }
        }
    }
}
