package expo.modules.appblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {

    private val prefs: SharedPreferences
        get() = appContext.reactContext!!
            .getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)

    override fun definition() = ModuleDefinition {

        Name("AppBlocker")

        // ── Permission checks ────────────────────────────────────────────────

        Function("hasUsageAccess") {
            val ctx = appContext.reactContext ?: return@Function false
            val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                appOps.unsafeCheckOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    ctx.packageName
                )
            } else {
                @Suppress("DEPRECATION")
                appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    ctx.packageName
                )
            }
            mode == AppOpsManager.MODE_ALLOWED
        }

        Function("hasOverlayPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            Settings.canDrawOverlays(ctx)
        }

        // ── Permission open-settings helpers ─────────────────────────────────

        Function("openUsageAccessSettings") {
            val ctx = appContext.reactContext ?: return@Function
            ctx.startActivity(
                Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
            )
        }

        Function("openOverlaySettings") {
            val ctx = appContext.reactContext ?: return@Function
            ctx.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    android.net.Uri.parse("package:${ctx.packageName}")
                ).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
            )
        }

        // ── Service control ──────────────────────────────────────────────────

        Function("startBlocker") { packages: List<String> ->
            val ctx = appContext.reactContext ?: return@Function
            prefs.edit()
                .putStringSet("blocked_packages", packages.toSet())
                .putBoolean("blocking_active", true)
                .apply()
            val intent = Intent(ctx, AppBlockerService::class.java).apply {
                action = AppBlockerService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(intent)
            } else {
                ctx.startService(intent)
            }
        }

        Function("stopBlocker") {
            val ctx = appContext.reactContext ?: return@Function
            prefs.edit().putBoolean("blocking_active", false).apply()
            ctx.stopService(Intent(ctx, AppBlockerService::class.java))
        }

        Function("updateBlockingState") { active: Boolean ->
            prefs.edit().putBoolean("blocking_active", active).apply()
        }
    }
}
