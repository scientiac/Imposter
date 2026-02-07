/**
 * Theme configuration for the app using React Native Paper MD3
 * Provides Material You theming with dynamic color support
 */

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';

const tintColorLight = '#BA1A1A'; // Material Red
const tintColorDark = '#FFB4AB';  // Material Light Red

// Basic colors used for simple components
export const Colors = {
  light: {
    text: '#1C1B1F',
    background: '#FFFBFE',
    tint: tintColorLight,
    icon: '#49454F',
    tabIconDefault: '#49454F',
    tabIconSelected: tintColorLight,
    card: '#FFFBFE',
    border: '#79747E',
    accent: '#7D5260',
  },
  dark: {
    text: '#E6E1E5',
    background: '#1C1B1F',
    tint: tintColorDark,
    icon: '#CAC4D0',
    tabIconDefault: '#CAC4D0',
    tabIconSelected: tintColorDark,
    card: '#1C1B1F',
    border: '#938F99',
    accent: '#EFB8C8',
  },
};

// Base Material 3 themes with our premium hardcoded values as fallbacks
export const BasePaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#BA1A1A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDAD6',
    onPrimaryContainer: '#410002',
    secondary: '#775652',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FFDAD5',
    onSecondaryContainer: '#2C1512',
    tertiary: '#715B29',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FDE2A1',
    onTertiaryContainer: '#261900',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    background: '#FFF8F6',
    onBackground: '#231918',
    surface: '#FFF8F6',
    onSurface: '#231918',
    surfaceVariant: '#F4DDDA',
    onSurfaceVariant: '#534341',
    outline: '#857371',
    elevation: {
      level0: 'transparent',
      level1: '#FCEAE8',
      level2: '#FAE3E0',
      level3: '#F8DBD8',
      level4: '#F6D3CF',
      level5: '#F4CCCA',
    },
  },
};

export const BasePaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFB4AB',
    onPrimary: '#690005',
    primaryContainer: '#93000A',
    onPrimaryContainer: '#FFDAD6',
    secondary: '#E7BDB7',
    onSecondary: '#442926',
    secondaryContainer: '#5D3F3B',
    onSecondaryContainer: '#FFDAD5',
    tertiary: '#DFC68B',
    onTertiary: '#3F2E00',
    tertiaryContainer: '#574414',
    onTertiaryContainer: '#FDE2A1',
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    background: '#1A1110',
    onBackground: '#F1DFDD',
    surface: '#1A1110',
    onSurface: '#F1DFDD',
    surfaceVariant: '#534341',
    onSurfaceVariant: '#D8C2BF',
    outline: '#A08C8A',
    elevation: {
      level0: 'transparent',
      level1: '#271C1B',
      level2: '#2C201F',
      level3: '#302423',
      level4: '#332726',
      level5: '#372A29',
    },
  },
};

/**
 * Creates an adapted navigation theme from a Paper theme
 */
export function getNavTheme(paperTheme: typeof MD3LightTheme) {
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

  const adapted = paperTheme.dark ? DarkTheme : LightTheme;

  return {
    ...adapted,
    colors: {
      ...adapted.colors,
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.tertiary,
    },
  };
}

/**
 * Shared layout constants for consistent UI elements
 */
export const Layout = {
  floatingBar: {
    bottom: 24,
    marginHorizontal: 20,
    height: 54,
    borderRadius: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
};

