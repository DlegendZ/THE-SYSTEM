import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const W = 1080, H = 2280;
const cx = W / 2, cy = 900;

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

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#262624"/>
  <circle cx="${cx}" cy="${cy}" r="220" fill="#D97757" opacity="0.10"/>
  <circle cx="${cx}" cy="${cy}" r="150" fill="#D97757" opacity="0.14"/>
  <polygon points="${spark(cx, cy, 170, 60)}" fill="#D97757"/>
  <circle cx="${cx}" cy="${cy}" r="46" fill="#F5D9C6"/>
  <text x="${cx}" y="${cy + 340}" font-family="Lora" font-weight="600" font-size="108"
        fill="#EDEAE0" text-anchor="middle" letter-spacing="6">THE SYSTEM</text>
  <text x="${cx}" y="${cy + 430}" font-family="Lora" font-weight="400" font-size="46"
        fill="#D97757" text-anchor="middle" letter-spacing="8">Ascend or perish</text>
</svg>`;

const fonts = [
  join(root, 'node_modules/@expo-google-fonts/lora/600SemiBold/Lora_600SemiBold.ttf'),
  join(root, 'node_modules/@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
];

const resvg = new Resvg(svg, {
  background: '#262624',
  font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Lora' },
});
const png = resvg.render().asPng();
writeFileSync(join(root, 'assets/splash-native.png'), png);
console.log('wrote assets/splash-native.png', png.length, 'bytes');
