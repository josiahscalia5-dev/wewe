package com.blastcollect.game.game

import com.blastcollect.core.Stage
import kotlin.math.max

/**
 * Maps the 1080x2340 design stage onto the real window: uniform scale-to-cover (never
 * stretched), centred horizontally. On screens shorter than 19.5:9 the extra stage
 * height is cropped a little more from the top, where the HUD sits anyway.
 */
class StageMapping {
    var scale = 1f
        private set
    var offsetX = 0f
        private set
    var offsetY = 0f
        private set
    var viewW = 0f
        private set
    var viewH = 0f
        private set

    fun update(w: Int, h: Int) {
        viewW = w.toFloat()
        viewH = h.toFloat()
        scale = max(viewW / Stage.W, viewH / Stage.H)
        offsetX = (viewW - Stage.W * scale) / 2f
        offsetY = (viewH - Stage.H * scale) * 0.6f
    }

    fun toStageX(px: Float) = (px - offsetX) / scale
    fun toStageY(py: Float) = (py - offsetY) / scale
    fun toViewX(sx: Float) = offsetX + sx * scale
    fun toViewY(sy: Float) = offsetY + sy * scale
}
