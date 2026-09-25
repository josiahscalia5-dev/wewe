package com.blastcollect.core

/**
 * Every Level 3 number in one place (brief section 5). Distances are metres, times are
 * seconds, speeds are metres per second.
 */
class Level3Tuning(
    // Flow
    val requiredKills: Int = 20,
    val startTime: Float = 90f,
    val introBannerTime: Float = 3f,
    val completeDelay: Float = 1.1f,
    val timerWarningAt: Float = 10f,

    // Player (front strip)
    val playerZ: Float = 2.1f,
    val playerMinX: Float = -0.64f,
    val playerMaxX: Float = 0.64f,
    /** Far left of the strip: the astronaut starts where reference/2376 shows him. */
    val playerStartX: Float = -0.60f,
    val playerSpeed: Float = 1.05f,
    val cameraFollow: Float = 0.22f,
    /** Cover spots on the front strip: left crate stack, centre crate, right forklift. */
    val coverX: FloatArray = floatArrayOf(-0.40f, 0.02f, 0.50f),
    val coverSnap: Float = 0.085f,
    /** How far past the cover spot a drag must reach before the astronaut leaves cover. */
    val coverExitDrag: Float = 0.16f,
    val popUpTime: Float = 0.12f,
    val duckTime: Float = 0.10f,

    // Weapon
    val chargeSegments: Int = 5,
    val regenPerSegment: Float = 0.35f,
    val overheatTime: Float = 0.8f,
    val fireInterval: Float = 0.16f,
    val boltTravel: Float = 0.12f,
    val muzzleFlashTime: Float = 0.08f,

    // Drones
    val maxAirborne: Int = 3,
    val maxAirborneLate: Int = 4,
    val lateAfterKills: Int = 10,
    val droneBodyRadius: Float = 0.33f,
    val droneHitRadiusScale: Float = 1.2f,
    val droneSpeedMin: Float = 1.0f,
    val droneSpeedMax: Float = 1.55f,
    val droneMinZ: Float = 3.8f,
    val droneMaxZ: Float = 8.0f,
    val droneDipChance: Float = 0.3f,
    val droneRespawnMin: Float = 0.7f,
    val droneRespawnMax: Float = 1.4f,
    val droneHitFlashTime: Float = 0.12f,
    val droneExplosionTime: Float = 0.48f,
    /** Airborne drones are kept between these screen y values (stage px). */
    val droneScreenTop: Float = 600f,
    val droneScreenBottom: Float = 1150f,

    // Robot
    val robotHeight: Float = 2.2f,
    val robotHalfWidth: Float = 0.42f,
    val robotMinX: Float = -1.7f,
    val robotMaxX: Float = 1.7f,
    val robotPatrolMinZ: Float = 4.6f,
    val robotPatrolMaxZ: Float = 7.4f,
    val robotPatrolSpeed: Float = 0.5f,
    /** Chase speed as a fraction of the player's speed (brief: ~65%, escapable). */
    val robotChaseFactor: Float = 0.65f,
    val robotRetreatSpeed: Float = 0.8f,
    val robotRetargetMin: Float = 3f,
    val robotRetargetMax: Float = 6f,
    val robotScanChance: Float = 0.5f,
    val robotScanMin: Float = 1.2f,
    val robotScanMax: Float = 2.0f,
    val robotConeHalfAngleDeg: Float = 55f,
    val robotSightRange: Float = 9.5f,
    /** Continuous exposure inside the cone needed before the robot reacts. */
    val detectTime: Float = 0.6f,
    /** Suspicion drains this much slower than it builds (peeking repeatedly adds up). */
    val suspicionDecayFactor: Float = 0.4f,
    val alertTime: Float = 0.55f,
    val searchMin: Float = 2f,
    val searchMax: Float = 3f,
    /** Depth offset in front of the strip where the robot stands to search / catch. */
    val robotFrontGap: Float = 0.55f,
    val robotSearchGap: Float = 0.95f,
    /** While the robot is closer than this to the strip it blocks the player's route. */
    val robotBlockDepth: Float = 1.2f,
    val robotBlockHalfWidth: Float = 0.3f,
    val catchReachX: Float = 0.34f,
    val catchReachZ: Float = 0.62f,
    val stunTime: Float = 1.5f,
    val catchPenalty: Float = 5f,
    val knockback: Float = 0.32f,
    val graceTime: Float = 3f,
    val lungeTime: Float = 0.45f,

    // Rewards
    val killsPerCoin: Int = 2,
    val completionBonus: Int = 5,
)
