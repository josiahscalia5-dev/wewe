package com.blastcollect.core

/**
 * The 2.5D stage shared by the game rules, the renderer and the art pipeline.
 *
 * Screen space is the portrait design canvas ([W] x [H] "stage px"); the app scales it
 * to cover the real window. World space is metres: x = left/right, y = up, z = depth
 * away from the camera. The camera is fixed (over the astronaut's shoulder) with no
 * pitch, so verticals stay vertical; the horizon is shifted with a lens offset.
 *
 * tools/art/studio/camera.js must use exactly these numbers when it renders
 * bg_warehouse so that sprites stand on the painted floor.
 */
object Stage {
    const val W = 1080f
    const val H = 2340f
}

class StageCamera {
    /** Focal length in stage px. */
    val focal = 1400f
    /** Screen y of the horizon (vanishing point) in stage px. */
    val horizonY = 1170f
    /** Camera height above the floor in metres. */
    val height = 1.7f
    /** Screen x of the optical axis in stage px. */
    val centerX = Stage.W / 2f

    /** Camera x in metres; follows the player a little for the background parallax pan. */
    var panX = 0f

    fun screenX(x: Float, z: Float): Float = centerX + focal * (x - panX) / z
    fun screenY(y: Float, z: Float): Float = horizonY + focal * (height - y) / z

    /** Stage px per metre at depth [z]. */
    fun pxPerMetre(z: Float): Float = focal / z

    /** World x at depth [z] that projects to screen x [sx]. */
    fun worldX(sx: Float, z: Float): Float = (sx - centerX) * z / focal + panX

    /** Half-width of the visible floor strip at depth [z], in metres. */
    fun halfVisibleWidth(z: Float): Float = centerX * z / focal

    /**
     * Horizontal shift of the background image in stage px. The backdrop is treated as a
     * plane at [BACKDROP_Z] so the pan stays small (brief: ≈5% total).
     */
    fun backgroundShift(): Float = -focal * panX / BACKDROP_Z

    companion object {
        const val BACKDROP_Z = 8f
    }
}
