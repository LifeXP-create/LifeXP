import { Stack } from "expo-router";
import { theme } from "../../src/theme";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="account" options={{ title: "Account" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="preferences" options={{ title: "Preferences" }} />
      <Stack.Screen name="permissions" options={{ title: "Permissions" }} />
      <Stack.Screen name="about" options={{ title: "About" }} />
    </Stack>
  );
}
