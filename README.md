# cartoon-short-kit

Engine for the cartoon-audio-short skill: flat 2D cartoon cards in a 3D toon world (three.js r160), rendered frame by frame in headless Chromium.
Worked example: "Perang Babi" (40 s, 1080x1920, 30 fps).

## Setup (new project)
```
mkdir -p ~/shorts/<slug> && cp -r cartoon-short-kit/* ~/shorts/<slug>/ && cd ~/shorts/<slug>
npm i three@0.160.0 && cp node_modules/three/build/three.module.js web/
ln -sfn "$(dirname $(node -e "console.log(require.resolve('playwright'))"))" node_modules/playwright
mkdir -p work stills frames out
```
Needs Node 22+, Python 3 (numpy, scipy, Pillow), ffmpeg, Playwright Chromium.

## Files
- `web/pen.js` drawing kit (ink outlines, crescent shading) · `web/cast.js` people, pig, props, effects · `web/paint.js` painted textures
- `web/main.js` engine + world (toon materials, cards, ink, grade, DOF) · `web/story.js` shots, cameras, lights, actors per frame (story-specific)
- `render.mjs <dir> "0-1201"` frames (RESUME=1 to continue; DBG=col|nd for debug buffers) · `sheet.py` contact sheet · `shot.mjs` 2D test pages
- `audio.py` music + SFX stems · `mix.py` level lock · `finish.sh "Title"` loudness, encode, QA

## v2 upgrades
- Cards lit by the scene: sun shadow mask on characters (shadow offset toward the sun so a card never shadows itself), far-side falloff from the light direction, foot shade. Per-light `cardShadow`.
- Grade: S-curve contrast + split toning per light preset (`contrast`, `shTint`, `hiTint`).
- Motion: `act(f, f0, dur, antic, a)` anticipation -> overshoot curve; pig walk with planted feet (phase from distance travelled, cycloid swing); optional Catmull-Rom camera per shot (`CURVED`).
- Mix: music -10 dB vs voice (gated RMS) + 3.5 dB ducking under speech; SFX <= music, peaks <= 0.7x voice. Finish: two-pass loudnorm -14 LUFS / -1.2 dBTP, optional caption burn-in from `work/captions.ass`.
