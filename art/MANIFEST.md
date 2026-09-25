# Art layers — status

**Production art has NOT been supplied.** Every layer below is an *interim placeholder* generated
from code by `tools/art` (three.js models rendered in headless Chromium, or 2D canvas painting).
They follow the references' composition, colours and lighting, but they are not the painted
3D-cartoon artwork of the references, so **visual fidelity to the references is NOT yet met**.

How to replace: drop a production PNG with the same file name into this folder and rebuild.
`SyncArtTask` (app/build.gradle.kts) packages `/art/*.png` into the APK. Geometry contracts
(anchors, pivots, px-per-metre) are in `core/src/main/kotlin/com/blastcollect/core/ArtMetrics.kt`;
if a replacement keeps the same canvas size nothing else needs to change. `_layers.json` holds the
trim offsets of the generated layers and is ignored automatically for files of a different size.

Regenerate the placeholders: `cd tools/art && npm install && node render.mjs && python3 trim.py`.

| Layer | Status | Source | Canvas (px) | Notes |
|---|---|---|---|---|
| **Home** | | | | |
| `bg_home` | interim placeholder | 3D (models/homescene.js) + painted finishing pass | 1440×3120 | dark blue aisle, crates in the bottom corners |
| `logo_title` | interim placeholder | 2D canvas (Lilita One), letter boxes measured on 2371 | 2000×1090 | canvas = screen x 0.05–0.98, y 0.10–0.33 |
| `hero_robot` | interim placeholder | 3D render (models/homehero.js), fitted to 12 keypoints of 2371 | 1600×1500 |  |
| `hero_muzzle_flash` | interim placeholder | 2D canvas | 768×768 |  |
| `creature_blue` | interim placeholder | 2D canvas painting | 600×600 |  |
| `creature_yellow` | interim placeholder | 2D canvas painting | 600×600 |  |
| `creature_green` | interim placeholder | 2D canvas painting | 600×600 |  |
| `creature_red` | interim placeholder | 2D canvas painting | 600×600 |  |
| `creature_purple` | interim placeholder | 2D canvas painting | 600×600 |  |
| `sparkle` | interim placeholder | 2D canvas | 256×256 | yellow |
| `sparkle_orange`, `sparkle_cyan`, `sparkle_green`, `sparkle_pink` | interim placeholder | 2D canvas | 256×256 | added: coloured sparkles of 2371 |
| `coin` | interim placeholder | 2D canvas | 512×512 |  |
| `gear` | interim placeholder | 2D canvas | 512×512 |  |
| `plus` | interim placeholder | 2D canvas | 512×512 |  |
| `nav_home` | interim placeholder | 2D canvas | 256×256 |  |
| `nav_missions` | interim placeholder | 2D canvas | 256×256 |  |
| `nav_shop` | interim placeholder | 2D canvas | 256×256 |  |
| `nav_profile` | interim placeholder | 2D canvas | 256×256 |  |
| **Level 3** | | | | |
| `bg_warehouse` | interim placeholder | 3D (three.js scene through the game camera) | 1568×3200 |  |
| `cover_crates_left` | interim placeholder | 3D render | 518×626 |  |
| `cover_forklift_right` | interim placeholder | 3D render | 1077×830 |  |
| `cover_crates_mid_1` | interim placeholder | 3D render | 429×582 |  |
| `cover_crates_mid_2` | interim placeholder | 3D render | 1117×746 |  |
| `cover_crates_mid_3` | interim placeholder | 3D render | 903×602 |  |
| `astro_aim_idle` | interim placeholder | 3D render | 900×1100 |  |
| `astro_fire` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_1` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_2` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_3` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_4` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_5` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_left_6` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_1` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_2` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_3` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_4` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_5` | interim placeholder | 3D render | 900×1100 |  |
| `astro_strafe_right_6` | interim placeholder | 3D render | 900×1100 |  |
| `astro_duck_cover` | interim placeholder | 3D render | 900×1100 |  |
| `astro_stunned` | interim placeholder | 3D render | 900×1100 |  |
| `astro_arm_blaster` | interim placeholder | 3D render | 760×320 | added: blaster arm is a separate layer so it can rotate toward the crosshair |
| `drone_body` | interim placeholder | 3D render | 800×800 |  |
| `drone_rotor_1` | interim placeholder | 3D render | 800×800 |  |
| `drone_rotor_2` | interim placeholder | 3D render | 800×800 |  |
| `drone_rotor_3` | interim placeholder | 3D render | 800×800 |  |
| `drone_rotor_4` | interim placeholder | 3D render | 800×800 |  |
| `drone_hit_flash` | interim placeholder | 3D render | 800×800 |  |
| `drone_explosion_1` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_2` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_3` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_4` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_5` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_6` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_7` | interim placeholder | 2D canvas | 800×800 |  |
| `drone_explosion_8` | interim placeholder | 2D canvas | 800×800 |  |
| `robot_walk_left_1` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_left_2` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_left_3` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_left_4` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_left_5` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_left_6` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_1` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_2` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_3` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_4` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_5` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_right_6` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_1` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_2` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_3` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_4` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_5` | interim placeholder | 3D render | 900×1100 |  |
| `robot_walk_front_6` | interim placeholder | 3D render | 900×1100 |  |
| `robot_scan_idle` | interim placeholder | 3D render | 900×1100 |  |
| `robot_alert` | interim placeholder | 3D render | 900×1100 |  |
| `robot_grab_lunge` | interim placeholder | 3D render | 900×1100 |  |
| `laser_bolt` | interim placeholder | 2D canvas | 640×96 |  |
| `impact_spark` | interim placeholder | 2D canvas | 256×256 |  |
| `muzzle_flash` | interim placeholder | 2D canvas | 256×256 | added |
| `glow_red` | interim placeholder | 2D canvas | 128×128 | added (robot eye flare) |
| `glow_cyan` | interim placeholder | 2D canvas | 128×128 | added |
| `icon_drone` | interim placeholder | 3D render | 512×512 |  |
| `icon_stopwatch` | interim placeholder | 2D canvas | 256×256 |  |
| `icon_blaster` | interim placeholder | 3D render | 640×400 |  |
| `icon_coin_star` | interim placeholder | 2D canvas | 512×512 |  |
