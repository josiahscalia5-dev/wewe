package com.blastcollect.core

import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sign
import kotlin.math.sin
import kotlin.random.Random

/**
 * Level 3 — "SHOOT THE RED DRONES" while the patrol robot hunts the player.
 *
 * Pure game rules: no Android types. The app feeds real frame time into [frame] (or tests
 * call [step] directly), forwards touches through the input methods (stage px) and reads
 * the public state to draw the world and the HUD.
 */
class Level3(
    val tuning: Level3Tuning = Level3Tuning(),
    seed: Long = 3L,
) {
    val camera = StageCamera()
    val clock = GameClock()
    private val rng = Random(seed)

    var phase = Phase.INTRO
        private set
    var phaseTime = 0f
        private set
    var timeLeft = tuning.startTime
        private set
    var kills = 0
        private set
    /** Seconds of "timer flash" left after a catch penalty. */
    var timerFlash = 0f
        private set

    val player = Player(tuning.playerStartX)
    val robot = Robot(1.35f, 6.2f)

    init {
        camera.panX = player.x + tuning.cameraShoulder
    }
    val drones = mutableListOf<Drone>()
    val bolts = mutableListOf<Bolt>()
    val effects = mutableListOf<Effect>()

    /** Events produced since the app last drained them (sound, vibration, HUD flashes). */
    val events = mutableListOf<GameEvent>()

    // Weapon
    var charge = tuning.chargeSegments
        private set
    var overheat = 0f
        private set
    private var regen = 0f
    private var fireCooldown = 0f
    private var pendingShot = false
    /** Keeps the astronaut up after a tap from cover so the single shot can go off. */
    private var standHold = 0f
    /** After an overheat, holding the trigger waits for a full bar (a fresh tap fires sooner). */
    private var waitForFullCharge = false
    var muzzleFlash = 0f
        private set
    var totalShots = 0
        private set
    /** Running totals (the app drains [events] every frame; these are never cleared). */
    var catches = 0
        private set
    var alerts = 0
        private set

    // Input
    var aiming = false
        private set
    var aimX = Stage.W * 0.52f
        private set
    var aimY = Stage.H * 0.485f
        private set
    /** Current blaster arm angle in degrees (screen space, negative = up). */
    var armAngle = ArtMetrics.ARM_REST_DEG
        private set
    private var dragging = false
    private var dragFingerStart = 0f
    private var dragPlayerStart = 0f
    private var dragFinger = 0f

    private var nextDroneId = 1
    private var spawnTimer = 0.35f
    private var lastTick = -1

    // Debug switches (used by instrumented tests and the reference pose; never set in release UI).
    var freezeWorld = false
    var freezeTimer = false

    val coinsEarned: Int
        get() = kills / tuning.killsPerCoin + if (phase == Phase.COMPLETE) tuning.completionBonus else 0

    val bannerVisible: Boolean get() = phase == Phase.INTRO
    val finished: Boolean get() = phase == Phase.COMPLETE || phase == Phase.FAILED
    val paused: Boolean get() = clock.paused

    fun pause() {
        clock.paused = true
    }

    fun resume() {
        clock.paused = false
    }

    /** Advance by real frame time; runs zero or more fixed steps on the game clock. */
    fun frame(realDt: Float) {
        val n = clock.advance(realDt)
        repeat(n) { step(clock.step) }
    }

    // ---------------------------------------------------------------- input (stage px)

    fun beginMove(fingerX: Float) {
        dragging = true
        dragFingerStart = fingerX
        dragFinger = fingerX
        dragPlayerStart = player.x
    }

    fun updateMove(fingerX: Float) {
        dragFinger = fingerX
    }

    fun endMove() {
        dragging = false
    }

    fun beginAim(x: Float, y: Float) {
        aiming = true
        pendingShot = true
        waitForFullCharge = false
        standHold = tuning.popUpTime + 0.25f
        setAim(x, y)
    }

    fun updateAim(x: Float, y: Float) = setAim(x, y)

    fun endAim() {
        aiming = false
    }

    private fun setAim(x: Float, y: Float) {
        aimX = x.coerceIn(0f, Stage.W)
        aimY = y.coerceIn(0f, Stage.H)
    }

    // ---------------------------------------------------------------- simulation

    fun step(dt: Float) {
        phaseTime += dt
        when (phase) {
            Phase.INTRO -> if (phaseTime >= tuning.introBannerTime) setPhase(Phase.PLAYING)
            Phase.PLAYING -> {
                if (!freezeTimer && !freezeWorld) timeLeft -= dt
                emitTimerTicks()
                if (timeLeft <= 0f) {
                    timeLeft = 0f
                    setPhase(Phase.FAILED)
                    events += GameEvent.Fail
                }
            }
            Phase.COMPLETING -> if (phaseTime >= tuning.completeDelay) {
                setPhase(Phase.COMPLETE)
                events += GameEvent.Complete
            }
            Phase.COMPLETE, Phase.FAILED -> Unit
        }
        if (!freezeWorld) timerFlash = max(0f, timerFlash - dt)

        val live = phase == Phase.INTRO || phase == Phase.PLAYING || phase == Phase.COMPLETING
        if (live && !freezeWorld) {
            updatePlayer(dt)
            updateWeapon(dt)
            updateRobot(dt)
            updateDrones(dt)
        }
        if (!freezeWorld) {
            updateBolts(dt)
            updateEffects(dt)
        }
    }

    private fun setPhase(p: Phase) {
        phase = p
        phaseTime = 0f
    }

    private fun emitTimerTicks() {
        if (timeLeft < tuning.timerWarningAt && timeLeft > 0f) {
            val s = kotlin.math.ceil(timeLeft).toInt()
            if (s != lastTick) {
                lastTick = s
                events += GameEvent.TimerTick(s)
            }
        }
    }

    // ---------------------------------------------------------------- player

    private fun dragTarget(): Float =
        dragPlayerStart + (dragFinger - dragFingerStart) * tuning.dragMetresPerPx

    /** Horizontal drag (stage px) that moves the astronaut by [dx] metres. */
    fun dragPixelsFor(dx: Float): Float = dx / tuning.dragMetresPerPx

    private fun updatePlayer(dt: Float) {
        val p = player
        val prevX = p.x
        p.velocity = 0f
        if (p.stunTimer > 0f) p.stunTimer = max(0f, p.stunTimer - dt)
        if (p.knockTimer > 0f) {
            p.knockTimer -= dt
            moveBy(p.knockVelocity * dt)
        } else if (!p.stunned) {
            if (p.inCover && dragging) {
                val c = tuning.coverX[p.cover]
                val target = dragTarget()
                if (abs(target - c) > tuning.coverExitDrag) {
                    p.ignoreCover = p.cover
                    p.cover = -1
                    events += GameEvent.LeaveCover
                }
            }
            if (!p.inCover && dragging) {
                val target = dragTarget().coerceIn(tuning.playerMinX, tuning.playerMaxX)
                val dx = target - p.x
                val stepX = sign(dx) * min(abs(dx), tuning.playerSpeed * dt)
                moveBy(stepX)
            }
        }
        if (p.inCover) {
            p.x = tuning.coverX[p.cover]
        } else if (!p.stunned) {
            trySnapToCover(prevX, p.x)
        }
        val ig = p.ignoreCover
        if (ig >= 0 && abs(p.x - tuning.coverX[ig]) > tuning.coverSnap * 2.2f) p.ignoreCover = -1

        // Duck behind cover unless aiming (holding aim pops the astronaut up to shoot).
        standHold = max(0f, standHold - dt)
        val wantStand = !p.inCover || ((aiming || standHold > 0f) && !p.stunned)
        p.stand = if (wantStand) {
            min(1f, p.stand + dt / tuning.popUpTime)
        } else {
            max(0f, p.stand - dt / tuning.duckTime)
        }

        p.velocity = (p.x - prevX) / dt
        if (abs(p.velocity) > 0.05f) p.runTime += dt else p.runTime = 0f
        camera.panX = p.x + tuning.cameraShoulder
    }

    private fun moveBy(dx: Float) {
        val p = player
        var nx = (p.x + dx).coerceIn(tuning.playerMinX, tuning.playerMaxX)
        if (robotBlocksStrip()) {
            val lo = robot.x - tuning.robotBlockHalfWidth
            val hi = robot.x + tuning.robotBlockHalfWidth
            if (p.x <= lo && nx > lo) nx = lo
            else if (p.x >= hi && nx < hi) nx = hi
        }
        p.x = nx
    }

    fun robotBlocksStrip(): Boolean =
        robot.z - tuning.playerZ < tuning.robotBlockDepth && phase != Phase.COMPLETE

    private fun trySnapToCover(prevX: Float, x: Float) {
        val lo = min(prevX, x)
        val hi = max(prevX, x)
        for (i in tuning.coverX.indices) {
            if (i == player.ignoreCover) continue
            val c = tuning.coverX[i]
            if (hi >= c - tuning.coverSnap && lo <= c + tuning.coverSnap) {
                if (robotBlocksStrip() && abs(robot.x - c) < tuning.robotBlockHalfWidth) continue
                player.cover = i
                player.x = c
                // Re-anchor the drag so the astronaut stays put until the finger moves on.
                dragPlayerStart = c
                dragFingerStart = dragFinger
                events += GameEvent.EnterCover
                return
            }
        }
    }

    // ---------------------------------------------------------------- weapon

    fun canShoot(): Boolean =
        !player.stunned && player.stand >= 1f &&
            (phase == Phase.INTRO || phase == Phase.PLAYING)

    private fun updateWeapon(dt: Float) {
        if (overheat > 0f) {
            overheat -= dt
            if (overheat <= 0f) {
                overheat = 0f
                regen = 0f
            }
        } else if (charge < tuning.chargeSegments) {
            regen += dt
            if (regen >= tuning.regenPerSegment) {
                regen -= tuning.regenPerSegment
                charge++
            }
        } else {
            regen = 0f
        }
        if (charge >= tuning.chargeSegments) waitForFullCharge = false
        if (!freezeWorld) muzzleFlash = max(0f, muzzleFlash - dt)
        fireCooldown -= dt

        val wantsShot = pendingShot || (aiming && !waitForFullCharge)
        if (wantsShot && canShoot() && fireCooldown <= 0f && charge > 0 && overheat <= 0f) {
            fire()
            pendingShot = false
        }
        // A tap fires once; drop it if it could not go off (stunned, overheated, too late).
        if (!aiming && pendingShot && (standHold <= 0f || !player.inCover)) pendingShot = false

        // The blaster always points at the crosshair (which stays where the player last aimed).
        val targetAngle = aimAngleDeg()
        val k = min(1f, dt * 18f)
        armAngle += (targetAngle - armAngle) * k
    }

    private fun fire() {
        armAngle = aimAngleDeg()
        charge--
        if (charge == 0) {
            overheat = tuning.overheatTime
            waitForFullCharge = true
            events += GameEvent.Overheat
        }
        val m = muzzle()
        bolts += Bolt(m.x, m.y, aimX, aimY, tuning.boltTravel)
        muzzleFlash = tuning.muzzleFlashTime
        fireCooldown = tuning.fireInterval
        totalShots++
        events += GameEvent.Fire
    }

    // ---------------------------------------------------------------- astronaut geometry

    data class Point(val x: Float, val y: Float)

    /** Stage px per sprite px for the astronaut layers. */
    fun astronautScale(): Float = camera.pxPerMetre(tuning.playerZ) / ArtMetrics.ASTRO_PX_PER_M

    /** Screen position of the astronaut's feet (sprite anchor). */
    fun astronautAnchor(): Point =
        Point(camera.screenX(player.x, tuning.playerZ), camera.screenY(0f, tuning.playerZ))

    fun shoulder(): Point {
        val a = astronautAnchor()
        val s = astronautScale()
        return Point(
            a.x + (ArtMetrics.ASTRO_SHOULDER_X - ArtMetrics.ASTRO_ANCHOR_X) * s,
            a.y + (ArtMetrics.ASTRO_SHOULDER_Y - ArtMetrics.ASTRO_ANCHOR_Y) * s,
        )
    }

    fun aimAngleDeg(): Float {
        val sh = shoulder()
        val deg = Math.toDegrees(atan2((aimY - sh.y).toDouble(), (aimX - sh.x).toDouble())).toFloat()
        // atan2 gives (-180, 180]; aiming is always upward so fold the lower half.
        val up = if (deg > 90f) deg - 360f else deg
        return up.coerceIn(ArtMetrics.ARM_MIN_DEG, ArtMetrics.ARM_MAX_DEG)
    }

    fun muzzle(): Point {
        val sh = shoulder()
        val s = astronautScale()
        val mx = (ArtMetrics.ARM_MUZZLE_X - ArtMetrics.ARM_PIVOT_X) * s
        val my = (ArtMetrics.ARM_MUZZLE_Y - ArtMetrics.ARM_PIVOT_Y) * s
        val r = Math.toRadians(armAngle.toDouble())
        val c = cos(r).toFloat()
        val si = sin(r).toFloat()
        return Point(sh.x + mx * c - my * si, sh.y + mx * si + my * c)
    }

    // ---------------------------------------------------------------- bolts & hits

    fun droneScreen(d: Drone): Point = Point(camera.screenX(d.x, d.z), camera.screenY(d.visibleY(), d.z))

    fun droneHitRadius(d: Drone): Float =
        tuning.droneBodyRadius * tuning.droneHitRadiusScale * camera.pxPerMetre(d.z)

    /** Screen rectangle of the robot's body: left, top, right, bottom. */
    fun robotRect(): FloatArray {
        val z = robot.z
        return floatArrayOf(
            camera.screenX(robot.x - tuning.robotHalfWidth, z),
            camera.screenY(tuning.robotHeight, z),
            camera.screenX(robot.x + tuning.robotHalfWidth, z),
            camera.screenY(0f, z),
        )
    }

    private fun updateBolts(dt: Float) {
        val it = bolts.iterator()
        while (it.hasNext()) {
            val b = it.next()
            b.t += dt
            if (b.t >= b.duration) {
                resolve(b)
                it.remove()
            }
        }
    }

    private fun resolve(b: Bolt) {
        var target: Drone? = null
        for (d in drones) {
            if (!d.hittable) continue
            val c = droneScreen(d)
            if (hypot(b.toX - c.x, b.toY - c.y) <= droneHitRadius(d) && (target == null || d.z < target.z)) {
                target = d
            }
        }
        val entry = segmentRectEntry(b.fromX, b.fromY, b.toX, b.toY, robotRect())
        if (entry != null && (target == null || robot.z < target.z)) {
            effects += Effect(EffectKind.ROBOT_SPARK, entry.x, entry.y, camera.pxPerMetre(robot.z) / 300f, 0.3f)
            events += GameEvent.Blocked
            robotHearsNoise()
            return
        }
        if (target != null) {
            hitDrone(target)
        } else {
            effects += Effect(EffectKind.SPARK, b.toX, b.toY, 0.6f, 0.25f)
            events += GameEvent.Miss
        }
    }

    private fun hitDrone(d: Drone) {
        d.state = DroneState.HIT
        d.stateTime = 0f
        if (kills < tuning.requiredKills) kills++
        events += GameEvent.Kill(kills)
        if (abs(d.x - robot.x) < 1.6f && abs(d.z - robot.z) < 1.6f) robotHearsNoise()
        if (kills >= tuning.requiredKills && (phase == Phase.PLAYING || phase == Phase.INTRO)) {
            setPhase(Phase.COMPLETING)
            robot.state = RobotState.IDLE
        }
    }

    // ---------------------------------------------------------------- drones

    private fun updateDrones(dt: Float) {
        val it = drones.iterator()
        while (it.hasNext()) {
            val d = it.next()
            d.age += dt
            d.stateTime += dt
            when (d.state) {
                DroneState.FLYING -> if (!d.frozen) fly(d, dt)
                DroneState.HIT -> if (d.stateTime >= tuning.droneHitFlashTime) {
                    val c = droneScreen(d)
                    effects += Effect(
                        EffectKind.EXPLOSION, c.x, c.y,
                        camera.pxPerMetre(d.z) / ArtMetrics.DRONE_PX_PER_M,
                        tuning.droneExplosionTime,
                    )
                    d.state = DroneState.EXPLODING
                    d.stateTime = 0f
                }
                DroneState.EXPLODING -> it.remove()
            }
        }
        val canSpawn = (phase == Phase.INTRO || phase == Phase.PLAYING) && kills < tuning.requiredKills
        if (canSpawn) {
            val airborne = drones.count { it.state == DroneState.FLYING }
            val cap = if (kills >= tuning.lateAfterKills) tuning.maxAirborneLate else tuning.maxAirborne
            if (airborne < cap) {
                spawnTimer -= dt
                if (spawnTimer <= 0f) {
                    spawnDrone()
                    spawnTimer = rand(tuning.droneRespawnMin, tuning.droneRespawnMax)
                }
            }
        }
    }

    private fun rand(a: Float, b: Float) = a + rng.nextFloat() * (b - a)

    /** World y at depth z that appears at screen y [sy]. */
    private fun yForScreen(sy: Float, z: Float) = camera.height + (camera.horizonY - sy) * z / camera.focal

    private fun spawnDrone() {
        val z = rand(tuning.droneMinZ + 0.4f, tuning.droneMaxZ)
        val half = camera.halfVisibleWidth(z)
        val roll = rng.nextFloat()
        val d: Drone
        if (roll < 0.8f) {
            val side = if (roll < 0.4f) -1f else 1f
            val x = camera.panX + side * (half + 1.1f)
            val y = rand(yForScreen(tuning.droneScreenBottom, z), yForScreen(tuning.droneScreenTop, z))
            d = Drone(nextDroneId++, x, y, z)
        } else {
            val x = camera.panX + rand(-half * 0.7f, half * 0.7f)
            d = Drone(nextDroneId++, x, yForScreen(-300f, z), z)
        }
        d.speed = rand(tuning.droneSpeedMin, tuning.droneSpeedMax)
        pickDroneTarget(d)
        drones += d
    }

    private fun pickDroneTarget(d: Drone) {
        d.retarget = rand(2.5f, 4.5f)
        val dip = rng.nextFloat() < tuning.droneDipChance && robot.state != RobotState.IDLE
        d.dipping = dip
        if (dip) {
            d.targetZ = (robot.z + rand(-0.6f, 0.6f)).coerceIn(tuning.droneMinZ, tuning.droneMaxZ)
            d.targetX = robot.x + rand(-0.8f, 0.8f)
            d.targetY = tuning.robotHeight + rand(0.35f, 0.8f)
        } else {
            val z = rand(tuning.droneMinZ, tuning.droneMaxZ)
            val half = max(0.3f, camera.halfVisibleWidth(z) - 0.55f)
            d.targetZ = z
            d.targetX = camera.panX + rand(-half, half)
            d.targetY = rand(yForScreen(tuning.droneScreenBottom, z), yForScreen(tuning.droneScreenTop, z))
        }
    }

    private fun fly(d: Drone, dt: Float) {
        d.retarget -= dt
        val dx = d.targetX - d.x
        val dy = d.targetY - d.y
        val dz = d.targetZ - d.z
        val dist = kotlin.math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 0.35f || d.retarget <= 0f) {
            pickDroneTarget(d)
            return
        }
        val k = min(1f, dt * 2.2f)
        d.vx += (dx / dist * d.speed - d.vx) * k
        d.vy += (dy / dist * d.speed - d.vy) * k
        d.vz += (dz / dist * d.speed - d.vz) * k
        d.x += d.vx * dt
        d.y += d.vy * dt
        d.z = (d.z + d.vz * dt).coerceIn(tuning.droneMinZ - 0.3f, tuning.droneMaxZ + 0.3f)
    }

    // ---------------------------------------------------------------- robot

    private fun enterRobot(s: RobotState, time: Float = 0f) {
        robot.state = s
        robot.stateTimer = time
    }

    private fun updateRobot(dt: Float) {
        val r = robot
        if (r.frozen) return
        r.grace = max(0f, r.grace - dt)
        r.stateTimer -= dt
        r.moving = false
        val pz = tuning.playerZ
        val chaseSpeed = tuning.robotChaseFactor * tuning.playerSpeed
        when (r.state) {
            RobotState.PATROL -> {
                r.retarget -= dt
                if (!r.hasWaypoint || r.retarget <= 0f) pickWaypoint()
                if (moveRobot(r.waypointX, r.waypointZ, tuning.robotPatrolSpeed, dt)) {
                    r.hasWaypoint = false
                    if (rng.nextFloat() < tuning.robotScanChance) {
                        enterRobot(RobotState.SCAN, rand(tuning.robotScanMin, tuning.robotScanMax))
                    }
                }
                detect(dt, fast = false)
            }
            RobotState.SCAN -> {
                r.facing = Facing.FRONT
                if (r.stateTimer <= 0f) enterRobot(RobotState.PATROL)
                detect(dt, fast = false)
            }
            RobotState.ALERT -> {
                r.facing = Facing.FRONT
                if (r.stateTimer <= 0f) enterRobot(RobotState.CHASE)
            }
            RobotState.CHASE -> {
                if (!player.exposed) {
                    r.lastSeenX = player.x
                    enterRobot(RobotState.INVESTIGATE)
                } else {
                    r.lastSeenX = player.x
                    moveRobot(player.x, pz + tuning.robotFrontGap, chaseSpeed, dt)
                    if (canCatch()) catchPlayer()
                }
            }
            RobotState.INVESTIGATE -> {
                val sx = r.lastSeenX.coerceIn(tuning.robotMinX, tuning.robotMaxX)
                if (moveRobot(sx, pz + tuning.robotSearchGap, chaseSpeed, dt)) {
                    enterRobot(RobotState.SEARCH, rand(tuning.searchMin, tuning.searchMax))
                    r.searchStep = 0
                }
                detect(dt, fast = true)
            }
            RobotState.SEARCH -> {
                val look = arrayOf(Facing.LEFT, Facing.FRONT, Facing.RIGHT, Facing.FRONT)
                r.facing = look[((r.stateTimer * 1.6f).toInt().let { if (it < 0) 0 else it }) % look.size]
                if (r.stateTimer <= 0f) {
                    pickWaypoint()
                    enterRobot(RobotState.RETREAT)
                }
                detect(dt, fast = true)
            }
            RobotState.LUNGE -> {
                r.facing = Facing.FRONT
                if (r.stateTimer <= 0f) {
                    pickWaypoint()
                    enterRobot(RobotState.RETREAT)
                }
            }
            RobotState.RETREAT -> {
                if (moveRobot(r.waypointX, r.waypointZ, tuning.robotRetreatSpeed, dt)) {
                    r.hasWaypoint = false
                    enterRobot(RobotState.PATROL)
                }
                detect(dt, fast = false)
            }
            RobotState.IDLE -> r.facing = Facing.FRONT
        }
        if (r.moving) r.walkTime += dt
        val flareTarget = when (r.state) {
            RobotState.ALERT, RobotState.CHASE, RobotState.LUNGE -> 1f
            RobotState.INVESTIGATE, RobotState.SEARCH -> 0.65f
            else -> 0.25f + 0.5f * r.suspicion
        }
        r.eyeFlare += (flareTarget - r.eyeFlare) * min(1f, dt * 10f)
    }

    private fun pickWaypoint() {
        val r = robot
        var x = r.x
        var z = r.z
        // Mostly the robot closes in on the player: it heads for the player's side of the
        // room and steps toward the front strip, so it keeps coming at them.
        val hunt = rng.nextFloat() < tuning.robotHuntBias
        val frontSweep = !hunt && rng.nextFloat() < 0.2f
        for (attempt in 0 until 8) {
            if (hunt) {
                x = (player.x + rand(-0.7f, 0.7f)).coerceIn(tuning.robotMinX, tuning.robotMaxX)
                z = tuning.playerZ + rand(1.5f, 3.2f)
            } else {
                x = rand(tuning.robotMinX, tuning.robotMaxX)
                z = if (frontSweep) {
                    tuning.playerZ + rand(1.7f, 2.3f)
                } else {
                    rand(tuning.robotPatrolMinZ, tuning.robotPatrolMaxZ)
                }
            }
            if (hypot(x - r.x, z - r.z) > 0.8f) break
        }
        r.waypointX = x
        r.waypointZ = z
        r.hasWaypoint = true
        r.retarget = rand(tuning.robotRetargetMin, tuning.robotRetargetMax)
    }

    /** Walks toward (tx, tz). Returns true on arrival. */
    private fun moveRobot(tx: Float, tz: Float, speed: Float, dt: Float): Boolean {
        val r = robot
        val dx = tx - r.x
        val dz = tz - r.z
        val d = hypot(dx, dz)
        if (d < 0.04f) return true
        val s = min(d, speed * dt)
        r.x = (r.x + dx / d * s).coerceIn(tuning.robotMinX, tuning.robotMaxX)
        r.z = (r.z + dz / d * s).coerceIn(tuning.playerZ + tuning.robotFrontGap - 0.02f, tuning.robotPatrolMaxZ + 0.3f)
        r.moving = true
        r.facing = when {
            abs(dx) >= abs(dz) * 0.6f -> if (dx < 0f) Facing.LEFT else Facing.RIGHT
            dz < 0f -> Facing.FRONT
            r.facing == Facing.FRONT -> if (r.x > 0f) Facing.LEFT else Facing.RIGHT
            else -> r.facing
        }
        return d - s < 0.04f
    }

    /** True when the player is inside the robot's facing cone and sight range. */
    fun robotSeesPlayer(): Boolean {
        val r = robot
        val dx = player.x - r.x
        val dz = tuning.playerZ - r.z
        val dist = hypot(dx, dz)
        if (dist > tuning.robotSightRange) return false
        if (dist < 1e-3f) return true
        val (fx, fz) = when (r.facing) {
            Facing.LEFT -> -1f to 0f
            Facing.RIGHT -> 1f to 0f
            Facing.FRONT -> 0f to -1f
        }
        val c = (dx * fx + dz * fz) / dist
        return c >= cos(Math.toRadians(tuning.robotConeHalfAngleDeg.toDouble())).toFloat()
    }

    private fun detect(dt: Float, fast: Boolean) {
        val r = robot
        if (phase != Phase.PLAYING || r.grace > 0f || player.stunned) {
            r.suspicion = max(0f, r.suspicion - dt * 2f)
            return
        }
        val detectT = if (fast) tuning.detectTime * 0.5f else tuning.detectTime
        if (player.exposed && robotSeesPlayer()) {
            r.suspicion += dt / detectT
        } else {
            r.suspicion -= dt * tuning.suspicionDecayFactor / tuning.detectTime
        }
        r.suspicion = r.suspicion.coerceIn(0f, 1f)
        if (r.suspicion >= 1f) {
            r.lastSeenX = player.x
            val alreadyHunting = r.state == RobotState.INVESTIGATE || r.state == RobotState.SEARCH
            enterRobot(RobotState.ALERT, if (alreadyHunting) tuning.alertTime * 0.45f else tuning.alertTime)
            r.suspicion = 0f
            alerts++
            events += GameEvent.Alert
        }
    }

    /** Explosions and shots nearby make a patrolling robot turn and look at the front. */
    private fun robotHearsNoise() {
        val r = robot
        if (r.state == RobotState.PATROL || r.state == RobotState.RETREAT) {
            enterRobot(RobotState.SCAN, rand(1.0f, 1.6f))
        }
    }

    private fun canCatch(): Boolean {
        val r = robot
        return player.exposed && !player.stunned && r.grace <= 0f &&
            abs(r.x - player.x) < tuning.catchReachX &&
            r.z - tuning.playerZ <= tuning.catchReachZ + 0.02f
    }

    private fun catchPlayer() {
        val r = robot
        enterRobot(RobotState.LUNGE, tuning.lungeTime)
        catches++
        events += GameEvent.Caught
        val p = player
        p.stunTimer = tuning.stunTime
        timeLeft = max(0f, timeLeft - tuning.catchPenalty)
        timerFlash = 1.2f
        var dir = if (p.x >= r.x) 1f else -1f
        if (p.x + dir * tuning.knockback > tuning.playerMaxX || p.x + dir * tuning.knockback < tuning.playerMinX) dir = -dir
        p.knockVelocity = dir * tuning.knockback / 0.25f
        p.knockTimer = 0.25f
        r.grace = tuning.graceTime
        r.suspicion = 0f
    }

    // ---------------------------------------------------------------- effects

    private fun updateEffects(dt: Float) {
        val it = effects.iterator()
        while (it.hasNext()) {
            val e = it.next()
            e.t += dt
            if (e.t >= e.duration) it.remove()
        }
    }

    // ---------------------------------------------------------------- debug hooks

    fun debugSkipIntro() {
        if (phase == Phase.INTRO) setPhase(Phase.PLAYING)
    }

    /** Puts the player on the front strip at [x], standing and out of cover. */
    fun debugPlacePlayer(x: Float) {
        player.x = x.coerceIn(tuning.playerMinX, tuning.playerMaxX)
        player.cover = -1
        player.ignoreCover = -1
        player.stand = 1f
        camera.panX = player.x + tuning.cameraShoulder
    }

    fun debugSetTimeLeft(seconds: Float) {
        timeLeft = seconds
    }

    fun debugSetKills(n: Int) {
        kills = n.coerceIn(0, tuning.requiredKills - 1)
    }

    fun debugSpawnDrone(x: Float, y: Float, z: Float, frozen: Boolean): Drone {
        val d = Drone(nextDroneId++, x, y, z)
        d.frozen = frozen
        d.targetX = x
        d.targetY = y
        d.targetZ = z
        drones += d
        return d
    }

    /** Drops a hovering drone at a stage-px screen position (depth z). */
    fun debugSpawnDroneAtScreen(sx: Float, sy: Float, z: Float, frozen: Boolean): Drone =
        debugSpawnDrone(camera.worldX(sx, z), yForScreen(sy, z), z, frozen)

    fun debugClearDrones() {
        drones.clear()
        spawnTimer = 999f
    }

    fun debugAllowSpawns() {
        spawnTimer = 0.2f
    }

    /** Puts the robot in a chase right in front of the player (tests the catch). */
    fun debugForceChase() {
        robot.x = player.x + 0.05f
        robot.z = tuning.playerZ + 1.5f
        robot.grace = 0f
        robot.frozen = false
        enterRobot(RobotState.CHASE)
    }

    fun debugParkRobot(x: Float, z: Float, facing: Facing) {
        robot.x = x
        robot.z = z
        robot.facing = facing
        robot.hasWaypoint = false
        enterRobot(RobotState.IDLE)
    }

    /** Ends any stun/knockback immediately (tests that script shots after a catch). */
    fun debugCalmPlayer() {
        player.stunTimer = 0f
        player.knockTimer = 0f
        player.knockVelocity = 0f
    }

    fun debugReleaseRobot() {
        enterRobot(RobotState.PATROL)
    }

    /** Parks the robot looking at the front strip with detection active. */
    fun debugScan(x: Float, z: Float, seconds: Float) {
        robot.x = x
        robot.z = z
        robot.grace = 0f
        robot.suspicion = 0f
        enterRobot(RobotState.SCAN, seconds)
    }

    /**
     * Freezes the level in the moment shown by reference/2376.png: 6/20, 00:28, +3,
     * three drones where the reference has them, robot mid-right, astronaut lower-left
     * firing at the centre crosshair. Used for side-by-side comparison screenshots.
     */
    fun applyReferencePose() {
        setPhase(Phase.PLAYING)
        kills = 6
        timeLeft = 28f
        player.x = tuning.playerStartX
        player.cover = -1
        player.stand = 1f
        camera.panX = player.x + tuning.cameraShoulder
        drones.clear()
        spawnTimer = 999f
        debugSpawnDroneAtScreen(0.33f * Stage.W, 0.365f * Stage.H, 4.3f, frozen = true).age = 0.4f
        debugSpawnDroneAtScreen(0.645f * Stage.W, 0.29f * Stage.H, 5.0f, frozen = true).age = 1.1f
        debugSpawnDroneAtScreen(0.665f * Stage.W, 0.44f * Stage.H, 6.4f, frozen = true).age = 2.3f
        val rz = camera.focal * camera.height / (0.66f * Stage.H - camera.horizonY)
        debugParkRobot(camera.worldX(0.76f * Stage.W, rz), rz, Facing.LEFT)
        robot.moving = true
        robot.walkTime = 0.3f
        aiming = true
        setAim(0.52f * Stage.W, 0.485f * Stage.H)
        armAngle = aimAngleDeg()
        charge = 3
        bolts.clear()
        val m = muzzle()
        bolts += Bolt(m.x, m.y, aimX, aimY, tuning.boltTravel).also { it.t = tuning.boltTravel * 0.55f }
        muzzleFlash = tuning.muzzleFlashTime
        freezeWorld = true
    }
}

/** Where segment (x0,y0)-(x1,y1) first enters rect [l,t,r,b], or null (Liang–Barsky). */
internal fun segmentRectEntry(x0: Float, y0: Float, x1: Float, y1: Float, rect: FloatArray): Level3.Point? {
    val dx = x1 - x0
    val dy = y1 - y0
    var t0 = 0f
    var t1 = 1f
    val p = floatArrayOf(-dx, dx, -dy, dy)
    val q = floatArrayOf(x0 - rect[0], rect[2] - x0, y0 - rect[1], rect[3] - y0)
    for (i in 0 until 4) {
        if (p[i] == 0f) {
            if (q[i] < 0f) return null
        } else {
            val t = q[i] / p[i]
            if (p[i] < 0f) {
                if (t > t1) return null
                if (t > t0) t0 = t
            } else {
                if (t < t0) return null
                if (t < t1) t1 = t
            }
        }
    }
    return Level3.Point(x0 + dx * t0, y0 + dy * t0)
}
