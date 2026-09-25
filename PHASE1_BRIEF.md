# BLAST & COLLECT — Phase 1 Build Brief (Home + Level 3, then STOP)

Paste this whole file into a Claude Code session opened on the new, empty `blast-and-collect` repo.

## 0. Ground rules

- Brand-new project. Do NOT copy, import, or reference anything from the Color Pop / `beargame` repo (code, screens, art, branding, config).
- The images in `/reference/` are the visual source of truth. Reproduce them as closely as technically possible. No redesign, no generic template, no "inspired by".
- Ignore the phone bezel, notch, and fake iOS status bar ("9:41") in the references. The real Android status bar is drawn by the system.
- This session builds ONLY: Home screen, then Level 3. Then STOP (section 9). Do not start Level 5, 7, 9, Boss, or any other screen.
- Never place a reference screenshot (or a stretched crop of one) in the app as graphics.

## 1. Inputs in the repo

`/reference/` (view every file before starting)
- `2371.png` — Home (canonical)
- `2376.png` — Level 3 (canonical: forklift right, robot mid-right)
- `2374.png`, `2375.png`, `2372.png` — Level 3 alternates (use for detail, lighting, robot/drone design)
- `2373.png`, `2370.png` — full set side by side (Home / Level 3 / Level 5)

`/art/` — production art layers (list in section 4).
If a layer is missing, build with a clearly labelled placeholder, list it as missing in the report, and state that visual fidelity is NOT yet met. Do not substitute generic art and call the screen done.

## 2. Stack

- Native Android, Kotlin. Jetpack Compose for Home, HUD, and overlays (crisp text, insets, responsive layout). Gameplay rendered on a SurfaceView (or Compose Canvas) with a fixed-timestep game loop and one game clock.
- compileSdk 36, targetSdk 36, minSdk 26. Look up the current stable AGP / Gradle / Kotlin / Compose BOM versions at build time; do not hardcode versions from memory.
- Portrait locked. Edge-to-edge: background art full-bleed behind the system bars; every HUD element and touch target inside `WindowInsets.safeDrawing`.
- Design canvas 1080×2340 portrait. Backgrounds scale-to-cover (never stretch), anchored so the key content stays visible on 19.5:9 to 21:9 phones. HUD positions come from a single layout-constants file expressed as fractions of the safe area.
- Fonts (bundle OFL fonts, compare against references and pick the closest): condensed bold for HUD text ("LEVEL 3", "SHOOT THE RED DRONES", "6/20", "00:28"); rounded heavy for "PLAY NOW" and nav labels.
- HUD panels, borders, glows, progress segments, and the crosshair are drawn in code (sharp at any density). Characters, environment, creatures, logo, and icons come from `/art/`.
- Dev-only reference overlay: a debug toggle that draws the matching reference image at 50% opacity over the live screen for alignment. Stripped from release builds.

## 3. Composition targets (measure precisely from the canonical references)

Level 3 (`2376.png`)
- Top row: circular pause button (left, cyan neon ring); "LEVEL 3" centered in a dark translucent pill; timer pill (right) with red stopwatch icon + white "00:28", red-to-cyan neon border.
- Objective panel under top row: near full width, dark navy fill, cyan neon border with soft glow, rounded corners. Drone icon left; "SHOOT THE RED DRONES" white; segmented progress bar under it (cyan lit, slate unlit); large "6/20" right.
- Play area: three red spherical drones in upper-middle airspace; crosshair center; astronaut seen from behind, lower-left foreground, cropped by the screen edge, blaster angled up-right with muzzle flash and laser; large robot mid-ground right; forklift and crate stacks right foreground; crates mid-ground; glossy tiled floor with warm reflections; magenta light left, cyan/blue light right.
- Bottom row: weapon panel (left, ~57% width): blaster icon, 5-segment charge bar, "∞". Coin panel (right): gold star coin + "+3".

Home (`2371.png`)
- Top right: coin capsule (coin icon, "2,350", green "+" button) and square settings button (dark fill, cyan border).
- "BLAST & COLLECT" logo upper third (crosshair as the O).
- Hero robot-astronaut center, blaster firing right; floating creatures (blue, yellow, green, red, purple) around it; sparkles.
- Three-line tagline "A FAST-PACED / SHOOT, COLLECT, EARN / ADVENTURE!" white with dark outline.
- Large glossy green "PLAY NOW" pill.
- Bottom nav in a dark translucent rounded bar: Home (selected: cyan icon + glowing underline), Missions (red "!" badge), Shop, Profile.

## 4. Art layers needed in `/art/` (PNG with alpha, same style/lighting as references, sprites at ≥2× on-screen size)

Home: `bg_home` (environment only, ≥1440×3120 with extra top/bottom bleed), `logo_title`, `hero_robot`, `hero_muzzle_flash`, `creature_blue/yellow/green/red/purple`, `sparkle`, icons (`coin`, `gear`, `plus`, `nav_home`, `nav_missions`, `nav_shop`, `nav_profile`).

Level 3: `bg_warehouse` (no characters, drones, HUD, or foreground cover), cover cut-outs (`cover_crates_left`, `cover_forklift_right`, 2–3 `cover_crates_mid`), astronaut back view (`aim_idle`, `fire`, strafe-left and strafe-right run cycles 4–6 frames each, `duck_cover`, `stunned`), drone (body + 4-frame rotor spin, `hit_flash`, 6–8 frame explosion), robot (walk cycle 6–8 frames facing left, right, and toward camera; `scan_idle`, `alert`, `grab_lunge`), `laser_bolt`, `impact_spark`, icons (`icon_drone`, `icon_stopwatch`, `icon_blaster`, `icon_coin_star`).

## 5. Level 3 gameplay

World
- Fixed over-the-shoulder camera. 2.5D stage: x = left/right, z = depth (0 = front strip near camera, 1 = back wall). Sprites scale and sort by z. Small background parallax pan (≈5%) as the player moves.
- Player moves along the front strip. Three cover spots: left crate stack, center crate, right forklift. In cover the astronaut ducks: hidden from the robot, cannot shoot.

Controls (multitouch; both at once must work)
- Lower play zone (above bottom HUD): horizontal drag moves the astronaut; release stops. Entering a cover spot snaps into cover.
- Upper play zone: touch-and-hold aims; crosshair sits ~80dp above the finger so it stays visible; auto-fires while held. Tap = single shot.

Shooting
- Laser bolt from the muzzle to the crosshair point, ~0.12s travel; hit test at arrival (moving drones can be missed). The robot's body blocks shots.
- Hit → hit flash → explosion → drone removed → counter +1 → progress bar updates. Misses change nothing.
- Weapon panel: each shot uses 1 of 5 segments; regen 1 per 0.35s; empty = 0.8s overheat (panel flashes). "∞" = no total ammo limit.

Drones
- 20 required. Max 3 airborne (4 after 10 kills). Spawn from edges/top, fly bobbing curves across the upper airspace. Some dip low over the robot's area so shooting them means exposing yourself near it.

Robot (active enemy, not decoration)
- States: PATROL → ALERT → CHASE → SEARCH → PATROL.
- PATROL: walks mid-ground waypoints, changes direction every 3–6s.
- Detects the player only when exposed and in its facing cone for 0.6s → ALERT (eyes flare, short warning cue) → CHASE: heads to the player's x and toward the front strip at ~65% of player speed (escapable).
- Player enters cover → robot goes to last seen x, SEARCH 2–3s, then resumes PATROL.
- While in the front strip the robot physically blocks movement through its x-range (temporarily cuts routes).
- CATCH (robot reaches the exposed player): player stunned 1.5s, −5s on the timer (timer flashes), knockback, robot backs off to a waypoint, 3s grace. No extra HUD elements (keeps the reference HUD intact).
- Tuned so standing still and shooting fails, but moving between cover always leaves an escape.

Timer, rewards, flow
- Start 90s (tune in playtest). Counts down on the game clock; pulses red under 10s. Hits 0 before 20/20 → LEVEL FAILED overlay (Retry, Home).
- +1 coin per 2 drones (so 6/20 shows +3, matching the reference), +5 bonus on completion. Coins added to the saved wallet on completion.
- 20/20 → LEVEL COMPLETE overlay (coins earned, Replay, Home; "Next" shown disabled as "Coming soon").
- Opening banner for 3s: "SHOOT THE RED DRONES — WATCH OUT FOR THE ROBOT! Hide behind cover."
- Pause freezes everything (player, robot, drones, bolts, effects, timer). Overlay: Resume (exact same state), Restart, Home. Auto-pause when the app goes to background.
- Complete/Failed/Pause overlays have no reference: build them minimal in the same panel style.

## 6. Home functionality

- PLAY NOW → Level 3 (Phase 1 flow).
- Wallet from saved data (DataStore), seeded at 2,350 on first launch. "+" opens the Shop tab.
- Settings button → panel with Sound, Music, Vibration toggles (persisted).
- Bottom nav switches tabs with the selected state. Missions / Shop / Profile open a lightweight "Coming soon" panel in the Home style (no new designed screens in Phase 1).
- Idle animation: creatures bob, sparkles twinkle, hero idles with periodic muzzle flash, PLAY NOW pulses.

## 7. Verification (all required before stopping)

- Unit tests: counter increments only on hits; pause freezes the game clock; timer-zero fails; catch applies stun and −5s; coin math.
- GitHub Actions workflow: build the debug APK; boot an API 36 x86_64 emulator (e.g. reactivecircus/android-emulator-runner, KVM); install; run an instrumented test that injects touches: Home screenshot → PLAY NOW → Level 3 start → move → shoot and destroy drones → get caught → hide → pause/resume → forced fail (debug short timer) → forced complete (debug near-complete). Capture screenshots at each step plus a 30s `adb screenrecord`.
- Run on three sizes: compact (720×1600), standard (1080×2400), tall (1440×3200). Check: no cropped HUD, no overlaps, no text off-screen, nothing under system bars, no stretched or blurry art.
- Side-by-side images: each screenshot next to its reference. List every visible deviation honestly.
- Upload APK, screenshots, comparisons, and video as workflow artifacts.

## 8. Report back

What works, what doesn't, missing art layers, deviations from the references, artifact links.

## 9. STOP

Commit, push, tag `phase1-level3-review`, and STOP. Wait for approval.
Do not start Level 5. Do not add screens. Do not modify approved work without instruction.
After approval: tag `phase1-level3-approved`.
