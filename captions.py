# python3 captions.py -> work/captions.ass + out/perang_babi.srt
# chunk timings: speech segments from silencedetect on voice.mp3, split inside a segment by character share
C = [
 (0.00, "Amerika dan Inggris pernah"), (1.66, "hampir perang"), (2.92, "gara-gara seekor babi."),
 (4.99, "Abad sembilan belas,"), (6.38, "Pulau San Juan diklaim"), (7.88, "dua negara."),
 (9.13, "Babi milik perusahaan Inggris"), (10.88, "masuk kebun petani Amerika,"), (12.93, "makan kentangnya."),
 (14.37, "Si petani menembak,"), (15.79, "babinya mati."), (17.25, "Inggris mengancam|menangkapnya."),
 (19.62, "Amerika mengirim tentara."), (21.65, "Inggris membalas dengan"), (23.00, "tiga kapal perang."),
 (24.46, "Semua demi satu babi."), (26.90, "Tapi gak ada yang berani"), (28.63, "menembak duluan."),
 (29.88, "Dua belas tahun saling jaga"), (32.03, "sampai Kaisar Jerman|jadi wasit."), (34.27, "Pulaunya jatuh ke Amerika."),
 (36.46, "Korban perangnya"), (37.78, "tetap satu,"), (39.13, "si babi."),
]
END = 40.05
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
    last = t == "si babi."
    col = r"{\c&H3AD2FF&\fs128}" if last else ""   # punchline in warm yellow
    ev.append(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b - 0.02)},Cap,,0,0,0,,{pop}{col}{t.replace('|', chr(92) + 'N')}")
    srt.append(f"{i + 1}\n{ts_srt(a)} --> {ts_srt(b - 0.02)}\n{t.replace('|', chr(10))}\n")
open("work/captions.ass", "w").write(head + "\n".join(ev) + "\n")
open("out/perang_babi.srt", "w").write("\n".join(srt))
print(len(C), "chunks; shortest", min(round((C[i+1][0] if i+1 < len(C) else END) - C[i][0], 2) for i in range(len(C))), "s")
