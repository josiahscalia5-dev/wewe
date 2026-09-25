package com.blastcollect.core

import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.abs

/**
 * Tuning checks with scripted players (brief: "standing still and shooting fails, but
 * moving between cover always leaves an escape").
 */
class PlaytestSimulationTest {

    private val dt = 1f / 120f

    private class Result(val won: Boolean, val caught: Int, val timeLeft: Float, val kills: Int)

    /** A reasonable player: shoots with a little lead, hides when the robot turns hostile. */
    private fun playWithCover(seed: Long): Result {
        val g = Level3(seed = seed)
        val metresPerFingerPx = g.tuning.playerZ / g.camera.focal / (1f - g.tuning.cameraFollow)
        var caught = 0
        var t = 0f
        var moving = false
        while (t < 120f && !g.finished) {
            val r = g.robot
            val hostile = r.state == RobotState.ALERT || r.state == RobotState.CHASE ||
                r.state == RobotState.INVESTIGATE || r.state == RobotState.SEARCH ||
                r.suspicion > 0.3f
            if (hostile && !g.player.inCover) {
                // Head for the cover spot furthest from the robot's x that is still close.
                val covers = g.tuning.coverX.indices.filter {
                    !(g.robotBlocksStrip() && abs(g.robot.x - g.tuning.coverX[it]) < 0.4f)
                }
                val best = covers.minByOrNull { abs(g.tuning.coverX[it] - g.player.x) - 0.3f * abs(g.tuning.coverX[it] - r.x) }
                if (best != null) {
                    if (g.aiming) g.endAim()
                    if (!moving) {
                        g.beginMove(500f)
                        moving = true
                    }
                    val want = g.tuning.coverX[best]
                    g.updateMove(500f + (want - g.player.x) / metresPerFingerPx + 1f)
                }
            } else {
                if (moving) {
                    g.endMove()
                    moving = false
                }
                val safeToShoot = !hostile
                val target = g.drones.filter { it.hittable }.minByOrNull { it.z }
                if (safeToShoot && target != null) {
                    val lead = g.tuning.boltTravel
                    val px = g.camera.screenX(target.x + target.vx * lead, target.z + target.vz * lead)
                    val py = g.camera.screenY(target.visibleY() + target.vy * lead, target.z + target.vz * lead)
                    if (!g.aiming) g.beginAim(px, py) else g.updateAim(px, py)
                } else if (g.aiming) {
                    g.endAim()
                }
            }
            g.step(dt)
            t += dt
            caught += g.events.count { it == GameEvent.Caught }
            g.events.clear()
        }
        return Result(g.phase == Phase.COMPLETE, caught, g.timeLeft, g.kills)
    }

    @Test
    fun playerUsingCoverCanWinLevel3() {
        val results = (1L..8L).map { playWithCover(it) }
        val wins = results.count { it.won }
        val summary = results.joinToString { "won=${it.won} kills=${it.kills} caught=${it.caught} left=${"%.1f".format(it.timeLeft)}" }
        println("cover bot: $summary")
        assertTrue("a careful player should usually finish in time: $summary", wins >= 6)
    }
}
