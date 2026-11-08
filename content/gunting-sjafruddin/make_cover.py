from PIL import Image, ImageDraw, ImageFont
import sys
F = int(sys.argv[1]) if len(sys.argv) > 1 else 640
im = Image.open(f"/root/shorts/gunting/frames/f{F:04d}.jpg").convert("RGB")
W, H = im.size
# soft top gradient for legibility
g = Image.new("L", (1, H))
for y in range(H):
    g.putpixel((0, y), int(150 * max(0, 1 - y / 760)))
dark = Image.new("RGB", (W, H), (20, 18, 30))
im = Image.composite(dark, im, g.resize((W, H)))
d = ImageDraw.Draw(im)
font = ImageFont.truetype("/root/shorts/gunting/fonts/Baloo2-ExtraBold.ttf", 104)
lines = [[("UANG RAKYAT", "w")], [("DIGUNTING", "y"), (" JADI DUA", "w")]]
col = {"w": (255, 255, 255), "y": (255, 214, 0)}
y = 285
for ln in lines:
    full = "".join(t for t, _ in ln)
    tw = d.textlength(full, font=font)
    x = (W - tw) / 2
    for t, c in ln:
        d.text((x, y), t, font=font, fill=col[c], stroke_width=12, stroke_fill=(26, 20, 36))
        x += d.textlength(t, font=font)
    y += 118
im.save("/root/shorts/gunting/cover/gunting_syafruddin_cover.jpg", quality=93)
