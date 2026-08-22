#!/bin/bash
# Per-scene render: a defect that lives in one scene costs four minutes to
# re-check here and forty-five under a whole-film render. Muted, because
# slicing AAC pads every segment tail and the drift accumulates.
set -e
declare -a S=(
 "00_lead:0-47" "01_hook:48-276" "02_what:277-891" "03_budget:892-1435"
 "04_collapse:1436-1939" "05_attack:1940-2790" "06_ceiling:2791-3529"
 "07_evidence:3530-4032" "08_cloud:4033-4510" "09_close:4511-4692"
)
for pair in "${S[@]}"; do
  name="${pair%%:*}"; range="${pair##*:}"
  if [ -f "out/seg/$name.mp4" ]; then echo "skip $name"; continue; fi
  echo "== $name ($range)"
  npx remotion render src/index.ts Video "out/seg/$name.mp4" \
    --frames="$range" --muted --crf=18 --concurrency=2 2>&1 | tail -1
done
echo "ALL SEGMENTS DONE"
