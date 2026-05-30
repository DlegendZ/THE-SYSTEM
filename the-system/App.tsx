import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

LogBox.ignoreLogs(['Text strings must be rendered within a <Text> component']);
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { useSystemStore } from './src/store/useSystemStore';
import { preloadSounds } from './src/audio/sounds';

export default function App() {
  const initialize = useSystemStore((s) => s.initialize);

  const [fontsLoaded, fontError] = useFonts({
    'PressStart2P': require('./src/assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    initialize();
    preloadSounds(); // fire and forget
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>LOADING...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ffd700', fontSize: 14 },
});
