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

class AppBlockerService : Service() {

    companion object {
        const val ACTION_START = "START"
        private const val CHANNEL_ID = "dsa_blocker"
        private const val NOTIF_ID = 7331
        private const val POLL_MS = 1500L
    }

    private val handler = Handler(Looper.getMainLooper())
    private var overlayView: View? = null

    private val pollRunnable = object : Runnable {
        override fun run() {
            tick()
            handler.postDelayed(this, POLL_MS)
        }
    }

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
        handler.post(pollRunnable)
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(pollRunnable)
        removeOverlay()
        super.onDestroy()
    }

    // ── Poll tick ─────────────────────────────────────────────────────────────

    private fun tick() {
        val active = prefs.getBoolean("blocking_active", false)
        if (!active) {
            removeOverlay()
            return
        }
        val fg = getForegroundApp() ?: return
        val blocked = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()

        if (fg in blocked && fg != packageName) {
            if (overlayView == null) showOverlay()
        } else if (fg == packageName || fg !in blocked) {
            removeOverlay()
        }
    }

    // ── Overlay ───────────────────────────────────────────────────────────────

    private fun showOverlay() {
        if (!Settings.canDrawOverlays(this)) return
        if (overlayView != null) return

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_SYSTEM_ALERT

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            type,
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        val view = buildView()
        overlayView = view
        try { windowManager.addView(view, params) } catch (_: Exception) { overlayView = null }
    }

    private fun removeOverlay() {
        overlayView?.let {
            try { windowManager.removeView(it) } catch (_: Exception) {}
            overlayView = null
        }
    }

    private fun buildView(): View {
        val d = resources.displayMetrics.density
        fun dp(v: Int) = (v * d).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#F00d1117"))
            setPadding(dp(32), dp(48), dp(32), dp(48))
        }

        root.addView(TextView(this).apply {
            text = "\uD83D\uDD12"          // 🔒
            textSize = 72f
            gravity = Gravity.CENTER
        })

        root.addView(TextView(this).apply {
            text = "Instagram Blocked"
            textSize = 26f
            setTextColor(Color.parseColor("#e6edf3"))
            gravity = Gravity.CENTER
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, dp(20), 0, dp(8))
        })

        root.addView(TextView(this).apply {
            text = "Finish your DSA problems first!\nSolve all 3 daily questions to unlock."
            textSize = 15f
            setTextColor(Color.parseColor("#8b949e"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, dp(40))
        })

        val btnParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        )
        val btn = Button(this).apply {
            text = "\u2192  Go Solve Problems"
            textSize = 16f
            setTextColor(Color.parseColor("#0d1117"))
            setBackgroundColor(Color.parseColor("#00ff88"))
            setPadding(dp(32), dp(16), dp(32), dp(16))
            setOnClickListener {
                removeOverlay()
                prefs.edit().putBoolean("blocking_active", false).apply()
                packageManager.getLaunchIntentForPackage(packageName)?.apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    this@AppBlockerService.startActivity(this)
                }
            }
        }
        root.addView(btn, btnParams)
        return root
    }

    // ── Foreground app detection via UsageStats ───────────────────────────────

    private fun getForegroundApp(): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return null
        val now = System.currentTimeMillis()
        return usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 10_000L, now)
            ?.filter { it.packageName != "android" }
            ?.maxByOrNull { it.lastTimeUsed }
            ?.packageName
    }

    // ── Notification ──────────────────────────────────────────────────────────

    private fun buildNotification(): Notification {
        val pi = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("DSA Grind is watching \uD83D\uDC40")
            .setContentText("Apps blocked until daily problems are solved")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pi)
            .setSilent(true)
            .setOngoing(true)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = NotificationChannel(
                CHANNEL_ID, "DSA Grind Blocker", NotificationManager.IMPORTANCE_LOW
            ).apply { description = "Keeps the app blocker running in background" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }
}
