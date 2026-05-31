import React from 'react';
import { Text } from 'react-native';

/**
 * Globally default every <Text> to the Cinzel fantasy font by patching the
 * Text host component's render. Cinzel is injected as the *base* style so any
 * explicit `style` a component passes still wins — in particular PixelText,
 * which sets `fontFamily: 'PressStart2P'`, keeps its pixel font.
 *
 * This runs as a side effect on import; keep the import at the top of App.tsx.
 */
const TextAny = Text as unknown as {
  render?: (...args: unknown[]) => React.ReactElement<{ style?: unknown }>;
  __cinzelPatched?: boolean;
};

if (TextAny.render && !TextAny.__cinzelPatched) {
  const baseRender = TextAny.render;
  TextAny.render = function patchedRender(...args: unknown[]) {
    const element = baseRender.apply(this, args);
    return React.cloneElement(element, {
      style: [{ fontFamily: 'Cinzel' }, element.props.style],
    } as Partial<{ style?: unknown }>);
  };
  TextAny.__cinzelPatched = true;
}
