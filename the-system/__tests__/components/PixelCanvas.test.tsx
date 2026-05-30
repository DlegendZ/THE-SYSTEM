import React from 'react';
import renderer from 'react-test-renderer';
import PixelCanvas from '../../src/components/avatar/PixelCanvas';

const palette = { R: '#ff0000', G: '#00ff00' };

describe('PixelCanvas', () => {
  it('renders without crashing', () => {
    const pixels = ['RG', '.R'];
    renderer.create(<PixelCanvas pixels={pixels} palette={palette} pixelSize={2} />);
  });

  it('renders with default pixelSize', () => {
    const pixels = ['RR', 'GG'];
    renderer.create(<PixelCanvas pixels={pixels} palette={palette} />);
  });

  it('handles empty pixels array', () => {
    renderer.create(<PixelCanvas pixels={[]} palette={palette} />);
  });

  it('skips transparent dots', () => {
    const pixels = ['..', '..'];
    renderer.create(<PixelCanvas pixels={pixels} palette={palette} />);
  });
});
