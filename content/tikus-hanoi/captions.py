# python3 captions.py -> work/captions.ass + out/tikus_hanoi.srt
# chunk timings: speech segments from silencedetect on voice.mp3, split inside a segment by character share
C = [
 (0.00, "Pemerintah Hanoi pernah"), (1.53, "membayar warga"), (2.49, "untuk membasmi tikus."),
 (4.25, "Hasilnya,"), (5.27, "tikus malah makin banyak."),
 (7.62, "Tahun 1902,"), (9.56, "Prancis membangun"), (10.70, "got modern di Hanoi."),
 (12.63, "Gotnya malah jadi"), (13.76, "jalan tol tikus,"), (15.09, "langsung ke rumah-rumah"), (16.35, "orang Prancis."),
 (17.65, "Pemerintah bikin|sayembara:"), (19.53, "1 ekor tikus,"), (20.97, "1 sen."), (22.17, "Buktinya cukup ekornya."),
 (24.28, "Ekor menumpuk di kantor."), (26.35, "Tapi di jalan,"), (27.46, "tikus masih berkeliaran."),
 (29.44, "Hidup..."), (30.55, "tanpa ekor."),
 (32.26, "Ternyata ekornya dipotong,"), (34.23, "tikusnya dilepas lagi."), (35.83, "Biar beranak."),
 (37.03, "Makin banyak tikus,"), (38.37, "makin banyak ekor,"), (39.66, "makin banyak duit."),
 (41.19, "Di pinggir kota,"), (42.31, "petugas malah menemukan"), (43.74, "peternakan tikus."),
 (45.17, "Sayembaranya dihentikan."), (47.07, "Tikusnya tetap ada."), (48.76, "Yang hilang"), (49.61, "cuma ekornya."),
]
END = 50.68
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

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev, srt = [], []
for i, (a, t) in enumerate(C):
    b = C[i + 1][0] if i + 1 < len(C) else END
    pop = r"{\fscx86\fscy86\t(0,90,\fscx104\fscy104)\t(90,160,\fscx100\fscy100)}"
    last = i == len(C) - 1
    col = r"{\c&H3AD2FF&\fs128}" if last else ""   # punchline in warm yellow
    ev.append(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b - 0.02)},Cap,,0,0,0,,{pop}{col}{t.replace('|', chr(92) + 'N')}")
    srt.append(f"{i + 1}\n{ts_srt(a)} --> {ts_srt(b - 0.02)}\n{t.replace('|', chr(10))}\n")
open("work/captions.ass", "w").write(head + "\n".join(ev) + "\n")
open("out/tikus_hanoi.srt", "w").write("\n".join(srt))
print(len(C), "chunks; shortest", min(round((C[i+1][0] if i+1 < len(C) else END) - C[i][0], 2) for i in range(len(C))), "s")
