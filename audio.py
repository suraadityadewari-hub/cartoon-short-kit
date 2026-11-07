# Synthesized score + SFX stems for "Perang Babi". Writes work/music.wav and work/sfx.wav (stems only; mix.py sets levels).
import numpy as np, wave, os

SR = 44100
FPS = 30
TOTAL_F = 1202
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

# ---------------- score ----------------
BPM = 116; BEAT = 60 / BPM
music = np.zeros(N)
PROG = [("C", [nn("C2"), nn("G2")], [nn("E4"), nn("G4"), nn("C5")]), ("G", [nn("G1"), nn("D2")], [nn("D4"), nn("G4"), nn("B4")]),
        ("Am", [nn("A1"), nn("E2")], [nn("E4"), nn("A4"), nn("C5")]), ("G", [nn("G1"), nn("D2")], [nn("D4"), nn("G4"), nn("B4")])]
MEL = ["E5", "G5", "E5", "C5", "D5", "B4", "G4", "-", "C5", "E5", "A5", "G5", "F5", "D5", "B4", "-"]  # 2 notes per bar
def march(f0, f1, drums=1.0, mel=True, g=1.0):
    s0, s1 = F(f0), F(f1)
    b = 0
    while True:
        at = s0 + int(b * BEAT * SR)
        if at >= s1: break
        bar = (b // 4) % 4; beat = b % 4
        _, bass, chord = PROG[bar]
        if beat in (0, 2):
            put(music, tuba(bass[0 if beat == 0 else 1], BEAT * 0.9), at, 0.55 * g)
            put(music, kick(), at, 0.7 * drums * g)
        else:
            put(music, stab(chord, BEAT * 0.45), at, 0.32 * g)
            put(music, snare(), at, 0.32 * drums * g)
        if mel and beat in (0, 2):
            m = MEL[(b // 2) % len(MEL)]
            if m != "-": put(music, glock(nn(m), BEAT * 1.8), at, 0.22 * g)
        b += 1
    # fade the edges so cuts don't click
    n = int(0.03 * SR); music[s1 - n:s1] *= np.linspace(1, 0, n) if s1 - n > s0 else 1

march(0, 452)
# sad trombone on "Babinya mati"
at = F(476)
for i, (n_, d) in enumerate([("Bb3", 0.32), ("A3", 0.32), ("Ab3", 0.32), ("G3", 1.0)]):
    put(music, trombone(nn(n_), d, vib=1.0 if i == 3 else 0), at, 0.5); at += int(d * SR)
march(510, 800, drums=1.1)
# tension: low pulse + growing snare roll
for k in range(int((890 - 800) / FPS / (BEAT / 2))):
    at = F(800) + int(k * BEAT / 2 * SR); u = k / ((890 - 800) / FPS / (BEAT / 2))
    put(music, tuba(nn("C2"), BEAT * 0.4), at, 0.45)
    if k % 2 == 1: put(music, snare(0.4 + 0.8 * u), at, 0.25)
march(890, 1133, drums=1.0)
# drone after the twist line
d = (TOTAL_F - 1133) / FPS + 0.4; t = t_(d)
drone = (np.sin(2 * np.pi * note(nn("C2")) * t) + 0.6 * np.sin(2 * np.pi * note(nn("G2")) * t) + 0.25 * np.sin(2 * np.pi * note(nn("C3")) * t * 1.002))
drone *= np.minimum(1, t / 0.6) * np.minimum(1, (d - t) / 0.8)
put(music, drone, F(1133), 0.3)
# ghost pig: a soft glock lullaby on "Si babi"
for i, n_ in enumerate(["C6", "E6", "G6", "C7"]): put(music, glock(nn(n_), 0.9), F(1174) + int(i * 0.09 * SR), 0.14)

# ---------------- SFX ----------------
sfx = np.zeros(N)
def whoosh(d=0.45, lo=300, hi=2600):
    n = noise(d); x = bp(n, lo, hi); e = np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2; return x * e
def crunch():
    x = np.zeros(int(0.12 * SR))
    for k in range(3): g = hp(noise(0.02), 2500) * env(int(0.02 * SR), 0.001, 0.018); put(x, g, int(k * 0.035 * SR), 0.8)
    return x
def oink():
    out = np.zeros(int(0.5 * SR))
    for k, (f0, f1, d) in enumerate([(330, 250, 0.16), (300, 210, 0.2)]):
        t = t_(d); fr = np.linspace(f0, f1, len(t)); ph = np.cumsum(fr) / SR
        x = 2 * (ph % 1) - 1; x = bp(x, 500, 1600) + 0.2 * bp(noise(d), 600, 2000)
        put(out, x * env(len(x), 0.01, d - 0.03, 0, 0.02), int(k * 0.22 * SR))
    return out
def pop(): return sweep(500, 1300, 0.08, 1) * env(int(0.08 * SR), 0.001, 0.075)
def ting(f=2400, d=0.6): t = t_(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.4 * t)) * np.exp(-t * 7)
def sparkle(): x = np.zeros(int(0.8 * SR)); [put(x, ting(f, 0.5), int(i * 0.06 * SR), 0.6) for i, f in enumerate([2100, 2800, 3500])]; return x
def tap(): return lp(noise(0.03), 900) * env(int(0.03 * SR), 0.001, 0.028)
def click(): return hp(noise(0.012), 3000) * env(int(0.012 * SR), 0.0005, 0.011)
def bang():
    d = 0.9; n = noise(d) * np.exp(-t_(d) * 9); th = sweep(90, 35, d, 0.5) * np.exp(-t_(d) * 6)
    x = 0.9 * n + 1.2 * th
    for k, g in [(0.09, 0.35), (0.17, 0.2), (0.28, 0.1)]: put(x, x.copy(), int(k * SR), g)
    return np.tanh(1.5 * x)
def flutter(d=0.7): n = bp(noise(d), 400, 3000); am = 0.5 + 0.5 * np.sin(2 * np.pi * 18 * t_(d)); return n * am * env(len(n), 0.02, d - 0.1, 0, 0.08)
def rustle(d=0.35): return bp(noise(d), 1500, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 7 * t_(d)))) * env(int(d * SR), 0.01, d - 0.05, 0, 0.04)
def step(): return lp(noise(0.07), 500) * env(int(0.07 * SR), 0.002, 0.06) + 0.6 * sweep(110, 60, 0.07, 1) * env(int(0.07 * SR), 0.001, 0.06)
def boom(): d = 1.2; return np.tanh(2 * (sweep(70, 32, d, 0.6) * np.exp(-t_(d) * 3.5) + 0.3 * lp(noise(d), 300) * np.exp(-t_(d) * 5)))
def gavel(): d = 0.5; t = t_(d); return np.tanh(2 * (np.sin(2 * np.pi * 210 * t) * np.exp(-t * 18) + 0.6 * np.sin(2 * np.pi * 520 * t) * np.exp(-t * 30) + 0.8 * sweep(90, 40, d, 0.5) * np.exp(-t * 7)))
def tick(): return bp(noise(0.015), 2000, 5000) * env(int(0.015 * SR), 0.0005, 0.014)
def snore():
    d = 1.1; t = t_(d); x = bp(noise(d), 120, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 32 * t))
    e = np.where(t < 0.7, np.sin(np.pi * t / 0.7), 0.0)
    w = np.where(t > 0.75, np.sin(2 * np.pi * (900 - 300 * (t - 0.75)) * t) * np.sin(np.pi * np.clip((t - 0.75) / 0.35, 0, 1)), 0.0)
    return x * e + 0.15 * w
def ghost(): d = 1.2; t = t_(d); f = 520 + 300 * t / d; return np.sin(2 * np.pi * np.cumsum(f * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))) / SR) * np.sin(np.pi * t / d) ** 2
def sea(d): return lp(noise(d), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t_(d)))
def gulp(): return sweep(260, 120, 0.12, 1) * env(int(0.12 * SR), 0.003, 0.11)
def thudlow(): d = 1.4; return np.tanh(2.2 * sweep(60, 30, d, 0.5) * np.exp(-t_(d) * 2.5))

# hook: munching then the pig's oink on "babi"
for f in range(8, 112, 9): put(sfx, crunch(), F(f), 0.5)
put(sfx, whoosh(0.5, 200, 1500), F(96), 0.35)
put(sfx, oink(), F(124), 0.8); put(sfx, sparkle(), F(122), 0.35)
put(sfx, whoosh(0.7, 200, 2000), F(140), 0.6)                       # to aerial
put(sfx, pop(), F(226), 0.7); put(sfx, pop(), F(232), 0.7); put(sfx, sparkle(), F(228), 0.4)
put(sfx, whoosh(0.4), F(262), 0.4)
for f in range(270, 374, 8): put(sfx, tap(), F(f), 0.45)                # trotting
put(sfx, rustle(0.4), F(318), 0.4)                                     # through the fence
for f in range(392, 425, 7): put(sfx, crunch(), F(f), 0.7)             # munching
put(sfx, click(), F(438), 0.7); put(sfx, click(), F(442), 0.6)        # rifle cocks
put(sfx, bang(), F(452), 1.0)
put(sfx, flutter(0.9), F(458), 0.5)
put(sfx, ghost(), F(476), 0.35); put(sfx, ting(1800, 0.8), F(482), 0.3)
put(sfx, whoosh(0.35), F(506), 0.35)
put(sfx, rustle(0.5), F(514), 0.55)                                    # scroll
put(sfx, whoosh(0.35), F(583), 0.35)
for f in range(586, 648, 9): put(sfx, step(), F(f), 0.55)              # marching
put(sfx, whoosh(0.5, 200, 1500), F(645), 0.4)
put(sfx, sea(82 / FPS), F(648), 0.25)
for f in (690, 701, 712): put(sfx, boom(), F(f), 0.8)                  # "tiga kapal perang"
put(sfx, whoosh(0.35), F(727), 0.35)
put(sfx, ting(2600, 0.5), F(780), 0.35)                                # "babi"
put(sfx, gulp(), F(852), 0.6); put(sfx, ting(3200, 0.3), F(832), 0.2) # sweat
put(sfx, whoosh(0.6, 300, 4000), F(886), 0.6)                          # time jump
for f in range(892, 958, 5): put(sfx, tick(), F(f), 0.5)
put(sfx, snore(), F(936), 0.5)
put(sfx, whoosh(0.6, 300, 4000), F(956), 0.6)
put(sfx, gavel(), F(1059), 1.0); put(sfx, sparkle(), F(1063), 0.45)
put(sfx, whoosh(0.6, 300, 4000), F(1086), 0.6)
put(sfx, thudlow(), F(1133), 0.9)                                      # the sting
put(sfx, sparkle(), F(1172), 0.45); put(sfx, oink(), F(1182), 0.45)

def save(path, x):
    x = x[:int(TOTAL_F / FPS * SR)]
    pk = np.max(np.abs(x)) or 1; x = x / pk * 0.9
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
os.makedirs("work", exist_ok=True)
save("work/music.wav", music); save("work/sfx.wav", sfx)
print("ok", len(music) / SR)
