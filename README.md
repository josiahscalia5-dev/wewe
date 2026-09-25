# Blast & Collect — Phase 1

Native Android game (Kotlin, Jetpack Compose + a custom game view). Phase 1 covers the
**Home** screen and **Level 3 — "SHOOT THE RED DRONES"**. Level 5 is deliberately not built
yet (see `PHASE1_BRIEF.md`).

| | |
|---|---|
| Visual source of truth | `reference/` (2371 = Home, 2376 = Level 3; see `reference/README.md`) |
| Game rules (pure Kotlin, unit-tested without Android) | `core/` |
| Android app | `app/` |
| Art layers (drop-in folder) | `art/` — currently **interim placeholders**, see `art/MANIFEST.md` |
| Art generator for the placeholders | `tools/art/` |
| CI (build, emulator play-through on 3 screen sizes, comparisons) | `.github/workflows/android.yml`, `ci/` |

## Build

Requirements: JDK 17+ and an Android SDK with API 37 platform (compileSdk; targetSdk is 36).

```bash
./gradlew -p core test            # game-rule unit tests (no Android SDK needed)
./gradlew :app:assembleDebug      # APK: app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:connectedDebugAndroidTest   # instrumented play-through on a device/emulator
```

Toolchain (latest stable when checked on 2026-09-25 by `.github/workflows/toolchain-versions.yml`):
Gradle 9.8.0, AGP 9.4.1, Kotlin 2.4.20, Compose BOM 2026.09.00.

## How Level 3 plays

- Third-person follow camera (reference/2376): the astronaut stays in the lower-left and the
  warehouse pans as he moves.
- Drag in the lower part of the screen to move the astronaut along the front strip.
  Moving into the left crates, the centre crate or the forklift snaps you into cover (ducked:
  hidden from the robot, can't shoot).
- Touch and hold in the upper part to aim (the crosshair sits ~80 dp above your finger) and
  auto-fire; tap for a single shot. Holding aim while in cover pops you up to shoot, which
  exposes you. Both fingers work at once.
- The robot actively hunts you: its patrol keeps closing in on your side of the room and
  toward the front strip. When it sees you exposed inside its facing cone for 0.6 s:
  ALERT → CHASE (75% of your speed, so you can outrun it) → (you hide) SEARCH → back to
  hunting. If it catches you: stunned 1.5 s, −5 s on the timer, knockback, then a 3 s grace
  period. While it stands on the front strip it blocks your route.
- 20 drones in 90 s. +1 coin per 2 drones, +5 on completion (added to the saved wallet).

Tuning lives in `core/src/main/kotlin/com/blastcollect/core/Level3Tuning.kt`.

## Debug tools (debug builds only)

- Three-finger tap toggles the matching reference screenshot at 50% opacity over the live
  screen (Home and Level 3). The overlay and the reference images are not in release builds.
- `Level3.applyReferencePose()` freezes the level at the moment shown in `reference/2376.png`
  (6/20, 00:28, +3); the instrumented test uses it for side-by-side comparisons.

## Art

Production art has not been supplied yet. Every file in `art/` is a clearly labelled interim
placeholder rendered from code (3D models in three.js or 2D canvas painting) that follows the
references' composition and palette. Replace any layer by dropping a PNG with the same name
into `art/` — see `art/MANIFEST.md` for the list, sizes and the geometry contract.
