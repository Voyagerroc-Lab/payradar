package com.example.payradar.data.repository

import com.example.payradar.data.db.PaymentDao
import com.example.payradar.data.db.PaymentEntity
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class PaymentRepository(private val dao: PaymentDao) {

    private val json = Json { ignoreUnknownKeys = true }

    val allPayments: Flow<List<Payment>> = dao.getAllPayments().map { entities ->
        entities.map { entity ->
            val points = try {
                if (entity.priceHistoryJson.isNotBlank()) {
                    json.decodeFromString<List<PricePoint>>(entity.priceHistoryJson)
                } else emptyList()
            } catch (_: Exception) {
                emptyList()
            }
            entity.toDomain(points)
        }
    }

    suspend fun insertPayment(payment: Payment) = withContext(Dispatchers.IO) {
        val historyJson = json.encodeToString(payment.priceHistory)
        dao.insertPayment(PaymentEntity.fromDomain(payment, historyJson))
    }

    suspend fun insertPayments(payments: List<Payment>) = withContext(Dispatchers.IO) {
        val entities = payments.map { p ->
            val historyJson = json.encodeToString(p.priceHistory)
            PaymentEntity.fromDomain(p, historyJson)
        }
        dao.insertPayments(entities)
    }

    suspend fun deletePayment(id: String) = withContext(Dispatchers.IO) {
        dao.deletePaymentById(id)
    }

    suspend fun deleteAll() = withContext(Dispatchers.IO) {
        dao.deleteAllPayments()
    }
}
