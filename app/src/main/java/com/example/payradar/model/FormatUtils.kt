package com.example.payradar.model

import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

object FormatUtils {
    private val trLocale = Locale.forLanguageTag("tr-TR")
    private val enLocale = Locale.UK

    fun formatMoney(amount: Double, currency: Currency): String {
        val symbols = DecimalFormatSymbols(trLocale)
        val df = DecimalFormat("#,##0.00", symbols)
        return "${df.format(amount)} ${currency.symbol}"
    }

    fun monthlyAmount(price: Double, cycle: BillingCycle): Double {
        return when (cycle) {
            BillingCycle.WEEKLY -> (price * 52.0) / 12.0
            BillingCycle.QUARTERLY -> price / 3.0
            BillingCycle.YEARLY -> price / 12.0
            BillingCycle.MONTHLY -> price
        }
    }

    fun toTryPerMonth(payment: Payment, usdTry: Double, eurTry: Double): Double {
        var amt = monthlyAmount(payment.price, payment.billingCycle)
        when (payment.currency) {
            Currency.USD -> amt *= if (usdTry > 0) usdTry else 1.0
            Currency.EUR -> amt *= if (eurTry > 0) eurTry else 1.0
            Currency.TRY -> {}
        }
        return amt
    }

    fun parseAmount(raw: String): Double {
        val s = raw.trim()
        if (s.isEmpty()) return Double.NaN
        val hasComma = s.contains(",")
        val hasDot = s.contains(".")
        return try {
            if (hasComma && hasDot) {
                if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
                    s.replace(".", "").replace(",", ".").toDouble()
                } else {
                    s.replace(",", "").toDouble()
                }
            } else if (hasComma) {
                s.replace(",", ".").toDouble()
            } else {
                s.toDouble()
            }
        } catch (_: Exception) {
            Double.NaN
        }
    }

    fun todayISO(): String {
        return LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
    }

    fun daysUntil(isoDate: String): Long {
        return try {
            val target = LocalDate.parse(isoDate)
            val today = LocalDate.now()
            ChronoUnit.DAYS.between(today, target)
        } catch (_: Exception) {
            0
        }
    }

    fun formatDate(isoDate: String, lang: AppLanguage): String {
        return try {
            val date = LocalDate.parse(isoDate)
            val formatter = if (lang == AppLanguage.TR) {
                DateTimeFormatter.ofPattern("d MMMM yyyy", trLocale)
            } else {
                DateTimeFormatter.ofPattern("d MMMM yyyy", enLocale)
            }
            date.format(formatter)
        } catch (_: Exception) {
            isoDate
        }
    }

    fun nextOccurrence(isoDate: String, cycle: BillingCycle): String {
        return try {
            var date = LocalDate.parse(isoDate)
            val today = LocalDate.now()
            while (date.isBefore(today)) {
                date = when (cycle) {
                    BillingCycle.WEEKLY -> date.plusWeeks(1)
                    BillingCycle.MONTHLY -> date.plusMonths(1)
                    BillingCycle.QUARTERLY -> date.plusMonths(3)
                    BillingCycle.YEARLY -> date.plusYears(1)
                }
            }
            date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        } catch (_: Exception) {
            isoDate
        }
    }
}
