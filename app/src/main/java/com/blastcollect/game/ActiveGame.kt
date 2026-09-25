package com.blastcollect.game

import com.blastcollect.core.Level3
import com.blastcollect.game.game.GameView

/**
 * The running level and view, exposed so instrumented tests can observe the real game
 * (always accessed on the main thread). Holds nothing in production beyond references.
 */
object ActiveGame {
    @Volatile
    var level: Level3? = null

    @Volatile
    var view: GameView? = null

    @Volatile
    var screen: String = "home"

    @Volatile
    var wallet: Int = -1
}
