package com.example.payradar.notification

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.example.payradar.MainActivity
import com.example.payradar.R
import com.example.payradar.data.db.AppDatabase
import com.example.payradar.data.repository.PaymentRepository
import com.example.payradar.model.CategoryId
import com.example.payradar.model.FormatUtils
import com.example.payradar.model.Payment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Calendar

object PayRadarNotificationManager {
    const val CHANNEL_ID = "payradar_payment_alerts"
    private const val TAG = "PayRadarNotify"
    private const val DAILY_ALARM_REQUEST_CODE = 9001

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Ödeme & Vade Hatırlatıcıları"
            val descriptionText = "Kredi taksitleri, çek vadeleri ve abonelik ödeme günleri bildirimleri"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableLights(true)
                enableVibration(true)
                setShowBadge(true)
            }
            val notificationManager: NotificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun scheduleDailyAlarm(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, DailyPaymentReceiver::class.java).apply {
            action = "com.example.payradar.CHECK_PAYMENTS"
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            DAILY_ALARM_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val calendar = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.HOUR_OF_DAY, 9)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            if (timeInMillis <= System.currentTimeMillis()) {
                add(Calendar.DAY_OF_YEAR, 1)
            }
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setRepeating(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    AlarmManager.INTERVAL_DAY,
                    pendingIntent
                )
            }
            Log.d(TAG, "Daily payment alarm scheduled for: ${calendar.time}")
        } catch (e: SecurityException) {
            Log.w(TAG, "Cannot schedule exact alarm without permission, falling back to set(): ${e.message}")
            alarmManager.set(
                AlarmManager.RTC_WAKEUP,
                calendar.timeInMillis,
                pendingIntent
            )
        }
    }

    fun checkAndSendPaymentNotifications(context: Context) {
        val db = AppDatabase.getInstance(context)
        val repository = PaymentRepository(db.paymentDao())

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val payments = repository.allPayments.first()
                val today = LocalDate.now()
                val dtf = DateTimeFormatter.ISO_LOCAL_DATE

                val urgentPayments = mutableListOf<Pair<Payment, Long>>()

                for (payment in payments) {
                    try {
                        val dueDate = LocalDate.parse(payment.nextPaymentDate, dtf)
                        val daysRemaining = ChronoUnit.DAYS.between(today, dueDate)
                        // Alert if overdue or due in 0..3 days
                        if (daysRemaining in -2..3) {
                            urgentPayments.add(payment to daysRemaining)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error parsing payment date for ${payment.name}: ${e.message}")
                    }
                }

                if (urgentPayments.isNotEmpty()) {
                    sendUrgentPaymentsNotification(context, urgentPayments)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error checking payments: ${e.message}", e)
            }
        }
    }

    private fun sendUrgentPaymentsNotification(
        context: Context,
        urgentList: List<Pair<Payment, Long>>
    ) {
        val appIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            appIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notificationManager = NotificationManagerCompat.from(context)

        // If single payment
        if (urgentList.size == 1) {
            val (payment, days) = urgentList.first()
            val timeText = when {
                days < 0 -> "${-days} gün gecikti!"
                days == 0L -> "Bugün son ödeme günü!"
                days == 1L -> "Yarın ödenmesi gerekiyor"
                else -> "$days gün kaldı"
            }

            val iconPrefix = when (payment.categoryId) {
                CategoryId.KREDI -> "🏦 Kredi: "
                CategoryId.CEK_SENET -> "📜 Çek/Senet: "
                CategoryId.FATURALAR -> "🧾 Fatura: "
                else -> "💳 Ödeme: "
            }

            val subDetails = when {
                payment.categoryId == CategoryId.KREDI && payment.bankName != null ->
                    " (${payment.bankName} - ${payment.currentInstallment ?: 1}/${payment.totalInstallments ?: 1}. Taksit)"
                payment.categoryId == CategoryId.CEK_SENET && payment.checkNumber != null ->
                    " (No: ${payment.checkNumber})"
                else -> ""
            }

            val title = "$iconPrefix${payment.name}$subDetails"
            val content = "$timeText • Tutar: ${FormatUtils.formatMoney(payment.price, payment.currency)}"

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(content)
                .setStyle(NotificationCompat.BigTextStyle().bigText("$content\n\nÖdeme gününü kaçırmamak ve ek faiz veya gecikme yaşamamak için PayRadar'ı kontrol edin."))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            try {
                notificationManager.notify(payment.id.hashCode(), notification)
            } catch (e: SecurityException) {
                Log.w(TAG, "Notification permission missing: ${e.message}")
            }
        } else {
            // Grouped notification
            val totalAmountTRY = urgentList.sumOf { (payment, _) ->
                when (payment.currency) {
                    com.example.payradar.model.Currency.TRY -> payment.price
                    com.example.payradar.model.Currency.USD -> payment.price * 42.0
                    com.example.payradar.model.Currency.EUR -> payment.price * 48.0
                }
            }

            val inboxStyle = NotificationCompat.InboxStyle()
                .setBigContentTitle("🔔 ${urgentList.size} Yaklaşan / Geciken Ödeme")
                .setSummaryText("Toplam: ₺${String.format(java.util.Locale.US, "%,.2f", totalAmountTRY)}")

            urgentList.take(5).forEach { (payment, days) ->
                val dayStr = when {
                    days < 0 -> "⚠️ ${-days}g gecikti"
                    days == 0L -> "🔴 Bugün"
                    days == 1L -> "🟡 Yarın"
                    else -> "⏳ ${days}g kaldı"
                }
                val extra = if (payment.categoryId == CategoryId.KREDI) " (Banka Kredisi)" else if (payment.categoryId == CategoryId.CEK_SENET) " (Çek)" else ""
                inboxStyle.addLine("$dayStr: ${payment.name}$extra - ${FormatUtils.formatMoney(payment.price, payment.currency)}")
            }

            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("🔔 ${urgentList.size} Ödemeniz Yaklaşıyor!")
                .setContentText("Kredi, çek ve fatura ödemelerinizi zamanında yapmak için tıklayın.")
                .setStyle(inboxStyle)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            try {
                notificationManager.notify(1001, notification)
            } catch (e: SecurityException) {
                Log.w(TAG, "Notification permission missing: ${e.message}")
            }
        }
    }
}

class DailyPaymentReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        Log.d("DailyPaymentReceiver", "Alarm received, running payment checks")
        PayRadarNotificationManager.checkAndSendPaymentNotifications(context)
        // Reschedule for next day if needed
        PayRadarNotificationManager.scheduleDailyAlarm(context)
    }
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootReceiver", "Boot completed, rescheduling PayRadar alarms")
            PayRadarNotificationManager.scheduleDailyAlarm(context)
            PayRadarNotificationManager.checkAndSendPaymentNotifications(context)
        }
    }
}
