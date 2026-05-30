"""
Generate icon.png, adaptive-icon.png, splash-icon.png for THE SYSTEM app.
Uses only Python stdlib — no Pillow required.
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

BLACK  = (0,0,0,255)
TRANS  = (0,0,0,0)
GOLD   = (255,215,0,255)
GOLD60 = (255,215,0,153)
GOLD20 = (255,215,0,51)
DARK   = (10,10,10,255)
WHITE  = (255,255,255,255)
RED    = (220,50,50,255)
AMBER  = (255,165,0,255)

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

def aa_circle_border(canvas, cx, cy, r, thick, color):
    for dy in range(-r-thick-2, r+thick+3):
        for dx in range(-r-thick-2, r+thick+3):
            dist = math.sqrt(dx*dx + dy*dy)
            inner = r - thick/2
            outer = r + thick/2
            if inner - 1 < dist < outer + 1:
                alpha = min(1, min(dist - (inner-1), (outer+1) - dist))
                c = list(color); c[3] = int(c[3] * alpha)
                put(canvas, cx+dx, cy+dy, c)

def aa_line(canvas, x0, y0, x1, y1, thick, color):
    dx = x1-x0; dy = y1-y0
    length = math.sqrt(dx*dx+dy*dy)
    if length == 0: return
    nx, ny = -dy/length, dx/length
    steps = int(max(abs(dx), abs(dy), 1))
    for i in range(steps+1):
        t = i/steps
        cx = x0 + t*dx; cy = y0 + t*dy
        for w in range(-int(thick*1.5)-1, int(thick*1.5)+2):
            px = cx + w*nx; py = cy + w*ny
            dist = abs(w)
            alpha = max(0, min(1, thick/2 - dist + 0.5))
            if alpha > 0:
                c = list(color); c[3] = int(c[3] * alpha)
                put(canvas, round(px), round(py), c)

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

def hexagon_pts(cx, cy, r, rot=0):
    return [(cx + r*math.cos(math.pi/3*i + rot),
             cy + r*math.sin(math.pi/3*i + rot)) for i in range(6)]

def stroke_polygon(canvas, pts, thick, color):
    n = len(pts)
    for i in range(n):
        x0,y0 = pts[i]; x1,y1 = pts[(i+1)%n]
        aa_line(canvas, x0, y0, x1, y1, thick, color)

def fill_rect(canvas, x0, y0, x1, y1, color):
    for y in range(max(0,y0), min(len(canvas),y1)):
        for x in range(max(0,x0), min(len(canvas[0]),x1)):
            put(canvas, x, y, color)

def rounded_rect(canvas, x0, y0, x1, y1, r, color):
    # Fill body
    fill_rect(canvas, x0+r, y0, x1-r, y1, color)
    fill_rect(canvas, x0, y0+r, x1, y1-r, color)
    # Corners
    for cx,cy in [(x0+r,y0+r),(x1-r,y0+r),(x0+r,y1-r),(x1-r,y1-r)]:
        fill_circle(canvas, cx, cy, r, color)

def aa_polygon_border(canvas, pts, thick, color):
    stroke_polygon(canvas, pts, thick, color)

# ─────────────────────────────────────────────────────────────────────────────
# Draw text via pixel font (supports A–Z, 0–9, space, limited punctuation)
# ─────────────────────────────────────────────────────────────────────────────

# 5×7 pixel font for uppercase latin + digits
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
# ICON — 1024×1024  "THE SYSTEM" emblem
# ─────────────────────────────────────────────────────────────────────────────

def draw_icon(size=1024):
    c = make_canvas(size, size, (0,0,0,255))
    cx = cy = size // 2

    # Background: deep radial gradient faked with concentric fills
    # Dark center expanding outward — use concentric circles of dark tones
    fill_circle(c, cx, cy, size//2, (0,0,0,255))

    # Subtle inner glow ring (dark amber)
    aa_circle_border(c, cx, cy, int(size*0.38), int(size*0.005), (255,180,0,40))

    # Outer hex frame — double ring
    r_outer = int(size * 0.44)
    r_inner = int(size * 0.40)
    outer_pts = hexagon_pts(cx, cy, r_outer, math.pi/6)
    inner_pts = hexagon_pts(cx, cy, r_inner, math.pi/6)

    # Fill between outer hexagon borders (thin border)
    stroke_polygon(c, outer_pts, size*0.012, list(GOLD)+[255])
    stroke_polygon(c, inner_pts, size*0.004, list(GOLD)+[120])

    # Corner dots at hex vertices
    for px,py in outer_pts:
        fill_circle(c, round(px), round(py), int(size*0.012), GOLD)

    # Inner decorative hex
    mid_pts = hexagon_pts(cx, cy, int(size*0.30), math.pi/6)
    stroke_polygon(c, mid_pts, size*0.003, (255,215,0,60))

    # Four corner bracket decorations (top, bottom, left, right)
    bracket_size = int(size * 0.08)
    bracket_thick = size * 0.007
    for bx, by, dirs in [
        (cx, cy - int(size*0.34), [(1,0),(-1,0),(0,1)]),   # top
        (cx, cy + int(size*0.34), [(1,0),(-1,0),(0,-1)]),  # bottom
        (cx - int(size*0.34), cy, [(0,1),(0,-1),(1,0)]),   # left
        (cx + int(size*0.34), cy, [(0,1),(0,-1),(-1,0)]),  # right
    ]:
        fill_circle(c, bx, by, int(bracket_thick*0.8), GOLD)

    # ── CENTER SYMBOL: Stylized "S" rune made of diamond + bars ──
    # Diamond shape (rotated square) — large center
    diamond_r = int(size * 0.20)
    d_pts = [(cx, cy-diamond_r), (cx+diamond_r, cy), (cx, cy+diamond_r), (cx-diamond_r, cy)]
    fill_polygon(c, d_pts, (255,215,0,30))
    stroke_polygon(c, d_pts, size*0.008, list(GOLD)+[255])

    # Inner diamond (slightly smaller, gives ring effect)
    d2_r = int(size * 0.14)
    d2_pts = [(cx, cy-d2_r), (cx+d2_r, cy), (cx, cy+d2_r), (cx-d2_r, cy)]
    stroke_polygon(c, d2_pts, size*0.004, (255,215,0,150))

    # Center: "S" drawn as three horizontal bars (pixel art)
    # Using 3 thick horizontal lines with half-turns = stylized S
    bar_w = int(size * 0.14)
    bar_h = int(size * 0.028)
    gap = int(size * 0.036)

    # Top bar
    fill_rect(c, cx - bar_w//2, cy - gap - bar_h - gap//2,
                 cx + bar_w//2, cy - gap + bar_h//2 - gap//2, GOLD)
    # Middle bar
    fill_rect(c, cx - bar_w//2, cy - bar_h//2,
                 cx + bar_w//2, cy + bar_h//2, GOLD)
    # Bottom bar
    fill_rect(c, cx - bar_w//2, cy + gap - bar_h//2 + gap//2,
                 cx + bar_w//2, cy + gap + bar_h + gap//2, GOLD)

    # Left connector: top-left to middle-left
    fill_rect(c, cx - bar_w//2, cy - gap - gap//2 + bar_h//2,
                 cx - bar_w//2 + bar_h, cy, GOLD)
    # Right connector: middle-right to bottom-right
    fill_rect(c, cx + bar_w//2 - bar_h, cy,
                 cx + bar_w//2, cy + gap + gap//2 - bar_h//2, GOLD)

    # Corner accent marks (4 small L-brackets in corners of diamond)
    accent_size = int(size * 0.05)
    accent_thick = max(3, int(size * 0.006))
    for ax, ay, sx, sy in [
        (cx, cy - diamond_r - int(size*0.04), 1, 1),
        (cx, cy + diamond_r + int(size*0.04), 1, -1),
        (cx - diamond_r - int(size*0.04), cy, 1, 1),
        (cx + diamond_r + int(size*0.04), cy, -1, 1),
    ]:
        fill_circle(c, ax, ay, accent_thick, GOLD)

    return [[tuple(px) for px in row] for row in c]

# ─────────────────────────────────────────────────────────────────────────────
# ADAPTIVE ICON FOREGROUND — 1024×1024 (transparent bg)
# ─────────────────────────────────────────────────────────────────────────────

def draw_adaptive_foreground(size=1024):
    """Same design on transparent background for adaptive icon foreground."""
    c = make_canvas(size, size, (0,0,0,0))
    cx = cy = size // 2

    # Only draw the emblem (no background fill)
    r_outer = int(size * 0.44)
    outer_pts = hexagon_pts(cx, cy, r_outer, math.pi/6)
    stroke_polygon(c, outer_pts, size*0.014, list(GOLD)+[255])
    for px,py in outer_pts:
        fill_circle(c, round(px), round(py), int(size*0.014), GOLD)

    inner_pts = hexagon_pts(cx, cy, int(size*0.40), math.pi/6)
    stroke_polygon(c, inner_pts, size*0.005, list(GOLD)+[100])

    diamond_r = int(size * 0.20)
    d_pts = [(cx, cy-diamond_r), (cx+diamond_r, cy), (cx, cy+diamond_r), (cx-diamond_r, cy)]
    fill_polygon(c, d_pts, (255,215,0,25))
    stroke_polygon(c, d_pts, size*0.009, list(GOLD)+[255])

    bar_w = int(size * 0.14)
    bar_h = int(size * 0.028)
    gap = int(size * 0.036)
    fill_rect(c, cx - bar_w//2, cy - gap - bar_h - gap//2,
                 cx + bar_w//2, cy - gap + bar_h//2 - gap//2, GOLD)
    fill_rect(c, cx - bar_w//2, cy - bar_h//2,
                 cx + bar_w//2, cy + bar_h//2, GOLD)
    fill_rect(c, cx - bar_w//2, cy + gap - bar_h//2 + gap//2,
                 cx + bar_w//2, cy + gap + bar_h + gap//2, GOLD)
    fill_rect(c, cx - bar_w//2, cy - gap - gap//2 + bar_h//2,
                 cx - bar_w//2 + bar_h, cy, GOLD)
    fill_rect(c, cx + bar_w//2 - bar_h, cy,
                 cx + bar_w//2, cy + gap + gap//2 - bar_h//2, GOLD)

    return [[tuple(px) for px in row] for row in c]

# ─────────────────────────────────────────────────────────────────────────────
# SPLASH SCREEN — 1284×2778 (iPhone 14 Pro Max, safe for all)
# ─────────────────────────────────────────────────────────────────────────────

def draw_splash(w=1284, h=2778):
    c = make_canvas(w, h, (0,0,0,255))
    cx = w // 2
    cy = h // 2

    # Subtle scan lines effect — very faint horizontal lines
    for y in range(0, h, 6):
        for x in range(w):
            put(c, x, y, (255,215,0,6))

    # Center emblem (same as icon but smaller)
    emblem_r = int(min(w,h) * 0.18)

    # Outer hex
    outer_pts = hexagon_pts(cx, cy - int(h*0.1), emblem_r, math.pi/6)
    stroke_polygon(c, outer_pts, min(w,h)*0.006, list(GOLD)+[255])
    for px,py in outer_pts:
        fill_circle(c, round(px), round(py), int(min(w,h)*0.007), GOLD)

    # Diamond
    d_r = int(emblem_r * 0.46)
    ey = cy - int(h*0.1)
    d_pts = [(cx, ey-d_r), (cx+d_r, ey), (cx, ey+d_r), (cx-d_r, ey)]
    fill_polygon(c, d_pts, (255,215,0,20))
    stroke_polygon(c, d_pts, min(w,h)*0.004, list(GOLD)+[255])

    # S symbol inside
    bw = int(d_r * 0.70)
    bh = int(d_r * 0.14)
    bg = int(d_r * 0.18)
    fill_rect(c, cx-bw//2, ey-bg-bh-bg//2, cx+bw//2, ey-bg+bh//2-bg//2, GOLD)
    fill_rect(c, cx-bw//2, ey-bh//2, cx+bw//2, ey+bh//2, GOLD)
    fill_rect(c, cx-bw//2, ey+bg-bh//2+bg//2, cx+bw//2, ey+bg+bh+bg//2, GOLD)
    fill_rect(c, cx-bw//2, ey-bg-bg//2+bh//2, cx-bw//2+bh, ey, GOLD)
    fill_rect(c, cx+bw//2-bh, ey, cx+bw//2, ey+bg+bg//2-bh//2, GOLD)

    # Horizontal rule above text
    rule_y = cy + int(h * 0.05)
    rule_w = int(w * 0.55)
    for x in range(cx - rule_w//2, cx + rule_w//2):
        put(c, x, rule_y, GOLD)
    # Diamond at center of rule
    dm_size = 8
    for dy in range(-dm_size, dm_size+1):
        for dx in range(-dm_size, dm_size+1):
            if abs(dx)+abs(dy) <= dm_size:
                put(c, cx+dx, rule_y+dy, GOLD)

    # "THE SYSTEM" text
    text_scale = max(3, w // 150)
    title = "THE SYSTEM"
    tw = text_width(title, text_scale)
    ty = rule_y + int(h * 0.03)
    draw_text(c, title, cx - tw//2, ty, text_scale, GOLD)

    # Subtitle
    sub_scale = max(2, text_scale - 1)
    subtitle = "ASCEND OR PERISH"
    sw = text_width(subtitle, sub_scale)
    sy = ty + text_height(text_scale) + int(h * 0.02)
    draw_text(c, subtitle, cx - sw//2, sy, sub_scale, (255,215,0,140))

    # Bottom rule
    br_y = sy + text_height(sub_scale) + int(h * 0.03)
    for x in range(cx - rule_w//2, cx + rule_w//2):
        put(c, x, br_y, GOLD)
    for dy in range(-dm_size, dm_size+1):
        for dx in range(-dm_size, dm_size+1):
            if abs(dx)+abs(dy) <= dm_size:
                put(c, cx+dx, br_y+dy, GOLD)

    # Corner accent brackets
    bracket = int(min(w,h) * 0.04)
    bthick = max(2, int(min(w,h) * 0.004))
    for bx, by, sx, sy2 in [
        (40, 40, 1, 1), (w-40, 40, -1, 1),
        (40, h-40, 1, -1), (w-40, h-40, -1, -1)
    ]:
        for i in range(bracket):
            put(c, bx+sx*i, by, GOLD if i < bthick else (0,0,0,0))
            put(c, bx, by+sy2*i, GOLD if i < bthick else (0,0,0,0))
        for i in range(bthick):
            for j in range(bracket):
                put(c, bx+sx*j, by+sy2*i, GOLD)
                put(c, bx+sx*i, by+sy2*j, GOLD)

    return [[tuple(px) for px in row] for row in c]

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

assets_dir = os.path.join(os.path.dirname(__file__), 'assets')

print("Generating icon.png (1024×1024)...")
icon = draw_icon(512)  # 512 for speed, still high-res
write_png(os.path.join(assets_dir, 'icon.png'), icon)
print("  OKicon.png")

print("Generating adaptive-icon.png (1024×1024)...")
adp = draw_adaptive_foreground(512)
write_png(os.path.join(assets_dir, 'adaptive-icon.png'), adp)
print("  OKadaptive-icon.png")

print("Generating splash-icon.png (1284×2778)...")
# Use smaller size for speed, expo will upscale
splash = draw_splash(642, 1389)
write_png(os.path.join(assets_dir, 'splash-icon.png'), splash)
print("  OKsplash-icon.png")

print("\nAll assets generated.")
