import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Rect, Circle, Path } from 'react-native-svg';
import { useSystemStore } from '../store/useSystemStore';
import type { RootStackParamList } from './types';
import { FONTS } from '../theme/typography';

import CommandHall from '../screens/CommandHall';
import AscensionPath from '../screens/AscensionPath';
import Mirror from '../screens/Mirror';
import Codex from '../screens/Codex';
import Archive from '../screens/Archive';
import Awakening from '../screens/Awakening';
import MandateReveal from '../screens/MandateReveal';
import LevelUpSplash from '../screens/LevelUpSplash';
import Settings from '../screens/Settings';
import ShieldOverlay from '../screens/ShieldOverlay';
import SRankCutscene from '../screens/SRankCutscene';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// SVG Tab Icons
function IconCommand({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Crossed swords */}
      <Line x1="4" y1="4" x2="18" y2="18" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Line x1="18" y1="4" x2="4" y2="18" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Rect x="9" y="2" width="4" height="3" fill={color} />
      <Rect x="9" y="17" width="4" height="3" fill={color} />
    </Svg>
  );
}

function IconAscend({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Mountain + arrow */}
      <Polygon points="11,2 20,20 2,20" fill="none" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Line x1="11" y1="6" x2="11" y2="17" stroke={color} strokeWidth="1.5" />
      <Polygon points="11,2 8,8 14,8" fill={color} />
    </Svg>
  );
}

function IconMirror({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Diamond */}
      <Polygon
        points="11,2 20,11 11,20 2,11"
        fill={focused ? color + '30' : 'none'}
        stroke={color}
        strokeWidth={focused ? 2 : 1.5}
      />
      <Polygon points="11,7 15,11 11,15 7,11" fill={color} />
    </Svg>
  );
}

function IconCodex({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Book/scroll */}
      <Rect x="4" y="3" width="14" height="16" rx="1" fill="none" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Line x1="7" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.5" />
      <Line x1="7" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.5" />
      <Line x1="7" y1="14" x2="12" y2="14" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function IconArchive({ color, focused }: { color: string; focused: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      {/* Grid chart */}
      <Rect x="3" y="3" width="6" height="6" fill={focused ? color + '50' : 'none'} stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Rect x="13" y="3" width="6" height="6" fill="none" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Rect x="3" y="13" width="6" height="6" fill="none" stroke={color} strokeWidth={focused ? 2 : 1.5} />
      <Rect x="13" y="13" width="6" height="6" fill={focused ? color + '50' : 'none'} stroke={color} strokeWidth={focused ? 2 : 1.5} />
    </Svg>
  );
}

function MainTabs() {
  const theme = useSystemStore((s) => s.currentTheme);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: { backgroundColor: theme.background },
        lazy: false,
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopColor: theme.accent + '40',
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 9,
          letterSpacing: 0.3,
          marginTop: 2,
          fontFamily: FONTS.display,
        },
      }}
    >
      <Tab.Screen
        name="CommandHall"
        component={CommandHall}
        options={{
          tabBarLabel: 'Command',
          tabBarIcon: ({ focused, color }) => <IconCommand color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AscensionPath"
        component={AscensionPath}
        options={{
          tabBarLabel: 'Ascend',
          tabBarIcon: ({ focused, color }) => <IconAscend color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Mirror"
        component={Mirror}
        options={{
          tabBarLabel: 'Mirror',
          tabBarIcon: ({ focused, color }) => <IconMirror color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Codex"
        component={Codex}
        options={{
          tabBarLabel: 'Codex',
          tabBarIcon: ({ focused, color }) => <IconCodex color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Archive"
        component={Archive}
        options={{
          tabBarLabel: 'Archive',
          tabBarIcon: ({ focused, color }) => <IconArchive color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { initialized, onboardingComplete } = useSystemStore();
  const theme = useSystemStore((s) => s.currentTheme);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingTitle}>THE SYSTEM</Text>
        <View style={styles.loadingBar}>
          <View style={styles.loadingFill} />
        </View>
        <Text style={styles.loadingSub}>Initializing…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.background },
          ...TransitionPresets.FadeFromBottomAndroid,
        }}
      >
        {!onboardingComplete ? (
          <Stack.Screen name="Awakening" component={Awakening} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="MandateReveal"
              component={MandateReveal}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="LevelUpSplash"
              component={LevelUpSplash}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="Settings"
              component={Settings}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ShieldOverlay"
              component={ShieldOverlay}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: 'transparent' } }}
            />
            <Stack.Screen
              name="SRankCutscene"
              component={SRankCutscene}
              options={{ presentation: 'transparentModal', cardStyle: { backgroundColor: '#000000' } }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#262624',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingTitle: {
    color: '#D97757',
    fontSize: 28,
    letterSpacing: 0.3,
    fontFamily: FONTS.display,
  },
  loadingBar: {
    width: 160,
    height: 2,
    backgroundColor: '#3A3733',
    overflow: 'hidden',
  },
  loadingFill: {
    width: '60%',
    height: 2,
    backgroundColor: '#D97757',
  },
  loadingSub: {
    color: '#9A968B',
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: FONTS.body,
  },
});
