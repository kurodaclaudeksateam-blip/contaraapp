# Genera el icono de la app (tres extremos de tubo) en todas las densidades de Android.
# Uso: python scripts/icons.py   (requiere Pillow)
from PIL import Image, ImageDraw
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android/app/src/main/res"
BG = (14, 20, 24, 255)          # #0E1418
ORANGE = (255, 122, 46, 255)    # #FF7A2E
RIM = (255, 176, 120, 255)
HOLE = (20, 14, 10, 255)
SS = 4                          # supermuestreo para bordes suaves

def tubes(draw, size, scale, cx, cy):
    """Tres tubos en triángulo, en una caja de 24 unidades centrada en (cx, cy)."""
    u = size * scale / 24
    for (x, y) in [(7, 8), (17, 8), (12, 16.6)]:
        px, py = cx + (x - 12) * u, cy + (y - 12.2) * u
        for r, col in [(4.1, RIM), (3.6, ORANGE), (2.2, HOLE)]:
            draw.ellipse([px - r*u, py - r*u, px + r*u, py + r*u], fill=col)

def render(px, kind):
    S = px * SS
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if kind == "square":
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=BG)
        tubes(d, S, 0.78, S / 2, S / 2)
    elif kind == "round":
        d.ellipse([0, 0, S - 1, S - 1], fill=BG)
        tubes(d, S, 0.70, S / 2, S / 2)
    else:  # foreground adaptativo: 108dp con zona segura de 66dp
        tubes(d, S, 0.56, S / 2, S / 2)
    return im.resize((px, px), Image.LANCZOS)

DENS = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
for name, f in DENS.items():
    out = RES / f"mipmap-{name}"
    out.mkdir(parents=True, exist_ok=True)
    render(round(48 * f), "square").save(out / "ic_launcher.png")
    render(round(48 * f), "round").save(out / "ic_launcher_round.png")
    render(round(108 * f), "fg").save(out / "ic_launcher_foreground.png")

# pantalla de arranque (Android < 12 usa la imagen; 12+ usa el tema)
for p in RES.glob("drawable*/splash.png"):
    w, h = Image.open(p).size
    im = Image.new("RGBA", (w, h), BG)
    icon = render(int(min(w, h) * 0.28), "fg")
    im.alpha_composite(icon, ((w - icon.width) // 2, (h - icon.height) // 2))
    im.convert("RGB").save(p)
print("iconos listos")
