# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ── Capacitor bridge + plugins ──────────────────────────────────────────────
# 2026-09-04: minifyEnabled was turned on (see build.gradle history) with NO
# rules below this comment — every rule here was missing. R8's real
# optimization pass (not just the -dontoptimize no-op the app shipped with
# before) is free to rename/strip anything it can't prove is reachable from
# a static call graph. Capacitor's bridge finds plugin classes and their
# @PluginMethod-annotated methods via REFLECTION at runtime (matching them to
# JS-side calls by string name), so R8 has no static evidence any of it is
# used — and stripped/renamed it. Every capability that goes through the
# native bridge broke: file picking returned a name, but the actual byte
# read-back ("source image could not be decoded") failed, because the
# Filesystem plugin method that JS calls to fetch those bytes was gone.
#
# This shipped to Play Store production (versionCode 1) before anyone
# actually ran the RELEASE (minified) build end-to-end — only the debug
# build was tested, which never exercises R8 at all. Fixed by keeping every
# Capacitor/plugin class and its externally-called (reflection-invoked)
# members, which is the standard, documented rule set for Capacitor + R8.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * extends com.getcapacitor.Plugin
-keepclassmembers,allowobfuscation class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.annotation.ActivityCallback <methods>;
    @com.getcapacitor.PluginMethod public <methods>;
}
-keep class * extends com.getcapacitor.plugin.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }

# Every installed Capacitor/Cordova plugin package (filesystem, camera, share,
# preferences, status bar, splash screen, ML Kit barcode scanning, app) — the
# bridge resolves these by class name at runtime, so they need the same
# "don't touch it" treatment as the bridge itself.
-keep class com.capacitorjs.plugins.** { *; }
-keep class com.getcapacitor.community.** { *; }
-keep class io.ionic.** { *; }

# Google ML Kit's barcode scanner is loaded dynamically via Play Services;
# obfuscating it breaks the same way.
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }

# WebView <-> JS bridge interface methods, the standard Android rule for any
# app whose JS calls into native via @JavascriptInterface.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile
