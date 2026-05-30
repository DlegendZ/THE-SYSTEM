import React from 'react';
import PixelCanvas from '../avatar/PixelCanvas';
import { ICON_DATA } from './iconData';

interface Props {
  code: string;
  size?: number; // pixelSize per pixel, default 2 → 32×32 display
}

export default function DisciplineIcon({ code, size = 2 }: Props) {
  const icon = ICON_DATA[code];
  if (!icon) return null;
  return <PixelCanvas pixels={icon.pixels} palette={icon.palette} pixelSize={size} />;
}
