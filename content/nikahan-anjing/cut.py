"""Remove frame ranges from the timeline (here: the two "Konon" beats).
Audio stems are cut at the same times (10 ms crossfade); frames are relinked into frames_c/.
python3 cut.py -> work/voice_c.wav work/music_c.wav work/sfx_c.wav, frames_c/f%04d.jpg"""
import subprocess, numpy as np, wave, os, glob
FPS, SR = 30, 44100
CUTS = [(1278, 1304), (1650, 1678)]   # [start, end) in frames
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def cut(x):
    out, cur, xf = [], 0, int(0.01 * SR)
    for a, b in CUTS:
        ia, ib = round(a / FPS * SR), round(b / FPS * SR)
        head, tail = x[cur:ia], x[ib:ib + xf]
        r = np.linspace(1, 0, xf)
        head = head.copy(); head[-xf:] = head[-xf:] * r + tail[:xf] * (1 - r)
        out.append(head); cur = ib + xf
    out.append(x[cur:]); return np.concatenate(out)
for src, dst in [("voice.mp3", "voice_c"), ("work/music.wav", "music_c"), ("work/sfx.wav", "sfx_c")]:
    y = cut(load(src))
    with wave.open(f"work/{dst}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(4); w.setframerate(SR)
        w.writeframes((np.clip(y, -1, 1) * 2147483647).astype(np.int32).tobytes())
    print(dst, round(len(y) / SR, 2), "s")
os.makedirs("frames_c", exist_ok=True)
for f in glob.glob("frames_c/*.jpg"): os.remove(f)
drop = set(f for a, b in CUTS for f in range(a, b))
n = 0
for f in range(len(glob.glob("frames/f*.jpg"))):
    if f in drop: continue
    os.symlink(os.path.abspath(f"frames/f{f:04d}.jpg"), f"frames_c/f{n:04d}.jpg"); n += 1
print("frames", n, "=", round(n / FPS, 2), "s")
