package com.example.payradar.data.csv

import com.example.payradar.model.BillingCycle
import com.example.payradar.model.CategoryId
import com.example.payradar.model.Currency
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import com.example.payradar.model.PricePoint
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

data class CsvImportResult(
    val payments: List<Payment>,
    val skipped: Int
)

object CsvHelper {
    private const val HEADER = "name,price,currency,billingCycle,nextPaymentDate,categoryId,notes,priceHistory"
    private val json = Json { ignoreUnknownKeys = true }

    fun exportCsv(payments: List<Payment>): String {
        val rows = payments.map { p ->
            val historyStr = if (p.priceHistory.isNotEmpty()) {
                json.encodeToString(p.priceHistory)
            } else ""
            listOf(
                csvEscape(p.name),
                csvEscape(p.price.toString()),
                csvEscape(p.currency.code),
                csvEscape(p.billingCycle.code),
                csvEscape(p.nextPaymentDate),
                csvEscape(p.categoryId.id),
                csvEscape(p.notes ?: ""),
                csvEscape(historyStr)
            ).joinToString(",")
        }
        return "\uFEFF" + (listOf(HEADER) + rows).joinToString("\r\n")
    }

    fun parseCsv(text: String, existingPayments: List<Payment>): CsvImportResult {
        val cleanText = text.removePrefix("\uFEFF")
        val lines = splitCsvLines(cleanText)
        val imported = mutableListOf<Payment>()
        var skipped = 0

        for (line in lines) {
            val trimmed = line.trim()
            if (trimmed.isEmpty() || trimmed.startsWith("name,")) continue

            val fields = parseCsvLine(trimmed)
            if (fields.size < 6) {
                if (fields.any { it.isNotBlank() }) skipped++
                continue
            }

            val payment = toPayment(fields)
            if (payment == null) {
                skipped++
                continue
            }

            // Check if duplicate exists (same name, same date, same amount)
            val isDuplicate = existingPayments.any {
                it.name.equals(payment.name, ignoreCase = true) &&
                it.nextPaymentDate == payment.nextPaymentDate &&
                it.price == payment.price
            } || imported.any {
                it.name.equals(payment.name, ignoreCase = true) &&
                it.nextPaymentDate == payment.nextPaymentDate &&
                it.price == payment.price
            }

            if (isDuplicate) {
                skipped++
            } else {
                imported.add(payment)
            }
        }

        return CsvImportResult(imported, skipped)
    }

    private fun splitCsvLines(text: String): List<String> {
        val out = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        var i = 0

        while (i < text.length) {
            val ch = text[i]
            if (ch == '"') {
                inQuotes = !inQuotes
                current.append(ch)
            } else if ((ch == '\n' || ch == '\r') && !inQuotes) {
                if (ch == '\r' && i + 1 < text.length && text[i + 1] == '\n') {
                    i++
                }
                out.add(current.toString())
                current = StringBuilder()
            } else {
                current.append(ch)
            }
            i++
        }
        if (current.isNotEmpty()) {
            out.add(current.toString())
        }
        return out
    }

    private fun parseCsvLine(line: String): List<String> {
        val fields = mutableListOf<String>()
        var current = StringBuilder()
        var inQuotes = false
        var i = 0

        while (i < line.length) {
            val ch = line[i]
            if (inQuotes) {
                if (ch == '"' && i + 1 < line.length && line[i + 1] == '"') {
                    current.append('"')
                    i++
                } else if (ch == '"') {
                    inQuotes = false
                } else {
                    current.append(ch)
                }
            } else if (ch == '"') {
                inQuotes = true
            } else if (ch == ',') {
                fields.add(current.toString().trim())
                current = StringBuilder()
            } else {
                current.append(ch)
            }
            i++
        }
        fields.add(current.toString().trim())
        return fields
    }

    private fun toPayment(fields: List<String>): Payment? {
        try {
            val rawName = fields.getOrNull(0) ?: return null
            val rawPrice = fields.getOrNull(1) ?: return null
            val rawCurrency = fields.getOrNull(2) ?: "TRY"
            val rawCycle = fields.getOrNull(3) ?: "monthly"
            val rawDate = fields.getOrNull(4) ?: return null
            val rawCategory = fields.getOrNull(5) ?: "abonelik"
            val rawNotes = fields.getOrNull(6)
            val rawHistory = fields.getOrNull(7)

            val price = FormatUtils.parseAmount(rawPrice)
            if (rawName.isBlank() || price.isNaN() || price <= 0) return null

            val parsedDate = normalizeDate(rawDate) ?: return null

            val history = try {
                if (!rawHistory.isNullOrBlank()) {
                    json.decodeFromString<List<PricePoint>>(rawHistory)
                } else emptyList()
            } catch (_: Exception) {
                emptyList()
            }

            return Payment(
                id = UUID.randomUUID().toString(),
                name = rawName,
                price = price,
                currency = Currency.fromCode(rawCurrency),
                billingCycle = BillingCycle.fromCode(rawCycle),
                nextPaymentDate = parsedDate,
                categoryId = CategoryId.fromId(rawCategory),
                notes = if (rawNotes.isNullOrBlank()) null else rawNotes,
                createdAt = System.currentTimeMillis(),
                priceHistory = history
            )
        } catch (_: Exception) {
            return null
        }
    }

    private fun normalizeDate(input: String): String? {
        val s = input.trim()
        if (Regex("^\\d{4}-\\d{2}-\\d{2}$").matches(s)) return s
        val ddmmyyyy = Regex("^(\\d{1,2})[./-](\\d{1,2})[./-](\\d{4})$").find(s)
        if (ddmmyyyy != null) {
            val (d, m, y) = ddmmyyyy.destructured
            return "$y-${m.padStart(2, '0')}-${d.padStart(2, '0')}"
        }
        return null
    }

    private fun csvEscape(value: String): String {
        return if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            "\"${value.replace("\"", "\"\"")}\""
        } else {
            value
        }
    }
}
