package com.example.payradar.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.payradar.data.csv.CsvHelper
import com.example.payradar.data.csv.CsvImportResult
import com.example.payradar.data.repository.PaymentRepository
import com.example.payradar.data.repository.SettingsRepository
import com.example.payradar.i18n.AppStrings
import com.example.payradar.model.AppLanguage
import com.example.payradar.model.AppPrefs
import com.example.payradar.model.AppTheme
import com.example.payradar.model.CategoryId
import com.example.payradar.model.DemoData
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint
import com.example.payradar.model.VaultSettings
import com.example.payradar.ui.components.SortKey
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(
    private val paymentRepository: PaymentRepository,
    private val settingsRepository: SettingsRepository
) : ViewModel() {

    val prefs: StateFlow<AppPrefs> = settingsRepository.appPrefs
    val vaultSettings: StateFlow<VaultSettings> = settingsRepository.vaultSettings

    private val _isLocked = MutableStateFlow(prefs.value.lockEnabled)
    val isLocked: StateFlow<Boolean> = _isLocked.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow<CategoryId?>(null)
    val selectedCategory: StateFlow<CategoryId?> = _selectedCategory.asStateFlow()

    private val _sortKey = MutableStateFlow(SortKey.DATE)
    val sortKey: StateFlow<SortKey> = _sortKey.asStateFlow()

    private val _snackbarMessage = MutableSharedFlow<String>()
    val snackbarMessage: SharedFlow<String> = _snackbarMessage.asSharedFlow()

    private val rawPayments = paymentRepository.allPayments

    val filteredPayments: StateFlow<List<Payment>> = combine(
        rawPayments,
        _searchQuery,
        _selectedCategory,
        _sortKey
    ) { payments, query, category, sort ->
        var list = payments

        // Search query filter
        if (query.isNotBlank()) {
            val q = query.trim().lowercase()
            list = list.filter {
                it.name.lowercase().contains(q) || (it.notes?.lowercase()?.contains(q) == true)
            }
        }

        // Category filter
        if (category != null) {
            list = list.filter { it.categoryId == category }
        }

        // Sorting
        when (sort) {
            SortKey.DATE -> list.sortedBy { it.nextPaymentDate }
            SortKey.PRICE_DESC -> list.sortedByDescending { it.price }
            SortKey.NAME -> list.sortedBy { it.name.lowercase() }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPaymentsList: StateFlow<List<Payment>> = rawPayments.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    fun onSearchChange(query: String) {
        _searchQuery.value = query
    }

    fun onCategorySelect(category: CategoryId?) {
        _selectedCategory.value = category
    }

    fun onSortSelect(sort: SortKey) {
        _sortKey.value = sort
    }

    fun savePayment(payment: Payment) {
        viewModelScope.launch {
            paymentRepository.insertPayment(payment)
            _snackbarMessage.emit(AppStrings.t("toast.saved", prefs.value.language))
        }
    }

    fun deletePayment(id: String) {
        viewModelScope.launch {
            paymentRepository.deletePayment(id)
            _snackbarMessage.emit(AppStrings.t("toast.deleted", prefs.value.language))
        }
    }

    fun advancePayment(payment: Payment) {
        viewModelScope.launch {
            val nextDate = FormatUtils.nextOccurrence(payment.nextPaymentDate, payment.billingCycle)
            val updated = payment.copy(
                nextPaymentDate = nextDate,
                isTrial = false // If it was a trial, advancing date converts to normal active cycle
            )
            paymentRepository.insertPayment(updated)
            _snackbarMessage.emit(AppStrings.t("toast.saved", prefs.value.language))
        }
    }

    fun loadDemoData() {
        viewModelScope.launch {
            val demos = DemoData.buildDemoPayments()
            paymentRepository.insertPayments(demos)
            _snackbarMessage.emit(AppStrings.t("toast.demoLoaded", prefs.value.language))
        }
    }

    fun wipeAllData() {
        viewModelScope.launch {
            paymentRepository.deleteAll()
            settingsRepository.wipeAllData()
            _isLocked.value = false
            _snackbarMessage.emit("Tüm veriler temizlendi")
        }
    }

    fun unlock(pin: String): Boolean {
        val success = settingsRepository.verifyPin(pin)
        if (success) {
            _isLocked.value = false
        }
        return success
    }

    fun lock() {
        if (prefs.value.lockEnabled) {
            _isLocked.value = true
            viewModelScope.launch {
                _snackbarMessage.emit(AppStrings.t("toast.locked", prefs.value.language))
            }
        }
    }

    fun setPin(pin: String): Boolean {
        val success = settingsRepository.setPin(pin)
        if (success) {
            _isLocked.value = false
        }
        return success
    }

    fun changePin(oldPin: String, newPin: String): Boolean {
        return settingsRepository.changePin(oldPin, newPin)
    }

    fun disableLock(pin: String): Boolean {
        val success = settingsRepository.disableLock(pin)
        if (success) {
            _isLocked.value = false
        }
        return success
    }

    fun updateLanguage(lang: AppLanguage) {
        settingsRepository.updateLanguage(lang)
    }

    fun updateTheme(theme: AppTheme) {
        settingsRepository.updateTheme(theme)
    }

    fun updateAutoLock(minutes: Int) {
        settingsRepository.updateAutoLock(minutes)
    }

    fun updateVaultSettings(settings: VaultSettings) {
        settingsRepository.updateVaultSettings(settings)
    }

    fun exportCsv(): String {
        return CsvHelper.exportCsv(allPaymentsList.value)
    }

    fun importCsv(text: String) {
        viewModelScope.launch {
            val result = CsvHelper.parseCsv(text, allPaymentsList.value)
            if (result.payments.isNotEmpty()) {
                paymentRepository.insertPayments(result.payments)
            }
            val msg = AppStrings.t(
                "toast.importDone",
                prefs.value.language,
                mapOf("added" to result.payments.size, "skipped" to result.skipped)
            )
            _snackbarMessage.emit(msg)
        }
    }
}
