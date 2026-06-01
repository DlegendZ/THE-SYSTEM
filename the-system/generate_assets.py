"""
Generate Claude-spark brand assets for THE SYSTEM app.
Coral spark on warm charcoal — icon, adaptive foreground, notification glyph,
splash art, favicon. Uses only Python stdlib — no Pillow required.
"""
import struct, zlib, math, os

# ─────────────────────────────────────────────────────────────────────────────
# Minimal PNG writer
# ─────────────────────────────────────────────────────────────────────────────

def png_chunk(name: bytes, data: bytes) -> bytes:
    c = zlib.crc32(name + data) & 0xFFFFFFFF
    return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

def write_png(path: str, pixels: list[list[tuple[int,int,int,int]]]):
    h = len(pixels)
    w = len(pixels[0]) if h else 0
    raw = b''
    for row in pixels:
        raw += b'\x00'  # filter type None
        for r,g,b,a in row:
            raw += bytes([r,g,b,a])
    compressed = zlib.compress(raw, 9)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = png_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(sig + ihdr + idat + iend)

# ─────────────────────────────────────────────────────────────────────────────
# Drawing primitives  (RGBA tuples)
# ─────────────────────────────────────────────────────────────────────────────

BLACK    = (0,0,0,255)
TRANS    = (0,0,0,0)
WHITE    = (255,255,255,255)
# Claude palette
CHARCOAL = (38,38,36,255)     # #262624 warm charcoal
CORAL    = (217,119,87,255)   # #D97757 signature Claude coral
CORE     = (243,185,150,255)  # warm light core
CORE_HOT = (251,217,166,255)  # near-white center

def make_canvas(w: int, h: int, bg=(0,0,0,255)) -> list[list]:
    return [[list(bg) for _ in range(w)] for _ in range(h)]

def clamp(v, lo=0, hi=255): return max(lo, min(hi, int(v)))

def blend(dst, src):
    """Alpha-composite src over dst."""
    sa = src[3] / 255
    da = dst[3] / 255
    oa = sa + da * (1 - sa)
    if oa == 0: return [0,0,0,0]
    r = (src[0]*sa + dst[0]*da*(1-sa)) / oa
    g = (src[1]*sa + dst[1]*da*(1-sa)) / oa
    b = (src[2]*sa + dst[2]*da*(1-sa)) / oa
    return [clamp(r), clamp(g), clamp(b), clamp(oa*255)]

def put(canvas, x, y, color):
    h = len(canvas); w = len(canvas[0])
    if 0 <= x < w and 0 <= y < h:
        canvas[y][x] = blend(canvas[y][x], list(color))

def fill_circle(canvas, cx, cy, r, color):
    for dy in range(-r-1, r+2):
        for dx in range(-r-1, r+2):
            if dx*dx + dy*dy <= r*r:
                put(canvas, cx+dx, cy+dy, color)

def soft_glow(canvas, cx, cy, r, color, layers=10):
    """Radial falloff glow: stacked translucent rings, bright center → 0 edge."""
    base = list(color)
    for i in range(layers, 0, -1):
        rr = int(r * i / layers)
        a = int(base[3] * (1 - i / layers) ** 2 * 0.6) if len(base) > 3 else 40
        fill_circle(canvas, cx, cy, rr, (base[0], base[1], base[2], max(4, a)))

def fill_polygon(canvas, pts, color):
    """Fill a convex polygon using scanline."""
    if not pts: return
    min_y = max(0, int(min(p[1] for p in pts)))
    max_y = min(len(canvas)-1, int(max(p[1] for p in pts)))
    n = len(pts)
    for y in range(min_y, max_y+1):
        xs = []
        for i in range(n):
            x0,y0 = pts[i]; x1,y1 = pts[(i+1)%n]
            if (y0 <= y < y1) or (y1 <= y < y0):
                if y1 != y0:
                    x = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
                    xs.append(x)
        xs.sort()
        for i in range(0, len(xs)-1, 2):
            for x in range(int(xs[i]), int(xs[i+1])+1):
                put(canvas, x, y, color)

# ─────────────────────────────────────────────────────────────────────────────
# Claude spark  — radial burst of tapered petals, long/short alternating
# ─────────────────────────────────────────────────────────────────────────────

def draw_spark(c, cx, cy, R, color=CORAL, core=CORE, hot=CORE_HOT,
               n_rays=12, width=0.11, short=0.60, glow=None):
    """Draw a Claude-style spark centred at (cx,cy), tip radius R."""
    if glow is not None:
        soft_glow(c, cx, cy, int(R * 1.25), glow)
    for i in range(n_rays):
        a = 2 * math.pi * i / n_rays
        length = R if i % 2 == 0 else R * short
        w = R * width
        tip = (cx + length * math.cos(a), cy + length * math.sin(a))
        bl  = (cx + math.cos(a + math.pi/2) * w, cy + math.sin(a + math.pi/2) * w)
        br  = (cx + math.cos(a - math.pi/2) * w, cy + math.sin(a - math.pi/2) * w)
        fill_polygon(c, [bl, tip, br], color)
    fill_circle(c, cx, cy, int(R * 0.27), core)
    fill_circle(c, cx, cy, int(R * 0.15), hot)

# ─────────────────────────────────────────────────────────────────────────────
# Pixel font (uppercase latin + digits + a little punctuation) for the splash
# ─────────────────────────────────────────────────────────────────────────────

FONT = {
    'A':['01110','10001','10001','11111','10001','10001','10001'],
    'B':['11110','10001','10001','11110','10001','10001','11110'],
    'C':['01110','10001','10000','10000','10000','10001','01110'],
    'D':['11110','10001','10001','10001','10001','10001','11110'],
    'E':['11111','10000','10000','11110','10000','10000','11111'],
    'F':['11111','10000','10000','11110','10000','10000','10000'],
    'G':['01110','10001','10000','10111','10001','10001','01110'],
    'H':['10001','10001','10001','11111','10001','10001','10001'],
    'I':['11111','00100','00100','00100','00100','00100','11111'],
    'J':['11111','00100','00100','00100','00100','10100','01100'],
    'K':['10001','10010','10100','11000','10100','10010','10001'],
    'L':['10000','10000','10000','10000','10000','10000','11111'],
    'M':['10001','11011','10101','10001','10001','10001','10001'],
    'N':['10001','11001','10101','10011','10001','10001','10001'],
    'O':['01110','10001','10001','10001','10001','10001','01110'],
    'P':['11110','10001','10001','11110','10000','10000','10000'],
    'Q':['01110','10001','10001','10001','10101','10010','01101'],
    'R':['11110','10001','10001','11110','10100','10010','10001'],
    'S':['01111','10000','10000','01110','00001','00001','11110'],
    'T':['11111','00100','00100','00100','00100','00100','00100'],
    'U':['10001','10001','10001','10001','10001','10001','01110'],
    'V':['10001','10001','10001','10001','01010','01010','00100'],
    'W':['10001','10001','10001','10001','10101','11011','10001'],
    'X':['10001','10001','01010','00100','01010','10001','10001'],
    'Y':['10001','10001','01010','00100','00100','00100','00100'],
    'Z':['11111','00001','00010','00100','01000','10000','11111'],
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00110','01000','10000','11111'],
    '3':['11110','00001','00001','01110','00001','00001','11110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '5':['11111','10000','10000','11110','00001','00001','11110'],
    '6':['00111','01000','10000','11110','10001','10001','01110'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '9':['01110','10001','10001','01111','00001','00010','01100'],
    ' ':['00000','00000','00000','00000','00000','00000','00000'],
    '-':['00000','00000','00000','11111','00000','00000','00000'],
    '.':['00000','00000','00000','00000','00000','00110','00110'],
    '!':['00100','00100','00100','00100','00100','00000','00100'],
}

def draw_text(canvas, text, x, y, scale, color):
    cx = x
    for ch in text.upper():
        glyph = FONT.get(ch, FONT[' '])
        for row, line in enumerate(glyph):
            for col, px in enumerate(line):
                if px == '1':
                    for dy in range(scale):
                        for dx in range(scale):
                            put(canvas, cx + col*scale + dx, y + row*scale + dy, color)
        cx += (5 + 1) * scale  # 5px wide + 1px gap

def text_width(text, scale): return len(text) * (5+1) * scale - scale
def text_height(scale): return 7 * scale

# ─────────────────────────────────────────────────────────────────────────────
# Asset builders
# ─────────────────────────────────────────────────────────────────────────────

def draw_icon(size=512):
    """Full app icon: coral spark on warm charcoal, soft glow."""
    c = make_canvas(size, size, CHARCOAL)
    cx = cy = size // 2
    draw_spark(c, cx, cy, int(size * 0.34), glow=CORAL)
    return [[tuple(px) for px in row] for row in c]

def draw_adaptive_foreground(size=512):
    """Adaptive-icon foreground: spark on transparent, kept inside the safe
    zone (~60% of the canvas) so the launcher mask never clips the rays."""
    c = make_canvas(size, size, TRANS)
    cx = cy = size // 2
    draw_spark(c, cx, cy, int(size * 0.30), glow=CORAL)
    return [[tuple(px) for px in row] for row in c]

def draw_monochrome(size=512):
    """Themed/monochrome adaptive layer: white spark on transparent."""
    c = make_canvas(size, size, TRANS)
    cx = cy = size // 2
    draw_spark(c, cx, cy, int(size * 0.30), color=WHITE, core=WHITE, hot=WHITE)
    return [[tuple(px) for px in row] for row in c]

def draw_background(size=512):
    """Adaptive-icon background: solid warm charcoal."""
    c = make_canvas(size, size, CHARCOAL)
    return [[tuple(px) for px in row] for row in c]

def draw_notification(size=192):
    """Status-bar notification glyph: white spark on transparent (Android tints
    it). No glow — must be a clean alpha silhouette."""
    c = make_canvas(size, size, TRANS)
    cx = cy = size // 2
    draw_spark(c, cx, cy, int(size * 0.40), color=WHITE, core=WHITE, hot=WHITE,
               n_rays=12, width=0.13)
    return [[tuple(px) for px in row] for row in c]

def draw_splash(w=642, h=1389):
    """Full-screen splash art: charcoal field, centred spark, wordmark."""
    c = make_canvas(w, h, CHARCOAL)
    cx = w // 2
    ey = int(h * 0.40)
    draw_spark(c, cx, ey, int(min(w, h) * 0.16), glow=CORAL)

    # Wordmark
    title = "THE SYSTEM"
    scale = max(3, w // 150)
    tw = text_width(title, scale)
    ty = ey + int(min(w, h) * 0.22)
    draw_text(c, title, cx - tw//2, ty, scale, (237,234,224,255))  # warm off-white

    # Subtitle in coral
    sub = "ASCEND OR PERISH"
    ss = max(2, scale - 1)
    sw = text_width(sub, ss)
    sy = ty + text_height(scale) + int(h * 0.018)
    draw_text(c, sub, cx - sw//2, sy, ss, (217,119,87,200))
    return [[tuple(px) for px in row] for row in c]

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

assets_dir = os.path.join(os.path.dirname(__file__), 'assets')

jobs = [
    ('icon.png',                     lambda: draw_icon(512)),
    ('adaptive-icon.png',            lambda: draw_adaptive_foreground(512)),
    ('android-icon-foreground.png',  lambda: draw_adaptive_foreground(512)),
    ('android-icon-background.png',  lambda: draw_background(512)),
    ('android-icon-monochrome.png',  lambda: draw_monochrome(512)),
    ('notification-icon.png',        lambda: draw_notification(192)),
    ('splash-icon.png',              lambda: draw_splash(642, 1389)),
    ('favicon.png',                  lambda: draw_icon(64)),
]

for name, fn in jobs:
    print(f"Generating {name} ...")
    write_png(os.path.join(assets_dir, name), fn())
    print(f"  OK {name}")

print("\nAll Claude-spark assets generated.")
