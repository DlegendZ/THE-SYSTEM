// Pre-renders each class × rank Claude-spark avatar to a notification large-icon.
// Output: android/app/src/main/res/drawable/notif_<class>_<rank>.png
// Run: NODE_PATH=node_modules node scripts/genAvatarBanners.js
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// Spark intensity per rank — mirrors src/components/avatar/ClaudeSpark.tsx.
const RANK_SPEC = {
  E: { rays: 6,  len: 0.62, tip: '#B98E78', core: '#C9A893' },
  D: { rays: 8,  len: 0.68, tip: '#C68F70', core: '#D6A98C' },
  C: { rays: 10, len: 0.74, tip: '#D97757', core: '#E89B7E' },
  B: { rays: 12, len: 0.80, tip: '#E07F54', core: '#F0A782' },
  A: { rays: 14, len: 0.86, tip: '#E88A5A', core: '#F3B98C' },
  S: { rays: 16, len: 0.94, tip: '#F0A368', core: '#FBD9A6' },
};
// HeroClass tweaks ray silhouette: Warrior broad, Mage slender, Rogue sharp.
const CLASS_WIDTH = { Warrior: 0.16, Mage: 0.09, Rogue: 0.06 };
const RANK_TIER = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 5 };

function hex(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

const SIDE = 360;
const CX = SIDE / 2, CY = SIDE / 2, R = SIDE * 0.40;

function setPx(png, x, y, r, g, b, a) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (png.width * y + x) << 2;
  // source-over composite
  const sa = a / 255, da = png.data[i + 3] / 255, oa = sa + da * (1 - sa);
  if (oa === 0) return;
  png.data[i]     = Math.round((r * sa + png.data[i]     * da * (1 - sa)) / oa);
  png.data[i + 1] = Math.round((g * sa + png.data[i + 1] * da * (1 - sa)) / oa);
  png.data[i + 2] = Math.round((b * sa + png.data[i + 2] * da * (1 - sa)) / oa);
  png.data[i + 3] = Math.round(oa * 255);
}

function fillTriangle(png, p, q, s, r, g, b) {
  const minY = Math.max(0, Math.floor(Math.min(p[1], q[1], s[1])));
  const maxY = Math.min(SIDE - 1, Math.ceil(Math.max(p[1], q[1], s[1])));
  const pts = [p, q, s];
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < 3; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % 3];
      if ((y0 <= y && y < y1) || (y1 <= y && y < y0)) {
        xs.push(x0 + (y - y0) * (x1 - x0) / (y1 - y0));
      }
    }
    xs.sort((a, c) => a - c);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.floor(xs[i]); x <= Math.ceil(xs[i + 1]); x++) setPx(png, x, y, r, g, b, 255);
    }
  }
}

function fillCircle(png, cx, cy, rad, r, g, b, a = 255) {
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++)
    for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) setPx(png, x, y, r, g, b, a);
}

const OUT = path.resolve(__dirname, '..', 'android/app/src/main/res/drawable');
let count = 0;

for (const cls of ['Warrior', 'Mage', 'Rogue']) {
  for (const rank of ['E', 'D', 'C', 'B', 'A', 'S']) {
    const spec = RANK_SPEC[rank];
    const png = new PNG({ width: SIDE, height: SIDE });
    const [tr, tg, tb] = hex(spec.tip);

    // Transparent background + soft radial aura in the rank accent. Brighter
    // with rank (matches the in-app glow escalation).
    const peak = 50 + RANK_TIER[rank] * 18;
    const AR = SIDE * 0.48;
    for (let y = 0; y < SIDE; y++) for (let x = 0; x < SIDE; x++) {
      const t = Math.hypot(x - CX, y - CY) / AR;
      const a = t >= 1 ? 0 : Math.round(peak * Math.exp(-2.4 * t * t));
      if (a > 0) setPx(png, x, y, tr, tg, tb, a);
    }

    // Spark rays — long/short alternating tapered spikes.
    const wFrac = CLASS_WIDTH[cls] || 0.12;
    for (let i = 0; i < spec.rays; i++) {
      const ang = (i / spec.rays) * Math.PI * 2;
      const len = R * (i % 2 === 0 ? spec.len : spec.len * 0.62);
      const w = R * wFrac;
      const tip = [CX + len * Math.cos(ang), CY + len * Math.sin(ang)];
      const bl  = [CX + Math.cos(ang + Math.PI / 2) * w, CY + Math.sin(ang + Math.PI / 2) * w];
      const br  = [CX + Math.cos(ang - Math.PI / 2) * w, CY + Math.sin(ang - Math.PI / 2) * w];
      fillTriangle(png, bl, tip, br, tr, tg, tb);
    }
    const [cr, cg, cb] = hex(spec.core);
    fillCircle(png, CX, CY, R * 0.27, cr, cg, cb);
    fillCircle(png, CX, CY, R * 0.15, 251, 233, 210);

    const name = `notif_${cls.toLowerCase()}_${rank.toLowerCase()}.png`;
    fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
    count++;
  }
}
console.log(`generated ${count} spark banners in ${OUT}`);
