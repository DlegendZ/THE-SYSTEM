import React from 'react';
import renderer from 'react-test-renderer';
import DisciplineIcon from '../../../src/components/icons/DisciplineIcon';
import { ICON_DATA } from '../../../src/components/icons/iconData';

describe('ICON_DATA', () => {
  it('has all 8 discipline icons', () => {
    const expected = ['RISE', 'REST', 'NOURISH', 'SILENCE', 'FORGE', 'KNOWLEDGE', 'PRESENCE', 'RITUAL'];
    for (const code of expected) {
      expect(ICON_DATA[code]).toBeDefined();
    }
  });

  it('each icon has exactly 16 rows', () => {
    for (const [code, def] of Object.entries(ICON_DATA)) {
      expect(def.pixels.length).toBe(16);
    }
  });

  it('each icon row has exactly 16 chars', () => {
    for (const [code, def] of Object.entries(ICON_DATA)) {
      for (let i = 0; i < def.pixels.length; i++) {
        expect(def.pixels[i].length).toBe(16);
      }
    }
  });

  it('each icon has at least one palette entry', () => {
    for (const [code, def] of Object.entries(ICON_DATA)) {
      expect(Object.keys(def.palette).length).toBeGreaterThan(0);
    }
  });
});

describe('DisciplineIcon', () => {
  it('renders RISE icon', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DisciplineIcon code="RISE" />);
    });
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders all 8 icons without crashing', () => {
    const codes = ['RISE', 'REST', 'NOURISH', 'SILENCE', 'FORGE', 'KNOWLEDGE', 'PRESENCE', 'RITUAL'];
    for (const code of codes) {
      expect(() => {
        renderer.act(() => {
          renderer.create(<DisciplineIcon code={code} />);
        });
      }).not.toThrow();
    }
  });

  it('returns null for unknown discipline code', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DisciplineIcon code="UNKNOWN" />);
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('uses default size 2', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DisciplineIcon code="FORGE" />);
    });
    const json = tree.toJSON() as any;
    // 16 cols × 2 = 32 wide
    expect(json.props.width).toBe(32);
    expect(json.props.height).toBe(32);
  });

  it('accepts custom size', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<DisciplineIcon code="FORGE" size={4} />);
    });
    const json = tree.toJSON() as any;
    // 16 cols × 4 = 64 wide
    expect(json.props.width).toBe(64);
    expect(json.props.height).toBe(64);
  });
});
