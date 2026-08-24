package com.example.payradar.ui.components

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.AppPrefs
import com.example.payradar.model.AppTheme
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.VaultSettings
import com.example.payradar.ui.theme.Danger
import com.example.payradar.ui.theme.DangerSoft
import com.example.payradar.ui.theme.IndigoPrimary
import com.example.payradar.ui.theme.Success

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsDialog(
    prefs: AppPrefs,
    vaultSettings: VaultSettings,
    onDismiss: () -> Unit,
    onUpdateLanguage: (AppLanguage) -> Unit,
    onUpdateTheme: (AppTheme) -> Unit,
    onUpdateAutoLock: (Int) -> Unit,
    onUpdateVaultSettings: (VaultSettings) -> Unit,
    onSetPin: (String) -> Boolean,
    onChangePin: (String, String) -> Boolean,
    onDisableLock: (String) -> Boolean,
    onExportCsv: () -> Unit,
    onImportCsv: (String) -> Unit,
    onLoadDemoData: () -> Unit,
    onWipeData: () -> Unit,
    lang: AppLanguage
) {
    val context = LocalContext.current

    var selectedLang by remember { mutableStateOf(prefs.language) }
    var selectedTheme by remember { mutableStateOf(prefs.theme) }
    var reminderDays by remember { mutableStateOf(vaultSettings.reminderDays) }
    var notificationsEnabled by remember { mutableStateOf(vaultSettings.notificationsEnabled) }
    var usdRateText by remember { mutableStateOf(vaultSettings.usdTry.toString()) }
    var eurRateText by remember { mutableStateOf(vaultSettings.eurTry.toString()) }

    var newPin by remember { mutableStateOf("") }
    var confirmPin by remember { mutableStateOf("") }
    var currentPin by remember { mutableStateOf("") }
    var securityError by remember { mutableStateOf("") }
    var securitySuccess by remember { mutableStateOf("") }

    var langExpanded by remember { mutableStateOf(false) }
    var themeExpanded by remember { mutableStateOf(false) }
    var reminderExpanded by remember { mutableStateOf(false) }
    var autoLockExpanded by remember { mutableStateOf(false) }

    // File picker for CSV import
    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            try {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    val content = stream.bufferedReader().readText()
                    onImportCsv(content)
                }
            } catch (_: Exception) {}
        }
    }

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
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = AppStrings.t("settings.title", lang),
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 19.sp
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Language
                Text(
                    text = AppStrings.t("settings.language", lang),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                ExposedDropdownMenuBox(
                    expanded = langExpanded,
                    onExpandedChange = { langExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = selectedLang.displayName,
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = langExpanded) },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                            .testTag("settings_lang_select")
                    )
                    ExposedDropdownMenu(
                        expanded = langExpanded,
                        onDismissRequest = { langExpanded = false }
                    ) {
                        AppLanguage.entries.forEach { l ->
                            DropdownMenuItem(
                                text = { Text(l.displayName) },
                                onClick = {
                                    selectedLang = l
                                    onUpdateLanguage(l)
                                    langExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Theme
                Text(
                    text = AppStrings.t("settings.theme", lang),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                ExposedDropdownMenuBox(
                    expanded = themeExpanded,
                    onExpandedChange = { themeExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = AppStrings.t("theme.${selectedTheme.code}", lang),
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = themeExpanded) },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                            .testTag("settings_theme_select")
                    )
                    ExposedDropdownMenu(
                        expanded = themeExpanded,
                        onDismissRequest = { themeExpanded = false }
                    ) {
                        AppTheme.entries.forEach { th ->
                            DropdownMenuItem(
                                text = { Text(AppStrings.t("theme.${th.code}", lang)) },
                                onClick = {
                                    selectedTheme = th
                                    onUpdateTheme(th)
                                    themeExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Reminder Days
                Text(
                    text = AppStrings.t("settings.reminderQuestion", lang),
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                ExposedDropdownMenuBox(
                    expanded = reminderExpanded,
                    onExpandedChange = { reminderExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = AppStrings.t("settings.daysBefore", lang, mapOf("n" to reminderDays)),
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = reminderExpanded) },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                            .testTag("settings_reminder_select")
                    )
                    ExposedDropdownMenu(
                        expanded = reminderExpanded,
                        onDismissRequest = { reminderExpanded = false }
                    ) {
                        listOf(1, 2, 3, 5, 7).forEach { days ->
                            DropdownMenuItem(
                                text = { Text(AppStrings.t("settings.daysBefore", lang, mapOf("n" to days))) },
                                onClick = {
                                    reminderDays = days
                                    onUpdateVaultSettings(vaultSettings.copy(reminderDays = days))
                                    reminderExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Notifications switch
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = AppStrings.t("settings.notifications", lang),
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Switch(
                        checked = notificationsEnabled,
                        onCheckedChange = {
                            notificationsEnabled = it
                            onUpdateVaultSettings(vaultSettings.copy(notificationsEnabled = it))
                        },
                        modifier = Modifier.testTag("settings_notifications_switch")
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Exchange rates
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = usdRateText,
                        onValueChange = {
                            usdRateText = it
                            val parsed = FormatUtils.parseAmount(it)
                            if (!parsed.isNaN() && parsed > 0) {
                                onUpdateVaultSettings(vaultSettings.copy(usdTry = parsed))
                            }
                        },
                        label = { Text(AppStrings.t("settings.usdRate", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = eurRateText,
                        onValueChange = {
                            eurRateText = it
                            val parsed = FormatUtils.parseAmount(it)
                            if (!parsed.isNaN() && parsed > 0) {
                                onUpdateVaultSettings(vaultSettings.copy(eurTry = parsed))
                            }
                        },
                        label = { Text(AppStrings.t("settings.eurRate", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    )
                }
                Text(
                    text = AppStrings.t("settings.ratesHint", lang),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))

                // Security Section
                Text(
                    text = AppStrings.t("security.title", lang),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))

                if (!prefs.lockEnabled) {
                    Text(
                        text = AppStrings.t("security.offHint", lang),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = newPin,
                        onValueChange = { if (it.length <= 8 && it.all { ch -> ch.isDigit() }) newPin = it },
                        label = { Text(AppStrings.t("security.newPin", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = confirmPin,
                        onValueChange = { if (it.length <= 8 && it.all { ch -> ch.isDigit() }) confirmPin = it },
                        label = { Text(AppStrings.t("security.confirmPin", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (newPin.length in 4..8 && newPin == confirmPin) {
                                if (onSetPin(newPin)) {
                                    newPin = ""
                                    confirmPin = ""
                                    securityError = ""
                                    securitySuccess = AppStrings.t("toast.lockEnabled", lang)
                                } else {
                                    securityError = AppStrings.t("security.error.mismatch", lang)
                                }
                            } else {
                                securityError = AppStrings.t("security.error.mismatch", lang)
                            }
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(AppStrings.t("security.enableTitle", lang))
                    }
                } else {
                    Text(
                        text = AppStrings.t("security.activeHint", lang),
                        style = MaterialTheme.typography.bodySmall,
                        color = Success
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Auto-lock selector
                    Text(
                        text = AppStrings.t("security.autoLock", lang),
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    ExposedDropdownMenuBox(
                        expanded = autoLockExpanded,
                        onExpandedChange = { autoLockExpanded = it },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        val currentLabel = if (prefs.autoLockMinutes == 0) {
                            AppStrings.t("autolock.never", lang)
                        } else {
                            AppStrings.t("autolock.minutes", lang, mapOf("n" to prefs.autoLockMinutes))
                        }
                        OutlinedTextField(
                            value = currentLabel,
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = autoLockExpanded) },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = autoLockExpanded,
                            onDismissRequest = { autoLockExpanded = false }
                        ) {
                            listOf(0, 1, 3, 5, 10).forEach { mins ->
                                val label = if (mins == 0) {
                                    AppStrings.t("autolock.never", lang)
                                } else {
                                    AppStrings.t("autolock.minutes", lang, mapOf("n" to mins))
                                }
                                DropdownMenuItem(
                                    text = { Text(label) },
                                    onClick = {
                                        onUpdateAutoLock(mins)
                                        autoLockExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = currentPin,
                        onValueChange = { currentPin = it },
                        label = { Text(AppStrings.t("security.currentPin", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newPin,
                        onValueChange = { if (it.length <= 8 && it.all { ch -> ch.isDigit() }) newPin = it },
                        label = { Text(AppStrings.t("security.newPin", lang)) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                if (newPin.length in 4..8 && onChangePin(currentPin, newPin)) {
                                    currentPin = ""
                                    newPin = ""
                                    securityError = ""
                                    securitySuccess = AppStrings.t("toast.pinChanged", lang)
                                } else {
                                    securityError = AppStrings.t("security.error.wrongPin", lang)
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(AppStrings.t("security.changePinBtn", lang), fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = {
                                if (onDisableLock(currentPin)) {
                                    currentPin = ""
                                    securityError = ""
                                    securitySuccess = AppStrings.t("toast.lockDisabled", lang)
                                } else {
                                    securityError = AppStrings.t("security.error.wrongPin", lang)
                                }
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Danger
                            ),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(AppStrings.t("security.disableBtn", lang), fontSize = 12.sp)
                        }
                    }
                }

                if (securityError.isNotEmpty()) {
                    Text(
                        text = securityError,
                        style = MaterialTheme.typography.bodySmall,
                        color = Danger,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                if (securitySuccess.isNotEmpty()) {
                    Text(
                        text = securitySuccess,
                        style = MaterialTheme.typography.bodySmall,
                        color = Success,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider()
                Spacer(modifier = Modifier.height(16.dp))

                // Data Backup
                Text(
                    text = AppStrings.t("data.title", lang),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = AppStrings.t("data.importHint", lang),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onExportCsv,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("settings_export_csv")
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(AppStrings.t("data.exportBtn", lang), fontSize = 12.sp)
                    }

                    OutlinedButton(
                        onClick = { filePicker.launch("text/*") },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .testTag("settings_import_csv")
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(AppStrings.t("data.importBtn", lang), fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = onLoadDemoData,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(AppStrings.t("empty.tryDemo", lang), fontSize = 13.sp)
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Footer
                Text(
                    text = AppStrings.t("footer.free", lang),
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = AppStrings.t("footer.openSource", lang),
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 10.5.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}
