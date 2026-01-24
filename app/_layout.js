// app/_layout.js
import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../src/context/AppState";
import { theme } from "../src/theme";

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

function TabIcon({ name, color, focused }) {
  return <Ionicons name={name} size={22} color={focused ? theme.accent : color} />;
}

export default function Layout() {
  useEffect(() => {
    (async () => {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("lifexp-reminders", {
          name: "LifeXP Reminders",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Tabs
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTitleStyle: { color: theme.text, fontWeight: "700" },
            headerTintColor: theme.text,
            tabBarStyle: {
              backgroundColor: theme.card,
              borderTopColor: "transparent",
            },
            tabBarActiveTintColor: theme.accent,
            tabBarInactiveTintColor: theme.sub,
          }}
        >
          <Tabs.Screen
            name="quests"
            options={{
              title: "Quests",
              tabBarIcon: (p) => <TabIcon {...p} name="checkmark-done-outline" />,
            }}
          />

          <Tabs.Screen
            name="todos"
            options={{
              title: "To-Dos",
              tabBarIcon: (p) => <TabIcon {...p} name="list-outline" />,
            }}
          />

          <Tabs.Screen
            name="chat"
            options={{
              title: "Coach",
              tabBarIcon: (p) => <TabIcon {...p} name="chatbubble-ellipses-outline" />,
            }}
          />

          <Tabs.Screen
            name="calendar"
            options={{
              title: "Kalender",
              tabBarIcon: (p) => <TabIcon {...p} name="calendar-outline" />,
            }}
          />

          {/* Settings ist ein Ordner-Stack: header hier aus */}
          <Tabs.Screen
            name="settings"
            options={{
              title: "Settings",
              tabBarIcon: (p) => <TabIcon {...p} name="settings-outline" />,
              headerShown: false,
            }}
          />

          {/* Versteckte Routen */}
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="onboarding" options={{ href: null }} />
        </Tabs>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
