package com.example.payradar.model

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

object DemoData {
    private data class DemoPaymentInput(
        val name: String,
        val price: Double,
        val currency: Currency = Currency.TRY,
        val billingCycle: BillingCycle = BillingCycle.MONTHLY,
        val daysFromNow: Long,
        val categoryId: CategoryId,
        val isTrial: Boolean = false
    )

    fun buildDemoPayments(): List<Payment> {
        val inputs = listOf(
            DemoPaymentInput(name = "Ev Kirası", price = 18500.0, daysFromNow = 9, categoryId = CategoryId.KONUT),
            DemoPaymentInput(name = "Araç Kirası", price = 24000.0, daysFromNow = 14, categoryId = CategoryId.ULASIM),
            DemoPaymentInput(name = "Elektrik Faturası", price = 850.0, daysFromNow = 3, categoryId = CategoryId.FATURALAR),
            DemoPaymentInput(name = "İnternet (Türk Telekom)", price = 649.0, daysFromNow = 7, categoryId = CategoryId.FATURALAR),
            DemoPaymentInput(name = "Netflix", price = 149.99, daysFromNow = 2, categoryId = CategoryId.ABONELIK),
            DemoPaymentInput(name = "Spotify Premium", price = 59.99, daysFromNow = 5, categoryId = CategoryId.ABONELIK),
            DemoPaymentInput(name = "Xbox Game Pass Ultimate", price = 249.0, daysFromNow = 20, categoryId = CategoryId.OYUN),
            DemoPaymentInput(name = "iCloud+ 200GB", price = 29.99, daysFromNow = 8, categoryId = CategoryId.DIGER),
            DemoPaymentInput(name = "ChatGPT Plus", price = 20.0, currency = Currency.USD, daysFromNow = 15, categoryId = CategoryId.ABONELIK),
            DemoPaymentInput(name = "DASK Sigortası", price = 1240.0, billingCycle = BillingCycle.YEARLY, daysFromNow = 45, categoryId = CategoryId.SIGORTA),
            DemoPaymentInput(name = "Canva Pro", price = 449.99, daysFromNow = 4, categoryId = CategoryId.DIGER, isTrial = true)
        )

        val now = System.currentTimeMillis()
        val today = LocalDate.now()
        val dtf = DateTimeFormatter.ISO_LOCAL_DATE

        return inputs.mapIndexed { index, input ->
            val paymentDate = today.plusDays(input.daysFromNow).format(dtf)
            Payment(
                id = "demo-$now-$index",
                name = input.name,
                price = input.price,
                currency = input.currency,
                billingCycle = input.billingCycle,
                nextPaymentDate = paymentDate,
                categoryId = input.categoryId,
                createdAt = now + index,
                isTrial = input.isTrial,
                priceHistory = if (input.name == "Netflix") {
                    listOf(
                        PricePoint(date = "2024-01-15", price = 99.99),
                        PricePoint(date = "2025-02-01", price = 129.99)
                    )
                } else {
                    emptyList()
                }
            )
        }
    }
}
