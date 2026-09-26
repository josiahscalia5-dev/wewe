package com.blastcollect.core

/**
 * Pixel geometry of the sprite layers in /art that the rules depend on (anchors,
 * pivots, scale). The art pipeline in tools/art renders every layer to these numbers;
 * replacement production art must keep them or update this file.
 */
object ArtMetrics {
    // bg_warehouse.png (supplied art, tools/art/import_level3.py) covers the stage
    // exactly; the Level 3 camera is fixed, so it never pans.
    const val BG_STAGE_LEFT = 0f
    const val BG_STAGE_TOP = 0f
    const val BG_STAGE_W = 1080f
    const val BG_STAGE_H = 2340f
    const val BG_PX_W = 1520
    const val BG_PX_H = 3293

    // Astronaut frames (astro_*.png), seen from behind; each aim pose holds the blaster.
    const val ASTRO_W = 1500
    const val ASTRO_H = 1400
    const val ASTRO_ANCHOR_X = 750f // between the feet
    const val ASTRO_ANCHOR_Y = 1370f
    const val ASTRO_PX_PER_M = 780f
    /** Aim origin on the upper torso (the laser angle is measured from here). */
    const val ASTRO_SHOULDER_X = 843.6f
    const val ASTRO_SHOULDER_Y = 761.6f

    /** Aim poses: layer, blaster muzzle (canvas px) and the angle it points at (deg, − = up). */
    val AIM_POSES = arrayOf("astro_aim_right", "astro_aim_upright", "astro_aim_up", "astro_aim_upleft")
    val AIM_MUZZLE_X = floatArrayOf(1368.4f, 1329.2f, 1067.2f, 314.4f)
    val AIM_MUZZLE_Y = floatArrayOf(588.1f, 194.2f, 155.8f, 190.8f)
    val AIM_DEG = floatArrayOf(-18.3f, -49.4f, -69.7f, -132.8f)

    /** Aim angle limits in degrees (screen coordinates: negative = up). */
    const val ARM_MIN_DEG = -168f
    const val ARM_MAX_DEG = -8f
    /** Aim angle before the first touch (up and to the right, as in reference 2376). */
    const val ARM_REST_DEG = -58f

    // Robot frames (robot_*.png).
    const val ROBOT_W = 1300
    const val ROBOT_H = 1100
    const val ROBOT_ANCHOR_X = 650f
    const val ROBOT_ANCHOR_Y = 1075f
    const val ROBOT_PX_PER_M = 450f
    /** Height of the robot's glowing visor above its feet. */
    const val ROBOT_EYE_M = 1.49f

    // Props (cover_*.png): bottom-centre anchor, same scale for every prop.
    const val PROP_PX_PER_M = 700f
    const val PROP_ANCHOR_BOTTOM_PAD = 140f

    // Drone frames (drone_*.png), body centre in the middle of the canvas.
    const val DRONE_W = 1000
    const val DRONE_H = 1000
    const val DRONE_PX_PER_M = 560f
}
