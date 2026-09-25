#!/usr/bin/env bash
# Runs inside android-emulator-runner. Installs the APKs and plays through Phase 1 on
# three screen configurations of the same API 36 emulator.
set -uo pipefail

PKG=com.blastcollect.game
OUT=verification/device
mkdir -p "$OUT"

adb wait-for-device
adb shell input keyevent 82 || true
adb shell settings put system screen_off_timeout 1800000 || true
adb install -r -g app/build/outputs/apk/debug/app-debug.apk
adb install -r -g app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk

status=0
for cfg in "compact 720x1600 320" "standard 1080x2400 420" "tall 1440x3200 560"; do
  set -- $cfg
  name=$1; size=$2; dpi=$3
  echo "=== $name: $size @ ${dpi}dpi ==="
  adb shell wm size "$size"
  adb shell wm density "$dpi"
  sleep 4
  adb shell pm clear "$PKG" >/dev/null
  adb logcat -c || true
  result=$(adb shell am instrument -w -r -e size "$name" -e class "$PKG.Phase1FlowTest" "$PKG.test/androidx.test.runner.AndroidJUnitRunner" 2>&1)
  echo "$result" > "$OUT/instrument_$name.txt"
  echo "$result" | grep -E "INSTRUMENTATION_STATUS: stack|OK \(|FAILURES|Tests run|shortMsg|longMsg" | head -40
  if echo "$result" | grep -q "OK (1 test)"; then echo "PASS $name"; else echo "FAIL $name"; status=1; fi
  mkdir -p "$OUT/$name"
  adb pull "/data/local/tmp/bc/$name/." "$OUT/$name/" >/dev/null 2>&1 || true
  adb logcat -d > "$OUT/logcat_$name.txt" 2>/dev/null || true
  adb shell dumpsys gfxinfo "$PKG" > "$OUT/gfxinfo_$name.txt" 2>/dev/null || true
done

adb shell wm size reset
adb shell wm density reset
exit $status
