# IMPERIAL AI ProGuard Rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.annotation.Keep <fields>;
    @androidx.annotation.Keep <methods>;
}
