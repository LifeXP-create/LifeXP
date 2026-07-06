// src/screens/ResetPasswordScreen.js
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

const LIFE_GREEN = "#22c55e";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const pwOk = pw1.length >= 6;
  const match = pw1 === pw2 && pw2.length > 0;
  const canSubmit = pwOk && match && !busy;

  const handleSave = async () => {
    if (!canSubmit) return;

    setMsg("");
    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: pw1,
      });

      if (error) {
        setMsg(error.message || "Passwort konnte nicht geändert werden.");
        return;
      }

      setMsg("Passwort wurde geändert.");
      setTimeout(() => {
        router.replace("/quests");
      }, 700);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.wrap}>
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.dot} />
            <Text style={s.h1}>Neues Passwort</Text>
          </View>

          <Text style={s.sub}>
            Setze jetzt ein neues Passwort für dein Konto.
          </Text>

          <View style={{ height: 16 }} />

          <Text style={s.label}>Neues Passwort</Text>
          <TextInput
            value={pw1}
            onChangeText={setPw1}
            secureTextEntry
            placeholder="mind. 6 Zeichen"
            placeholderTextColor={theme.sub}
            style={s.input}
            editable={!busy}
          />

          <View style={{ height: 12 }} />

          <Text style={s.label}>Passwort wiederholen</Text>
          <TextInput
            value={pw2}
            onChangeText={setPw2}
            secureTextEntry
            placeholder="nochmals eingeben"
            placeholderTextColor={theme.sub}
            style={s.input}
            editable={!busy}
          />

          {!!msg && <Text style={s.msg}>{msg}</Text>}

          <View style={{ height: 16 }} />

          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSubmit}
            style={[s.btn, !canSubmit && { opacity: 0.5 }]}
            activeOpacity={0.85}
          >
            <Text style={s.btnT}>{busy ? "..." : "Passwort speichern"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LIFE_GREEN,
  },
  h1: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.text,
  },
  sub: {
    marginTop: 6,
    color: theme.sub,
    fontWeight: "700",
  },
  label: {
    color: theme.sub,
    fontWeight: "800",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    color: theme.text,
    backgroundColor: "rgba(255,255,255,0.04)",
    fontWeight: "800",
  },
  msg: {
    marginTop: 12,
    color: theme.sub,
    fontWeight: "700",
    lineHeight: 20,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: LIFE_GREEN,
    alignItems: "center",
  },
  btnT: {
    color: "#07140B",
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
