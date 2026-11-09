# python3 captions.py -> work/captions.ass + out/perang_tanggal_ganjil.srt
# chunk timings: speech segments from silencedetect on voice.mp3, split inside a segment by character share
SEG = [  # (start, end, text) from silencedetect on voice.mp3; "/" splits a segment by character share
 (0.00, 3.29, "China pernah menembaki/sebuah pulau/selama dua puluh tahun."), (3.79, 4.81, "Tapi ada jadwalnya:"), (5.11, 6.30, "cuma di tanggal ganjil."),
 (6.80, 8.06, "Nama pulaunya Kinmen."), (8.37, 9.37, "Dikuasai Taiwan,"), (9.67, 12.48, "padahal cuma beberapa kilometer/dari daratan China."),
 (12.98, 14.88, "Agustus 1958,"), (15.18, 18.22, "China menghujani Kinmen/dengan ratusan ribu/peluru meriam"), (18.45, 19.85, "selama 44 hari."),
 (20.35, 23.42, "Lalu Menteri Pertahanan China/mengirim surat ke Taiwan."), (23.72, 25.33, "Kira-kira isinya begini:"),
 (25.83, 26.46, "\"Tanggal genap,"), (26.76, 27.74, "kami tidak menembak."), (28.24, 29.48, "Silakan kirim beras,"), (29.64, 31.43, "sayur, dan minyak goreng/ke Kinmen.\""),
 (31.93, 32.93, "Jadi tanggal genap,"), (33.23, 34.77, "kapal pembawa makanan datang."), (35.28, 36.08, "Tanggal ganjil,"), (36.37, 37.55, "semua masuk bunker."),
 (38.05, 38.39, "Imlek?"), (38.69, 39.48, "Libur menembak."), (39.98, 40.65, "Lama-lama,"), (40.96, 43.02, "banyak pelurunya/tidak berisi bahan peledak."),
 (43.60, 45.23, "Isinya selebaran propaganda."), (45.73, 48.90, "Jadwal ini jalan terus/sampai 1979."), (49.40, 50.00, "Totalnya,"),
 (50.30, 52.61, "hampir satu juta peluru/jatuh di Kinmen."), (53.11, 53.74, "Sekarang,"), (54.04, 56.41, "besi peluru itu/ditempa jadi pisau dapur."),
 (56.91, 59.02, "Satu peluru/bisa jadi puluhan pisau."), (59.53, 61.02, "Yang mampir ke pabrik pisaunya?"), (61.70, 63.19, "Rombongan turis|dari China."),
]
C = []
for a_, b_, txt in SEG:
    parts = txt.split("/"); tot = sum(len(p) for p in parts); t = a_
    for p in parts: C.append((round(t, 2), p)); t += (b_ - a_) * len(p) / tot
END = 64.6
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
    last = i == len(C) - 1 or t == "cuma di tanggal ganjil."
    col = r"{\c&H3AD2FF&\fs128}" if last else ""   # punchline in warm yellow
    ev.append(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b - 0.02)},Cap,,0,0,0,,{pop}{col}{t.replace('|', chr(92) + 'N')}")
    srt.append(f"{i + 1}\n{ts_srt(a)} --> {ts_srt(b - 0.02)}\n{t.replace('|', chr(10))}\n")
# context labels (top of frame)
T_ = lambda a, b, txt: ev.append(f"Dialogue: 1,{ts_ass(a)},{ts_ass(b)},Tag,,0,0,0,,{{\\fad(250,250)}}{txt}")
T_(20.4, 25.2, "Peng Dehuai\\N{\\fs46\\c&H0AD6FF&}Menteri Pertahanan China")
open("work/captions.ass", "w").write(head + "\n".join(ev) + "\n")
open("out/perang_tanggal_ganjil.srt", "w").write("\n".join(srt))
print(len(C), "chunks; shortest", min(round((C[i+1][0] if i+1 < len(C) else END) - C[i][0], 2) for i in range(len(C))), "s")
