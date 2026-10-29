# Keep Room schema and database classes
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Keep MediaPipe GenAI LLM classes and native JNI bindings
-keep class com.google.mediapipe.tasks.genai.** { *; }
-keep class com.google.mediapipe.framework.** { *; }

# Keep data entities for JSON deserialization
-keep class com.aura.coach.data.local.entity.** { *; }
