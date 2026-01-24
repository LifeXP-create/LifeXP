// src/screens/SettingsReportScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../theme";

export default function SettingsReportScreen() {
  return (
    <View style={s.wrap}>
      <Text style={s.title}>Report a problem</Text>
      <Text style={s.text}>Kommt später. (Hier baust du z.B. Mailto / Formular ein.)</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  title: { color: theme.text, fontSize: 22, fontWeight: "900", marginBottom: 10 },
  text: { color: theme.sub, fontWeight: "700" },
});
