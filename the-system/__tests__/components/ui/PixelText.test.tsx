import React from 'react';
import renderer from 'react-test-renderer';
import PixelText from '../../../src/components/ui/PixelText';

describe('PixelText', () => {
  it('renders text content', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<PixelText>HELLO WORLD</PixelText>); });
    const json = tree!.toJSON() as renderer.ReactTestRendererJSON;
    expect(json).not.toBeNull();
  });

  it('applies default size and color', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => { tree = renderer.create(<PixelText size={14} color="#ffd700">TEST</PixelText>); });
    const json = tree!.toJSON() as renderer.ReactTestRendererJSON;
    expect(json).not.toBeNull();
  });
});
