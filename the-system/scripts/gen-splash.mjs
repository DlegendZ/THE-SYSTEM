import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const fonts = [
  join(root, 'node_modules/@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf'),
  join(root, 'node_modules/@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
];

// Coral 12-point spark (matches the in-app ClaudeSpark look).
function spark(cx, cy, rOuter, rInner, points = 12) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function render(svg, outName) {
  const resvg = new Resvg(svg, {
    background: '#262624',
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Lora' },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(root, 'assets', outName), png);
  console.log('wrote assets/' + outName, png.length, 'bytes');
}

// ── splash-icon.png — full-screen JS overlay (App.tsx, resizeMode cover) ──
// Spark is centered vertically so it lines up with the native splash icon
// (which Android centers); the title fades in BELOW it. Same on-screen spark
// size as the native icon ⇒ no "small then big" jump, just text appearing.
{
  const W = 1080, H = 2400;
  const cx = W / 2, cy = H / 2; // dead-center spark, matches native
  const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#262624"/>
  <circle cx="${cx}" cy="${cy}" r="240" fill="#D97757" opacity="0.10"/>
  <circle cx="${cx}" cy="${cy}" r="165" fill="#D97757" opacity="0.14"/>
  <polygon points="${spark(cx, cy, 185, 66)}" fill="#D97757"/>
  <circle cx="${cx}" cy="${cy}" r="50" fill="#F5D9C6"/>
  <text x="${cx}" y="${cy + 360}" font-family="Lora" font-weight="600" font-size="112"
        fill="#EDEAE0" text-anchor="middle" letter-spacing="6">THE SYSTEM</text>
  <text x="${cx}" y="${cy + 452}" font-family="Lora" font-weight="400" font-size="46"
        fill="#D97757" text-anchor="middle" letter-spacing="8">Ascend or perish</text>
</svg>`;
  render(svg, 'splash-icon.png');
}

// ── splash-native.png — native Android-12 splash icon (centered, no text) ──
// Spark only (text would be shrunk to an unreadable blob by the system icon
// scaler). Square so the system mask/centering stays clean. Drawn large so it
// fills the icon at a size matching the JS overlay spark.
{
  const S = 1080;
  const c = S / 2;
  const svg = `
<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${S}" height="${S}" fill="#262624"/>
  <circle cx="${c}" cy="${c}" r="500" fill="#D97757" opacity="0.10"/>
  <circle cx="${c}" cy="${c}" r="360" fill="#D97757" opacity="0.14"/>
  <polygon points="${spark(c, c, 470, 168)}" fill="#D97757"/>
  <circle cx="${c}" cy="${c}" r="128" fill="#F5D9C6"/>
</svg>`;
  render(svg, 'splash-native.png');
}
