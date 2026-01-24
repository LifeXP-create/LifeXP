// Minimal Platzhalter – nur falls eine Route später genutzt wird.
// Aktuell nicht von Tabs verlinkt, bleibt aber stabil vorhanden.
import React from "react";
import { View, Text } from "react-native";
import { theme } from "../theme";

export default function GalaxyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: theme.text }}>Galaxy</Text>
    </View>
  );
}
