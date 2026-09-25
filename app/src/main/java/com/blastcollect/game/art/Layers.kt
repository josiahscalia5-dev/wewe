package com.blastcollect.game.art

/** Names of the art layers in /art (brief section 4). */
object Layers {
    const val STRAFE_FRAMES = 6
    const val WALK_FRAMES = 6
    const val ROTOR_FRAMES = 4
    const val EXPLOSION_FRAMES = 8

    val home = listOf(
        "bg_home", "logo_title", "hero_robot", "hero_muzzle_flash",
        "creature_blue", "creature_yellow", "creature_green", "creature_red", "creature_purple",
        "sparkle", "coin", "gear", "plus", "nav_home", "nav_missions", "nav_shop", "nav_profile",
    )

    val hudIcons = listOf("icon_drone", "icon_stopwatch", "icon_blaster", "icon_coin_star")

    fun strafe(dir: String, i: Int) = "astro_strafe_${dir}_${i + 1}"
    fun walk(dir: String, i: Int) = "robot_walk_${dir}_${i + 1}"
    fun rotor(i: Int) = "drone_rotor_${i + 1}"
    fun explosion(i: Int) = "drone_explosion_${i + 1}"

    val astronaut: List<String> = buildList {
        add("astro_aim_idle"); add("astro_fire"); add("astro_duck_cover"); add("astro_stunned"); add("astro_arm_blaster")
        for (d in listOf("left", "right")) for (i in 0 until STRAFE_FRAMES) add(strafe(d, i))
    }

    val robot: List<String> = buildList {
        for (d in listOf("left", "right", "front")) for (i in 0 until WALK_FRAMES) add(walk(d, i))
        add("robot_scan_idle"); add("robot_alert"); add("robot_grab_lunge")
    }

    val drone: List<String> = buildList {
        add("drone_body"); add("drone_hit_flash")
        for (i in 0 until ROTOR_FRAMES) add(rotor(i))
        for (i in 0 until EXPLOSION_FRAMES) add(explosion(i))
    }

    val props = listOf(
        "cover_crates_left", "cover_forklift_right", "cover_crates_mid_1", "cover_crates_mid_2", "cover_crates_mid_3",
    )

    val effects = listOf("laser_bolt", "impact_spark", "muzzle_flash", "glow_red", "glow_cyan")

    val level3World: List<String> = listOf("bg_warehouse") + props + astronaut + robot + drone + effects
}
