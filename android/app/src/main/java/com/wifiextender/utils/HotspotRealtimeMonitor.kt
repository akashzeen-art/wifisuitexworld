package com.wifiextender.utils

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Production real-time monitor — polls connected hotspot clients every few seconds
 * and pushes updates to all registered listeners (Hotspot tab, Devices tab, ViewModel).
 */
class HotspotRealtimeMonitor private constructor(context: Context) {

    private val appContext = context.applicationContext
    private val hotspotManager = HotspotManager.getInstance(appContext)
    private val handler = Handler(Looper.getMainLooper())
    private val listeners = CopyOnWriteArrayList<(List<ConnectedClient>) -> Unit>()
    private val running = AtomicBoolean(false)
    private var lastSnapshot: List<ConnectedClient> = emptyList()
    private var pollGeneration = 0
    private var pollCount = 0

    private val pollRunnable: Runnable = Runnable {
        if (!running.get()) return@Runnable
        val generation = pollGeneration
        val deep = pollCount++ % 2 == 0
        Thread {
            try {
                val sharing = hotspotManager.isHotspotOn() || hotspotManager.syncHotspotStateFromSystem()
                if (!sharing) {
                    if (lastSnapshot.isNotEmpty()) {
                        lastSnapshot = emptyList()
                        handler.post { notifyListeners(emptyList()) }
                    }
                } else {
                    hotspotManager.userHotspotActive = true
                    hotspotManager.ensureClientListeners()
                    val system = hotspotManager.getCurrentConnectedClients()
                    val clients = if (system.isNotEmpty()) {
                        system
                    } else {
                        val discovered = hotspotManager.discoverConnectedClients(deepScan = deep)
                        if (discovered.isEmpty()) {
                            hotspotManager.discoverConnectedClients(deepScan = true)
                        } else {
                            discovered
                        }
                    }
                    if (generation == pollGeneration && snapshotChanged(lastSnapshot, clients)) {
                        lastSnapshot = clients
                        handler.post { notifyListeners(clients) }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "poll failed: ${e.message}")
            } finally {
                if (running.get() && generation == pollGeneration) {
                    scheduleNextPoll()
                }
            }
        }.start()
    }

    private fun scheduleNextPoll() {
        handler.postDelayed(pollRunnable, POLL_INTERVAL_MS)
    }

    fun addListener(listener: (List<ConnectedClient>) -> Unit) {
        listeners.add(listener)
        if (lastSnapshot.isNotEmpty()) {
            handler.post { listener(lastSnapshot) }
        }
    }

    fun removeListener(listener: (List<ConnectedClient>) -> Unit) {
        listeners.remove(listener)
    }

    fun start() {
        if (running.getAndSet(true)) return
        pollGeneration++
        Log.i(TAG, "started (${OemBrandDetector.displayName()} device)")
        handler.post(pollRunnable)
    }

    fun stop() {
        running.set(false)
        pollGeneration++
        handler.removeCallbacks(pollRunnable)
        Log.i(TAG, "stopped")
    }

    fun isRunning(): Boolean = running.get()

    fun forceRefresh() {
        if (!running.get()) {
            start()
        }
        handler.removeCallbacks(pollRunnable)
        handler.post(pollRunnable)
    }

    /** Last non-empty client snapshot — used by Devices tab when a quick read returns empty. */
    fun getLastSnapshot(): List<ConnectedClient> = lastSnapshot

    fun clearSnapshot() {
        lastSnapshot = emptyList()
        handler.post { notifyListeners(emptyList()) }
    }

    private fun notifyListeners(clients: List<ConnectedClient>) {
        listeners.forEach { listener ->
            try {
                listener(clients)
            } catch (_: Exception) {
            }
        }
    }

    private fun snapshotChanged(prev: List<ConnectedClient>, next: List<ConnectedClient>): Boolean {
        if (prev.size != next.size) return true
        val prevKeys = prev.map { it.macAddress?.uppercase() ?: it.ipAddress }.toSet()
        val nextKeys = next.map { it.macAddress?.uppercase() ?: it.ipAddress }.toSet()
        return prevKeys != nextKeys
    }

    companion object {
        private const val TAG = "HotspotMonitor"
        private const val POLL_INTERVAL_MS = 4_000L

        @Volatile
        private var instance: HotspotRealtimeMonitor? = null

        fun getInstance(context: Context): HotspotRealtimeMonitor {
            return instance ?: synchronized(this) {
                instance ?: HotspotRealtimeMonitor(context).also { instance = it }
            }
        }
    }
}
