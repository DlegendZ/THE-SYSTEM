import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface PixelCanvasProps {
  /** Array of strings — each char = one pixel using palette keys, '.' = transparent */
  pixels: string[];
  /** Map from char to hex color string */
  palette: Record<string, string>;
  /** Display size of each pixel in pts. Default 4 (16×24 grid → 64×96 display) */
  pixelSize?: number;
}

export default function PixelCanvas({ pixels, palette, pixelSize = 4 }: PixelCanvasProps) {
  const cols = pixels[0]?.length ?? 0;
  const rows = pixels.length;

  return (
    <Svg width={cols * pixelSize} height={rows * pixelSize}>
      {pixels.flatMap((row, y) =>
        Array.from(row).map((char, x) => {
          if (char === '.' || !palette[char]) return null;
          return (
            <Rect
              key={`${y}-${x}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={palette[char]}
            />
          );
        })
      )}
    </Svg>
  );
}
