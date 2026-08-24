package com.example.payradar.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.BillingCycle
import com.example.payradar.model.CategoryId
import com.example.payradar.model.Currency
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint
import com.example.payradar.ui.theme.Danger
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentFormDialog(
    initialPayment: Payment?,
    onDismiss: () -> Unit,
    onSave: (Payment) -> Unit,
    lang: AppLanguage
) {
    var name by remember { mutableStateOf(initialPayment?.name ?: "") }
    var priceText by remember { mutableStateOf(initialPayment?.price?.let { if (it % 1.0 == 0.0) it.toLong().toString() else it.toString() } ?: "") }
    var currency by remember { mutableStateOf(initialPayment?.currency ?: Currency.TRY) }
    var billingCycle by remember { mutableStateOf(initialPayment?.billingCycle ?: BillingCycle.MONTHLY) }
    var nextPaymentDate by remember {
        mutableStateOf(
            initialPayment?.nextPaymentDate ?: LocalDate.now().plusMonths(1).format(DateTimeFormatter.ISO_LOCAL_DATE)
        )
    }
    var categoryId by remember { mutableStateOf(initialPayment?.categoryId ?: CategoryId.ABONELIK) }
    var notes by remember { mutableStateOf(initialPayment?.notes ?: "") }
    var isTrial by remember { mutableStateOf(initialPayment?.isTrial ?: false) }
    var errorMessage by remember { mutableStateOf("") }

    var currencyExpanded by remember { mutableStateOf(false) }
    var cycleExpanded by remember { mutableStateOf(false) }
    var categoryExpanded by remember { mutableStateOf(false) }

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
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = if (initialPayment == null) AppStrings.t("form.newTitle", lang) else AppStrings.t("form.editTitle", lang),
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 19.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Name
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        errorMessage = ""
                    },
                    label = { Text(AppStrings.t("form.name", lang)) },
                    placeholder = { Text(AppStrings.t("form.namePlaceholder", lang)) },
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("form_name_input")
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Amount and Currency
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = priceText,
                        onValueChange = {
                            priceText = it
                            errorMessage = ""
                        },
                        label = { Text(AppStrings.t("form.amount", lang)) },
                        placeholder = { Text("149.99") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1.2f)
                            .testTag("form_price_input")
                    )

                    ExposedDropdownMenuBox(
                        expanded = currencyExpanded,
                        onExpandedChange = { currencyExpanded = it },
                        modifier = Modifier.weight(0.8f)
                    ) {
                        OutlinedTextField(
                            value = "${currency.symbol} ${currency.code}",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(AppStrings.t("form.currency", lang)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = currencyExpanded) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .menuAnchor()
                                .testTag("form_currency_select")
                        )
                        ExposedDropdownMenu(
                            expanded = currencyExpanded,
                            onDismissRequest = { currencyExpanded = false }
                        ) {
                            Currency.entries.forEach { c ->
                                DropdownMenuItem(
                                    text = { Text("${c.symbol} ${c.code}") },
                                    onClick = {
                                        currency = c
                                        currencyExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Cycle & Category
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ExposedDropdownMenuBox(
                        expanded = cycleExpanded,
                        onExpandedChange = { cycleExpanded = it },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = AppStrings.t("cycle.${billingCycle.code}", lang),
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(AppStrings.t("form.cycle", lang)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = cycleExpanded) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .menuAnchor()
                                .testTag("form_cycle_select")
                        )
                        ExposedDropdownMenu(
                            expanded = cycleExpanded,
                            onDismissRequest = { cycleExpanded = false }
                        ) {
                            BillingCycle.entries.forEach { b ->
                                DropdownMenuItem(
                                    text = { Text(AppStrings.t("cycle.${b.code}", lang)) },
                                    onClick = {
                                        billingCycle = b
                                        cycleExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    ExposedDropdownMenuBox(
                        expanded = categoryExpanded,
                        onExpandedChange = { categoryExpanded = it },
                        modifier = Modifier.weight(1f)
                    ) {
                        OutlinedTextField(
                            value = "${categoryId.emoji} ${AppStrings.t("cat.${categoryId.id}", lang)}",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text(AppStrings.t("form.category", lang)) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .menuAnchor()
                                .testTag("form_category_select")
                        )
                        ExposedDropdownMenu(
                            expanded = categoryExpanded,
                            onDismissRequest = { categoryExpanded = false }
                        ) {
                            CategoryId.entries.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text("${cat.emoji} ${AppStrings.t("cat.${cat.id}", lang)}") },
                                    onClick = {
                                        categoryId = cat
                                        categoryExpanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Next payment date
                OutlinedTextField(
                    value = nextPaymentDate,
                    onValueChange = {
                        nextPaymentDate = it
                        errorMessage = ""
                    },
                    label = { Text(if (isTrial) AppStrings.t("form.trialEndDate", lang) else AppStrings.t("form.nextDate", lang)) },
                    placeholder = { Text("yyyy-MM-dd") },
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("form_date_input")
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Free trial toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isTrial,
                        onCheckedChange = { isTrial = it },
                        modifier = Modifier.testTag("form_is_trial_checkbox")
                    )
                    Text(
                        text = AppStrings.t("form.isTrial", lang),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (isTrial) {
                    Text(
                        text = AppStrings.t("form.isTrialHint", lang),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(start = 12.dp, bottom = 6.dp)
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Notes
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text(AppStrings.t("form.notes", lang)) },
                    placeholder = { Text(AppStrings.t("form.notesPlaceholder", lang)) },
                    shape = RoundedCornerShape(10.dp),
                    maxLines = 3,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("form_notes_input")
                )

                if (errorMessage.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = Danger
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.testTag("form_cancel_button")
                    ) {
                        Text(AppStrings.t("action.cancel", lang))
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val trimmedName = name.trim()
                            val parsedPrice = FormatUtils.parseAmount(priceText)

                            if (trimmedName.isEmpty()) {
                                errorMessage = AppStrings.t("form.error.name", lang)
                                return@Button
                            }
                            if (parsedPrice.isNaN() || parsedPrice <= 0) {
                                errorMessage = AppStrings.t("form.error.amount", lang)
                                return@Button
                            }
                            if (!Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(nextPaymentDate)) {
                                errorMessage = AppStrings.t("form.error.date", lang)
                                return@Button
                            }

                            val history = initialPayment?.priceHistory?.toMutableList() ?: mutableListOf()
                            // If editing and price changed, append to priceHistory
                            if (initialPayment != null && initialPayment.price != parsedPrice) {
                                history.add(PricePoint(FormatUtils.todayISO(), initialPayment.price))
                            }

                            onSave(
                                Payment(
                                    id = initialPayment?.id ?: UUID.randomUUID().toString(),
                                    name = trimmedName,
                                    price = parsedPrice,
                                    currency = currency,
                                    billingCycle = billingCycle,
                                    nextPaymentDate = nextPaymentDate,
                                    categoryId = categoryId,
                                    notes = notes.trim().ifEmpty { null },
                                    createdAt = initialPayment?.createdAt ?: System.currentTimeMillis(),
                                    priceHistory = history,
                                    isTrial = isTrial
                                )
                            )
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.testTag("form_save_button")
                    ) {
                        Text(AppStrings.t("action.save", lang))
                    }
                }
            }
        }
    }
}
