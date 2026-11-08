# Synthesized score + SFX stems for "Gunting Sjafruddin". Writes work/music.wav and work/sfx.wav (stems only; mix.py sets levels).
import numpy as np, wave, os

SR = 44100
FPS = 30
TOTAL_F = 1695
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

# ---------------- score: a bright, cheeky caper in C major (kroncong-ish plucks) ----------------
BPM = 116; BEAT = 60 / BPM
music = np.zeros(N)
PROG = [("C", [nn("C2"), nn("G2")], [nn("E4"), nn("G4"), nn("C5")]), ("Am", [nn("A1"), nn("E2")], [nn("E4"), nn("A4"), nn("C5")]),
        ("F", [nn("F1"), nn("C2")], [nn("F4"), nn("A4"), nn("C5")]), ("G", [nn("G1"), nn("D2")], [nn("D4"), nn("G4"), nn("B4")])]
MEL = ["E5", "G5", "C6", "-", "A5", "G5", "E5", "-", "F5", "A5", "G5", "E5", "D5", "-", "G5", "-"]
def pluck(n_, d=0.25):
    f = note(n_); t = t_(d); x = (saw(f, d) * 0.6 + sq(f, d, 0.3) * 0.4) * np.exp(-t * 14); return lp(x, 2600)
def march(f0, f1, drums=1.0, mel=True, g=1.0, cak=True):
    s0, s1 = F(f0), F(f1); b = 0
    while True:
        at = s0 + int(b * BEAT * SR)
        if at >= s1: break
        bar = (b // 4) % 4; beat = b % 4
        _, bass, chord = PROG[bar]
        if beat in (0, 2):
            put(music, tuba(bass[0 if beat == 0 else 1], BEAT * 0.7), at, 0.55 * g)
            put(music, kick(), at, 0.5 * drums * g)
        else:
            put(music, stab(chord, BEAT * 0.3), at, 0.26 * g)
            put(music, snare(0.7), at, 0.22 * drums * g)
        if cak:
            for k in range(2): put(music, pluck(chord[(b + k) % 3] + 12, 0.18), at + int(k * BEAT / 2 * SR), 0.16 * g)
        if mel and beat in (0, 2):
            m = MEL[(b // 2) % len(MEL)]
            if m != "-": put(music, glock(nn(m), BEAT * 1.6), at, 0.18 * g)
        b += 1
    n = int(0.04 * SR)
    if s1 - n > s0: music[s1 - n:s1] *= np.linspace(1, 0, n)
def wah(at, notes, g=0.45):
    for i, (n_, d) in enumerate(notes): put(music, trombone(nn(n_), d, vib=1.0 if i == len(notes) - 1 else 0), at, g); at += int(d * SR)
def sting(at, chord, g=0.5, d=0.9): put(music, stab([nn(c) for c in chord], d), at, g); put(music, kick(), at, 0.6 * g)
march(0, 220)
march(222, 352, drums=1.2, g=1.05)
for k, f in enumerate(range(357, 412, 7)): put(music, stab([nn("C4") + k, nn("E4") + k, nn("G4") + k], 0.14), F(f), 0.32)   # price climbs
wah(F(428), [("G3", 0.22), ("F#3", 0.22), ("F3", 0.8)])                                                                     # empty safe
for i, n_ in enumerate(["C6", "E6", "G6"]): put(music, glock(nn(n_), 0.9), F(516) + int(i * 0.06 * SR), 0.2)                # idea
march(522, 690, drums=0.9, g=0.95)
sting(F(692), ["C4", "E4", "G4", "C5"], 0.6)
march(745, 836, drums=0.8, g=0.9)
wah(F(840), [("E3", 0.2), ("Eb3", 0.2), ("D3", 0.6)], 0.4)
march(882, 975, drums=0.6, g=0.85)
march(977, 1074, drums=0.7, g=0.85)
for k in range(26): put(music, glock(nn("C5") + (k % 12), 0.25), F(1078) + int(k * 0.07 * SR), 0.12)                        # the years fly
for k in range(8):                                                                                                         # old, slow, tired
    at = F(1132) + int(k * BEAT * 1.6 * SR); put(music, tuba(nn(["C2", "G1", "A1", "E1"][k % 4]), BEAT), at, 0.35)
    if k % 2 == 0: put(music, lp(glock(nn(["E5", "D5", "C5", "B4"][(k // 2) % 4]), 1.4), 1800), at, 0.14)
def waltz(f0, f1, g=1.0):
    b = 0
    while F(f0) + int(b * BEAT * SR) < F(f1):
        at = F(f0) + int(b * BEAT * SR); bar = (b // 3) % 4; _, bass, chord = PROG[[0, 2, 1, 3][bar]]
        if b % 3 == 0: put(music, tuba(bass[0], BEAT * 0.8), at, 0.35 * g)
        else: put(music, pluck(chord[b % 3] + 12, 0.3), at, 0.2 * g)
        if b % 3 == 0: put(music, glock(nn(["E5", "F5", "E5", "D5"][bar]), 1.2), at, 0.15 * g)
        b += 1
waltz(1183, 1292)
march(1296, 1345, drums=0.5, mel=False, g=0.75)
waltz(1349, 1396)
wah(F(1402), [("G3", 0.2), ("F#3", 0.2), ("F3", 0.7)], 0.45)
for k in range(int((1560 - 1452) / FPS / (BEAT / 2))): put(music, stab([nn("A3"), nn("E4")], 0.09), F(1452) + int(k * BEAT / 2 * SR), 0.16 if k % 2 else 0.24)
d = (TOTAL_F - 1650) / FPS + 0.3; t = t_(d)
sting(F(1650), ["C4", "E4", "G4", "Bb4"], 0.55, 0.7)
for i, n_ in enumerate(["C5", "E5", "G5", "C6"]): put(music, glock(nn(n_), 1.0), F(1662) + int(i * 0.09 * SR), 0.15)

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

# 1 hook
put(sfx, whoosh(0.5, 400, 3000), F(60), 0.45); put(sfx, snip(), F(84), 1.0); put(sfx, rustle(0.6), F(88), 0.5)
put(sfx, whoosh(0.35, 500, 3500), F(154), 0.4); put(sfx, snip(), F(178), 1.0)
# 2 money rain
put(sfx, whoosh(0.8, 200, 2400), F(218), 0.5)
for k in range(14): put(sfx, rustle(0.4), F(226 + k * 9), 0.35)
for f in (250, 262, 276): put(sfx, ting(1800 + f, 0.3), F(f), 0.2)
# 3 price climbs
for k, f in enumerate(range(357, 412, 7)): put(sfx, tap(), F(f), 0.5); put(sfx, ting(1200 + 160 * k, 0.15), F(f + 1), 0.25)
# 4 the empty safe
put(sfx, sweep(160, 90, 0.5, 1) * env(int(0.5 * SR), 0.02, 0.45) * 0.6, F(418), 0.6)
for k in range(5): put(sfx, rustle(0.25) * 0.6, F(432 + k * 8), 0.35)
# 5 the minister
put(sfx, whoosh(0.35), F(474), 0.35); put(sfx, sparkle(), F(516), 0.45); put(sfx, rustle(0.4), F(560), 0.4)
put(sfx, whoosh(0.3, 600, 3000), F(612), 0.4); put(sfx, snip(), F(632), 1.0); put(sfx, rustle(0.5), F(634), 0.4)
put(sfx, stamp(), F(692), 1.0)
# 6 shopping
put(sfx, whoosh(0.35), F(743), 0.3); put(sfx, rustle(0.4), F(770), 0.4)
put(sfx, pop(), F(838), 0.6); put(sfx, whoosh(0.3, 400, 2000), F(840), 0.3)
put(sfx, whoosh(0.4, 300, 2600), F(892), 0.35); put(sfx, sparkle(), F(941), 0.5)
# 7 bank
put(sfx, whoosh(0.35), F(975), 0.3); put(sfx, rustle(0.4), F(980), 0.4); put(sfx, rustle(0.5), F(1016), 0.45); put(sfx, stamp() * 0.4, F(1030), 0.4); put(sfx, rustle(0.4), F(1046), 0.4)
for k in range(30): put(sfx, click(), F(1078) + int(k * 0.06 * SR), 0.5)
def snore(d=1.2): t = t_(d); return lp(noise(d), 500) * np.sin(np.pi * np.minimum(1, t / (d * 0.6))) ** 2
put(sfx, snore(1.3), F(1135), 0.35); put(sfx, snore(1.3), F(1170), 0.3)
# 8 tailor shop
put(sfx, whoosh(0.35), F(1179), 0.3)
for f in (1190, 1222, 1255): put(sfx, sparkle(), F(f), 0.22)
# 9 prime minister
put(sfx, whoosh(0.35), F(1292), 0.3); put(sfx, rustle(0.5), F(1300), 0.35)
# 10 savings cut
put(sfx, coinclink(), F(1352), 0.4); put(sfx, whoosh(0.4, 500, 3500), F(1378), 0.45); put(sfx, snip(), F(1400), 1.0)
put(sfx, boing(), F(1406), 0.45); put(sfx, plop(), F(1420), 0.6)
# 11 the protest: foot taps
put(sfx, whoosh(0.35), F(1447), 0.3); put(sfx, pop(), F(1453), 0.5)
for f in range(1460, 1560, 7): put(sfx, tap(), F(f), 0.55)
# 12 state secret
put(sfx, rustle(0.6), F(1566), 0.5); put(sfx, stamp(), F(1650), 1.0)

def save(path, x):
    x = x[:int(TOTAL_F / FPS * SR)]
    pk = np.max(np.abs(x)) or 1; x = x / pk * 0.9
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
os.makedirs("work", exist_ok=True)
save("work/music.wav", music); save("work/sfx.wav", sfx)
print("ok", len(music) / SR)
