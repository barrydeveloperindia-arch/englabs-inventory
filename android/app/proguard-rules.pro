
# --------------------------
# STANDARD CAPACITOR RULES
# --------------------------
-keep public class * extends com.getcapacitor.Plugin
-keep public class com.getcapacitor.Plugin {
    public *;
}
-keep public class com.getcapacitor.MessageHandler {
    public void postMessage(java.lang.String);
}

# --------------------------
# THIRD PARTY LIBRARIES
# --------------------------
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# --------------------------
# SECURITY & OBFUSCATION
# --------------------------
# Remove debug info to harden against reverse engineering
-renamesourcefileattribute SourceFile
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Keep JS Bridge interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep our main activity if custom
-keep class com.englabscivil.inventory.MainActivity { *; }
