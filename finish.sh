#!/bin/bash
# bash finish.sh "Title"  -> out/<slug>.mp4 : one linear gain to -14 LUFS + -1 dBFS limiter, H.264 CRF 17 + AAC, QA
set -e
TITLE="$1"; SLUG=$(echo "$TITLE" | tr 'A-Z ' 'a-z_' | tr -cd 'a-z0-9_')
I=$(ffmpeg -hide_banner -i work/mix.wav -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
G=$(python3 -c "print(-14 - ($I))")
echo "measured $I LUFS -> gain $G dB"
ffmpeg -y -v error -i work/mix.wav -af "volume=${G}dB,alimiter=limit=0.891:attack=2:release=50:level=false" -ar 48000 -ac 2 work/master.wav
ffmpeg -y -v error -framerate 30 -i frames/f%04d.jpg -i work/master.wav -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart -metadata title="$TITLE" "out/$SLUG.mp4"
echo "--- loudness"; ffmpeg -hide_banner -i "out/$SLUG.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
echo "--- freeze/black"; ffmpeg -hide_banner -i "out/$SLUG.mp4" -vf "freezedetect=n=0.001:d=0.4,blackdetect=d=0.1" -an -f null - 2>&1 | grep -E "freeze_|black_" || echo "none"
python3 - "$SLUG" <<'PY'
import sys, subprocess
from PIL import Image
slug = sys.argv[1]
ims = []
for i in range(24):
    t = 0.5 + i * (39.5 / 24)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", f"out/{slug}.mp4", "-frames:v", "1", "-vf", "scale=180:320", f"work/q{i:02d}.jpg"], check=True)
    ims.append(Image.open(f"work/q{i:02d}.jpg"))
sh = Image.new("RGB", (180 * 8, 320 * 3))
for i, im in enumerate(ims): sh.paste(im, ((i % 8) * 180, (i // 8) * 320))
sh.save("out/qa_sheet.jpg", quality=85)
PY
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact "out/$SLUG.mp4"
