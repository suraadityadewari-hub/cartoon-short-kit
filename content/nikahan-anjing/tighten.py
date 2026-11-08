"""Cap pauses in voice_raw.mp3 -> voice.mp3. Long pauses (>=0.8 s, sentence ends) cap at 0.6 s,
short ones cap at 0.4 s. Pauses listed in KEEP (by index) keep up to 0.85 s (dramatic beats)."""
import subprocess, re, sys, numpy as np
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "voice_raw.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True).stdout
x = np.frombuffer(raw, np.float32)
log = subprocess.run(["ffmpeg", "-i", "voice_raw.mp3", "-af", "silencedetect=n=-35dB:d=0.18", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r"silence_start: ([0-9.]+)", log)]
en = [float(v) for v in re.findall(r"silence_end: ([0-9.]+)", log)]
pairs = list(zip(st, en))
KEEP = set(int(a) for a in sys.argv[1:])
out, cur = [], 0
for i, (a, b) in enumerate(pairs):
    d = b - a
    if a < 0.05:  # leading silence -> 0.15 s
        cap = 0.15
    elif b >= len(x) / SR - 0.05:
        cap = 0.4
    elif i in KEEP:
        cap = 0.85
    else:
        cap = 0.6 if d >= 0.8 else 0.4
    if d <= cap:
        continue
    # keep head and tail of the gap, drop the middle
    h = cap / 2
    ca, cb = int((a + h) * SR), int((b - h) * SR)
    out.append(x[cur:ca]); cur = cb
    print(f"{i:2d} {a:6.2f} {d:4.2f} -> {cap:.2f}")
out.append(x[cur:])
y = np.concatenate(out)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-c:a", "libmp3lame", "-b:a", "192k", "voice.mp3"], input=y.tobytes())
print("len", len(x) / SR, "->", len(y) / SR)
