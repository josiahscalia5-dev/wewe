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
        // Each cover prop stands just beyond the strip where it hides the astronaut when he
        // is at its cover spot (the follow camera keeps him in the lower-left of the screen).
        Prop("cover_forklift_right", 0.85f, 3.3f, cover = 1),
        Prop("cover_crates_mid_1", 1.47f, 2.85f, cover = 2),
        Prop("cover_crates_left", -1.07f, 2.75f, cover = 0),
    )
}
