import * as fs from 'fs';
import * as path from 'path';

const SRC = path.join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(t|j)sx?$/.test(e.name) ? [p] : [];
  });
}

const FONT_INFRA = 'applyGlobalFont'; // builds {fontSize} objects by design

/** Every innermost object literal that sets fontSize but not fontFamily. */
function offenders(src: string, rel: string): string[] {
  if (rel.includes(FONT_INFRA)) return [];
  const out: string[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '{') continue;
    let depth = 1; let j = i + 1;
    for (; j < src.length && depth > 0; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}') depth--;
    }
    const body = src.slice(i + 1, j - 1);
    const innermost = !body.includes('{');
    if (innermost && /\bfontSize\s*:/.test(body) && !/\bfontFamily\s*:/.test(body)) {
      out.push(`${rel}:${src.slice(0, i).split('\n').length}`);
    }
    // Only skip past this region when it was innermost; otherwise keep
    // scanning so nested object literals (e.g. inline `style={{ ... }}`) are seen.
    if (innermost) i = j - 1;
  }
  return out;
}

describe('font consistency', () => {
  const files = walk(SRC);

  it('every object literal with fontSize also sets fontFamily (inline + StyleSheet)', () => {
    const bad: string[] = [];
    for (const f of files) {
      bad.push(...offenders(fs.readFileSync(f, 'utf8'), path.relative(SRC, f)));
    }
    expect(bad).toEqual([]);
  });

  it('every fontFamily value is a Lora family', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /fontFamily\s*:\s*(['"][^'"]+['"]|FONTS\.\w+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const v = m[1];
        if (v.startsWith('FONTS.')) continue;
        if (/Lora_/.test(v)) continue;
        bad.push(`${path.relative(SRC, f)}: ${v}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every SVG text element sets a fontFamily prop', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const names = new Set<string>(['SvgText']);
      const imp = src.match(/from\s+['"]react-native-svg['"]/);
      if (imp) {
        const aliasRe = /\bText\s+as\s+(\w+)/g;
        let a: RegExpExecArray | null;
        while ((a = aliasRe.exec(src))) names.add(a[1]);
      }
      for (const name of names) {
        const re = new RegExp(`<${name}\\b([\\s\\S]*?)>`, 'g');
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          if (!/fontFamily/.test(m[1])) {
            bad.push(`${path.relative(SRC, f)}:${src.slice(0, m.index).split('\n').length} (${name})`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('no style sets fontWeight (weight is encoded in the Lora family name)', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /\bfontWeight\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        bad.push(`${path.relative(SRC, f)}:${src.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every FONTS value is a Lora family', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FONTS } = require('../src/theme/typography');
    const bad = Object.entries(FONTS).filter(([, v]) => !/^Lora_/.test(String(v)));
    expect(bad).toEqual([]);
  });
});
