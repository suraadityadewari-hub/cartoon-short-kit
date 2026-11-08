# python3 captions.py -> work/captions.ass + out/gunting_syafruddin.srt
# chunk timings: speech segments from silencedetect on voice.mp3, split inside a segment by character share
C = [
 (0.00, "Pemerintah Indonesia pernah"), (1.69, "menyuruh rakyat"), (2.66, "menggunting uangnya|jadi dua."),
 (4.93, "Beneran,"), (5.79, "pakai gunting."),
 (7.38, "Tahun 1950,"), (9.42, "uang beredar|terlalu banyak."),
 (11.75, "Harga-harga naik terus,"), (13.86, "kas negara kosong."),
 (15.83, "Menteri Keuangan|Syafruddin"), (17.48, "punya ide:"),
 (18.68, "uang kertas|lima rupiah ke atas,"), (21.02, "potong dua."),
 (22.13, "Namanya:"), (23.04, "Gunting Syafruddin."),
 (24.83, "Potongan kiri"), (25.61, "masih bisa|dipakai belanja,"), (27.47, "tapi nilainya|tinggal setengah."),
 (29.99, "Uang sepuluh rupiah,"), (31.38, "jadi lima."),
 (32.58, "Potongan kanan?"), (33.75, "Ditukar|surat utang negara."), (35.87, "Baru dilunasi|40 tahun kemudian."),
 (39.36, "Konon,"), (40.14, "yang ikut jadi korban"), (41.42, "adalah istri Bung Hatta,"), (43.14, "perdana menteri|waktu itu."),
 (44.90, "Tabungannya buat beli"), (46.15, "mesin jahit"), (46.84, "tinggal setengah."),
 (48.30, "Ibu Rahmi protes,"), (49.90, "kenapa nggak|dikasih tahu"), (51.20, "dari awal."),
 (52.12, "Jawaban Bung Hatta:"), (53.63, "\"Itu rahasia|negara.\""),
]
END = 56.4
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
    last = i == len(C) - 1
    col = r"{\c&H3AD2FF&\fs128}" if last else ""   # punchline in warm yellow
    ev.append(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b - 0.02)},Cap,,0,0,0,,{pop}{col}{t.replace('|', chr(92) + 'N')}")
    srt.append(f"{i + 1}\n{ts_srt(a)} --> {ts_srt(b - 0.02)}\n{t.replace('|', chr(10))}\n")
# context labels (top of frame)
T_ = lambda a, b, txt: ev.append(f"Dialogue: 1,{ts_ass(a)},{ts_ass(b)},Tag,,0,0,0,,{{\\fad(250,250)}}{txt}")
T_(7.45, 11.55, "Jakarta, {\\c&H0AD6FF&}1950")
T_(15.9, 20.9, "Syafruddin Prawiranegara\\N{\\fs46\\c&H0AD6FF&}Menteri Keuangan")
T_(43.2, 44.85, "Bung Hatta\\N{\\fs46\\c&H0AD6FF&}Perdana Menteri")
open("work/captions.ass", "w").write(head + "\n".join(ev) + "\n")
open("out/gunting_syafruddin.srt", "w").write("\n".join(srt))
print(len(C), "chunks; shortest", min(round((C[i+1][0] if i+1 < len(C) else END) - C[i][0], 2) for i in range(len(C))), "s")
