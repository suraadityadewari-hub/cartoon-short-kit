# Synthesized score + SFX stems for "Nikahan Anjing". Writes work/music.wav and work/sfx.wav (stems only; mix.py sets levels).
import numpy as np, wave, os

SR = 44100
FPS = 30
TOTAL_F = 1985
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

# ---------------- score: a royal caper in D "phrygian dominant" (shehnai-ish lead, tabla-ish drums) ----------------
BPM = 112; BEAT = 60 / BPM
music = np.zeros(N)
PROG = [("D", [nn("D2"), nn("A2")], [nn("D4"), nn("F#4"), nn("A4")]), ("Eb", [nn("Eb2"), nn("Bb2")], [nn("Eb4"), nn("G4"), nn("Bb4")]),
        ("D", [nn("D2"), nn("A2")], [nn("D4"), nn("F#4"), nn("A4")]), ("Gm", [nn("G1"), nn("D2")], [nn("D4"), nn("G4"), nn("Bb4")])]
MEL = ["D5", "Eb5", "F#5", "-", "G5", "F#5", "Eb5", "-", "D5", "F#5", "A5", "G5", "F#5", "-", "D5", "-"]
def pluck(n_, d=0.25):
    f = note(n_); t = t_(d); fr = f * (1 + 0.012 * np.exp(-t * 30)); x = (2 * ((np.cumsum(fr) / SR) % 1) - 1) * np.exp(-t * 9); return lp(x, 3400)
def shehnai(n_, d):
    t = t_(d); f = note(n_) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t) * np.minimum(1, t / 0.15))
    ph = np.cumsum(f) / SR; x = 0.6 * (2 * (ph % 1) - 1) + 0.4 * np.where(ph % 1 < 0.3, 1.0, -1.0)
    return bp(x, 500, 2600) * env(len(x), 0.04, 0.1, 0.75, 0.08, max(0, d - 0.25))
def tabla(hi=True): d = 0.22; t = t_(d); f = (330 if hi else 120) * (1 + 0.6 * np.exp(-t * 25)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (14 if hi else 9))
def march(f0, f1, drums=1.0, mel=True, g=1.0, cak=True, lead=False):
    s0, s1 = F(f0), F(f1); b = 0
    while True:
        at = s0 + int(b * BEAT * SR)
        if at >= s1: break
        bar = (b // 4) % 4; beat = b % 4
        _, bass, chord = PROG[bar]
        if beat in (0, 2):
            put(music, tuba(bass[0 if beat == 0 else 1], BEAT * 0.7), at, 0.5 * g)
            put(music, tabla(False), at, 0.5 * drums * g)
        else:
            put(music, stab(chord, BEAT * 0.3), at, 0.22 * g)
            put(music, tabla(True), at, 0.3 * drums * g)
        put(music, tabla(True), at + int(BEAT / 2 * SR), 0.14 * drums * g)
        if cak:
            for k in range(2): put(music, pluck(chord[(b + k) % 3] + 12, 0.22), at + int(k * BEAT / 2 * SR), 0.15 * g)
        if mel and beat in (0, 2):
            m = MEL[(b // 2) % len(MEL)]
            if m != "-": put(music, shehnai(nn(m), BEAT * 1.7) if lead else glock(nn(m), BEAT * 1.6), at, (0.16 if lead else 0.18) * g)
        b += 1
    n = int(0.04 * SR)
    if s1 - n > s0: music[s1 - n:s1] *= np.linspace(1, 0, n)
def wah(at, notes, g=0.45):
    for i, (n_, d) in enumerate(notes): put(music, trombone(nn(n_), d, vib=1.0 if i == len(notes) - 1 else 0), at, g); at += int(d * SR)
def sting(at, chord, g=0.5, d=0.9): put(music, stab([nn(c) for c in chord], d), at, g); put(music, kick(), at, 0.6 * g)
def waltz(f0, f1, g=1.0):
    b = 0
    while F(f0) + int(b * BEAT * SR) < F(f1):
        at = F(f0) + int(b * BEAT * SR); bar = (b // 3) % 4; _, bass, chord = PROG[[0, 3, 1, 0][bar]]
        if b % 3 == 0: put(music, tuba(bass[0], BEAT * 0.8), at, 0.32 * g)
        else: put(music, pluck(chord[b % 3] + 12, 0.35), at, 0.2 * g)
        if b % 3 == 0: put(music, glock(nn(["F#5", "G5", "Eb5", "D5"][bar]), 1.2), at, 0.15 * g)
        b += 1
march(0, 200, lead=True)
sting(F(169), ["D4", "F#4", "A4", "D5"], 0.45, 0.4)
march(203, 405, drums=0.8, g=0.9)
sting(F(350), ["Eb4", "G4", "Bb4", "Eb5"], 0.5, 0.6)
march(407, 498, drums=0.7, g=0.85, mel=False)
waltz(501, 752)
for i, n_ in enumerate(["D6", "F#6", "A6"]): put(music, glock(nn(n_), 0.9), F(688) + int(i * 0.07 * SR), 0.18)
march(755, 940, drums=1.3, g=1.05, lead=True)
march(942, 1126, drums=1.0, g=1.0, lead=True)
sting(F(1024), ["D4", "F#4", "A4", "D5"], 0.6)
for k in range(5): put(music, pluck(nn(["D4", "F#4", "A4", "F#4", "D4"][k]), 0.4), F(1132) + int(k * BEAT * SR), 0.18)
wah(F(1196), [("A3", 0.2), ("Ab3", 0.2), ("G3", 0.7)], 0.45)
put(music, stab([nn("D4"), nn("A4")], 0.3), F(1245), 0.3)
for k in range(16): put(music, glock(nn("D5") + [0, 4, 7, 12][k % 4] + 12 * (k // 8), 0.3), F(1306) + int(k * 0.08 * SR), 0.12)
march(1310, 1392, drums=0.8, g=0.9)
sting(F(1395), ["D4", "G4", "Bb4"], 0.4, 0.5)
march(1400, 1655, drums=0.7, g=0.85)
for k in range(int((1800 - 1662) / FPS / (BEAT / 2))): put(music, stab([nn("D3"), nn("A3")], 0.09), F(1662) + int(k * BEAT / 2 * SR), 0.14 if k % 2 else 0.22)
sting(F(1832), ["Eb4", "G4", "Bb4", "Eb5"], 0.55, 0.5)
waltz(1840, 1897, g=0.7)
wah(F(1932), [("D4", 0.3), ("Db4", 0.3), ("C4", 0.3), ("B3", 1.3)], 0.5)

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

def bark(f=520, g=1.0):
    d = 0.17; t = t_(d); fr = f * (1 + 0.45 * np.sin(np.pi * t / d)) * (1 - 0.25 * t / d)
    x = 0.7 * (2 * ((np.cumsum(fr) / SR) % 1) - 1) + 0.5 * noise(d)
    return g * bp(x, 350, 2400) * np.sin(np.pi * np.minimum(1, t / d)) ** 0.6
def barks(at, n, spread=0.9, f0=420, g=0.5):
    for k in range(n): put(sfx, bark(f0 + 380 * rng.random(), 0.6 + 0.4 * rng.random()), at + int(spread * rng.random() * SR), g)
def hiss(d=1.2): return hp(noise(d), 2500) * env(int(d * SR), 0.05, 0.2, 0.6, 0.4, d - 0.6)
def engine(d, f0=28, f1=45): t = t_(d); fr = f0 + (f1 - f0) * t / d; x = 2 * ((np.cumsum(fr) / SR) % 1) - 1; return lp(x, 300) * (0.6 + 0.4 * np.sin(2 * np.pi * fr * 3 * t)) + 0.4 * lp(noise(d), 600)
# 1 the wedding
put(sfx, sparkle(), F(4), 0.35); put(sfx, whoosh(0.4), F(132), 0.35)
put(sfx, bark(560), F(169), 0.9); put(sfx, bark(470), F(171), 0.8); put(sfx, pop(), F(170), 0.4)
# 2 durbar hall
put(sfx, whoosh(0.4), F(200), 0.3)
put(sfx, whoosh(0.6, 200, 2400), F(346), 0.45)
for k in range(12): put(sfx, pop(), F(350 + int(k * 1.5)), 0.25)
barks(F(352), 14, 1.6, g=0.32)
# 3 kennels
put(sfx, whoosh(0.35), F(405), 0.3)
for k in range(8): put(sfx, rustle(0.3), F(412 + k * 11), 0.3)
barks(F(430), 3, 1.8, f0=600, g=0.25)
# 4 Roshanara + Bobby
put(sfx, sparkle(), F(502), 0.35); put(sfx, sparkle(), F(608), 0.35)
for f in range(640, 690, 7): put(sfx, tap(), F(f), 0.45)
put(sfx, sparkle(), F(688), 0.5); put(sfx, boing() * 0.5, F(690), 0.3)
# 5 the station
put(sfx, hiss(1.6), F(752), 0.35); put(sfx, ting(1500, 0.8), F(758), 0.3); put(sfx, ting(1500, 0.8), F(768), 0.25)
for f in range(772, 812, 7): put(sfx, tap(), F(f), 0.45)
put(sfx, whoosh(0.5), F(842), 0.4)
for k in range(18): put(sfx, pop(), F(845 + int(k * 1.2)), 0.22)
barks(F(850), 8, 1.4, g=0.3)
# 6 procession
put(sfx, whoosh(0.4), F(940), 0.3)
for f in range(950, 1125, 11): put(sfx, step(), F(f), 0.35)
put(sfx, stamp(), F(1024), 1.0)
# 7 the Governor General
put(sfx, whoosh(0.35), F(1128), 0.3); put(sfx, rustle(0.5), F(1135), 0.45); put(sfx, rustle(0.4), F(1195), 0.3); put(sfx, stamp(), F(1193), 0.95)
# 8 the cost
put(sfx, whoosh(0.35), F(1243), 0.3); put(sfx, pop(), F(1248), 0.4)
for k in range(26): put(sfx, coinclink(), F(1308) + int(k * 0.09 * SR), 0.28)
# 9 1947
put(sfx, whoosh(0.6, 200, 2400), F(1392), 0.45); put(sfx, engine(2.0, 20, 24) * 0.0, F(1395), 0.0)
for f in range(1470, 1530, 8): put(sfx, ting(900, 0.12), F(f), 0.2); put(sfx, tap(), F(f), 0.5)
for f in range(1540, 1640, 9): put(sfx, step(), F(f), 0.35)
put(sfx, scurry(1.2), F(1580), 0.45); barks(F(1600), 5, 1.0, f0=600, g=0.3)
# 10 the wife steps off
put(sfx, pop(), F(1680), 0.5); put(sfx, whoosh(0.3), F(1660), 0.3)
for f in range(1700, 1800, 7): put(sfx, tap(), F(f), 0.5)
d_ = (TOTAL_F - 1780) / FPS
put(sfx, engine(d_, 18, 34) * np.minimum(1, t_(d_) / 2.5), F(1780), 0.35)
# 11 her seat
put(sfx, whoosh(0.3, 600, 3000), F(1808), 0.35); put(sfx, pop(), F(1826), 0.6); put(sfx, bark(600), F(1832), 0.8); put(sfx, bark(500), F(1836), 0.7); put(sfx, boing(), F(1834), 0.35)
# 12 take-off
put(sfx, whoosh(1.5, 150, 1800), F(1900), 0.5); put(sfx, engine(2.8, 38, 52), F(1905), 0.45)

def save(path, x):
    x = x[:int(TOTAL_F / FPS * SR)]
    pk = np.max(np.abs(x)) or 1; x = x / pk * 0.9
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
os.makedirs("work", exist_ok=True)
save("work/music.wav", music); save("work/sfx.wav", sfx)
print("ok", len(music) / SR)
