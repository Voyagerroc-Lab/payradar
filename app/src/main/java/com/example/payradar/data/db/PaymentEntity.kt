package com.example.payradar.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.payradar.model.BillingCycle
import com.example.payradar.model.CategoryId
import com.example.payradar.model.Currency
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint

@Entity(tableName = "payments")
data class PaymentEntity(
    @PrimaryKey val id: String,
    val name: String,
    val price: Double,
    val currency: String,
    val billingCycle: String,
    val nextPaymentDate: String,
    val categoryId: String,
    val notes: String?,
    val createdAt: Long,
    val priceHistoryJson: String,
    val isTrial: Boolean,
    val bankName: String? = null,
    val totalInstallments: Int? = null,
    val currentInstallment: Int? = null,
    val checkNumber: String? = null,
    val payee: String? = null
) {
    fun toDomain(priceHistory: List<PricePoint>): Payment {
        return Payment(
            id = id,
            name = name,
            price = price,
            currency = Currency.fromCode(currency),
            billingCycle = BillingCycle.fromCode(billingCycle),
            nextPaymentDate = nextPaymentDate,
            categoryId = CategoryId.fromId(categoryId),
            notes = notes,
            createdAt = createdAt,
            priceHistory = priceHistory,
            isTrial = isTrial,
            bankName = bankName,
            totalInstallments = totalInstallments,
            currentInstallment = currentInstallment,
            checkNumber = checkNumber,
            payee = payee
        )
    }

    companion object {
        fun fromDomain(payment: Payment, priceHistoryJson: String): PaymentEntity {
            return PaymentEntity(
                id = payment.id,
                name = payment.name,
                price = payment.price,
                currency = payment.currency.code,
                billingCycle = payment.billingCycle.code,
                nextPaymentDate = payment.nextPaymentDate,
                categoryId = payment.categoryId.id,
                notes = payment.notes,
                createdAt = payment.createdAt,
                priceHistoryJson = priceHistoryJson,
                isTrial = payment.isTrial,
                bankName = payment.bankName,
                totalInstallments = payment.totalInstallments,
                currentInstallment = payment.currentInstallment,
                checkNumber = payment.checkNumber,
                payee = payment.payee
            )
        }
    }
}
