from PIL import Image, ImageDraw, ImageFont
import sys
F = int(sys.argv[1]) if len(sys.argv) > 1 else 200
im = Image.open(f"/root/shorts/kinmen/frames/f{F:04d}.jpg").convert("RGB")
W, H = im.size
# soft top gradient for legibility
g = Image.new("L", (1, H))
for y in range(H):
    g.putpixel((0, y), int(150 * max(0, 1 - y / 760)))
dark = Image.new("RGB", (W, H), (20, 18, 30))
im = Image.composite(dark, im, g.resize((W, H)))
d = ImageDraw.Draw(im)
font = ImageFont.truetype("/root/shorts/kinmen/fonts/Baloo2-ExtraBold.ttf", 98)
lines = [[("PERANG 20 TAHUN", "w")], [("CUMA NEMBAK DI", "w")], [("TANGGAL ", "w"), ("GANJIL", "y")]]
col = {"w": (255, 255, 255), "y": (255, 214, 0)}
y = 250
for ln in lines:
    full = "".join(t for t, _ in ln)
    tw = d.textlength(full, font=font)
    x = (W - tw) / 2
    for t, c in ln:
        d.text((x, y), t, font=font, fill=col[c], stroke_width=12, stroke_fill=(26, 20, 36))
        x += d.textlength(t, font=font)
    y += 110
im.save("/root/shorts/kinmen/cover/perang_tanggal_ganjil_cover.jpg", quality=93)
