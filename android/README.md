# Aura: Offline AI Accountability Coach & Timetable Planner

A 100% offline, production-grade Android application built with **Kotlin**, **Jetpack Compose (Material 3)**, **Room SQLite**, **AlarmManager (RTC_WAKEUP)**, and **On-Device MediaPipe GenAI** (`tasks-genai:0.10.14`).

---

## Behavioral Loop Architecture

1. **Bedtime Planning (Local LLM Parsing)**:
   - User inputs freeform text or voice brain dump before bed.
   - On-device LLM (`model.bin` mapped via MediaPipe GenAI) parses the brain dump into a non-overlapping, chronologically ordered timetable with 10–15m buffers between deep focus blocks.
   - Zero network permissions; 100% privacy-preserving and works in airplane mode.

2. **Day Execution & Exact-Time Actionable Notifications**:
   - `AlarmScheduler` sets high-precision `AlarmManager.setExactAndAllowWhileIdle` alarms scheduled exactly for each task's `endTime`.
   - Fires `CheckInReceiver` even while the device is in Android Doze mode.
   - Posts a high-priority notification with interactive tray action buttons:
     - **"Done"**: Marks task as COMPLETED in Room DB, cancels remaining alarms for this block.
     - **"+30m"**: Triggers immediate **Domino Rescheduling**.

3. **Domino Rescheduling Engine**:
   - `TaskActionReceiver` catches "+30m" intent using `goAsync()` on `Dispatchers.IO`.
   - Extends the active task by 30 minutes.
   - Queries all downstream tasks for the day and automatically shifts their `startTime` and `endTime` by +30 minutes in a single SQLite transaction.
   - Cancels and re-registers all downstream alarms dynamically via `AlarmScheduler`.

4. **Evening Friction Diagnostic**:
   - At the end of the day, uncompleted tasks are tagged with friction reasons:
     - `LOW_ENERGY`: Afternoon cognitive slump or lack of physical recovery.
     - `DISTRACTION`: Context switches or digital interruptions.
     - `POOR_ESTIMATION`: Task scope exceeded allocated block.
     - `EMERGENCY`: Unplanned external obligations.
   - On-device AI synthesizes daily wins, friction patterns, and prescribes **1 concrete actionable tip** for tomorrow.

---

## Technical Specifications

| Component | Implementation | Notes |
|---|---|---|
| **Language** | Kotlin 1.9.22 | Coroutines, Flow, StateFlow |
| **UI** | Jetpack Compose + Material 3 | Dark-mode-first aesthetic |
| **Architecture** | Clean Architecture / MVVM | UI -> ViewModel -> Repository -> Room / MediaPipe |
| **Persistence** | Android Room 2.6.1 SQLite | TypeConverters for `java.time.LocalDate` & `LocalTime` |
| **Scheduling** | `AlarmManager.setExactAndAllowWhileIdle` | RTC_WAKEUP + WakeLock guarantees |
| **Local AI** | `com.google.mediapipe:tasks-genai:0.10.14` | Reads uncompressed `.bin` model via memory-mapping |
| **Build Optimization** | `aaptOptions { noCompress += listOf("bin", "task", "gguf") }` | Mandatory for memory-mapped weights |

---

## Running in Android Studio

1. Clone or open the `/android` directory in Android Studio (Iguana / Jellyfish / Koala).
2. Download an on-device model (e.g. Gemma-2B-IT or TinyLlama quantized for MediaPipe) and place it at:
   `app/src/main/assets/models/model.bin`
3. Sync Gradle and run on an Android 8.0+ (API 26+) physical device or emulator.
