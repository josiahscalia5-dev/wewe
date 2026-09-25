package com.blastcollect.game.game

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import com.blastcollect.core.ArtMetrics
import com.blastcollect.core.DroneState
import com.blastcollect.core.EffectKind
import com.blastcollect.core.Facing
import com.blastcollect.core.Level3
import com.blastcollect.core.Level3Props
import com.blastcollect.core.RobotState
import com.blastcollect.core.Stage
import com.blastcollect.game.art.ArtLayer
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.art.Layers
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/**
 * Draws the Level 3 world (everything except the Compose HUD) in stage coordinates.
 * Draw order: background → floor props / robot / drones by depth → effects →
 * astronaut → blaster arm → muzzle flash → laser bolts → crosshair.
 */
class WorldRenderer(private val art: ArtLibrary) {
    private val bitmapPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
    private val addPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply {
        xfermode = PorterDuffXfermode(PorterDuff.Mode.ADD)
    }
    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
    }
    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val dst = RectF()
    private val tmp = RectF()
    private val shadow: Bitmap = makeShadow()

    private sealed interface DepthItem {
        val z: Float
    }

    private class PropItem(val index: Int, override val z: Float) : DepthItem
    private class DroneItem(val index: Int, override val z: Float) : DepthItem
    private class RobotItem(override val z: Float) : DepthItem

    private val items = ArrayList<DepthItem>(16)

    fun draw(c: Canvas, level: Level3, map: StageMapping, time: Float) {
        c.save()
        c.translate(map.offsetX, map.offsetY)
        c.scale(map.scale, map.scale)

        drawBackground(c, level)

        items.clear()
        Level3Props.all.forEachIndexed { i, p -> items += PropItem(i, p.z) }
        level.drones.forEachIndexed { i, d -> if (d.state != DroneState.EXPLODING) items += DroneItem(i, d.z) }
        items += RobotItem(level.robot.z)
        items.sortByDescending { it.z }
        for (it in items) {
            when (it) {
                is PropItem -> drawProp(c, level, it.index)
                is DroneItem -> drawDrone(c, level, it.index, time)
                is RobotItem -> drawRobot(c, level, time)
            }
        }

        drawEffects(c, level)
        drawAstronaut(c, level)
        drawBolts(c, level)
        drawCrosshair(c, level, time)
        c.restore()
    }

    // ------------------------------------------------------------------ helpers

    private fun layer(name: String): ArtLayer? = art[name]

    private fun drawLayer(c: Canvas, l: ArtLayer?, left: Float, top: Float, w: Float, h: Float, paint: Paint = bitmapPaint) {
        if (l == null) return
        dst.set(left, top, left + w, top + h)
        l.trimmedRect(dst, tmp)
        c.drawBitmap(l.bitmap, null, tmp, paint)
    }

    private fun makeShadow(): Bitmap {
        val b = Bitmap.createBitmap(256, 96, Bitmap.Config.ARGB_8888)
        val cv = Canvas(b)
        val p = Paint(Paint.ANTI_ALIAS_FLAG)
        p.shader = RadialGradient(128f, 48f, 128f, intArrayOf(Color.argb(170, 0, 0, 8), Color.argb(0, 0, 0, 8)), null, Shader.TileMode.CLAMP)
        cv.save()
        cv.scale(1f, 96f / 256f, 128f, 48f)
        cv.drawCircle(128f, 48f, 128f, p)
        cv.restore()
        return b
    }

    private fun drawShadow(c: Canvas, cx: Float, cy: Float, w: Float, h: Float, alpha: Int) {
        bitmapPaint.alpha = alpha
        dst.set(cx - w / 2f, cy - h / 2f, cx + w / 2f, cy + h / 2f)
        c.drawBitmap(shadow, null, dst, bitmapPaint)
        bitmapPaint.alpha = 255
    }

    // ------------------------------------------------------------------ background

    private fun drawBackground(c: Canvas, level: Level3) {
        val bg = layer("bg_warehouse")
        val shift = level.camera.backgroundShift()
        if (bg == null) {
            c.drawColor(Color.rgb(12, 14, 40))
            return
        }
        drawLayer(
            c, bg,
            ArtMetrics.BG_STAGE_LEFT + shift, ArtMetrics.BG_STAGE_TOP,
            ArtMetrics.BG_STAGE_W, ArtMetrics.BG_STAGE_H,
        )
    }

    // ------------------------------------------------------------------ props

    private fun drawProp(c: Canvas, level: Level3, index: Int) {
        val p = Level3Props.all[index]
        val l = layer(p.layer) ?: return
        val cam = level.camera
        val s = cam.pxPerMetre(p.z) / ArtMetrics.PROP_PX_PER_M
        val ax = cam.screenX(p.x, p.z)
        val ay = cam.screenY(0f, p.z)
        val w = l.canvasW * s
        val h = l.canvasH * s
        drawShadow(c, ax, ay - 4f * s, w * 1.05f, w * 0.22f, 150)
        drawLayer(c, l, ax - w / 2f, ay - (l.canvasH - ArtMetrics.PROP_ANCHOR_BOTTOM_PAD) * s, w, h)
    }

    // ------------------------------------------------------------------ robot

    private fun robotLayerName(level: Level3): String {
        val r = level.robot
        return when {
            r.state == RobotState.LUNGE -> "robot_grab_lunge"
            r.state == RobotState.ALERT -> "robot_alert"
            r.moving -> {
                val dir = when (r.facing) {
                    Facing.LEFT -> "left"
                    Facing.RIGHT -> "right"
                    Facing.FRONT -> "front"
                }
                val speedScale = if (r.state == RobotState.CHASE || r.state == RobotState.INVESTIGATE) 1.35f else 1f
                Layers.walk(dir, ((r.walkTime * 7.5f * speedScale).toInt()) % Layers.WALK_FRAMES)
            }
            r.facing == Facing.LEFT -> Layers.walk("left", 0)
            r.facing == Facing.RIGHT -> Layers.walk("right", 0)
            else -> "robot_scan_idle"
        }
    }

    private fun drawRobot(c: Canvas, level: Level3, time: Float) {
        val r = level.robot
        val cam = level.camera
        val s = cam.pxPerMetre(r.z) / ArtMetrics.ROBOT_PX_PER_M
        val ax = cam.screenX(r.x, r.z)
        val ay = cam.screenY(0f, r.z)
        val l = layer(robotLayerName(level))
        val w = ArtMetrics.ROBOT_W * s
        val h = ArtMetrics.ROBOT_H * s
        val left = ax - ArtMetrics.ROBOT_ANCHOR_X * s
        val top = ay - ArtMetrics.ROBOT_ANCHOR_Y * s

        drawShadow(c, ax, ay, 1.25f * cam.pxPerMetre(r.z), 0.34f * cam.pxPerMetre(r.z), 200)

        // Reflection on the glossy floor.
        c.save()
        c.clipRect(left - w, ay, left + 2 * w, ay + h)
        c.scale(1f, -1f, ax, ay)
        bitmapPaint.alpha = 46
        drawLayer(c, l, left, top, w, h)
        bitmapPaint.alpha = 255
        c.restore()

        drawLayer(c, l, left, top, w, h)

        // Eyes flare when the robot is hunting.
        val flare = r.eyeFlare
        if (flare > 0.3f && r.facing == Facing.FRONT) {
            val glow = layer("glow_red")
            val pulse = 0.85f + 0.15f * sin(time * 14f)
            val gs = cam.pxPerMetre(r.z) * (0.55f + 0.45f * flare) * pulse
            addPaint.alpha = (255 * ((flare - 0.3f) / 0.7f)).toInt().coerceIn(0, 255)
            val ey = ay - 1.83f * cam.pxPerMetre(r.z)
            drawLayer(c, glow, ax - gs / 2f, ey - gs / 2f, gs, gs, addPaint)
            addPaint.alpha = 255
        }
    }

    // ------------------------------------------------------------------ drones

    private fun drawDrone(c: Canvas, level: Level3, index: Int, time: Float) {
        val d = level.drones[index]
        val cam = level.camera
        val p = level.droneScreen(d)
        val s = cam.pxPerMetre(d.z) / ArtMetrics.DRONE_PX_PER_M
        val w = ArtMetrics.DRONE_W * s
        val h = ArtMetrics.DRONE_H * s
        val tilt = (d.vx * 7f).coerceIn(-14f, 14f)
        c.save()
        c.rotate(tilt, p.x, p.y)
        drawLayer(c, layer("drone_body"), p.x - w / 2f, p.y - h / 2f, w, h)
        val frame = ((d.age + d.id * 0.37f) * 28f).toInt() % Layers.ROTOR_FRAMES
        drawLayer(c, layer(Layers.rotor(frame)), p.x - w / 2f, p.y - h / 2f, w, h)
        if (d.state == DroneState.HIT) {
            val a = 1f - d.stateTime / level.tuning.droneHitFlashTime
            bitmapPaint.alpha = (255 * a.coerceIn(0f, 1f)).toInt()
            drawLayer(c, layer("drone_hit_flash"), p.x - w / 2f, p.y - h / 2f, w, h)
            bitmapPaint.alpha = 255
        }
        c.restore()
    }

    // ------------------------------------------------------------------ effects

    private fun drawEffects(c: Canvas, level: Level3) {
        for (e in level.effects) {
            when (e.kind) {
                EffectKind.EXPLOSION -> {
                    val f = min(Layers.EXPLOSION_FRAMES - 1, (e.progress * Layers.EXPLOSION_FRAMES).toInt())
                    val w = ArtMetrics.DRONE_W * e.scale * 1.35f
                    drawLayer(c, layer(Layers.explosion(f)), e.x - w / 2f, e.y - w / 2f, w, w)
                }
                EffectKind.SPARK, EffectKind.ROBOT_SPARK -> {
                    val size = 150f * e.scale * (0.6f + 0.9f * e.progress) * if (e.kind == EffectKind.ROBOT_SPARK) 1.6f else 1f
                    addPaint.alpha = (255 * (1f - e.progress)).toInt().coerceIn(0, 255)
                    drawLayer(c, layer("impact_spark"), e.x - size / 2f, e.y - size / 2f, size, size, addPaint)
                    addPaint.alpha = 255
                }
            }
        }
    }

    // ------------------------------------------------------------------ astronaut

    private fun astronautLayerName(level: Level3): String {
        val p = level.player
        return when {
            p.stunned -> "astro_stunned"
            p.ducked -> "astro_duck_cover"
            abs(p.velocity) > 0.05f -> {
                val dir = if (p.velocity < 0f) "left" else "right"
                Layers.strafe(dir, ((p.runTime * 11f).toInt()) % Layers.STRAFE_FRAMES)
            }
            level.muzzleFlash > 0f -> "astro_fire"
            else -> "astro_aim_idle"
        }
    }

    private fun drawAstronaut(c: Canvas, level: Level3) {
        val p = level.player
        val a = level.astronautAnchor()
        val s = level.astronautScale()
        val w = ArtMetrics.ASTRO_W * s
        val h = ArtMetrics.ASTRO_H * s
        val left = a.x - ArtMetrics.ASTRO_ANCHOR_X * s
        val top = a.y - ArtMetrics.ASTRO_ANCHOR_Y * s
        drawLayer(c, layer(astronautLayerName(level)), left, top, w, h)

        if (p.stunned || p.ducked) return
        val sh = level.shoulder()
        c.save()
        c.rotate(level.armAngle, sh.x, sh.y)
        drawLayer(
            c, layer("astro_arm_blaster"),
            sh.x - ArtMetrics.ARM_PIVOT_X * s, sh.y - ArtMetrics.ARM_PIVOT_Y * s,
            ArtMetrics.ARM_W * s, ArtMetrics.ARM_H * s,
        )
        c.restore()

        if (level.muzzleFlash > 0f) {
            val m = level.muzzle()
            val k = level.muzzleFlash / level.tuning.muzzleFlashTime
            val size = 330f * s * (0.75f + 0.5f * k)
            c.save()
            c.rotate(level.armAngle, m.x, m.y)
            addPaint.alpha = (255 * min(1f, 0.4f + k)).toInt()
            drawLayer(c, layer("muzzle_flash"), m.x - size * 0.35f, m.y - size / 2f, size, size, addPaint)
            addPaint.alpha = 255
            c.restore()
        }
    }

    // ------------------------------------------------------------------ bolts

    private fun drawBolts(c: Canvas, level: Level3) {
        val l = layer("laser_bolt") ?: return
        for (b in level.bolts) {
            val t = b.progress
            val hx = b.fromX + (b.toX - b.fromX) * t
            val hy = b.fromY + (b.toY - b.fromY) * t
            val t0 = max(0f, t - 0.55f)
            val tx = b.fromX + (b.toX - b.fromX) * t0
            val ty = b.fromY + (b.toY - b.fromY) * t0
            val len = hypot(hx - tx, hy - ty)
            if (len < 1f) continue
            val ang = Math.toDegrees(atan2((hy - ty).toDouble(), (hx - tx).toDouble())).toFloat()
            // Thicker near the gun, thinner far away.
            val thick = 70f * (1f - 0.45f * t)
            c.save()
            c.rotate(ang, tx, ty)
            drawLayer(c, l, tx, ty - thick / 2f, len, thick, addPaint)
            c.restore()
        }
    }

    // ------------------------------------------------------------------ crosshair (drawn in code)

    private fun drawCrosshair(c: Canvas, level: Level3, time: Float) {
        val x = level.aimX
        val y = level.aimY
        val active = level.aiming
        val a = if (active) 1f else 0.7f
        val r = Stage.W * 0.078f
        val cyan = Color.rgb(90, 200, 255)
        // Glow passes.
        for (i in 4 downTo 1) {
            strokePaint.color = cyan
            strokePaint.alpha = (a * 255 * 0.12f * (5 - i) / 4f).toInt()
            strokePaint.strokeWidth = 5f + i * 6f
            c.drawCircle(x, y, r, strokePaint)
            c.drawLine(x, y - r * 1.42f, x, y - r * 0.52f, strokePaint)
            c.drawLine(x, y + r * 0.52f, x, y + r * 1.42f, strokePaint)
            c.drawLine(x - r * 1.42f, y, x - r * 0.52f, y, strokePaint)
            c.drawLine(x + r * 0.52f, y, x + r * 1.42f, y, strokePaint)
        }
        strokePaint.color = Color.rgb(235, 248, 255)
        strokePaint.alpha = (255 * a).toInt()
        strokePaint.strokeWidth = 6f
        c.drawCircle(x, y, r, strokePaint)
        strokePaint.strokeWidth = 6.5f
        c.drawLine(x, y - r * 1.42f, x, y - r * 0.52f, strokePaint)
        c.drawLine(x, y + r * 0.52f, x, y + r * 1.42f, strokePaint)
        c.drawLine(x - r * 1.42f, y, x - r * 0.52f, y, strokePaint)
        c.drawLine(x + r * 0.52f, y, x + r * 1.42f, y, strokePaint)
        // Magenta core spark.
        val pulse = 0.8f + 0.2f * sin(time * 9f)
        fillPaint.shader = RadialGradient(
            x, y, r * 0.42f * pulse,
            intArrayOf(Color.argb((255 * a).toInt(), 255, 235, 255), Color.argb((200 * a).toInt(), 255, 60, 220), Color.argb(0, 255, 60, 220)),
            floatArrayOf(0f, 0.3f, 1f), Shader.TileMode.CLAMP,
        )
        c.drawCircle(x, y, r * 0.42f * pulse, fillPaint)
        fillPaint.shader = null
    }
}
