package com.aura.coach

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.aura.coach.ai.MediaPipeAIEngine
import com.aura.coach.alarm.CheckInReceiver
import com.aura.coach.data.local.AppDatabase
import com.aura.coach.data.repository.TaskRepository
import com.aura.coach.data.repository.TaskRepositoryImpl
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class AccountabilityApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var repository: TaskRepository
        private set

    lateinit var aiEngine: MediaPipeAIEngine
        private set

    private val applicationScope = CoroutineScope(Dispatchers.Default + SupervisorJob())

    override fun onCreate() {
        super.onCreate()

        // Initialize Room Database
        database = AppDatabase.getInstance(this)

        // Initialize On-Device MediaPipe GenAI engine
        aiEngine = MediaPipeAIEngine(this)

        // Initialize Repository
        repository = TaskRepositoryImpl(
            context = this,
            taskDao = database.taskDao(),
            aiEngine = aiEngine
        )

        // Pre-warm local AI engine in background
        applicationScope.launch {
            aiEngine.initialize()
        }

        // Register system notification channel early
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CheckInReceiver.CHANNEL_ID,
                CheckInReceiver.CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Urgent task completion accountability check-ins with Done & +30m domino action buttons"
                enableVibration(true)
                setShowBadge(true)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
        }
    }
}
