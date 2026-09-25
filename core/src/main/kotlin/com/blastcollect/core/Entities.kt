package com.blastcollect.core

enum class Phase { INTRO, PLAYING, COMPLETING, COMPLETE, FAILED }

enum class Facing { LEFT, RIGHT, FRONT }

enum class RobotState { PATROL, SCAN, ALERT, CHASE, INVESTIGATE, SEARCH, LUNGE, RETREAT, IDLE }

enum class DroneState { FLYING, HIT, EXPLODING }

class Player(var x: Float) {
    /** Index into [Level3Tuning.coverX], or -1 when not at a cover spot. */
    var cover = -1
    /** 0 = ducked behind cover, 1 = standing. Always 1 away from cover. */
    var stand = 1f
    var stunTimer = 0f
    var knockVelocity = 0f
    var knockTimer = 0f
    /** Signed horizontal speed this step, for the strafe animation. */
    var velocity = 0f
    var runTime = 0f
    /** Cover spot the player just left; it cannot re-snap until they are clear of it. */
    var ignoreCover = -1

    val stunned: Boolean get() = stunTimer > 0f
    val inCover: Boolean get() = cover >= 0
    val ducked: Boolean get() = inCover && stand < 0.5f
    val exposed: Boolean get() = !ducked
}

class Drone(
    val id: Int,
    var x: Float,
    var y: Float,
    var z: Float,
) {
    var vx = 0f
    var vy = 0f
    var vz = 0f
    var speed = 1.2f
    var targetX = x
    var targetY = y
    var targetZ = z
    var retarget = 0f
    var state = DroneState.FLYING
    var stateTime = 0f
    var age = 0f
    val bobPhase = (id * 1.7f) % 6.283f
    var dipping = false
    var frozen = false

    /** Current height including the bob, which is what the player sees and shoots at. */
    fun visibleY(): Float = y + 0.11f * kotlin.math.sin(age * 4.4f + bobPhase)

    val hittable: Boolean get() = state == DroneState.FLYING
}

class Robot(var x: Float, var z: Float) {
    var state = RobotState.PATROL
    var stateTimer = 0f
    var facing = Facing.LEFT
    var moving = false
    var walkTime = 0f
    var waypointX = x
    var waypointZ = z
    var hasWaypoint = false
    var retarget = 0f
    var suspicion = 0f
    var grace = 0f
    var lastSeenX = 0f
    var searchStep = 0
    var frozen = false
    /** Eye flare 0..1 for the renderer (alert / chase). */
    var eyeFlare = 0f
}

class Bolt(
    val fromX: Float,
    val fromY: Float,
    val toX: Float,
    val toY: Float,
    val duration: Float,
) {
    var t = 0f
    val progress: Float get() = (t / duration).coerceIn(0f, 1f)
}

enum class EffectKind { EXPLOSION, SPARK, ROBOT_SPARK }

class Effect(val kind: EffectKind, val x: Float, val y: Float, val scale: Float, val duration: Float) {
    var t = 0f
    val progress: Float get() = (t / duration).coerceIn(0f, 1f)
}

sealed interface GameEvent {
    data object Fire : GameEvent
    data class Kill(val kills: Int) : GameEvent
    data object Miss : GameEvent
    data object Blocked : GameEvent
    data object Overheat : GameEvent
    data object Alert : GameEvent
    data object Caught : GameEvent
    data object EnterCover : GameEvent
    data object LeaveCover : GameEvent
    data class TimerTick(val secondsLeft: Int) : GameEvent
    data object Complete : GameEvent
    data object Fail : GameEvent
}
