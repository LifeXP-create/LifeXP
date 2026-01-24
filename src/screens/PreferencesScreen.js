import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";

export default function PreferencesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, padding: 16 }}>
      <Text style={{ color: theme.text, fontWeight: "900", fontSize: 22 }}>Preferences</Text>
      <Text style={{ color: theme.sub, marginTop: 10, fontWeight: "700" }}>Coming soon.</Text>
    </View>
  );
}
