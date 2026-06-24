package expo.modules.appblocker

import android.app.*
import android.app.usage.UsageStatsManager
import android.content.*
import android.graphics.*
import android.os.*
import android.provider.Settings
import android.view.*
import android.widget.*
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class AppBlockerService : Service() {

    companion object {
        const val ACTION_START = "START"
        private const val CHANNEL_ID = "dsa_blocker"
        private const val NOTIF_ID = 7331
    }

    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val handler = Handler(Looper.getMainLooper())
    private var overlayView: View? = null
    private var lastBlockedPkg = ""

    private val windowManager by lazy {
        getSystemService(WINDOW_SERVICE) as WindowManager
    }

    private val prefs by lazy {
        getSharedPreferences("AppBlocker", Context.MODE_PRIVATE)
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onBind(intent: Intent?) = null

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIF_ID, buildNotification())
        startMonitoring()
        return START_STICKY
    }

    override fun onDestroy() {
        scope.cancel()
        handler.post { removeOverlay() }
        super.onDestroy()
    }

    // ── Monitoring loop ───────────────────────────────────────────────────────

    private fun startMonitoring() {
        scope.launch {
            while (isActive) {
                withContext(Dispatchers.Main) { tick() }
                delay(1_500)
            }
        }
    }

    private fun tick() {
        val active = prefs.getBoolean("blocking_active", false)
        if (!active) {
            removeOverlay()
            lastBlockedPkg = ""
            return
        }

        val fg = getForegroundApp() ?: return
        val blocked = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()
        val ownPkg = packageName

        if (fg in blocked && fg != ownPkg) {
            if (overlayView == null) showOverlay(fg)
        } else {
            if (fg == ownPkg || fg !in blocked) {
                removeOverlay()
                lastBlockedPkg = ""
            }
        }
    }

    // ── Overlay ───────────────────────────────────────────────────────────────

    private fun showOverlay(blockedPkg: String) {
        if (!Settings.canDrawOverlays(this)) return
        if (overlayView != null) return
        lastBlockedPkg = blockedPkg

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_ALERT

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )

        val view = buildOverlayView()
        overlayView = view
        windowManager.addView(view, params)
    }

    private fun removeOverlay() {
        overlayView?.let {
            try { windowManager.removeView(it) } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun buildOverlayView(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#EE0d1117"))
            setPadding(dp(32), dp(32), dp(32), dp(32))
        }

        root.addView(TextView(this).apply {
            text = "🔒"
            textSize = 72f
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = "Instagram Blocked"
            textSize = 26f
            setTextColor(Color.parseColor("#e6edf3"))
            gravity = Gravity.CENTER
            setPadding(0, dp(20), 0, dp(10))
            typeface = Typeface.DEFAULT_BOLD
        })

        root.addView(TextView(this).apply {
            text = "Finish your DSA problems first!\nSolve all 3 daily questions to unlock."
            textSize = 15f
            setTextColor(Color.parseColor("#8b949e"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(40))
        })

        root.addView(Button(this).apply {
            text = "→  Go Solve Problems"
            textSize = 16f
            setTextColor(Color.parseColor("#0d1117"))
            setBackgroundColor(Color.parseColor("#00ff88"))
            setPadding(dp(32), dp(16), dp(32), dp(16))
            setOnClickListener {
                removeOverlay()
                prefs.edit().putBoolean("blocking_active", false).apply()
                packageManager.getLaunchIntentForPackage(packageName)?.apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    startActivity(this)
                }
            }
        })

        return root
    }

    // ── UsageStats foreground app detection ───────────────────────────────────

    private fun getForegroundApp(): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return null
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            now - 10_000,
            now
        ) ?: return null
        return stats
            .filter { it.packageName != "android" }
            .maxByOrNull { it.lastTimeUsed }
            ?.packageName
    }

    // ── Notification (required for foreground service) ────────────────────────

    private fun buildNotification(): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DSA Grind is watching \uD83D\uDC40")
            .setContentText("Apps will be blocked until your daily problems are solved")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pi)
            .setSilent(true)
            .setOngoing(true)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID,
                "DSA Grind Blocker",
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Keeps the app blocker running" }
            (getSystemService(NotificationManager::class.java)).createNotificationChannel(ch)
        }
    }

    private fun dp(v: Int): Int =
        (v * resources.displayMetrics.density).toInt()
}
