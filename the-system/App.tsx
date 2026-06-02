import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, LogBox, Animated, Image, Easing } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import './src/theme/applyGlobalFont';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  'InteractionManager has been deprecated',
]);
import { useFonts } from 'expo-font';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_400Regular_Italic,
  Lora_600SemiBold_Italic,
} from '@expo-google-fonts/lora';
import AppNavigator from './src/navigation/AppNavigator';
import { useSystemStore } from './src/store/useSystemStore';

// Keep the native splash up until our JS splash overlay is ready to draw,
// so there is no black flash between them.
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_DURATION = 2000;
const FADE_DURATION = 500;

export default function App() {
  const initialize = useSystemStore((s) => s.initialize);
  const initialized = useSystemStore((s) => s.initialized);

  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
    Lora_600SemiBold_Italic,
  });

  const [splashDone, setSplashDone] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  // Cross-dissolve: the centred logo (drawn identical to the native splash for a
  // seamless handoff) fades OUT as the tagline art ("Ascend or Perish") fades
  // IN. Only one image is ever visible, so there's no double-logo ghosting.
  const artFade = useRef(new Animated.Value(0)).current;
  const logoFade = artFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  useEffect(() => {
    initialize();
  }, []);

  const ready = fontsLoaded || !!fontError;

  // Hand off from native splash once fonts are up, fade the tagline art in,
  // and start the minimum on-screen timer for the JS splash.
  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync().catch(() => {});
    Animated.timing(artFade, {
      toValue: 1,
      duration: 900,
      delay: 120,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => setMinElapsed(true), SPLASH_DURATION);
    return () => clearTimeout(t);
  }, [ready, artFade]);

  // Only fade the splash out once the app is actually ready (fonts loaded,
  // store initialized) AND the minimum time has passed. Holding the overlay
  // until `initialized` hides the bare "Initializing…" loading screen, so the
  // splash fades straight into the real app instead of cutting to it.
  useEffect(() => {
    if (splashDone) return;
    if (!(ready && initialized && minElapsed)) return;
    Animated.timing(fade, {
      toValue: 0,
      duration: FADE_DURATION,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => setSplashDone(true));
  }, [ready, initialized, minElapsed, splashDone, fade]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" backgroundColor="#262624" />
        {ready && <AppNavigator />}
        {!splashDone && (
          <Animated.View
            style={[StyleSheet.absoluteFill, styles.splash, { opacity: fade }]}
            pointerEvents="none"
          >
            <Animated.Image
              source={require('./assets/splash-native.png')}
              style={[styles.splashImage, { opacity: logoFade }]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('./assets/splash-icon.png')}
              style={[StyleSheet.absoluteFill, styles.splashArt, { opacity: artFade }]}
              resizeMode="cover"
            />
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { backgroundColor: '#262624', justifyContent: 'center', alignItems: 'center' },
  // Match the native splash exactly (centred logo, imageWidth 200) so the
  // native→JS handoff is a seamless identical frame — only the fade animates.
  splashImage: { width: 200, height: 200 },
  splashArt: { width: '100%', height: '100%' },
});
