package com.example.payradar

import android.app.Application
import com.example.payradar.data.db.AppDatabase
import com.example.payradar.data.repository.PaymentRepository
import com.example.payradar.data.repository.SettingsRepository

class PayRadarApplication : Application() {
    val database: AppDatabase by lazy { AppDatabase.getInstance(this) }
    val paymentRepository: PaymentRepository by lazy { PaymentRepository(database.paymentDao()) }
    val settingsRepository: SettingsRepository by lazy { SettingsRepository(this) }
}
