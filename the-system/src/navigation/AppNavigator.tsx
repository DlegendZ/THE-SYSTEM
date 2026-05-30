import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSystemStore } from '../store/useSystemStore';
import type { RootStackParamList } from './types';

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

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  return (
    <Text style={{ color, fontSize: 10, fontWeight: focused ? 'bold' : 'normal' }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  const theme = useSystemStore((s) => s.currentTheme);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.primary,
          borderTopColor: theme.accent,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen
        name="CommandHall"
        component={CommandHall}
        options={{
          tabBarLabel: 'COMMAND',
          tabBarIcon: ({ focused, color }) => <TabIcon label="⚔" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="AscensionPath"
        component={AscensionPath}
        options={{
          tabBarLabel: 'ASCEND',
          tabBarIcon: ({ focused, color }) => <TabIcon label="▲" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mirror"
        component={Mirror}
        options={{
          tabBarLabel: 'MIRROR',
          tabBarIcon: ({ focused, color }) => <TabIcon label="◆" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Codex"
        component={Codex}
        options={{
          tabBarLabel: 'CODEX',
          tabBarIcon: ({ focused, color }) => <TabIcon label="≡" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Archive"
        component={Archive}
        options={{
          tabBarLabel: 'ARCHIVE',
          tabBarIcon: ({ focused, color }) => <TabIcon label="◫" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { initialized, onboardingComplete } = useSystemStore();

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>THE SYSTEM</Text>
        <Text style={styles.loadingSub}>INITIALIZING...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingSub: {
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
});
