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

/** A sparkle on the Home screen: centre, size (fractions like [Spot]) and its art layer. */
data class Sparkle(val cx: Float, val cy: Float, val size: Float, val layer: String)

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
        /** logo_title canvas = reference screen x 0.05..0.98, y 0.10..0.33 (see flat.js LOGO). */
        val logo = Spot(cx = 0.515f, cy = 0.1964f, w = 0.93f, h = 0.5068f)

        /** hero_robot canvas (1600x1500), fitted to 12 keypoints measured on the reference. */
        val heroRobot = Spot(cx = 0.4906f, cy = 0.5296f, w = 1.0539f, h = 0.9880f)
        /** Cannon muzzle inside the hero_robot canvas (fractions), where the flash is centred. */
        const val heroMuzzleU = 0.7825f
        const val heroMuzzleV = 0.6007f
        /** hero_muzzle_flash size (fraction of width); its core sits 35% from its left edge. */
        const val heroMuzzleSize = 0.36f

        // Creature canvases: the painted silhouette (body + nubs) is ~70% of the canvas.
        val creatureBlue = Spot(cx = 0.141f, cy = 0.3676f, w = 0.334f, h = 0.334f)
        val creatureYellow = Spot(cx = 0.650f, cy = 0.3298f, w = 0.210f, h = 0.210f)
        val creatureGreen = Spot(cx = 0.840f, cy = 0.3687f, w = 0.274f, h = 0.274f)
        val creatureRed = Spot(cx = 0.808f, cy = 0.4643f, w = 0.268f, h = 0.268f)
        val creaturePurple = Spot(cx = 0.100f, cy = 0.5273f, w = 0.168f, h = 0.168f)
        val creatureBlueSmall = Spot(cx = 0.870f, cy = 0.6513f, w = 0.131f, h = 0.131f)

        /** Coloured 4-point sparkles measured on the reference: cx, cy, size, layer. */
        val sparkles = listOf(
            Sparkle(0.125f, 0.0626f, 0.065f, "sparkle_orange"),
            Sparkle(0.349f, 0.0804f, 0.065f, "sparkle_cyan"),
            Sparkle(0.100f, 0.1429f, 0.056f, "sparkle"),
            Sparkle(0.125f, 0.1712f, 0.041f, "sparkle_orange"),
            Sparkle(0.909f, 0.1366f, 0.130f, "sparkle"),
            Sparkle(0.510f, 0.3141f, 0.056f, "sparkle"),
            Sparkle(0.336f, 0.3393f, 0.106f, "sparkle"),
            Sparkle(0.455f, 0.3435f, 0.041f, "sparkle_cyan"),
            Sparkle(0.538f, 0.3550f, 0.032f, "sparkle_cyan"),
            Sparkle(0.897f, 0.3057f, 0.065f, "sparkle_green"),
            Sparkle(0.716f, 0.3950f, 0.048f, "sparkle"),
            Sparkle(0.720f, 0.4128f, 0.041f, "sparkle"),
            Sparkle(0.162f, 0.4527f, 0.072f, "sparkle_green"),
            Sparkle(0.946f, 0.4538f, 0.056f, "sparkle_cyan"),
            Sparkle(0.180f, 0.5620f, 0.065f, "sparkle"),
            Sparkle(0.910f, 0.5221f, 0.032f, "sparkle_pink"),
            Sparkle(0.056f, 0.4275f, 0.032f, "sparkle_orange"),
        )

        val taglineCy = floatArrayOf(0.6586f, 0.6933f, 0.7269f)
        const val taglineSize = 0.071f

        val playButton = Spot(cx = 0.4994f, cy = 0.796f, w = 0.732f, h = 0.172f)
        const val playTextSize = 0.115f

        val navBar = Spot(cx = 0.50f, cy = 0.9264f, w = 0.96f, h = 0.198f)
        const val navIconSize = 0.105f // of screen width
        const val navIconCy = 0.36f // of nav bar height
        const val navLabelCy = 0.73f
        const val navLabelSize = 0.052f
    }
}
