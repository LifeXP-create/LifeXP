// src/screens/AuthScreen.js
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().includes("@") && pw.length >= 6 && !busy;

  const signUp = async () => {
    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
      });
      if (error) setMsg(error.message);
      else setMsg("Account erstellt. Bestätige die Mail, dann einloggen.");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    setMsg("");
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pw,
      });
      if (error) setMsg(error.message);
      // kein Redirect hier nötig – _layout.js schickt dich automatisch weiter
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setMsg("");
    await supabase.auth.signOut();
    setMsg("Ausgeloggt.");
  };

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>Login</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="email"
        placeholderTextColor={theme.sub}
        style={s.input}
      />
      <TextInput
        value={pw}
        onChangeText={setPw}
        secureTextEntry
        placeholder="passwort (min. 6)"
        placeholderTextColor={theme.sub}
        style={s.input}
      />

      {!!msg && <Text style={s.msg}>{msg}</Text>}

      <TouchableOpacity
        onPress={signIn}
        disabled={!canSubmit}
        style={[s.btn, !canSubmit && { opacity: 0.5 }]}
      >
        <Text style={s.btnT}>{busy ? "..." : "Sign In"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={signUp}
        disabled={!canSubmit}
        style={[s.btnGhost, !canSubmit && { opacity: 0.5 }]}
      >
        <Text style={s.btnGhostT}>{busy ? "..." : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signOut} style={s.link}>
        <Text style={s.linkT}>Logout (Test)</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 12,
    backgroundColor: theme.bg,
  },
  h1: { fontSize: 26, fontWeight: "900", color: theme.text },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 12,
    borderRadius: 12,
    color: theme.text,
    backgroundColor: theme.card,
    fontWeight: "800",
  },
  msg: { color: theme.sub, fontWeight: "700" },
  btn: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: "center",
  },
  btnT: { color: "#001014", fontWeight: "900" },
  btnGhost: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  btnGhostT: { color: theme.text, fontWeight: "900" },
  link: { marginTop: 8, alignItems: "center" },
  linkT: { color: theme.sub, fontWeight: "800" },
});
