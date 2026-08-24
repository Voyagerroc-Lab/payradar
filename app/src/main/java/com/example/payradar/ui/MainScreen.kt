package com.example.payradar.ui

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.CancelGuide
import com.example.payradar.model.GuidesData
import com.example.payradar.model.Payment
import com.example.payradar.ui.components.ConfirmDialog
import com.example.payradar.ui.components.GuideDialog
import com.example.payradar.ui.components.LockScreenView
import com.example.payradar.ui.components.PayRadarHeader
import com.example.payradar.ui.components.PaymentCardItem
import com.example.payradar.ui.components.PaymentFormDialog
import com.example.payradar.ui.components.PriceChartDialog
import com.example.payradar.ui.components.SettingsDialog
import com.example.payradar.ui.components.SummaryCards
import com.example.payradar.ui.components.ToolbarView

@Composable
fun MainScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val prefs by viewModel.prefs.collectAsStateWithLifecycle()
    val vaultSettings by viewModel.vaultSettings.collectAsStateWithLifecycle()
    val isLocked by viewModel.isLocked.collectAsStateWithLifecycle()
    val filteredPayments by viewModel.filteredPayments.collectAsStateWithLifecycle()
    val allPayments by viewModel.allPaymentsList.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val selectedCategory by viewModel.selectedCategory.collectAsStateWithLifecycle()
    val sortKey by viewModel.sortKey.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }

    // Dialog state
    var showFormDialog by remember { mutableStateOf(false) }
    var editingPayment by remember { mutableStateOf<Payment?>(null) }
    var activeGuide by remember { mutableStateOf<CancelGuide?>(null) }
    var chartPayment by remember { mutableStateOf<Payment?>(null) }
    var showSettingsDialog by remember { mutableStateOf(false) }
    var paymentToDelete by remember { mutableStateOf<Payment?>(null) }
    var showWipeConfirm by remember { mutableStateOf(false) }

    val lang = prefs.language

    // Handle snackbars
    LaunchedEffect(Unit) {
        viewModel.snackbarMessage.collect { msg ->
            snackbarHostState.showSnackbar(msg)
        }
    }

    if (isLocked && prefs.lockEnabled) {
        LockScreenView(
            onUnlock = { pin -> viewModel.unlock(pin) },
            onForgotPin = { showWipeConfirm = true },
            lang = lang
        )

        if (showWipeConfirm) {
            ConfirmDialog(
                title = AppStrings.t("confirm.title", lang),
                message = AppStrings.t("lock.wipeConfirmText", lang),
                onConfirm = {
                    viewModel.wipeAllData()
                    showWipeConfirm = false
                },
                onDismiss = { showWipeConfirm = false },
                lang = lang,
                isDestructive = true
            )
        }
        return
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            PayRadarHeader(
                lang = lang,
                lockEnabled = prefs.lockEnabled,
                onLockClick = { viewModel.lock() },
                onSettingsClick = { showSettingsDialog = true }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingPayment = null
                    showFormDialog = true
                },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.testTag("fab_add_payment")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Payment")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 14.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Top Summary Cards
            item(key = "summary_cards") {
                SummaryCards(
                    payments = allPayments,
                    vaultSettings = vaultSettings,
                    lang = lang
                )
            }

            // Toolbar with Search, Sort, Filters
            item(key = "toolbar_view") {
                ToolbarView(
                    searchQuery = searchQuery,
                    onSearchChange = { viewModel.onSearchChange(it) },
                    selectedCategory = selectedCategory,
                    onCategorySelect = { viewModel.onCategorySelect(it) },
                    currentSort = sortKey,
                    onSortSelect = { viewModel.onSortSelect(it) },
                    onAddPaymentClick = {
                        editingPayment = null
                        showFormDialog = true
                    },
                    lang = lang
                )
            }

            // Empty state (Welcome)
            if (allPayments.isEmpty()) {
                item(key = "empty_state") {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "📡",
                                fontSize = 48.sp
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = AppStrings.t("empty.title", lang),
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 20.sp
                                ),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = AppStrings.t("empty.body", lang),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(20.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Button(
                                    onClick = {
                                        editingPayment = null
                                        showFormDialog = true
                                    },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.primary
                                    )
                                ) {
                                    Text(AppStrings.t("empty.addFirst", lang))
                                }
                                OutlinedButton(
                                    onClick = { viewModel.loadDemoData() },
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text(AppStrings.t("empty.tryDemo", lang))
                                }
                            }
                        }
                    }
                }
            } else if (filteredPayments.isEmpty()) {
                item(key = "no_search_results") {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 32.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Box(
                            modifier = Modifier.padding(24.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = AppStrings.t("list.noResults", lang),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                // Payment items
                items(
                    items = filteredPayments,
                    key = { it.id }
                ) { payment ->
                    PaymentCardItem(
                        payment = payment,
                        onEdit = {
                            editingPayment = payment
                            showFormDialog = true
                        },
                        onDelete = { paymentToDelete = payment },
                        onShowGuide = {
                            activeGuide = GuidesData.getGuideOrGeneric(payment.name, lang)
                        },
                        onShowHistory = { chartPayment = payment },
                        onAdvanceDate = { viewModel.advancePayment(payment) },
                        lang = lang
                    )
                }
            }
        }
    }

    // Dialogs
    if (showFormDialog) {
        PaymentFormDialog(
            initialPayment = editingPayment,
            onDismiss = { showFormDialog = false },
            onSave = { payment ->
                viewModel.savePayment(payment)
                showFormDialog = false
            },
            lang = lang
        )
    }

    if (activeGuide != null) {
        GuideDialog(
            guide = activeGuide!!,
            onDismiss = { activeGuide = null },
            lang = lang
        )
    }

    if (chartPayment != null) {
        PriceChartDialog(
            payment = chartPayment!!,
            onDismiss = { chartPayment = null },
            lang = lang
        )
    }

    if (showSettingsDialog) {
        SettingsDialog(
            prefs = prefs,
            vaultSettings = vaultSettings,
            onDismiss = { showSettingsDialog = false },
            onUpdateLanguage = { viewModel.updateLanguage(it) },
            onUpdateTheme = { viewModel.updateTheme(it) },
            onUpdateAutoLock = { viewModel.updateAutoLock(it) },
            onUpdateVaultSettings = { viewModel.updateVaultSettings(it) },
            onSetPin = { viewModel.setPin(it) },
            onChangePin = { old, new -> viewModel.changePin(old, new) },
            onDisableLock = { viewModel.disableLock(it) },
            onExportCsv = {
                val csv = viewModel.exportCsv()
                val sendIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, csv)
                    type = "text/csv"
                }
                context.startActivity(Intent.createChooser(sendIntent, "PayRadar CSV Export"))
            },
            onImportCsv = { text -> viewModel.importCsv(text) },
            onLoadDemoData = {
                viewModel.loadDemoData()
                showSettingsDialog = false
            },
            onWipeData = {
                viewModel.wipeAllData()
                showSettingsDialog = false
            },
            lang = lang
        )
    }

    if (paymentToDelete != null) {
        ConfirmDialog(
            title = AppStrings.t("confirm.title", lang),
            message = AppStrings.t("confirm.deletePayment", lang, mapOf("name" to paymentToDelete!!.name)),
            onConfirm = {
                viewModel.deletePayment(paymentToDelete!!.id)
                paymentToDelete = null
            },
            onDismiss = { paymentToDelete = null },
            lang = lang,
            isDestructive = true
        )
    }
}
