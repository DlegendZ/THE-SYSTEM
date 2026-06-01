import { bumpFontSize } from '../src/theme/applyGlobalFont';

describe('bumpFontSize', () => {
  it('adds 2 to an explicit fontSize', () => {
    expect(bumpFontSize({ fontSize: 13 })).toEqual({ fontSize: 15 });
  });
  it('returns null when no own fontSize (so inheritance is untouched)', () => {
    expect(bumpFontSize({ color: 'red' })).toBeNull();
    expect(bumpFontSize(undefined)).toBeNull();
  });
  it('flattens arrays and bumps the resolved fontSize', () => {
    expect(bumpFontSize([{ fontSize: 20 }, { color: 'x' }])).toEqual({ fontSize: 22 });
  });
});
