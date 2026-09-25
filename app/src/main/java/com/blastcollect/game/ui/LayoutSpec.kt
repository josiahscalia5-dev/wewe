package com.blastcollect.game.ui

/**
 * Every Home and Level 3 HUD position, as fractions of the safe area
 * (WindowInsets.safeDrawing): [cx] and [w]/[h] are fractions of the safe WIDTH (so
 * proportions hold on 19.5:9 to 21:9 phones), [cy] is a fraction of the safe HEIGHT.
 *
 * Values were measured from reference/2371.png (Home) and reference/2376.png (Level 3),
 * inside the phone bezel, then converted to safe-area fractions assuming the reference's
 * system bars take the top 2.8% and bottom 2% of the screen, like a typical Android
 * status bar and gesture bar: safeY = (refY - 0.028) / 0.952.
 */
data class Spot(val cx: Float, val cy: Float, val w: Float, val h: Float)

object LayoutSpec {

    object Level3 {
        val pause = Spot(cx = 0.097f, cy = 0.0599f, w = 0.131f, h = 0.131f)
        val levelPill = Spot(cx = 0.495f, cy = 0.0588f, w = 0.43f, h = 0.103f)
        val timerPill = Spot(cx = 0.8505f, cy = 0.0583f, w = 0.2585f, h = 0.1047f)
        val objectivePanel = Spot(cx = 0.5038f, cy = 0.1505f, w = 0.924f, h = 0.193f)
        val weaponPanel = Spot(cx = 0.3058f, cy = 0.937f, w = 0.5486f, h = 0.179f)
        val coinPanel = Spot(cx = 0.8008f, cy = 0.937f, w = 0.3581f, h = 0.179f)

        // Inside the objective panel (fractions of the panel's own width/height).
        const val objIconCx = 0.113f
        const val objIconSize = 0.185f // of panel width
        const val objTitleLeft = 0.232f
        const val objTitleTop = 0.17f
        const val objTitleSize = 0.064f // text size, of panel width
        const val objSegLeft = 0.242f
        const val objSegTop = 0.55f
        const val objSegW = 0.039f
        const val objSegH = 0.235f // of panel height
        const val objSegGap = 0.0085f
        const val objCountRight = 0.935f
        const val objCountSize = 0.094f

        // Inside the weapon panel.
        const val wpnSegLeft = 0.305f
        const val wpnSegW = 0.074f
        const val wpnSegH = 0.33f
        const val wpnSegGap = 0.022f
        const val wpnInfLeft = 0.815f

        // Inside the coin panel.
        const val coinIconCx = 0.28f
        const val coinIconSize = 0.37f
        const val coinTextLeft = 0.5f

        /** Touches below this fraction of the view height steer the astronaut; above it they aim. */
        const val moveZoneTop = 0.62f
        /** Crosshair offset above the aiming finger. */
        const val aimOffsetDp = 80f
    }

    object Home {
        val coinCapsule = Spot(cx = 0.655f, cy = 0.0513f, w = 0.335f, h = 0.068f)
        val coinIcon = Spot(cx = 0.5237f, cy = 0.0513f, w = 0.0785f, h = 0.0785f)
        val plusButton = Spot(cx = 0.774f, cy = 0.0513f, w = 0.076f, h = 0.076f)
        val settingsButton = Spot(cx = 0.9078f, cy = 0.0510f, w = 0.1046f, h = 0.093f)
        val logo = Spot(cx = 0.546f, cy = 0.1964f, w = 0.98f, h = 0.519f)

        val heroRobot = Spot(cx = 0.47f, cy = 0.51f, w = 1.08f, h = 1.0214f)
        /** Blaster muzzle inside the hero_robot canvas (fractions), where the flash is centred. */
        const val heroMuzzleU = 0.8707f
        const val heroMuzzleV = 0.5174f
        /** hero_muzzle_flash size (fraction of width); its core sits 35% from its left edge. */
        const val heroMuzzleSize = 0.36f

        val creatureBlue = Spot(cx = 0.165f, cy = 0.360f, w = 0.338f, h = 0.338f)
        val creatureYellow = Spot(cx = 0.655f, cy = 0.323f, w = 0.230f, h = 0.230f)
        val creatureGreen = Spot(cx = 0.845f, cy = 0.370f, w = 0.270f, h = 0.270f)
        val creatureRed = Spot(cx = 0.805f, cy = 0.466f, w = 0.284f, h = 0.284f)
        val creaturePurple = Spot(cx = 0.098f, cy = 0.518f, w = 0.176f, h = 0.176f)
        val creatureBlueSmall = Spot(cx = 0.872f, cy = 0.654f, w = 0.128f, h = 0.128f)

        /** Sparkles: cx, cy, size (fraction of width). */
        val sparkles = listOf(
            floatArrayOf(0.12f, 0.070f, 0.060f),
            floatArrayOf(0.35f, 0.075f, 0.040f),
            floatArrayOf(0.10f, 0.165f, 0.050f),
            floatArrayOf(0.13f, 0.205f, 0.035f),
            floatArrayOf(0.92f, 0.175f, 0.075f),
            floatArrayOf(0.51f, 0.315f, 0.050f),
            floatArrayOf(0.33f, 0.345f, 0.065f),
            floatArrayOf(0.45f, 0.355f, 0.030f),
            floatArrayOf(0.60f, 0.40f, 0.030f),
            floatArrayOf(0.71f, 0.425f, 0.045f),
            floatArrayOf(0.16f, 0.455f, 0.055f),
            floatArrayOf(0.94f, 0.43f, 0.040f),
            floatArrayOf(0.18f, 0.575f, 0.050f),
            floatArrayOf(0.72f, 0.535f, 0.035f),
            floatArrayOf(0.90f, 0.33f, 0.035f),
        )

        val taglineCy = floatArrayOf(0.6586f, 0.6933f, 0.7269f)
        const val taglineSize = 0.071f

        val playButton = Spot(cx = 0.4994f, cy = 0.796f, w = 0.732f, h = 0.172f)
        const val playTextSize = 0.108f

        val navBar = Spot(cx = 0.50f, cy = 0.9264f, w = 0.96f, h = 0.198f)
        const val navIconSize = 0.105f // of screen width
        const val navIconCy = 0.36f // of nav bar height
        const val navLabelCy = 0.73f
        const val navLabelSize = 0.052f
    }
}
