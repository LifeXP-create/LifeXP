import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "../../src/theme";

function Row({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={s.row}>
      <View style={s.rowLeft}>
        <Ionicons name={icon} size={20} color={danger ? "#ef4444" : theme.text} />
        <Text style={[s.rowText, danger && { color: "#ef4444" }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.sub} />
    </TouchableOpacity>
  );
}

function Card({ children }) {
  return <View style={s.card}>{children}</View>;
}

export default function SettingsIndex() {
  const router = useRouter();

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ paddingBottom: 24 }}>
      

      <Card>
        <Row icon="person-outline" label="Account" onPress={() => router.push("/settings/account")} />
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push("/settings/notifications")} />
        <Row icon="options-outline" label="Preferences" onPress={() => router.push("/settings/preferences")} />
        <Row icon="shield-checkmark-outline" label="Permissions" onPress={() => router.push("/settings/permissions")} />
      </Card>

      <Card>
        <Row icon="flag-outline" label="Report a problem" onPress={() => router.push("/settings/report")} />
        <Row icon="document-text-outline" label="Terms of Service" onPress={() => router.push("/settings/terms")} />
        <Row icon="lock-closed-outline" label="Privacy Policy" onPress={() => router.push("/settings/privacy")} />
        <Row icon="information-circle-outline" label="About" onPress={() => router.push("/settings/about")} />
      </Card>

      <Card>
        <Row icon="log-out-outline" label="Log out" danger onPress={() => {/* später */}} />
      </Card>

      <Text style={s.footer}>LifeXP v0.1</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 16, paddingTop: 10 },
  title: { color: theme.text, fontSize: 22, fontWeight: "900", marginBottom: 12 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
    overflow: "hidden",
  },

  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },

  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: theme.text, fontSize: 15, fontWeight: "800" },

  footer: { textAlign: "center", color: theme.sub, marginTop: 6, opacity: 0.8, fontWeight: "800" },
});
