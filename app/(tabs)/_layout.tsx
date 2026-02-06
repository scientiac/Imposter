/**
 * Tab Layout - Bottom tab navigation
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Layout } from '@/constants/theme';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const theme = useTheme();

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarShowIcon: true,
        tabBarIndicatorStyle: {
          backgroundColor: 'transparent',
        },
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          position: 'absolute',
          bottom: Layout.floatingBar.bottom,
          marginHorizontal: Layout.floatingBar.marginHorizontal,
          left: 0,
          right: 0,
          height: 80,
          borderRadius: 32,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          borderTopWidth: 0,
          overflow: 'hidden',
        },
        tabBarContentContainerStyle: {
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          textTransform: 'none',
          marginBottom: 12,
        },
        tabBarItemStyle: {
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 14,
        },
      }}>
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.secondaryContainer : 'transparent',
              paddingHorizontal: 20,
              paddingVertical: 4,
              borderRadius: 16,
              marginBottom: 0,
              marginTop: 5,
            }}>
              <MaterialCommunityIcons name={focused ? "gamepad-variant" : "gamepad-variant-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <MaterialTopTabs.Screen
        name="explore"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => (
            <View style={{
              backgroundColor: focused ? theme.colors.secondaryContainer : 'transparent',
              paddingHorizontal: 20,
              paddingVertical: 4,
              borderRadius: 16,
              marginBottom: 0,
              marginTop: 5,
            }}>
              <MaterialCommunityIcons name={focused ? "view-grid-plus" : "view-grid-plus-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </MaterialTopTabs>
  );
}
