// app/_layout.js
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "../src/context/AppState";
import { theme } from "../src/theme";

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Supabase Auth Provider
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "../src/lib/supabase";

function TabIcon({ name, color, focused }) {
  return (
    <Ionicons name={name} size={22} color={focused ? theme.accent : color} />
  );
}

export default function Layout() {
  const pathname = usePathname();
  const [booting, setBooting] = useState(true);
  const [hasSession, setHasSession] = useState(false);

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

  // Session check + live updates
  useEffect(() => {
    let sub;
    (async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data?.session);
      setBooting(false);

      sub = supabase.auth.onAuthStateChange((_event, session) => {
        setHasSession(!!session);
      });
    })();

    return () => {
      sub?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  // Allow auth routes without being logged in
  const isAuthRoute =
    pathname === "/auth" ||
    pathname === "/auth-callback" ||
    pathname === "/onboarding" ||
    pathname === "/index";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionContextProvider supabaseClient={supabase}>
        <AppProvider>
          {!booting && !hasSession && !isAuthRoute ? (
            <Redirect href="/auth" />
          ) : null}

          {!booting &&
          hasSession &&
          (pathname === "/auth" || pathname === "/index") ? (
            <Redirect href="/quests" />
          ) : null}

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
                tabBarIcon: (p) => (
                  <TabIcon {...p} name="checkmark-done-outline" />
                ),
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
                tabBarIcon: (p) => (
                  <TabIcon {...p} name="chatbubble-ellipses-outline" />
                ),
              }}
            />

            <Tabs.Screen
              name="calendar"
              options={{
                title: "Kalender",
                tabBarIcon: (p) => <TabIcon {...p} name="calendar-outline" />,
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: "Settings",
                tabBarIcon: (p) => <TabIcon {...p} name="settings-outline" />,
                headerShown: false,
              }}
            />

            {/* Hidden routes */}
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="onboarding" options={{ href: null }} />
            <Tabs.Screen name="auth" options={{ href: null }} />
            <Tabs.Screen name="auth-callback" options={{ href: null }} />
          </Tabs>
        </AppProvider>
      </SessionContextProvider>
    </GestureHandlerRootView>
  );
}
