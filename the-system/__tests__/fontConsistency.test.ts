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

/** Named styles inside StyleSheet.create({...}) that set fontSize but not fontFamily. */
function offenders(src: string, rel: string): string[] {
  const out: string[] = [];
  const marker = 'StyleSheet.create(';
  let idx = 0;
  while ((idx = src.indexOf(marker, idx)) !== -1) {
    const open0 = src.indexOf('{', idx + marker.length);
    if (open0 === -1) break;
    let depth = 1; let end = open0 + 1;
    for (; end < src.length && depth > 0; end++) {
      if (src[end] === '{') depth++;
      else if (src[end] === '}') depth--;
    }
    const block = src.slice(open0 + 1, end - 1);
    const blockStart = open0 + 1;
    let i = 0;
    while (i < block.length) {
      const open = block.indexOf('{', i);
      if (open === -1) break;
      const before = block.slice(i, open);
      const nameMatch = before.match(/(\w+)\s*:\s*$/);
      let d = 1; let j = open + 1;
      for (; j < block.length && d > 0; j++) {
        if (block[j] === '{') d++;
        else if (block[j] === '}') d--;
      }
      const body = block.slice(open + 1, j - 1);
      if (nameMatch && /\bfontSize\s*:/.test(body) && !/\bfontFamily\s*:/.test(body)) {
        const line = src.slice(0, blockStart + open).split('\n').length;
        out.push(`${rel}:${line} (${nameMatch[1]})`);
      }
      i = j;
    }
    idx = end;
  }
  return out;
}

describe('font consistency', () => {
  const files = walk(SRC);

  it('every StyleSheet style with fontSize also sets fontFamily', () => {
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

  it('every <SvgText> sets a fontFamily prop', () => {
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /<SvgText\b([\s\S]*?)>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        if (!/fontFamily/.test(m[1])) {
          bad.push(`${path.relative(SRC, f)}:${src.slice(0, m.index).split('\n').length}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
