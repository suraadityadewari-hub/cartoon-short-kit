# python3 captions.py -> work/captions.ass + out/nikahan_anjing.srt
# chunk timings: speech segments from silencedetect on voice.mp3, split inside a segment by character share
C = [
 (0.00, "Seorang raja di India"), (1.42, "pernah bikin pesta"), (2.64, "pernikahan tiga hari."),
 (4.59, "Pengantinnya:"), (5.64, "anjing."),
 (6.75, "Dia Nawab Junagadh,"), (8.51, "penguasa kerajaan kecil"), (9.85, "di India barat."),
 (11.66, "Anjingnya ratusan."), (13.55, "Tiap ekor punya kandang"), (14.92, "dan pengasuh sendiri."),
 (16.71, "Tahun 1920-an,"), (18.83, "anjing kesayangannya,"), (20.25, "Roshanara,"), (21.27, "dinikahkan dengan Bobby,"), (22.85, "anjing milik|raja tetangga."),
 (25.15, "Bobby disambut di stasiun"), (26.67, "pakai band militer,"), (28.18, "dan 250 anjing"), (30.01, "berbaju sutra."),
 (31.41, "Roshanara diarak"), (32.47, "naik tandu perak."), (34.13, "Satu hari pestanya"), (35.24, "dijadikan|hari libur kerajaan."),
 (37.65, "Gubernur Jenderal Inggris"), (39.02, "diundang,"), (39.78, "tapi menolak datang."),
 (41.51, "Biayanya?"), (43.53, "Setara miliaran rupiah"), (44.97, "zaman sekarang."),
 (46.51, "Tahun 1947,"), (48.70, "sang Nawab kabur"), (49.74, "ke Pakistan naik pesawat,"), (51.67, "bawa harta,"), (52.83, "istri,"), (53.49, "dan anjing-anjingnya."),
 (56.11, "Satu istrinya|turun sebentar"), (57.69, "menjemput anaknya"), (58.67, "yang ketinggalan."),
 (60.19, "Kursinya langsung diisi"), (61.51, "dua ekor anjing."), (63.24, "Pesawatnya berangkat."),
]
END = 65.8
# "Konon" cut from the VO: frames [1278,1304) and [1650,1678) removed (see cut.py); shift all times
CUTS = [(1278 / 30, 1304 / 30), (1650 / 30, 1678 / 30)]
def sh(t): return t - sum(b - a for a, b in CUTS if t >= b)
C = [(sh(a), t) for a, t in C]; END = sh(END)
assert all(len(t.replace("|", " ")) <= 32 for _, t in C), [t for _, t in C if len(t) > 32]
def ts_ass(s): h = int(s // 3600); m = int(s % 3600 // 60); return f"{h}:{m:02d}:{s % 60:05.2f}"
def ts_srt(s): ms = int(round(s * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Baloo 2 ExtraBold,100,&H00FFFFFF,&H00FFFFFF,&H00241A1A,&H64000000,0,0,0,0,100,100,1,0,1,12,5,2,90,90,400,1
Style: Tag,Baloo 2 ExtraBold,58,&H00FFFFFF,&H00FFFFFF,&H40241A1A,&H00000000,0,0,0,0,100,100,1,0,3,16,0,8,90,90,300,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev, srt = [], []
for i, (a, t) in enumerate(C):
    b = C[i + 1][0] if i + 1 < len(C) else END
    pop = r"{\fscx86\fscy86\t(0,90,\fscx104\fscy104)\t(90,160,\fscx100\fscy100)}"
    last = i == len(C) - 1 or t == "anjing."
    col = r"{\c&H3AD2FF&\fs128}" if last else ""   # punchline in warm yellow
    ev.append(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b - 0.02)},Cap,,0,0,0,,{pop}{col}{t.replace('|', chr(92) + 'N')}")
    srt.append(f"{i + 1}\n{ts_srt(a)} --> {ts_srt(b - 0.02)}\n{t.replace('|', chr(10))}\n")
# context labels (top of frame)
T_ = lambda a, b, txt: ev.append(f"Dialogue: 1,{ts_ass(sh(a))},{ts_ass(sh(b))},Tag,,0,0,0,,{{\\fad(250,250)}}{txt}")
T_(6.8, 11.4, "Mahabat Khan III\\N{\\fs46\\c&H0AD6FF&}Nawab Junagadh, India")
T_(37.7, 41.3, "Lord Irwin\\N{\\fs46\\c&H0AD6FF&}Gubernur Jenderal Inggris")
T_(46.55, 50.2, "Oktober {\\c&H0AD6FF&}1947")
open("work/captions.ass", "w").write(head + "\n".join(ev) + "\n")
open("out/nikahan_anjing.srt", "w").write("\n".join(srt))
print(len(C), "chunks; shortest", min(round((C[i+1][0] if i+1 < len(C) else END) - C[i][0], 2) for i in range(len(C))), "s")
