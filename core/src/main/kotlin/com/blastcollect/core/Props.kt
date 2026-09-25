package com.blastcollect.core

/** A static scenery / cover sprite standing on the floor (bottom-centre anchor). */
data class Prop(val layer: String, val x: Float, val z: Float, val cover: Int = -1)

object Level3Props {
    /**
     * Cover objects sit just beyond the front strip, lined up on screen with the three
     * cover spots in [Level3Tuning.coverX]; the other crates are scenery the robot walks
     * past. Positions follow the composition of reference/2376.png.
     */
    val all = listOf(
        Prop("cover_crates_mid_2", -1.55f, 8.3f),
        Prop("cover_crates_mid_3", 1.35f, 3.95f),
        Prop("cover_forklift_right", 0.80f, 3.0f, cover = 2),
        Prop("cover_crates_left", -0.62f, 2.85f, cover = 0),
        Prop("cover_crates_mid_1", 0.02f, 3.3f, cover = 1),
    )
}
