# Synthesized score + SFX stems for "Tikus Hanoi". Writes work/music.wav and work/sfx.wav (stems only; mix.py sets levels).
import numpy as np, wave, os

SR = 44100
FPS = 30
TOTAL_F = 1520
N = int(TOTAL_F / FPS * SR) + SR // 2
rng = np.random.default_rng(7)
F = lambda f: int(f / FPS * SR)  # frame -> sample

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, d=0.1, s=0.0, r=0.05, hold=0.0):
    a_, d_, h_, r_ = int(a * SR), int(d * SR), int(hold * SR), int(r * SR)
    e = np.concatenate([np.linspace(0, 1, max(1, a_)), np.linspace(1, s, max(1, d_)), np.full(h_, s), np.linspace(s, 0, max(1, r_))])
    return np.pad(e, (0, max(0, n - len(e))))[:n]
from scipy.signal import lfilter
def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def lpv(x, fc):  # vectorised-ish one-pole via scipy-free recursion on chunks (fast enough for short sounds)
    return lp(x, fc)
def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return lp(hp(x, lo), hi)
def saw(freq, d): t = t_(d); return 2 * ((t * freq) % 1) - 1
def sq(freq, d, duty=0.5): t = t_(d); return np.where((t * freq) % 1 < duty, 1.0, -1.0)
def sine(freq, d): return np.sin(2 * np.pi * freq * t_(d))
def sweep(f0, f1, d, curve=2.0):
    t = t_(d); fr = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(fr) / SR)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def put(buf, x, at, g=1.0):
    if at >= len(buf): return
    n = min(len(x), len(buf) - at); buf[at:at + n] += g * x[:n]
def note(n): return 440.0 * 2 ** ((n - 69) / 12)
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
def nn(s):  # "C4", "Bb3"
    k = NOTE[s[0]]; i = 1
    if s[1] == "b": k -= 1; i = 2
    elif s[1] == "#": k += 1; i = 2
    return 12 * (int(s[i:]) + 1) + k

# ---------------- instruments ----------------
def kick():
    x = sweep(130, 42, 0.32, 0.4) * env(F(0) + int(0.32 * SR), 0.002, 0.3, 0, 0.02)
    return np.tanh(1.6 * x)
def snare(g=1.0):
    n = noise(0.18) * env(int(0.18 * SR), 0.001, 0.16, 0, 0.02)
    tone = sine(190, 0.12) * env(int(0.12 * SR), 0.001, 0.1, 0, 0.01)
    return g * (0.7 * hp(n, 1200) + 0.4 * np.pad(tone, (0, len(n) - len(tone))))
def tuba(n_, d):
    f = note(n_); x = 0.6 * saw(f, d) + 0.4 * sq(f, d, 0.4)
    x = lp(x, 520) * env(len(x), 0.012, 0.12, 0.55, 0.06, max(0, d - 0.2))
    return x
def stab(chord, d=0.16):
    x = sum(saw(note(c) * (1 + 0.003 * k), d) for k, c in enumerate(chord)) / len(chord)
    return lp(x, 1900) * env(len(x), 0.008, 0.1, 0.35, 0.05, max(0, d - 0.15))
def glock(n_, d=0.5):
    f = note(n_); t = t_(d)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t * 6)
    return x
def trombone(n_, d, vib=0.0):
    t = t_(d); f = note(n_) * (1 + vib * 0.03 * np.sin(2 * np.pi * 5.5 * t))
    x = 2 * ((np.cumsum(f) / SR) % 1) - 1
    return lp(x, 900) * env(len(x), 0.03, 0.1, 0.8, 0.12, max(0, d - 0.25))

# ---------------- score: a sneaky caper march in A minor ----------------
BPM = 112; BEAT = 60 / BPM
music = np.zeros(N)
PROG = [("Am", [nn("A1"), nn("E2")], [nn("C4"), nn("E4"), nn("A4")]), ("E", [nn("E1"), nn("B1")], [nn("B3"), nn("E4"), nn("G#4")]),
        ("Am", [nn("A1"), nn("E2")], [nn("C4"), nn("E4"), nn("A4")]), ("Dm", [nn("D2"), nn("A2")], [nn("D4"), nn("F4"), nn("A4")])]
MEL = ["A4", "C5", "E5", "-", "D5", "B4", "G#4", "-", "A4", "C5", "E5", "A5", "F5", "D5", "E5", "-"]
def march(f0, f1, drums=1.0, mel=True, g=1.0):
    s0, s1 = F(f0), F(f1); b = 0
    while True:
        at = s0 + int(b * BEAT * SR)
        if at >= s1: break
        bar = (b // 4) % 4; beat = b % 4
        _, bass, chord = PROG[bar]
        if beat in (0, 2):
            put(music, tuba(bass[0 if beat == 0 else 1], BEAT * 0.7), at, 0.55 * g)
            put(music, kick(), at, 0.6 * drums * g)
        else:
            put(music, stab(chord, BEAT * 0.3), at, 0.3 * g)
            put(music, snare(0.8), at, 0.26 * drums * g)
        if mel and beat in (0, 2):
            m = MEL[(b // 2) % len(MEL)]
            if m != "-": put(music, glock(nn(m), BEAT * 1.6), at, 0.2 * g)
        b += 1
    n = int(0.03 * SR)
    if s1 - n > s0: music[s1 - n:s1] *= np.linspace(1, 0, n)
march(0, 468)
march(529, 846, drums=1.0)
# tension under "Tapi di jalan": sparse plucks, then a held breath before "Hidup"
for k in range(6): put(music, stab([nn("A3"), nn("E4")], 0.12), F(846) + int(k * BEAT * SR), 0.22)
# "tanpa ekor": a sliding trombone wah
at = F(918)
for i, (n_, d) in enumerate([("E3", 0.22), ("Eb3", 0.22), ("D3", 0.7)]): put(music, trombone(nn(n_), d, vib=1.0 if i == 2 else 0), at, 0.45); at += int(d * SR)
# night flashback: slow sneaky glock over a soft low pulse
for k in range(int((1110 - 970) / FPS / BEAT)):
    at = F(970) + int(k * BEAT * SR)
    put(music, tuba(nn(["A1", "A1", "E1", "E1"][k % 4]), BEAT * 0.5), at, 0.35)
    if k % 2 == 0: put(music, glock(nn(["E5", "C5", "B4", "G#4"][(k // 2) % 4]), 1.0), at, 0.14)
march(1110, 1318, drums=1.25, g=1.05)
march(1318, 1352, drums=0.0, mel=False, g=0.7)
# ending: gentle glock + drone
d = (TOTAL_F - 1405) / FPS + 0.3; t = t_(d)
drone = np.sin(2 * np.pi * note(nn("A2")) * t) + 0.5 * np.sin(2 * np.pi * note(nn("E3")) * t * 1.002)
drone *= np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.6)
put(music, drone, F(1405), 0.22)
for i, n_ in enumerate(["A4", "C5", "E5", "D5", "C5", "B4", "A4"]): put(music, glock(nn(n_), 1.2), F(1412) + int(i * 0.42 * SR), 0.16)
for i, n_ in enumerate(["A5", "C6", "E6", "A6"]): put(music, glock(nn(n_), 0.9), F(T_EKOR := 1494) + int(i * 0.08 * SR), 0.13)

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(d=0.45, lo=300, hi=2600):
    n = noise(d); x = bp(n, lo, hi); e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2; return x * e
def squeak(f0=2300, d=0.11, n=2):
    out = np.zeros(int((d * n + 0.05) * SR))
    for k in range(n):
        t = t_(d); fr = f0 * (1 + 0.25 * np.sin(np.pi * t / d)) * (1 + 0.03 * np.sin(2 * np.pi * 40 * t))
        x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / d) ** 1.5
        put(out, x, int(k * (d + 0.03) * SR), 1.0 - 0.2 * k)
    return out
def scurry(d=0.8): t = t_(d); return hp(noise(d), 2500) * (np.abs(np.sin(2 * np.pi * 14 * t)) ** 4) * np.sin(np.pi * t / d)
def pop(): return sweep(500, 1300, 0.08, 1) * env(int(0.08 * SR), 0.001, 0.075)
def ting(f=2400, d=0.6): t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.4 * t)) * np.exp(-t * 7)
def coinclink(): x = np.zeros(int(0.3 * SR)); [put(x, ting(f, 0.25), int(i * 0.03 * SR), 0.6) for i, f in enumerate([3100, 4200])]; return x
def sparkle(): x = np.zeros(int(0.8 * SR)); [put(x, ting(f, 0.5), int(i * 0.06 * SR), 0.6) for i, f in enumerate([2100, 2800, 3500])]; return x
def tap(): return lp(noise(0.03), 900) * env(int(0.03 * SR), 0.001, 0.028)
def plop(): return lp(noise(0.05), 700) * env(int(0.05 * SR), 0.002, 0.045) + 0.5 * sweep(240, 120, 0.05, 1) * env(int(0.05 * SR), 0.001, 0.045)
def click(): return hp(noise(0.012), 3000) * env(int(0.012 * SR), 0.0005, 0.011)
def snip(): x = np.zeros(int(0.35 * SR)); put(x, click(), 0, 1.0); put(x, ting(5200, 0.3), int(0.005 * SR), 0.5); put(x, hp(noise(0.05), 4000) * env(int(0.05 * SR), 0.001, 0.045), int(0.01 * SR), 0.6); return x
def boing(): d = 0.45; t = t_(d); f = 180 + 260 * np.abs(np.sin(2 * np.pi * 7 * t)) * np.exp(-t * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
def honk(): d = 0.16; x = 0.5 * (sq(415, d, 0.5) + sq(523, d, 0.5)); return lp(x, 2200) * env(len(x), 0.005, d - 0.02, 0, 0.015)
def drip(): d = 0.12; return sweep(900, 1800, d, 2) * np.exp(-t_(d) * 30)
def water(d): return bp(noise(d), 300, 1800) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 1.3 * t_(d))))
def crickets(d): t = t_(d); return bp(noise(d), 4000, 6000) * (np.sin(2 * np.pi * 30 * t) > 0.6) * (np.sin(2 * np.pi * 0.9 * t) > -0.2)
def step(): return lp(noise(0.07), 500) * env(int(0.07 * SR), 0.002, 0.06) + 0.6 * sweep(110, 60, 0.07, 1) * env(int(0.07 * SR), 0.001, 0.06)
def stamp(): d = 0.6; t = t_(d); return np.tanh(2.2 * (sweep(120, 45, d, 0.5) * np.exp(-t * 9) + 0.6 * lp(noise(d), 1200) * np.exp(-t * 25)))
def gulp(): return sweep(260, 120, 0.12, 1) * env(int(0.12 * SR), 0.003, 0.11)
def rustle(d=0.35): return bp(noise(d), 1500, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t_(d)))) * env(int(d * SR), 0.01, d - 0.05, 0, 0.04)
def birds(d): t = t_(d); x = np.zeros(len(t)); [put(x, squeak(3600 + 400 * (k % 3), 0.06, 2) * 0.5, int(k * 0.9 * SR)) for k in range(int(d / 0.9))]; return x[:len(t)]

# 1 hook: coin + rat
put(sfx, coinclink(), F(34), 0.7); put(sfx, squeak(2400), F(52), 0.6); put(sfx, squeak(2600), F(104), 0.5)
# 2 flood
put(sfx, whoosh(0.6, 200, 1600), F(128), 0.4)
for k in range(10): put(sfx, scurry(0.9), F(150 + k * 7), 0.35)
for f, fr in [(160, 2500), (172, 2900), (183, 2300), (196, 2700), (205, 3100), (214, 2400)]: put(sfx, squeak(fr), F(f), 0.45)
put(sfx, gulp(), F(166), 0.5); put(sfx, boing(), F(196), 0.4)
# 3 aerial + roadworks
put(sfx, whoosh(0.8, 200, 2400), F(224), 0.55)
for f in range(300, 376, 11): put(sfx, ting(1500, 0.15), F(f), 0.25); put(sfx, tap(), F(f + 3), 0.4)
put(sfx, whoosh(0.6, 200, 2000), F(368), 0.5)
# 4 sewer toll road
put(sfx, water(74 / FPS), F(378), 0.3)
for f in (384, 410, 433): put(sfx, drip(), F(f), 0.35)
for k in range(6): put(sfx, scurry(0.6), F(380 + k * 12), 0.45)
put(sfx, honk(), F(404), 0.55); put(sfx, honk(), F(410), 0.55)
# 5 bathroom
put(sfx, whoosh(0.4), F(448), 0.4); put(sfx, boing(), F(470), 0.7); put(sfx, squeak(2800, 0.1, 3), F(474), 0.6); put(sfx, gulp(), F(478), 0.6)
# 6-7 office
put(sfx, whoosh(0.4), F(526), 0.35); put(sfx, rustle(0.6), F(532), 0.6)
put(sfx, pop(), F(586), 0.6); put(sfx, squeak(2500), F(590), 0.4); put(sfx, coinclink(), F(629), 0.8)
put(sfx, whoosh(0.5, 200, 1500), F(652), 0.35); put(sfx, plop(), F(671), 0.9)
for k in range(16): put(sfx, plop(), F(730 + k * 3), 0.6)
put(sfx, gulp(), F(762), 0.5)
# 8 street reveal
put(sfx, whoosh(0.4), F(788), 0.35)
for f in range(800, 840, 9): put(sfx, step(), F(f), 0.5)
for f in range(846, 874, 5): put(sfx, tap(), F(f), 0.35)
put(sfx, squeak(3000, 0.12, 2), F(884), 0.6)
put(sfx, whoosh(0.35, 400, 3000), F(912), 0.4); put(sfx, sparkle(), F(922), 0.35)
# 9 flashback
put(sfx, whoosh(0.7, 300, 4000), F(963), 0.55); put(sfx, crickets(143 / FPS), F(967), 0.18)
for f in (975, 985, 994): put(sfx, click(), F(f), 0.45)
put(sfx, snip(), F(1002), 0.9); put(sfx, squeak(3200, 0.12, 2), F(1005), 0.6); put(sfx, plop(), F(1018), 0.5)
put(sfx, scurry(0.9), F(1041), 0.5); put(sfx, sparkle(), F(1075), 0.4)
for f in (1085, 1089, 1093, 1097): put(sfx, pop(), F(f), 0.45); put(sfx, squeak(3600, 0.06, 1), F(f + 1), 0.3)
# 10 more, more, more
put(sfx, whoosh(0.5, 300, 3000), F(1106), 0.45)
for k in range(14): put(sfx, pop(), F(1108 + k * 2.2), 0.35)
for k in range(8): put(sfx, plop(), F(1148 + k * 3), 0.5)
for k in range(10): put(sfx, coinclink(), F(1189 + k * 3), 0.55)
# 11 farm
put(sfx, whoosh(0.5), F(1232), 0.4); put(sfx, birds(4.0), F(1240), 0.15)
for f in range(1240, 1306, 10): put(sfx, step(), F(f), 0.4)
put(sfx, gulp(), F(1318), 0.6)
for f, fr in [(1322, 2500), (1328, 2900), (1334, 2300), (1340, 3100)]: put(sfx, squeak(fr), F(f), 0.4)
# 12-13 ending
put(sfx, whoosh(0.4), F(1352), 0.35); put(sfx, stamp(), F(1378), 1.0)
put(sfx, whoosh(0.5), F(1402), 0.4); put(sfx, squeak(2300, 0.14, 2), F(1414), 0.35)
put(sfx, sparkle(), F(1494), 0.45)

def save(path, x):
    x = x[:int(TOTAL_F / FPS * SR)]
    pk = np.max(np.abs(x)) or 1; x = x / pk * 0.9
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
os.makedirs("work", exist_ok=True)
save("work/music.wav", music); save("work/sfx.wav", sfx)
print("ok", len(music) / SR)
