#!/bin/bash
# bash finish.sh "Title"  -> out/<slug>.mp4 : one linear gain to -14 LUFS + -1 dBFS limiter, H.264 CRF 17 + AAC, QA
set -e
TITLE="$1"; SLUG=$(echo "$TITLE" | tr 'A-Z ' 'a-z_' | tr -cd 'a-z0-9_')
# two-pass loudnorm to -14 LUFS / -1.2 dBTP, then a safety limiter
J=$(ffmpeg -hide_banner -i work/mix.wav -af loudnorm=I=-14:TP=-1.2:LRA=20:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import sys,json; print(json.load(sys.stdin)['$1'])"; }
echo "pass 1: $(g input_i) LUFS, TP $(g input_tp)"
ffmpeg -y -v error -i work/mix.wav -af "loudnorm=I=-14:TP=-1.2:LRA=20:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,alimiter=limit=0.87:attack=2:release=50:level=false" -ar 48000 -ac 2 work/master.wav
# trim: measure the master and close any gap to -14 LUFS with one linear gain (peaks have headroom after the limiter)
MI=$(ffmpeg -hide_banner -i work/master.wav -af ebur128 -f null - 2>&1 | grep -E "^ +I:" | tail -1 | awk '{print $2}')
GAIN=$(python3 -c "print(round(-14-($MI),2))"); echo "master I=$MI LUFS, trim ${GAIN} dB"
ffmpeg -y -v error -i work/master.wav -af "volume=${GAIN}dB,alimiter=limit=0.87:attack=2:release=50:level=false" -ar 48000 -ac 2 work/master_t.wav && mv work/master_t.wav work/master.wav
SUBS=""; [ -f work/captions.ass ] && SUBS="-vf subtitles=work/captions.ass:fontsdir=fonts"
ffmpeg -y -v error -framerate 30 -i frames/f%04d.jpg -i work/master.wav $SUBS -c:v libx264 -preset veryfast -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart -metadata title="$TITLE" "out/$SLUG.mp4"
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
