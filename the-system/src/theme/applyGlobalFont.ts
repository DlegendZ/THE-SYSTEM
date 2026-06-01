import React from 'react';

/**
 * Default every <Text> / <TextInput> to the Inter sans-serif font.
 *
 * Under React 19 + RN 0.85 the `Text` export is a plain function component —
 * the old `Text.render` forwardRef field no longer exists, so the previous
 * render-monkeypatch silently did nothing and everything rendered in the
 * system sans-serif. Instead we override the lazy `Text`/`TextInput` getters on
 * the react-native module with thin wrappers that inject `{ fontFamily:
 * 'Inter_400Regular' }` as the *base* style. Any explicit `style` a caller passes still
 * wins (so PixelText's `fontFamily: 'Lora_600SemiBold'` keeps its display font).
 *
 * Imported for its side effect at the top of App.tsx, before AppNavigator, so
 * the override is in place before any screen renders. Consumers reference the
 * live `_reactNative.Text` binding, so redefining the property propagates.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native');

type AnyComponent = React.ComponentType<{ style?: unknown }> & {
  displayName?: string;
  name?: string;
  __interWrapped?: boolean;
};

function wrapWithFont(Original: AnyComponent, fontFamily: string): AnyComponent {
  // React 19 passes `ref` as a normal prop to function components, so spreading
  // `props` forwards it to the wrapped native component (e.g. TextInput.focus).
  const Wrapped = ((props: { style?: unknown }) =>
    React.createElement(Original, {
      ...props,
      style: [{ fontFamily }, props.style],
    })) as AnyComponent;
  Wrapped.displayName = `Inter(${Original.displayName || Original.name || 'Component'})`;
  Wrapped.__interWrapped = true;
  return Wrapped;
}

function overrideFont(name: 'Text' | 'TextInput'): void {
  const Original = RN[name] as AnyComponent | undefined;
  if (!Original || Original.__interWrapped) return;
  const Wrapped = wrapWithFont(Original, 'Inter_400Regular');
  try {
    Object.defineProperty(RN, name, {
      configurable: true,
      enumerable: true,
      get() {
        return Wrapped;
      },
    });
  } catch {
    // Property not configurable — leave the default font rather than crash.
  }
}

overrideFont('Text');
overrideFont('TextInput');
