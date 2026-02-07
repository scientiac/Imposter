/**
 * Root Layout - App navigation and providers
 */

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';



import {
  BasePaperDarkTheme,
  BasePaperLightTheme,
  getNavTheme,
} from '@/constants/theme';
import { GameProvider } from '@/contexts/game-context';
import { ThemeProvider as AppThemeSettingsProvider, useThemeContext } from '@/contexts/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeSettingsProvider>
        <MainLayout />
      </AppThemeSettingsProvider>
    </GestureHandlerRootView>
  );
}

function MainLayout() {
  const colorScheme = useColorScheme();
  const { mode, isLoading } = useThemeContext();

  // Determine source color for Material 3 theme
  // Default mode uses specific color, Dynamic uses system colors (undefined source)
  const sourceColor = mode === 'default'
    ? BasePaperLightTheme.colors.primary
    : undefined;

  const { theme } = useMaterial3Theme({
    fallbackSourceColor: BasePaperLightTheme.colors.primary,
    sourceColor,
  });

  // Create dynamic paper theme by merging Material 3 generated colors with base theme structure
  const paperTheme = colorScheme === 'dark'
    ? { ...BasePaperDarkTheme, colors: theme.dark }
    : { ...BasePaperLightTheme, colors: theme.light };

  // Sync native background color with theme to prevent white flash
  useEffect(() => {
    if (!isLoading) {
      SystemUI.setBackgroundColorAsync(paperTheme.colors.background);
    }
  }, [paperTheme.colors.background, isLoading]);

  // Create dynamic navigation theme
  const navTheme = getNavTheme(paperTheme as any);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <GameProvider>
          <Stack screenOptions={{
            contentStyle: { backgroundColor: paperTheme.colors.background },
            animation: 'fade_from_bottom',
          }}>
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
                headerShown: false,
                presentation: 'modal',
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
          </Stack>
          <StatusBar style="auto" />

        </GameProvider>
      </ThemeProvider>
    </PaperProvider>
  );
}


