package com.blastcollect.game.game

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.view.Choreographer
import android.view.MotionEvent
import android.view.View
import com.blastcollect.core.GameEvent
import com.blastcollect.core.Level3
import com.blastcollect.core.Phase
import com.blastcollect.game.art.ArtLibrary
import com.blastcollect.game.ui.LayoutSpec
import kotlin.math.ceil

/** What the Compose HUD needs; published only when something visible changes. */
data class HudState(
    val kills: Int = 0,
    val required: Int = 20,
    val secondsLeft: Int = 90,
    val coins: Int = 0,
    val charge: Int = 5,
    val overheated: Boolean = false,
    val timerFlash: Boolean = false,
    val phase: Phase = Phase.INTRO,
    val paused: Boolean = false,
    val chargeSegments: Int = 5,
) {
    companion object {
        fun of(l: Level3) = HudState(
            kills = l.kills,
            required = l.tuning.requiredKills,
            secondsLeft = ceil(l.timeLeft.toDouble()).toInt(),
            coins = l.coinsEarned,
            charge = l.charge,
            overheated = l.overheat > 0f,
            timerFlash = l.timerFlash > 0f,
            phase = l.phase,
            paused = l.paused,
            chargeSegments = l.tuning.chargeSegments,
        )
    }
}

/**
 * Hosts the Level 3 world: drives the fixed-step game clock from Choreographer, draws
 * the world, and turns multitouch into moves (lower zone) and aim/fire (upper zone).
 * Both zones work at the same time.
 */
@SuppressLint("ViewConstructor")
class GameView(
    context: Context,
    art: ArtLibrary,
) : View(context), Choreographer.FrameCallback {

    var level: Level3? = null
        set(value) {
            if (field !== value) {
                movePointer = -1
                aimPointer = -1
            }
            field = value
        }

    var onHud: ((HudState) -> Unit)? = null
    var onEvents: ((List<GameEvent>) -> Unit)? = null

    private val renderer = WorldRenderer(art)
    val mapping = StageMapping()
    private var lastFrameNanos = 0L
    private var running = false
    private var lastHud: HudState? = null
    private var renderTime = 0f
    private val eventBuffer = ArrayList<GameEvent>()

    private var movePointer = -1
    private var aimPointer = -1
    private val aimOffsetPx = LayoutSpec.Level3.aimOffsetDp * resources.displayMetrics.density

    init {
        isClickable = true
        contentDescription = "Level 3 play area"
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        start()
    }

    override fun onDetachedFromWindow() {
        stop()
        super.onDetachedFromWindow()
    }

    fun start() {
        if (running) return
        running = true
        lastFrameNanos = 0L
        Choreographer.getInstance().postFrameCallback(this)
    }

    fun stop() {
        running = false
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        if (!running) return
        val dt = if (lastFrameNanos == 0L) 0f else ((frameTimeNanos - lastFrameNanos) / 1e9f)
        lastFrameNanos = frameTimeNanos
        val l = level
        if (l != null) {
            l.frame(dt)
            if (!l.paused) renderTime += dt
            if (l.events.isNotEmpty()) {
                eventBuffer.clear()
                eventBuffer.addAll(l.events)
                l.events.clear()
                onEvents?.invoke(eventBuffer)
            }
            val hud = HudState.of(l)
            if (hud != lastHud) {
                lastHud = hud
                onHud?.invoke(hud)
            }
        }
        invalidate()
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        mapping.update(w, h)
    }

    override fun onDraw(canvas: Canvas) {
        val l = level ?: return
        renderer.draw(canvas, l, mapping, renderTime)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(e: MotionEvent): Boolean {
        val l = level ?: return false
        if (l.paused || l.finished) {
            movePointer = -1
            aimPointer = -1
            return true
        }
        val moveTop = height * LayoutSpec.Level3.moveZoneTop
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                val i = e.actionIndex
                val id = e.getPointerId(i)
                val x = e.getX(i)
                val y = e.getY(i)
                if (y >= moveTop && movePointer == -1) {
                    movePointer = id
                    l.beginMove(mapping.toStageX(x))
                } else if (y < moveTop && aimPointer == -1) {
                    aimPointer = id
                    l.beginAim(mapping.toStageX(x), mapping.toStageY(y - aimOffsetPx))
                }
            }
            MotionEvent.ACTION_MOVE -> {
                for (i in 0 until e.pointerCount) {
                    val id = e.getPointerId(i)
                    if (id == movePointer) l.updateMove(mapping.toStageX(e.getX(i)))
                    if (id == aimPointer) l.updateAim(mapping.toStageX(e.getX(i)), mapping.toStageY(e.getY(i) - aimOffsetPx))
                }
            }
            MotionEvent.ACTION_POINTER_UP -> {
                val id = e.getPointerId(e.actionIndex)
                release(l, id)
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                if (movePointer != -1) l.endMove()
                if (aimPointer != -1) l.endAim()
                movePointer = -1
                aimPointer = -1
            }
        }
        return true
    }

    private fun release(l: Level3, id: Int) {
        if (id == movePointer) {
            l.endMove()
            movePointer = -1
        }
        if (id == aimPointer) {
            l.endAim()
            aimPointer = -1
        }
    }
}
