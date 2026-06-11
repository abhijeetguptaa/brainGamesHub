# Capacitor ProGuard rules
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.community.** { *; }

# WebView and JS Interface
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve line numbers for better crash reports in Vitals (optional, but recommended)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Optimize more aggressively
-optimizationpasses 5
-allowaccessmodification

# AdMob / Google Play Services
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.**

# Facebook
-keep class com.facebook.** { *; }

# Handle Kotlin
-dontwarn kotlin.**
-dontwarn org.jetbrains.annotations.**

# Handle AndroidX
-dontwarn androidx.**
