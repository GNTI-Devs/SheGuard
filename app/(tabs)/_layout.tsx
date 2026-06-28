import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/hooks/useThemeContext';
import { AudioGuideIndicator } from '@/components/AudioGuideIndicator';

export default function TabLayout() {
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  // On Android with gesture navigation, insets.bottom gives us the system bar height.
  // We add 8px of extra breathing room above the nav labels.
  const tabBarBottomPadding =
    Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 8);
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 56 + tabBarBottomPadding;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: activeColors.primary,
          tabBarInactiveTintColor: activeColors.textMuted,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: activeColors.surface,
            borderTopColor: activeColors.border,
            height: tabBarHeight,
            paddingBottom: tabBarBottomPadding,
            paddingTop: 10,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="tips"
          options={{
            title: 'Tips',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="hospitals"
          options={{
            title: 'Hospitals',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'map' : 'map-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <AudioGuideIndicator tabBarHeight={tabBarHeight} />
    </View>
  );
}
