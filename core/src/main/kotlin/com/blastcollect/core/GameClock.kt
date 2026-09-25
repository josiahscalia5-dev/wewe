package com.blastcollect.core

/**
 * The one game clock. Real frame time goes in, whole fixed steps come out. While paused
 * nothing accumulates, so resuming continues from exactly the same state.
 */
class GameClock(val step: Float = 1f / 120f, private val maxFrame: Float = 0.1f) {
    var paused = false
    /** Game seconds simulated so far. */
    var time = 0.0
        private set
    private var accumulator = 0f

    /** Adds [realDt] seconds of real time and returns how many fixed steps to run. */
    fun advance(realDt: Float): Int {
        if (paused || realDt <= 0f) return 0
        accumulator += realDt.coerceAtMost(maxFrame)
        var n = 0
        while (accumulator >= step) {
            accumulator -= step
            n++
        }
        time += n * step
        return n
    }

    /** Fraction of a step left over, for render interpolation. */
    val alpha: Float get() = accumulator / step
}
