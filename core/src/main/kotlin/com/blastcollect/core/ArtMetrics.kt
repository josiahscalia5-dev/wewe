package com.blastcollect.core

/**
 * Pixel geometry of the sprite layers in /art that the rules depend on (anchors,
 * pivots, scale). The art pipeline in tools/art renders every layer to these numbers;
 * replacement production art must keep them or update this file.
 */
object ArtMetrics {
    // bg_warehouse.png covers this stage rectangle (extra width for the parallax pan).
    const val BG_STAGE_LEFT = -48f
    const val BG_STAGE_TOP = -30f
    const val BG_STAGE_W = 1176f
    const val BG_STAGE_H = 2400f
    const val BG_PX_W = 1568
    const val BG_PX_H = 3200

    // Astronaut body frames (astro_*.png), seen from behind.
    const val ASTRO_W = 900
    const val ASTRO_H = 1100
    const val ASTRO_ANCHOR_X = 450f // between the feet
    const val ASTRO_ANCHOR_Y = 1080f
    const val ASTRO_PX_PER_M = 780f
    /** Right shoulder (screen right) where the blaster arm is attached. */
    const val ASTRO_SHOULDER_X = 618f
    const val ASTRO_SHOULDER_Y = 590f

    // Blaster arm (astro_arm_blaster.png), drawn pointing along +x and rotated to the aim.
    const val ARM_W = 760
    const val ARM_H = 320
    const val ARM_PIVOT_X = 96f
    const val ARM_PIVOT_Y = 170f
    const val ARM_MUZZLE_X = 732f
    const val ARM_MUZZLE_Y = 150f
    /** Arm rotation limits in degrees (screen coordinates: negative = up). */
    const val ARM_MIN_DEG = -168f
    const val ARM_MAX_DEG = -8f
    /** Arm angle used when the player is not aiming (up and to the right, as in 2376). */
    const val ARM_REST_DEG = -58f

    // Robot frames (robot_*.png).
    const val ROBOT_W = 900
    const val ROBOT_H = 1100
    const val ROBOT_ANCHOR_X = 450f
    const val ROBOT_ANCHOR_Y = 1075f
    const val ROBOT_PX_PER_M = 450f

    // Props (cover_*.png): bottom-centre anchor, same scale for every prop.
    const val PROP_PX_PER_M = 420f
    const val PROP_ANCHOR_BOTTOM_PAD = 12f

    // Drone frames (drone_*.png), body centre in the middle of the canvas.
    const val DRONE_W = 800
    const val DRONE_H = 800
    const val DRONE_PX_PER_M = 560f
}
