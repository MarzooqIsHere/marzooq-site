import sys, pathlib
from playwright.sync_api import sync_playwright
SRC = pathlib.Path("/home/claude/marzooq-site/marzooq-site/src")
F = "/tmp/fonts/node_modules/@fontsource"
CSS = f"""
@font-face {{ font-family: CG; src: url(file://{F}/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2); font-weight: 500; }}
@font-face {{ font-family: CG; src: url(file://{F}/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2); font-weight: 500; font-style: italic; }}
@font-face {{ font-family: In; src: url(file://{F}/inter/files/inter-latin-400-normal.woff2); }}
@font-face {{ font-family: In; src: url(file://{F}/inter/files/inter-latin-500-normal.woff2); font-weight: 500; }}
* {{ margin:0; box-sizing:border-box; }}
body {{ width:1200px; height:630px; background:#16110E; color:#EFE4D6; font-family: In; overflow:hidden; position:relative; }}
.h {{ font-family: CG; font-weight:500; line-height:1; }}
.amber {{ color:#D49568; }} .muted {{ color:#BCAE9E; }}
.lab {{ font-size:15px; letter-spacing:.22em; text-transform:uppercase; color:#D49568; }}
.url {{ position:absolute; left:72px; bottom:56px; font-size:20px; color:#D9C4A0; }}
.grain {{ position:absolute; inset:0; background: radial-gradient(ellipse at 30% 40%, rgba(212,149,104,.08), transparent 60%); pointer-events:none; }}
"""
img = lambda p: f"file://{SRC}{p}"
pages = {
"home": f"""
<div class=grain></div>
<img src="{img('/images/portrait-brandon-hill.jpg')}" style="position:absolute;right:0;top:0;width:440px;height:630px;object-fit:cover;object-position:50% 30%">
<div style="position:absolute;right:440px;top:0;width:160px;height:630px;background:linear-gradient(90deg,#16110E,rgba(22,17,14,0))"></div>
<div style="position:absolute;left:72px;top:84px;width:640px">
  <div class=lab>marzooq.co.uk</div>
  <div class=h style="font-size:96px;margin-top:28px">Marzooq<br>Subhani</div>
  <div class="h" style="font-size:38px;font-style:italic;margin-top:30px;color:#D9C4A0">Philosophy, writing and photographs.</div>
  <div class=muted style="font-size:19px;line-height:1.7;margin-top:30px">Maths and Philosophy at Bristol · writer of <i>Grounded</i><br>President of ResSoc · photographer · from Cardiff</div>
</div>""",
"photography": f"""
<img src="{img('/images/personal/personal-03.jpg')}" style="position:absolute;inset:0;width:1200px;height:630px;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(22,17,14,.92) 0%,rgba(22,17,14,.35) 45%,rgba(22,17,14,0) 70%)"></div>
<div style="position:absolute;left:72px;bottom:56px">
  <div class=lab>Marzooq Subhani</div>
  <div class=h style="font-size:92px;margin-top:16px">Photography</div>
  <div style="font-size:20px;margin-top:16px;color:#EFE4D6">Wales, travel and people · commissions in Bristol</div>
</div>""",
"shelf": "SHELF",
"cv": f"""
<div class=grain></div>
<div style="position:absolute;left:72px;top:84px">
  <div class=lab>Marzooq Subhani</div>
  <div class=h style="font-size:110px;margin-top:20px">CV</div>
</div>
<div style="position:absolute;left:470px;top:110px;width:660px;display:flex;flex-direction:column;gap:26px">
  <div class=lab style="letter-spacing:.2em">Right now</div>
  ROWS
</div>
<div class=url>marzooq.co.uk/cv</div>""",
}
rows = [("BSc Mathematics and Philosophy","University of Bristol"),("President","Academic Research Society"),("Freelance Photographer","Bristol and Cardiff"),("Writer","Grounded, on Substack")]
pages["cv"] = pages["cv"].replace("ROWS", "".join(f'<div><div class=h style="font-size:36px">{t}</div><div class=muted style="font-size:18px;margin-top:6px">{o}</div></div>' for t,o in rows))
import random; random.seed(7)
cols = ["#6E3B2A","#8C5A3C","#3E4A3A","#2F3B4A","#A3784E","#5A2E33","#C9B48E","#47362B","#7A6A4F","#2B4A44","#8C421E","#D9C4A0","#54463A","#3A2A2E"]
def spines(n, x0):
    out=[]; x=x0
    for i in range(n):
        w=random.randint(26,54); h=random.randint(190,262); c=random.choice(cols)
        out.append(f'<div style="position:absolute;left:{x}px;bottom:150px;width:{w}px;height:{h}px;background:{c};box-shadow:inset -4px 0 0 rgba(0,0,0,.18),inset 3px 0 0 rgba(255,255,255,.06)"></div>'); x+=w+3
    return "".join(out), x
s1,x = spines(13, 560)
pages["shelf"] = f"""<div class=grain></div>
{s1}<div style="position:absolute;left:540px;right:0;bottom:132px;height:18px;background:#2E2621"></div>
<div style="position:absolute;left:72px;top:84px;width:440px">
  <div class=lab>Marzooq Subhani</div>
  <div class=h style="font-size:104px;margin-top:20px">Shelf</div>
  <div class="h" style="font-size:34px;font-style:italic;margin-top:24px;color:#D9C4A0;line-height:1.2">The books that shaped how I think, and what I'm reading now.</div>
</div>
<div class=url>marzooq.co.uk/shelf</div>"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width":1200,"height":630})
    for name, body in pages.items():
        open(f"/home/claude/og/{name}.html","w").write(f"<meta charset=utf-8><style>{CSS}</style>{body}"); pg.goto(f"file:///home/claude/og/{name}.html"); pg.wait_for_timeout(600)
        pg.screenshot(path=f"/home/claude/og/{name}.png")
    b.close()
