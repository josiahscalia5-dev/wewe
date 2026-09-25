package com.blastcollect.game

import android.content.Intent
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Configurator
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import androidx.test.uiautomator.Until
import com.blastcollect.core.Facing
import com.blastcollect.core.Level3
import com.blastcollect.core.Phase
import com.blastcollect.core.RobotState
import com.blastcollect.core.Stage
import com.blastcollect.game.ui.LayoutSpec
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Plays through Phase 1 with injected touches on a real device/emulator (brief section 7):
 * Home → PLAY NOW → Level 3 → move → shoot drones → get caught → hide → pause/resume →
 * forced fail → forced complete, capturing screenshots (and a 30 s screen recording)
 * into /data/local/tmp/bc/<size>/ for CI to pull.
 *
 * Run with `-e size compact|standard|tall` to name the output folder.
 */
@RunWith(AndroidJUnit4::class)
class Phase1FlowTest {
    private val inst = InstrumentationRegistry.getInstrumentation()
    private val device = UiDevice.getInstance(inst)
    private val size = InstrumentationRegistry.getArguments().getString("size") ?: "standard"
    private val out = "/data/local/tmp/bc/$size"
    private val density = inst.targetContext.resources.displayMetrics.density
    private val log = StringBuilder()

    // ------------------------------------------------------------------ helpers

    private fun shell(cmd: String): String {
        val pfd = inst.uiAutomation.executeShellCommand(cmd)
        return ParcelFileDescriptor.AutoCloseInputStream(pfd).bufferedReader().use { it.readText() }
    }

    private fun note(s: String) {
        log.append(s).append('\n')
        android.util.Log.i("Phase1Flow", s)
    }

    // No waitForIdleSync(): the game animates every frame, so the main thread is never idle
    // for long and idle waits stall for tens of seconds.
    private fun shot(name: String) {
        shell("screencap -p $out/$name.png")
        note("screenshot $name")
    }

    private fun <T> onMain(block: () -> T): T {
        if (Looper.myLooper() == Looper.getMainLooper()) return block()
        var r: Any? = null
        inst.runOnMainSync { r = block() }
        @Suppress("UNCHECKED_CAST")
        return r as T
    }

    private fun level(): Level3 = onMain { ActiveGame.level }!!

    private fun waitFor(what: String, timeoutMs: Long, cond: () -> Boolean) {
        val end = SystemClock.uptimeMillis() + timeoutMs
        while (SystemClock.uptimeMillis() < end) {
            if (onMain(cond)) return
            SystemClock.sleep(50)
        }
        throw AssertionError("timed out waiting for: $what")
    }

    private fun sleep(ms: Long) = SystemClock.sleep(ms)

    private fun screenPoint(sx: Float, sy: Float): Pair<Float, Float> = onMain {
        val v = ActiveGame.view!!
        val loc = IntArray(2)
        v.getLocationOnScreen(loc)
        Pair(loc[0] + v.mapping.toViewX(sx), loc[1] + v.mapping.toViewY(sy))
    }

    private fun viewSize(): Pair<Int, Int> = onMain { ActiveGame.view!!.let { Pair(it.width, it.height) } }

    private fun inject(e: MotionEvent) {
        e.source = InputDevice.SOURCE_TOUCHSCREEN
        inst.uiAutomation.injectInputEvent(e, true)
        e.recycle()
    }

    private fun props(n: Int) = Array(n) { MotionEvent.PointerProperties().apply { id = it; toolType = MotionEvent.TOOL_TYPE_FINGER } }

    private fun coords(vararg xy: Float) = Array(xy.size / 2) { i ->
        MotionEvent.PointerCoords().apply {
            x = xy[i * 2]
            y = xy[i * 2 + 1]
            pressure = 1f
            this.size = 1f
        }
    }

    private fun multi(down: Long, action: Int, vararg xy: Float) = MotionEvent.obtain(
        down, SystemClock.uptimeMillis(), action, xy.size / 2, props(xy.size / 2), coords(*xy),
        0, 0, 1f, 1f, 0, 0, InputDevice.SOURCE_TOUCHSCREEN, 0,
    )

    /** Press, optionally move, hold, release — one finger. */
    private fun press(x0: Float, y0: Float, x1: Float = x0, y1: Float = y0, moveMs: Long = 0, holdMs: Long = 120) {
        val down = SystemClock.uptimeMillis()
        inject(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, x0, y0, 0))
        val steps = (moveMs / 16).toInt().coerceAtLeast(1)
        if (moveMs > 0) {
            for (i in 1..steps) {
                val t = i / steps.toFloat()
                sleep(16)
                inject(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0))
            }
        }
        sleep(holdMs)
        inject(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, x1, y1, 0))
    }

    /** Taps where the crosshair (80dp above the finger) lands on a stage point. */
    private fun shootAt(sx: Float, sy: Float, holdMs: Long = 90) {
        val (x, y) = screenPoint(sx, sy)
        press(x, y + 80f * density, holdMs = holdMs)
    }

    /**
     * Plays like a person for [seconds] with the live robot and real moving drones:
     * tracks the nearest drone with the aim finger (auto-fire while held), then sidesteps
     * away from the robot. Screenshots are taken at [shotsAt] seconds into the session.
     */
    private fun autoplay(seconds: Float, vw: Int, vh: Int, shotsAt: List<Pair<Float, String>>) {
        val start = SystemClock.uptimeMillis()
        val pending = shotsAt.toMutableList()
        val aimLimitY = vh * LayoutSpec.Level3.moveZoneTop - 12f
        fun elapsed() = (SystemClock.uptimeMillis() - start) / 1000f
        fun maybeShoot() {
            while (pending.isNotEmpty() && elapsed() >= pending.first().first) shot(pending.removeAt(0).second)
        }
        fun targetPoint(): Pair<Float, Float>? = onMain {
            val l = level()
            val d = l.drones.filter { it.hittable }
                .map { it to l.droneScreen(it) }
                .filter { (_, p) -> p.x in 60f..(Stage.W - 60f) && p.y in 250f..1500f }
                .minByOrNull { (_, p) -> kotlin.math.abs(p.x - Stage.W * 0.5f) }
            d?.let { (_, p) -> screenPoint(p.x, p.y) }
        }
        while (elapsed() < seconds) {
            maybeShoot()
            if (onMain { level().player.stunned || level().finished }) {
                sleep(100)
                continue
            }
            val t = targetPoint()
            if (t != null) {
                // Aim finger: down on the drone (crosshair sits 80 dp above the finger), follow it.
                val down = SystemClock.uptimeMillis()
                fun fy(y: Float) = (y + 80f * density).coerceAtMost(aimLimitY)
                inject(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, t.first, fy(t.second), 0))
                var last: Pair<Float, Float> = t
                repeat(22) {
                    sleep(32)
                    val p = targetPoint() ?: last
                    last = p
                    inject(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE, p.first, fy(p.second), 0))
                }
                inject(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, last.first, fy(last.second), 0))
            } else {
                sleep(150)
            }
            maybeShoot()
            // Reposition: step away from the robot (turn around at the edges of the strip).
            val dir = onMain {
                val l = level()
                var d = if (l.robot.x >= l.player.x) -1f else 1f
                if (l.player.x < l.tuning.playerMinX + 0.15f) d = 1f
                if (l.player.x > l.tuning.playerMaxX - 0.15f) d = -1f
                d
            }
            press(vw * 0.5f, vh * 0.84f, vw * (0.5f + dir * 0.16f), vh * 0.84f, moveMs = 280, holdMs = 120)
        }
        maybeShoot()
    }

    private fun clickDesc(desc: String, timeout: Long = 8000) {
        val o = device.wait(Until.findObject(By.desc(desc)), timeout)
        assertNotNull("button '$desc' visible", o)
        o.click()
    }

    private fun launchApp() {
        val ctx = inst.targetContext
        val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)!!
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        ctx.startActivity(intent)
    }

    /** No live drones, robot parked mid-right, player able to shoot. */
    private fun quietArena() = onMain {
        val l = ActiveGame.level!!
        l.debugSkipIntro()
        l.debugClearDrones()
        l.debugParkRobot(1.8f, 7.2f, Facing.LEFT)
        l.debugCalmPlayer()
    }

    // ------------------------------------------------------------------ the flow

    @Test
    fun phase1Flow() {
        Configurator.getInstance().apply {
            waitForIdleTimeout = 100
            waitForSelectorTimeout = 100
            actionAcknowledgmentTimeout = 100
        }
        shell("mkdir -p $out")
        shell("rm -f $out/*")
        shell("svc power stayon true")
        device.wakeUp()

        // Home.
        launchApp()
        assertNotNull(device.wait(Until.findObject(By.desc("PLAY NOW")), 30_000))
        sleep(1800)
        shot("01_home")
        assertEquals(2350, onMain { ActiveGame.wallet })

        // Settings panel and a nav tab.
        clickDesc("Settings")
        assertNotNull(device.wait(Until.findObject(By.desc("Vibration")), 5000))
        sleep(300)
        shot("02_settings")
        clickDesc("CLOSE")
        clickDesc("Missions")
        assertNotNull(device.wait(Until.findObject(By.desc("BACK TO HOME")), 5000))
        sleep(300)
        shot("03_missions_coming_soon")
        clickDesc("BACK TO HOME")
        sleep(400)

        // PLAY NOW → Level 3 (start a 30 s screen recording of the gameplay).
        val recorder = inst.uiAutomation.executeShellCommand("screenrecord --time-limit 30 --bit-rate 6000000 $out/level3_30s.mp4")
        clickDesc("PLAY NOW")
        waitFor("level 3 running", 20_000) { ActiveGame.screen == "level3" && ActiveGame.level != null && ActiveGame.view?.isAttachedToWindow == true }
        sleep(900)
        shot("04_level3_banner")
        assertEquals(Phase.INTRO, onMain { level().phase })
        waitFor("banner ends", 6000) { level().phase == Phase.PLAYING }
        sleep(1200)
        shot("05_level3_playing")
        val (vw, vh) = viewSize()

        // Real play for ~14 s: live robot hunting the player, drones flying their routes.
        val kills0 = onMain { level().kills }
        val shots0 = onMain { level().totalShots }
        val robotStart = onMain { level().robot.x to level().robot.z }
        var robotTravel = 0f
        var lastRobot = robotStart
        val sampler = Thread {
            while (!Thread.currentThread().isInterrupted) {
                try {
                    Thread.sleep(100)
                } catch (e: InterruptedException) {
                    break
                }
                val r = onMain { level().robot.x to level().robot.z }
                robotTravel += kotlin.math.hypot(r.first - lastRobot.first, r.second - lastRobot.second)
                lastRobot = r
            }
        }
        sampler.start()
        autoplay(14f, vw, vh, listOf(2.5f to "06_play_aiming", 6f to "06b_play_robot_hunting", 10f to "06c_play_moving", 13.5f to "06d_play_progress"))
        sampler.interrupt()
        sampler.join(1000)
        val playKills = onMain { level().kills } - kills0
        val playShots = onMain { level().totalShots } - shots0
        note("autoplay: kills=$playKills shots=$playShots catches=${onMain { level().catches }} alerts=${onMain { level().alerts }} " +
            "robotTravel=${"%.2f".format(robotTravel)}m timeLeft=${onMain { level().timeLeft }}")
        assertTrue("autoplay fired shots", playShots > 0)
        assertTrue("autoplay destroyed moving drones", playKills > 0)
        assertTrue("robot moved around hunting the player", robotTravel > 1.5f)

        // Deterministic checks from here on: the robot is parked while the scripted
        // movement/shooting steps run (its chase and catch are tested below).
        onMain {
            val l = level()
            l.debugParkRobot(1.8f, 7.2f, Facing.LEFT)
            l.debugCalmPlayer()
            l.debugPlacePlayer(l.tuning.playerStartX)
        }
        sleep(300)

        // Move: drag in the lower zone.
        val x0 = onMain { level().player.x }
        press(vw * 0.25f, vh * 0.8f, vw * 0.50f, vh * 0.8f, moveMs = 500, holdMs = 700)
        val x1 = onMain { level().player.x }
        note("move: player.x $x0 -> $x1")
        assertTrue("drag moves the astronaut", x1 > x0 + 0.1f)
        shot("06_moved")

        // Leave cover if the drag ended in one, then shoot two hovering drones.
        press(vw * 0.5f, vh * 0.8f, vw * 0.62f, vh * 0.8f, moveMs = 300, holdMs = 500)
        quietArena()
        val targets = listOf(Triple(0.30f, 0.34f, 4.6f), Triple(0.68f, 0.40f, 5.4f))
        var kills = onMain { level().kills }
        for ((i, t) in targets.withIndex()) {
            val d = onMain { level().debugSpawnDroneAtScreen(t.first * Stage.W, t.second * Stage.H, t.third, frozen = true) }
            sleep(350)
            val p = onMain { level().droneScreen(d) }
            shootAt(p.x, p.y)
            if (i == 0) {
                sleep(230)
                shot("07_drone_hit")
            }
            waitFor("drone ${i + 1} destroyed", 3000) { level().kills == kills + 1 }
            kills++
        }
        // A missed shot must not count.
        shootAt(Stage.W * 0.5f, Stage.H * 0.3f)
        sleep(500)
        assertEquals(kills, onMain { level().kills })

        // Two fingers at once: move with one, shoot with the other.
        val d3 = onMain { level().debugSpawnDroneAtScreen(0.5f * Stage.W, 0.36f * Stage.H, 5f, frozen = true) }
        sleep(300)
        val p3 = onMain { level().droneScreen(d3) }
        val (ax, ay) = screenPoint(p3.x, p3.y)
        val mxStart = onMain { level().player.x }
        val shotsBefore = onMain { level().totalShots }
        // Finger 0 drags left in the move zone while finger 1 holds on the drone (aim zone).
        val steps = 60
        val moveFinger = Array(steps) { i ->
            MotionEvent.PointerCoords().apply {
                x = vw * 0.55f - vw * 0.14f * i / (steps - 1)
                y = vh * 0.8f
                pressure = 1f
                this.size = 1f
            }
        }
        val aimFinger = Array(steps) {
            MotionEvent.PointerCoords().apply {
                x = ax
                y = ay + 80f * density
                pressure = 1f
                this.size = 1f
            }
        }
        val playArea = device.findObject(UiSelector().description("Level 3 play area"))
        val gestureOk = playArea.performMultiPointerGesture(moveFinger, aimFinger)
        note("multitouch gesture injected=$gestureOk shots ${shotsBefore}->${onMain { level().totalShots }} " +
            "aiming=${onMain { level().aiming }} cover=${onMain { level().player.cover }} x=${onMain { level().player.x }}")
        waitFor("multitouch shot", 3000) { level().kills == kills + 1 }
        kills++
        note("multitouch: player.x $mxStart -> ${onMain { level().player.x }}")
        assertTrue("moved while shooting", onMain { level().player.x } < mxStart - 0.05f)

        // Get caught: the robot is sent after the exposed player.
        onMain {
            level().player.let {
                if (it.inCover) {
                    it.ignoreCover = it.cover
                    it.cover = -1
                    it.stand = 1f
                }
            }
        }
        val catchesBefore = onMain { level().catches }
        val before = onMain { level().timeLeft }
        val t0 = SystemClock.uptimeMillis()
        onMain { level().debugForceChase() }
        waitFor("robot catches the player", 8000) { level().player.stunned }
        sleep(120)
        shot("08_caught")
        val elapsed = (SystemClock.uptimeMillis() - t0) / 1000f
        val after = onMain { level().timeLeft }
        note("catch: time $before -> $after after ${elapsed}s")
        assertTrue("catch costs 5 s", after <= before - 5f + 0.3f)
        assertEquals("caught once", catchesBefore + 1, onMain { level().catches })

        // Hide: wait out the stun, run into the nearest cover spot, robot must not see us.
        waitFor("stun ends", 3000) { !level().player.stunned }
        sleep(400)
        val coverX = onMain {
            val l = level()
            l.tuning.coverX.indices.filter { it != l.player.ignoreCover }
                .map { l.tuning.coverX[it] }
                .minByOrNull { kotlin.math.abs(it - l.player.x) }!!
        }
        // Follow camera: the drag length (not the finger position) decides where he goes.
        val dragView = onMain {
            val l = level()
            val dx = coverX - l.player.x
            (l.dragPixelsFor(dx + kotlin.math.sign(dx) * 0.05f)) * ActiveGame.view!!.mapping.scale
        }
        press(vw * 0.5f - dragView / 2f, vh * 0.82f, vw * 0.5f + dragView / 2f, vh * 0.82f, moveMs = 500, holdMs = 900)
        waitFor("astronaut ducks behind cover", 3000) { level().player.ducked }
        val alertsBefore = onMain { level().alerts }
        onMain {
            val l = level()
            l.debugScan(l.player.x, 5.2f, 4f)
        }
        sleep(1500)
        shot("09_hiding")
        assertEquals("robot does not spot a hidden player", alertsBefore, onMain { level().alerts })
        assertEquals(RobotState.SCAN, onMain { level().robot.state })

        // Pause / resume.
        clickDesc("Pause")
        assertNotNull(device.wait(Until.findObject(By.desc("RESUME")), 5000))
        val clock0 = onMain { level().clock.time }
        val robot0 = onMain { level().robot.x to level().robot.z }
        sleep(1200)
        shot("10_paused")
        assertEquals(clock0, onMain { level().clock.time }, 0.0)
        assertEquals(robot0, onMain { level().robot.x to level().robot.z })
        clickDesc("RESUME")
        sleep(600)
        assertTrue("clock runs again", onMain { level().clock.time } > clock0)

        // Let the recording finish (it started at PLAY NOW).
        ParcelFileDescriptor.AutoCloseInputStream(recorder).use { it.readBytes() }

        // Forced fail (debug short timer) → Retry.
        onMain { level().debugSetTimeLeft(2f) }
        assertNotNull(device.wait(Until.findObject(By.desc("RETRY")), 8000))
        sleep(500)
        shot("11_failed")
        assertEquals(Phase.FAILED, onMain { level().phase })
        val failedLevel = level()
        clickDesc("RETRY")
        waitFor("fresh level", 5000) { ActiveGame.level !== failedLevel }

        // Forced complete (debug near-complete).
        sleep(500)
        quietArena()
        onMain { level().debugSetKills(19) }
        val walletBefore = onMain { ActiveGame.wallet }
        val d = onMain { level().debugSpawnDroneAtScreen(0.5f * Stage.W, 0.35f * Stage.H, 5f, frozen = true) }
        sleep(300)
        val pd = onMain { level().droneScreen(d) }
        shootAt(pd.x, pd.y)
        assertNotNull(device.wait(Until.findObject(By.desc("REPLAY")), 8000))
        sleep(700)
        shot("12_complete")
        assertEquals(Phase.COMPLETE, onMain { level().phase })
        val earned = onMain { level().coinsEarned }
        assertEquals(15, earned)
        waitFor("wallet credited", 3000) { ActiveGame.wallet == walletBefore + earned }

        // Frozen moment matching reference/2376.png for the side-by-side comparison.
        clickDesc("REPLAY")
        sleep(800)
        onMain { level().applyReferencePose() }
        sleep(800)
        shot("13_level3_reference_pose")

        // Back to Home for the final comparison shot.
        device.pressBack()
        clickDesc("HOME")
        assertNotNull(device.wait(Until.findObject(By.desc("PLAY NOW")), 8000))
        sleep(1500)
        shot("14_home_after")
        note("wallet ${onMain { ActiveGame.wallet }}")
        shell("echo '${log.toString().replace("'", "")}' > $out/flow_log.txt")
    }
}
