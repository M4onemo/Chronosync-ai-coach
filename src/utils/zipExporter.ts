import JSZip from 'jszip';
import { ANDROID_FILES } from '../data/androidFiles';

export async function exportAndroidProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Root build files
  zip.file(
    'build.gradle.kts',
    `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.ksp) apply false
}
`
  );

  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AuraAccountabilityCoach"
include(":app")
`
  );

  zip.file(
    'gradle/libs.versions.toml',
    `[versions]
agp = "8.2.2"
kotlin = "1.9.22"
ksp = "1.9.22-1.0.17"

[libraries]

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
`
  );

  zip.file(
    'app/proguard-rules.pro',
    `# Keep Room schema and database classes
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Keep MediaPipe GenAI LLM classes and native JNI bindings
-keep class com.google.mediapipe.tasks.genai.** { *; }
-keep class com.google.mediapipe.framework.** { *; }

# Keep data entities for JSON deserialization
-keep class com.aura.coach.data.local.entity.** { *; }
`
  );

  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">Aura Accountability Coach</string>
</resources>
`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.AuraCoach" parent="android:Theme.Material.NoActionBar">
        <item name="android:statusBarColor">#0C0E14</item>
        <item name="android:navigationBarColor">#0C0E14</item>
    </style>
</resources>
`
  );

  // Add all files from ANDROID_FILES registry
  for (const file of ANDROID_FILES) {
    zip.file(file.path, file.code);
  }

  // Add README
  zip.file(
    'README.md',
    `# Aura: Offline AI Accountability Coach & Timetable Planner

Production-grade Android application built with Kotlin, Jetpack Compose, Room SQLite, AlarmManager, and on-device MediaPipe GenAI.

## Quick Start
1. Open this directory in Android Studio (Iguana / Jellyfish / Hedgehog).
2. Place your Gemma-2B / TinyLlama quantized model at:
   \`app/src/main/assets/models/model.bin\`
3. Run on device with minSdk 26+ (Android 8.0+).
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
