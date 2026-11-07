import sys, glob, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(os.path.join(src, "*.jpg")))
cols = 6; w, h = 270, 480
rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 24)), "#111")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    im = Image.open(f).resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 24)
    sheet.paste(im, (x, y + 24)); d.text((x + 6, y + 5), os.path.basename(f), fill="#fff")
sheet.save(out, quality=88)
