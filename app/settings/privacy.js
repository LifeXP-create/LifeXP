// app/settings/privacy.js
import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { theme } from "../../src/theme";

export default function PrivacyScreen() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={s.h1}>Privacy Policy</Text>

      <Text style={s.p}>
        LifeXP speichert Daten lokal auf deinem Gerät (AsyncStorage). Standardmässig werden keine Daten an Dritte gesendet.
      </Text>

      <Text style={s.h2}>Lokale Daten</Text>
      <Text style={s.p}>
        Quests, Routinen, Kalender-Events und Einstellungen werden lokal gespeichert.
      </Text>

      <Text style={s.h2}>Benachrichtigungen</Text>
      <Text style={s.p}>
        Wenn du Push erlaubst, nutzt die App das System-Notification-Framework. Inhalte sind kurze Erinnerungen.
      </Text>

      <Text style={s.h2}>Später: Cloud / AI</Text>
      <Text style={s.p}>
        Falls du später Cloud-Login oder AI-Features aktivierst, wird diese Policy erweitert. Dann bekommst du in der App einen Hinweis und musst zustimmen.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  h1: { color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 12 },
  h2: { color: theme.text, fontSize: 14, fontWeight: "900", marginTop: 14, marginBottom: 6 },
  p: { color: theme.sub, fontSize: 13, fontWeight: "700", lineHeight: 18, opacity: 0.92 },
});
