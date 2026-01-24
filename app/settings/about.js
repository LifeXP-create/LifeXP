// app/settings/about.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";

export default function AboutScreen() {
  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <View style={s.row}>
          <Ionicons name="sparkles-outline" size={18} color={theme.text} />
          <Text style={s.title}>LifeXP</Text>
        </View>
        <Text style={s.p}>Version v0.1</Text>
        <Text style={s.p}>Build: local</Text>

        <Text style={[s.p, { marginTop: 10 }]}>
          Fokus-App mit Quests, Routinen, Erinnerungen und Kalender.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  title: { color: theme.text, fontSize: 16, fontWeight: "900" },
  p: { color: theme.sub, fontSize: 13, fontWeight: "700", opacity: 0.9, lineHeight: 18 },
});
