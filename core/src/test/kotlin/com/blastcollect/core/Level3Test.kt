package com.blastcollect.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

class Level3Test {

    private val dt = 1f / 120f

    private fun Level3.run(seconds: Float) {
        repeat((seconds / dt).toInt()) { step(dt) }
    }

    /** A level past its intro with the robot parked far away and no random drones. */
    private fun quietLevel(): Level3 = Level3(seed = 11).apply {
        debugSkipIntro()
        debugClearDrones()
        debugParkRobot(1.8f, 7.2f, Facing.LEFT)
    }

    private fun Level3.tapAt(x: Float, y: Float) {
        beginAim(x, y)
        endAim()
    }

    // ------------------------------------------------------------ shooting / counter

    @Test
    fun missedShotDoesNotCount() {
        val g = quietLevel()
        g.debugSpawnDroneAtScreen(540f, 800f, 5f, frozen = true)
        g.tapAt(120f, 650f)
        g.run(0.4f)
        assertEquals(1, g.totalShots)
        assertEquals(0, g.kills)
        assertTrue(g.events.contains(GameEvent.Miss))
        assertEquals(1, g.drones.size)
    }

    @Test
    fun hitIncrementsCounterExactlyOnce() {
        val g = quietLevel()
        val d = g.debugSpawnDroneAtScreen(540f, 800f, 5f, frozen = true)
        val c = g.droneScreen(d)
        g.tapAt(c.x, c.y)
        g.run(0.5f)
        assertEquals(1, g.kills)
        assertTrue(g.events.contains(GameEvent.Kill(1)))
        assertTrue("destroyed drone is removed", g.drones.isEmpty())
        assertTrue(g.effects.any { it.kind == EffectKind.EXPLOSION })
    }

    @Test
    fun boltTravelTimeMeansMovingDroneCanBeMissed() {
        val g = quietLevel()
        val d = g.debugSpawnDroneAtScreen(540f, 800f, 5f, frozen = true)
        val c = g.droneScreen(d)
        g.tapAt(c.x, c.y)
        g.step(dt)
        // Drone darts away before the bolt arrives.
        d.x += 1.5f
        g.run(0.3f)
        assertEquals(0, g.kills)
    }

    @Test
    fun robotBodyBlocksShots() {
        val g = quietLevel()
        g.debugParkRobot(0.3f, 4.2f, Facing.LEFT)
        val rect = g.robotRect()
        val cx = (rect[0] + rect[2]) / 2f
        val cy = rect[1] + (rect[3] - rect[1]) * 0.3f
        // Drone hovering behind the robot's chest.
        val d = g.debugSpawnDroneAtScreen(cx, cy, 6.5f, frozen = true)
        val c = g.droneScreen(d)
        g.tapAt(c.x, c.y)
        g.run(0.4f)
        assertEquals(0, g.kills)
        assertTrue(g.events.contains(GameEvent.Blocked))
    }

    @Test
    fun segmentEntryFindsRectangle() {
        val hit = segmentRectEntry(0f, 0f, 10f, 10f, floatArrayOf(4f, 4f, 6f, 6f))
        assertNotNull(hit)
        assertEquals(4f, hit!!.x, 1e-4f)
        assertEquals(null, segmentRectEntry(0f, 0f, 10f, 0f, floatArrayOf(4f, 4f, 6f, 6f)))
    }

    // ------------------------------------------------------------ weapon

    @Test
    fun tapFiresSingleShot() {
        val g = quietLevel()
        g.tapAt(540f, 700f)
        g.run(1f)
        assertEquals(1, g.totalShots)
    }

    @Test
    fun holdingAutoFiresUntilOverheat() {
        val g = quietLevel()
        g.beginAim(540f, 700f)
        var t = 0f
        while (!g.events.contains(GameEvent.Overheat) && t < 3f) {
            g.step(dt)
            t += dt
        }
        assertTrue(g.events.contains(GameEvent.Overheat))
        assertTrue("five segments plus what regenerated while firing", g.totalShots in 5..9)
        assertEquals(0, g.charge)
        val shots = g.totalShots
        g.run(g.tuning.overheatTime - 0.02f)
        assertEquals("no shots while overheated", shots, g.totalShots)
        g.run(0.35f * 4)
        assertEquals("holding waits for the bar to refill", shots, g.totalShots)
        g.run(0.35f + 0.1f)
        assertTrue("auto-fire resumes once full", g.totalShots > shots)
    }

    @Test
    fun eachShotUsesOneSegmentAndRegenerates() {
        val g = quietLevel()
        g.tapAt(540f, 700f)
        g.step(dt)
        assertEquals(4, g.charge)
        g.run(0.36f)
        assertEquals(5, g.charge)
    }

    // ------------------------------------------------------------ clock / timer

    @Test
    fun pauseFreezesTheGameClock() {
        val g = Level3(seed = 1)
        g.frame(0.05f)
        val t0 = g.clock.time
        val left = g.timeLeft
        val droneState = g.drones.map { Triple(it.x, it.y, it.z) }
        g.pause()
        repeat(100) { g.frame(0.05f) }
        assertEquals(t0, g.clock.time, 0.0)
        assertEquals(left, g.timeLeft, 0f)
        assertEquals(droneState, g.drones.map { Triple(it.x, it.y, it.z) })
        g.resume()
        g.frame(0.05f)
        assertTrue(g.clock.time > t0)
    }

    @Test
    fun timerDoesNotRunDuringIntroBanner() {
        val g = Level3(seed = 1)
        g.run(2.5f)
        assertEquals(Phase.INTRO, g.phase)
        assertEquals(g.tuning.startTime, g.timeLeft, 0f)
        g.run(1f)
        assertEquals(Phase.PLAYING, g.phase)
        assertTrue(g.timeLeft < g.tuning.startTime)
    }

    @Test
    fun timerReachingZeroFailsTheLevel() {
        val g = quietLevel()
        g.debugSetTimeLeft(0.5f)
        g.run(0.6f)
        assertEquals(Phase.FAILED, g.phase)
        assertEquals(0f, g.timeLeft, 0f)
        assertTrue(g.events.contains(GameEvent.Fail))
    }

    // ------------------------------------------------------------ robot

    @Test
    fun catchStunsPlayerAndCostsFiveSeconds() {
        val g = quietLevel()
        g.debugSetTimeLeft(60f)
        g.debugForceChase()
        var elapsed = 0f
        while (!g.events.contains(GameEvent.Caught) && elapsed < 6f) {
            g.step(dt)
            elapsed += dt
        }
        assertTrue("robot reaches the exposed player", g.events.contains(GameEvent.Caught))
        assertTrue(g.player.stunned)
        assertEquals(60f - elapsed - 5f, g.timeLeft, 0.05f)
        assertTrue(g.timerFlash > 0f)
        val xAtCatch = g.player.x
        g.run(0.3f)
        assertTrue("knockback moves the player", abs(g.player.x - xAtCatch) > 0.2f)
        g.run(1.3f)
        assertFalse(g.player.stunned)
        // Grace period: no second catch straight away.
        val caughtCount = g.events.count { it == GameEvent.Caught }
        g.run(1f)
        assertEquals(caughtCount, g.events.count { it == GameEvent.Caught })
    }

    @Test
    fun detectionNeedsContinuousExposureInCone() {
        val g = quietLevel()
        g.debugScan(g.player.x, 6f, 10f)
        g.run(0.5f)
        assertFalse(g.events.contains(GameEvent.Alert))
        g.run(0.15f)
        assertTrue(g.events.contains(GameEvent.Alert))
    }

    @Test
    fun robotFacingAwayDoesNotSeePlayer() {
        val g = quietLevel()
        g.debugParkRobot(-1.5f, 6f, Facing.LEFT)
        assertFalse(g.robotSeesPlayer())
        g.debugParkRobot(-1.5f, 6f, Facing.FRONT)
        assertTrue(g.robotSeesPlayer())
    }

    @Test
    fun coverHidesThePlayer() {
        val g = quietLevel()
        // Drag left past the left crate stack: the astronaut snaps into cover there.
        g.beginMove(600f)
        g.updateMove(600f - g.dragPixelsFor(0.6f))
        g.run(1.5f)
        g.endMove()
        assertEquals(0, g.player.cover)
        assertTrue(g.player.ducked)
        g.debugScan(g.player.x, 6f, 10f)
        g.run(2f)
        assertFalse(g.events.contains(GameEvent.Alert))
    }

    @Test
    fun dragPastCoverLeavesIt() {
        val g = quietLevel()
        val snapFinger = 600f - g.dragPixelsFor(0.6f)
        g.beginMove(600f)
        g.updateMove(snapFinger)
        g.run(1.5f)
        assertEquals(0, g.player.cover)
        // Keep dragging the same way: past the exit distance the astronaut leaves cover.
        g.updateMove(snapFinger - g.dragPixelsFor(0.35f))
        g.run(1f)
        g.endMove()
        assertEquals(-1, g.player.cover)
        assertTrue(g.player.x < g.tuning.coverX[0] - 0.1f)
        assertTrue(g.player.exposed)
    }

    @Test
    fun hidingBreaksTheChase() {
        val g = quietLevel()
        g.debugForceChase()
        g.robot.z = g.tuning.playerZ + 3f
        // Run for the nearest cover (left crate stack).
        g.beginMove(600f)
        g.updateMove(600f - g.dragPixelsFor(0.6f))
        g.run(1.2f)
        g.endMove()
        assertTrue(g.player.ducked)
        g.run(8f)
        assertFalse(g.events.contains(GameEvent.Caught))
        assertTrue(g.robot.state == RobotState.RETREAT || g.robot.state == RobotState.PATROL || g.robot.state == RobotState.SCAN)
    }

    @Test
    fun robotAtFrontBlocksTheRoute() {
        val g = quietLevel()
        g.debugParkRobot(0.25f, g.tuning.playerZ + 0.8f, Facing.FRONT)
        assertTrue(g.robotBlocksStrip())
        g.beginMove(300f)
        g.updateMove(1000f)
        g.run(2f)
        assertTrue(g.player.x <= 0.25f - g.tuning.robotBlockHalfWidth + 1e-4f)
    }

    @Test
    fun chaseIsSlowerThanThePlayer() {
        val t = Level3Tuning()
        assertTrue(t.robotChaseFactor * t.playerSpeed < t.playerSpeed)
    }

    @Test
    fun standingStillAndShootingGetsCaught() {
        // A careless bot that never moves or hides and keeps firing at drones.
        val g = Level3(seed = 5)
        var caught = 0
        var t = 0f
        while (t < 80f && !g.finished) {
            val target = g.drones.filter { it.hittable }.minByOrNull { it.z }
            if (target != null) {
                val c = g.droneScreen(target)
                if (!g.aiming) g.beginAim(c.x, c.y) else g.updateAim(c.x, c.y)
            } else if (g.aiming) {
                g.endAim()
            }
            g.step(dt)
            t += dt
            caught += g.events.count { it == GameEvent.Caught }
            g.events.clear()
        }
        assertTrue("robot should catch a player who never takes cover (caught=$caught)", caught >= 2)
    }

    // ------------------------------------------------------------ rewards / completion

    @Test
    fun coinMath() {
        val g = quietLevel()
        g.debugSetKills(6)
        assertEquals(3, g.coinsEarned)
        g.debugSetKills(7)
        assertEquals(3, g.coinsEarned)
        g.debugSetKills(19)
        assertEquals(9, g.coinsEarned)
    }

    @Test
    fun twentiethKillCompletesWithBonus() {
        val g = quietLevel()
        g.debugSetKills(19)
        val d = g.debugSpawnDroneAtScreen(540f, 800f, 5f, frozen = true)
        val c = g.droneScreen(d)
        g.tapAt(c.x, c.y)
        g.run(0.4f)
        assertEquals(20, g.kills)
        assertEquals(Phase.COMPLETING, g.phase)
        g.run(g.tuning.completeDelay + 0.1f)
        assertEquals(Phase.COMPLETE, g.phase)
        assertTrue(g.events.contains(GameEvent.Complete))
        assertEquals(20 / 2 + 5, g.coinsEarned)
    }

    @Test
    fun dronesNeverExceedAirborneCap() {
        val g = Level3(seed = 9)
        var maxSeen = 0
        repeat((30f / dt).toInt()) {
            g.step(dt)
            maxSeen = maxOf(maxSeen, g.drones.count { it.state == DroneState.FLYING })
        }
        assertTrue(maxSeen in 1..3)
        g.debugSetKills(12)
        repeat((20f / dt).toInt()) {
            g.step(dt)
            maxSeen = maxOf(maxSeen, g.drones.count { it.state == DroneState.FLYING })
        }
        assertEquals(4, maxSeen)
    }

    @Test
    fun referencePoseMatchesTheReferenceHud() {
        val g = Level3(seed = 1)
        g.applyReferencePose()
        assertEquals(6, g.kills)
        assertEquals(3, g.coinsEarned)
        assertEquals(28f, g.timeLeft, 0f)
        assertEquals(3, g.drones.size)
        g.run(1f)
        assertEquals("pose is frozen", 28f, g.timeLeft, 0f)
    }

    // ------------------------------------------------------------ robot hunts

    @Test
    fun robotActivelyClosesInOnThePlayer() {
        for (seed in 1L..6L) {
            val g = Level3(seed = seed)
            g.debugSkipIntro()
            g.debugClearDrones()
            val dist = { kotlin.math.hypot(g.robot.x - g.player.x, g.robot.z - g.tuning.playerZ) }
            val start = dist()
            var closest = start
            repeat((8f / dt).toInt()) {
                g.step(dt)
                closest = kotlin.math.min(closest, dist())
            }
            assertTrue("seed $seed: robot closes in (start $start, closest $closest, caught ${g.catches})", closest < start - 2f || g.catches > 0)
        }
    }

    @Test
    fun catchAndAlertCountersSurviveDrainedEvents() {
        val g = quietLevel()
        g.debugForceChase()
        var steps = 0
        while (!g.player.stunned && steps < 2000) {
            g.step(dt)
            g.events.clear() // the app drains events every frame
            steps++
        }
        assertEquals(1, g.catches)
        assertTrue(g.player.stunned)
    }
}
