import React from 'react';
import renderer from 'react-test-renderer';
import PixelCanvas from '../../src/components/avatar/PixelCanvas';

const palette = { R: '#ff0000', G: '#00ff00' };

// The react-native-svg mock renders Svg as 'svg-mock' and Rect as 'rect-mock'
// host elements so react-test-renderer can serialise them via toJSON().
// renderer.act() is required in React 19 to flush the render synchronously.

describe('PixelCanvas', () => {
  it('renders without crashing', () => {
    const pixels = ['RG', '.R'];
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<PixelCanvas pixels={pixels} palette={palette} pixelSize={2} />);
    });
    expect(tree!.toJSON()).toBeTruthy();
  });

  it('renders with default pixelSize (4)', () => {
    const pixels = ['RR', 'GG'];
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<PixelCanvas pixels={pixels} palette={palette} />);
    });
    expect(tree!.toJSON()).toBeTruthy();
  });

  it('handles empty pixels array — renders SVG with zero dimensions', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<PixelCanvas pixels={[]} palette={palette} />);
    });
    const json = tree!.toJSON() as any;
    expect(json).toBeTruthy();
    // Empty grid → width and height are 0
    expect(json.props.width).toBe(0);
    expect(json.props.height).toBe(0);
    // No pixel children
    expect(json.children).toBeNull();
  });

  it('skips transparent dots — only opaque pixels produce children', () => {
    // All transparent — SVG with no children
    let allDots: renderer.ReactTestRenderer;
    renderer.act(() => {
      allDots = renderer.create(
        <PixelCanvas pixels={['..', '..']} palette={palette} />
      );
    });
    const allDotsJson = allDots!.toJSON() as any;
    expect(allDotsJson).toBeTruthy();
    expect(allDotsJson.children).toBeNull();

    // Mixed — one R pixel among dots → SVG has children
    let mixed: renderer.ReactTestRenderer;
    renderer.act(() => {
      mixed = renderer.create(
        <PixelCanvas pixels={['R.', '..']} palette={palette} pixelSize={2} />
      );
    });
    const mixedJson = mixed!.toJSON() as any;
    expect(mixedJson.children).not.toBeNull();
    expect(mixedJson.children).toHaveLength(1);
  });

  it('uses correct pixelSize for SVG dimensions', () => {
    // 3 cols × 2 rows × pixelSize 10
    const pixels = ['RGR', 'GRG'];
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<PixelCanvas pixels={pixels} palette={palette} pixelSize={10} />);
    });
    const json = tree!.toJSON() as any;
    expect(json.props.width).toBe(30);  // 3 cols × 10
    expect(json.props.height).toBe(20); // 2 rows × 10
    // All 6 pixels are opaque (R or G)
    expect(json.children).toHaveLength(6);
  });
});
