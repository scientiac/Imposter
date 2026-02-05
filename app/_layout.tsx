/**
 * Root Layout - App navigation and providers
 */

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import {
  BasePaperDarkTheme,
  BasePaperLightTheme,
  getNavTheme,
} from '@/constants/theme';
import { GameProvider } from '@/contexts/game-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useMaterial3Theme();

  // Create dynamic paper theme
  const paperTheme = colorScheme === 'dark'
    ? { ...BasePaperDarkTheme, colors: theme ? theme.dark : BasePaperDarkTheme.colors }
    : { ...BasePaperLightTheme, colors: theme ? theme.light : BasePaperLightTheme.colors };

  // Sync native background color with theme to prevent white flash
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(paperTheme.colors.background);
  }, [paperTheme.colors.background]);

  // Create dynamic navigation theme
  const navTheme = getNavTheme(paperTheme as any);

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <GameProvider>
          <Stack screenOptions={{ contentStyle: { backgroundColor: paperTheme.colors.background } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="player-setup"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                title: 'Game Settings',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="reveal"
              options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="game"
              options={{
                presentation: 'modal',
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </GameProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}
