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

const tintColorLight = '#6750A4'; // Material You Deep Purple
const tintColorDark = '#D0BCFF';  // Material You Light Purple

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
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    secondary: '#625B71',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#7D5260',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD8E4',
    onTertiaryContainer: '#31111D',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    background: '#FFFBFE',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    elevation: {
      level0: 'transparent',
      level1: '#F7F2FA',
      level2: '#F3EDF7',
      level3: '#F0EAF6',
      level4: '#ECDFE5',
      level5: '#E6DDE3',
    },
  },
};

export const BasePaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    background: '#1C1B1F',
    onBackground: '#E6E1E5',
    surface: '#1C1B1F',
    onSurface: '#E6E1E5',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',
    outline: '#938F99',
    elevation: {
      level0: 'transparent',
      level1: '#272329',
      level2: '#2B2930',
      level3: '#2F2E34',
      level4: '#323035',
      level5: '#363438',
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

