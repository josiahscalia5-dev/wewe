#!/bin/bash
# Renders hero_robot and fits it onto the reference. usage: hero_iter.sh out.png
set -e
cd "$(dirname "$0")/../art"
KEYS=$(node render.mjs hero_robot 2>&1 | grep HERO_KEYS | sed 's/.*HERO_KEYS //')
cd ../..
python3 tools/preview/hero_fit.py "$KEYS" "$1"
