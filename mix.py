# python3 mix.py voice.mp3 work/music.wav work/sfx.wav -> work/mix.wav
# Music gated RMS = 50 % of voice gated RMS (-6 dB). SFX gated RMS <= 50 % of voice, peaks capped at 0.7x voice peak.
import sys, subprocess, numpy as np, wave
SR = 44100
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def gated_rms(x, win=0.05, gate_db=-40):
    n = int(win * SR); m = len(x) // n
    r = np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1))
    thr = np.max(r) * 10 ** (gate_db / 20); act = r[r > thr]
    return np.sqrt(np.mean(act ** 2)) if len(act) else 1e-9
db = lambda r: 20 * np.log10(max(r, 1e-12))
v, mu, fx = load(sys.argv[1]), load(sys.argv[2]), load(sys.argv[3])
L = int(1202 / 30 * SR)
pad = lambda x: np.pad(x, (0, max(0, L - len(x))))[:L]
v, mu, fx = pad(v), pad(mu), pad(fx)
rv = gated_rms(v)
mu *= 0.5 * rv / gated_rms(mu)
fx *= 0.5 * rv / gated_rms(fx)
cap = 0.7 * np.max(np.abs(v))
if np.max(np.abs(fx)) > cap: fx *= cap / np.max(np.abs(fx))
print(f"voice gated RMS {db(rv):.1f} dBFS, peak {db(np.max(np.abs(v))):.1f}")
print(f"music vs voice {db(gated_rms(mu)) - db(rv):+.1f} dB")
print(f"sfx   vs voice {db(gated_rms(fx)) - db(rv):+.1f} dB, sfx peak / voice peak {np.max(np.abs(fx)) / np.max(np.abs(v)):.2f}")
mix = v + mu + fx
with wave.open("work/mix.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(4); w.setframerate(SR)
    w.writeframes((np.clip(mix, -8, 8) / 8 * 2147483647).astype(np.int32).tobytes())
print("pre-gain scale 1/8 applied for headroom")
