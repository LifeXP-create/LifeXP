// app/_layout.js
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Redirect, Stack, Tabs, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppProvider } from "../src/context/AppState";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

function TabIcon({ name, color, focused }) {
  return (
    <Ionicons name={name} size={22} color={focused ? theme.accent : color} />
  );
}

export default function Layout() {
  const segments = useSegments();
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(error ? null : (data?.session ?? null));
      setBooting(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // auth, auth-callback und reset-password gehören nicht in die normale App-Navigation
  const seg0 = segments?.[0];
  const onAuthRoute =
    seg0 === "auth" || seg0 === "auth-callback" || seg0 === "reset-password";

  if (booting) return null;

  // ---- ROUTING GUARD ----
  if (!session && !onAuthRoute) return <Redirect href="/auth" />;
  if (session && seg0 === "auth") return <Redirect href="/quests" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        {!session ? (
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.bg },
              headerTitleStyle: { color: theme.text, fontWeight: "700" },
              headerTintColor: theme.text,
            }}
          >
            <Stack.Screen
              name="auth"
              options={{ title: "auth", headerShown: false }}
            />

            <Stack.Screen
              name="auth-callback"
              options={{ title: "auth-callback", headerShown: false }}
            />

            <Stack.Screen
              name="reset-password"
              options={{ title: "Neues Passwort", headerShown: false }}
            />

            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack>
        ) : (
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

            {/* versteckte Routen */}
            <Tabs.Screen name="auth" options={{ href: null }} />
            <Tabs.Screen name="auth-callback" options={{ href: null }} />
            <Tabs.Screen name="reset-password" options={{ href: null }} />
            <Tabs.Screen name="index" options={{ href: null }} />
            <Tabs.Screen name="onboarding" options={{ href: null }} />
          </Tabs>
        )}
      </AppProvider>
    </GestureHandlerRootView>
  );
}
