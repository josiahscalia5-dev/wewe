package com.blastcollect.game

import android.content.Intent
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.view.InputDevice
import android.view.MotionEvent
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import com.blastcollect.core.Facing
import com.blastcollect.core.GameEvent
import com.blastcollect.core.Level3
import com.blastcollect.core.Phase
import com.blastcollect.core.RobotState
import com.blastcollect.core.Stage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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

    private fun shot(name: String) {
        inst.waitForIdleSync()
        shell("screencap -p $out/$name.png")
        note("screenshot $name")
    }

    private fun <T> onMain(block: () -> T): T {
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

    private fun quietArena() = onMain {
        val l = ActiveGame.level!!
        l.debugSkipIntro()
        l.debugClearDrones()
        l.debugParkRobot(1.8f, 7.2f, Facing.LEFT)
        l.events.clear()
    }

    // ------------------------------------------------------------------ the flow

    @Test
    fun phase1Flow() {
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
        val down = SystemClock.uptimeMillis()
        inject(MotionEvent.obtain(down, down, MotionEvent.ACTION_DOWN, vw * 0.55f, vh * 0.8f, 0))
        sleep(60)
        inject(multi(down, MotionEvent.ACTION_POINTER_DOWN or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), vw * 0.55f, vh * 0.8f, ax, ay + 80f * density))
        for (i in 1..12) {
            sleep(30)
            inject(multi(down, MotionEvent.ACTION_MOVE, vw * 0.55f - i * vw * 0.012f, vh * 0.8f, ax, ay + 80f * density))
        }
        inject(multi(down, MotionEvent.ACTION_POINTER_UP or (1 shl MotionEvent.ACTION_POINTER_INDEX_SHIFT), vw * 0.41f, vh * 0.8f, ax, ay + 80f * density))
        sleep(200)
        inject(MotionEvent.obtain(down, SystemClock.uptimeMillis(), MotionEvent.ACTION_UP, vw * 0.41f, vh * 0.8f, 0))
        waitFor("multitouch shot", 3000) { level().kills == kills + 1 }
        kills++
        note("multitouch: player.x $mxStart -> ${onMain { level().player.x }}")
        assertTrue("moved while shooting", onMain { level().player.x } < mxStart - 0.05f)

        // Get caught: the robot is sent after the exposed player.
        onMain {
            level().player.let { if (it.inCover) it.cover = -1 }
            level().events.clear()
        }
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
        assertTrue(onMain { level().events.contains(GameEvent.Caught) })

        // Hide: wait out the stun, run into the nearest cover spot, robot must not see us.
        waitFor("stun ends", 3000) { !level().player.stunned }
        sleep(400)
        val coverX = onMain {
            val l = level()
            l.tuning.coverX.minByOrNull { kotlin.math.abs(it - l.player.x) }!!
        }
        val targetStageX = onMain { level().camera.screenX(coverX * (1f - level().tuning.cameraFollow) + level().camera.panX, level().tuning.playerZ) }
        val startStageX = onMain { level().camera.screenX(level().player.x, level().tuning.playerZ) }
        val (sx0, _) = screenPoint(startStageX, 0f)
        val (sx1, _) = screenPoint(targetStageX, 0f)
        press(sx0, vh * 0.82f, sx1, vh * 0.82f, moveMs = 500, holdMs = 900)
        waitFor("astronaut ducks behind cover", 3000) { level().player.ducked }
        onMain {
            val l = level()
            l.events.clear()
            l.debugScan(l.player.x, 5.2f, 4f)
        }
        sleep(1500)
        shot("09_hiding")
        assertFalse("robot does not spot a hidden player", onMain { level().events.contains(GameEvent.Alert) })
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
