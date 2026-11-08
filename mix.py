# python3 mix.py voice.mp3 work/music.wav work/sfx.wav -> work/mix.wav
# Music: gated RMS 10 dB under the voice, then ducked a further 3.5 dB while the narrator speaks (attack ~30 ms, release ~250 ms).
# SFX: gated RMS at or below the music, peaks capped at 0.7x the voice peak.
import sys, subprocess, numpy as np, wave
SR = 44100
MUSIC_DB, DUCK_DB, SFX_DB = -10.0, 3.5, -10.0
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def win_rms(x, win=0.02):
    n = int(win * SR); m = len(x) // n
    return np.sqrt(np.mean(x[: m * n].reshape(m, n) ** 2, axis=1)), n
def gated_rms(x, gate_db=-40):
    r, _ = win_rms(x, 0.05); thr = np.max(r) * 10 ** (gate_db / 20); a = r[r > thr]
    return np.sqrt(np.mean(a ** 2)) if len(a) else 1e-9
db = lambda r: 20 * np.log10(max(r, 1e-12))
raw = [load(p) for p in sys.argv[1:4]]
L = max(len(x) for x in raw)  # length follows the longest stem (stems are built to the frame count)
pad = lambda x: np.pad(x, (0, max(0, L - len(x))))[:L]
v, mu, fx = (pad(x) for x in raw)
rv = gated_rms(v)
mu *= 10 ** (MUSIC_DB / 20) * rv / gated_rms(mu)
fx *= 10 ** (SFX_DB / 20) * rv / gated_rms(fx)
cap = 0.7 * np.max(np.abs(v))
if np.max(np.abs(fx)) > cap: fx *= cap / np.max(np.abs(fx))
# ducking: speech mask from the voice envelope, smoothed with attack/release
r, n = win_rms(v)
speech = (r > rv * 10 ** (-18 / 20)).astype(float)
g = np.zeros_like(speech); a_up, a_dn = 1 - np.exp(-0.02 / 0.03), 1 - np.exp(-0.02 / 0.25)
for i in range(len(speech)):
    prev = g[i - 1] if i else 0.0
    g[i] = prev + (a_up if speech[i] > prev else a_dn) * (speech[i] - prev)
duck = 10 ** (-DUCK_DB * g / 20)
duck_s = np.interp(np.arange(L), np.arange(len(duck)) * n + n / 2, duck)
mu *= duck_s
sp = np.repeat(speech, n)[:L]; sp = np.pad(sp, (0, L - len(sp)))
def seg_rms(x, m): return np.sqrt(np.mean(x[m > 0.5] ** 2)) if np.any(m > 0.5) else 1e-9
print(f"voice gated RMS {db(rv):.1f} dBFS, peak {db(np.max(np.abs(v))):.1f}")
print(f"music vs voice overall {db(gated_rms(mu)) - db(rv):+.1f} dB, under speech {db(seg_rms(mu, sp)) - db(rv):+.1f} dB")
print(f"sfx   vs voice {db(gated_rms(fx)) - db(rv):+.1f} dB, sfx peak / voice peak {np.max(np.abs(fx)) / np.max(np.abs(v)):.2f}")
mix = (v + mu + fx) / 8
with wave.open("work/mix.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(4); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 2147483647).astype(np.int32).tobytes())
