import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, LogBox, Animated, Image } from 'react-native';
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

const SPLASH_DURATION = 1400;
const FADE_DURATION = 500;

export default function App() {
  const initialize = useSystemStore((s) => s.initialize);

  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
    Lora_600SemiBold_Italic,
  });

  const [splashDone, setSplashDone] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initialize();
  }, []);

  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (!ready) return;
    // JS splash overlay now renders; hand off from the native splash.
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => setSplashDone(true));
    }, SPLASH_DURATION);
    return () => clearTimeout(t);
  }, [ready]);

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
            <Image
              source={require('./assets/splash-icon.png')}
              style={styles.splashImage}
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
  splashImage: { width: '100%', height: '100%' },
});
