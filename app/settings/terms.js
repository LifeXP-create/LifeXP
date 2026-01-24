// app/settings/terms.js
import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { theme } from "../../src/theme";

export default function TermsScreen() {
  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ paddingBottom: 28 }}>
      <Text style={s.h1}>Terms of Service</Text>

      <Text style={s.p}>
        LifeXP ist eine Produktivitäts-App. Nutzung auf eigenes Risiko.
      </Text>

      <Text style={s.h2}>1. Keine Garantie</Text>
      <Text style={s.p}>
        Wir garantieren keine Ergebnisse. Inhalte dienen als Unterstützung, nicht als professionelle Beratung.
      </Text>

      <Text style={s.h2}>2. Verantwortung</Text>
      <Text style={s.p}>
        Du bist verantwortlich für deine Entscheidungen und Handlungen. LifeXP ersetzt keine medizinische oder psychologische Betreuung.
      </Text>

      <Text style={s.h2}>3. Änderungen</Text>
      <Text style={s.p}>
        Wir können Funktionen und Texte jederzeit ändern.
      </Text>

      <Text style={s.h2}>4. Kontakt</Text>
      <Text style={s.p}>
        Bei Problemen nutze „Report a problem“.
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
