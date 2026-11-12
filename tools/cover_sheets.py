import json, urllib.request, urllib.parse, io, os
from PIL import Image, ImageDraw
def get(u, raw=False):
    req = urllib.request.Request(u, headers={"User-Agent": "marzooq.co.uk cover picker (me@marzooq.co.uk)"})
    with urllib.request.urlopen(req, timeout=20) as r: return r.read() if raw else json.load(r)
books = {
  "orientalism": {"title": "Orientalism", "author": "Edward Said"},
  "hard-to-be-a-god": {"title": "Hard to Be a God", "author": "Strugatsky"},
  "rise-and-kill-first": {"title": "Rise and Kill First", "author": "Bergman"},
  "sealed-nectar": {"title": "The Sealed Nectar"},
}
os.makedirs("out", exist_ok=True)
for name, q in books.items():
    s = get("https://openlibrary.org/search.json?" + urllib.parse.urlencode({**q, "limit": 4, "fields": "key"}))
    covers = []
    for d in s["docs"][:3]:
        e = get(f"https://openlibrary.org{d['key']}/editions.json?limit=200")
        for x in e.get("entries", []):
            for c in (x.get("covers") or [])[:1]:
                if c > 0 and c not in covers: covers.append(c)
    covers = covers[:48]
    tw, th, cols = 150, 225, 8
    rows = (len(covers) + cols - 1) // cols or 1
    sheet = Image.new("RGB", (cols * (tw + 10) + 10, rows * (th + 34) + 10), (22, 17, 14))
    dr = ImageDraw.Draw(sheet)
    for i, c in enumerate(covers):
        x, y = 10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 34)
        try:
            im = Image.open(io.BytesIO(get(f"https://covers.openlibrary.org/b/id/{c}-M.jpg", raw=True))).convert("RGB")
            im.thumbnail((tw, th)); sheet.paste(im, (x, y))
        except Exception as ex: dr.text((x, y), "error", fill=(200, 100, 100))
        dr.text((x, y + th + 6), str(c), fill=(239, 228, 214))
    sheet.save(f"out/{name}.jpg", quality=85)
    print(name, len(covers))
