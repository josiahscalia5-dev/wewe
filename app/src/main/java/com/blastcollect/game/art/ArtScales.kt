package com.blastcollect.game.art

import com.blastcollect.core.ArtMetrics
import com.blastcollect.core.Level3Props
import com.blastcollect.core.Level3Tuning
import com.blastcollect.core.Stage
import kotlin.math.max

/**
 * Chooses how large each art layer is kept in memory for this screen: never more than
 * the largest size it is drawn at (so nothing is upscaled from a shrunken copy), and
 * never upscaled beyond the stored art.
 */
class ArtScales(private val screenW: Float, private val screenH: Float) {
    /** Device px per stage px (scale-to-cover). */
    private val stage = max(screenW / Stage.W, screenH / Stage.H)

    fun loadHome(art: ArtLibrary) {
        // Background: cover the screen.
        art.load("bg_home", max(screenW / 1440f, screenH / 3120f) * 1.02f)
        // Foreground Home art is drawn at up to ~0.9 of the screen width.
        for (n in Layers.home) if (n != "bg_home") art.load(n, 1f)
        for (n in Layers.hudIcons) art.load(n, 1f)
    }

    fun loadLevel3(art: ArtLibrary) {
        art.load("bg_warehouse", stage * ArtMetrics.BG_STAGE_W / ArtMetrics.BG_PX_W * 1.02f)
        // Largest on-screen scale of each family (stage px per sprite px), see Level3Tuning.
        val t = Level3Tuning()
        val robotMax = 1400f / (t.playerZ + t.robotFrontGap - 0.05f) / ArtMetrics.ROBOT_PX_PER_M
        val astroMax = 1400f / t.playerZ / ArtMetrics.ASTRO_PX_PER_M
        val droneMax = 1400f / 3.5f / ArtMetrics.DRONE_PX_PER_M * 1.35f
        val propMax = 1400f / Level3Props.all.minOf { it.z } / ArtMetrics.PROP_PX_PER_M
        art.preload(Layers.robot, stage * robotMax)
        art.preload(Layers.astronaut, stage * astroMax)
        art.preload(Layers.drone, stage * droneMax)
        art.preload(Layers.props, stage * propMax)
        art.preload(Layers.effects, 1f)
        art.preload(Layers.hudIcons, 1f)
    }
}
