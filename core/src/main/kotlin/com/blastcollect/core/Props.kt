package com.blastcollect.core

/** A static scenery / cover sprite standing on the floor (bottom-centre anchor). */
data class Prop(val layer: String, val x: Float, val z: Float, val cover: Int = -1)

object Level3Props {
    /**
     * Cover objects sit just beyond the front strip, lined up on screen with the three
     * cover spots in [Level3Tuning.coverX]. At the start the forklift stands where
     * reference/2376.png shows it; mid-ground crates are part of bg_warehouse.
     */
    val all = listOf(
        // Each crate stack stands just beyond the strip, right behind the astronaut when he
        // is at its cover spot (x scaled by depth so it lines up on screen).
        Prop("cover_crates_left", -0.806f, 2.6f, cover = 0),
        Prop("cover_crates_mid_1", 0.65f, 2.6f, cover = 1),
    )
}
