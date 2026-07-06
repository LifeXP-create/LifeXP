// src/screens/AuthScreen.js
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import { theme } from "../theme";

const LIFE_GREEN = "#22c55e";

function translateAuthError(error) {
  const msg = String(error?.message || "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "E-Mail oder Passwort ist falsch.";
  }
  if (msg.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  }
  if (msg.includes("user already registered")) {
    return "Für diese E-Mail existiert bereits ein Konto.";
  }
  if (msg.includes("password should be at least")) {
    return "Das Passwort ist zu kurz.";
  }
  if (msg.includes("invalid email")) {
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  }
  if (msg.includes("network request failed")) {
    return "Netzwerkfehler. Bitte versuche es erneut.";
  }

  return "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
}

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const emailOk = email.trim().includes("@");
  const pwOk = pw.length >= 6;
  const canSubmit = emailOk && pwOk && !busy;

  const signUp = async () => {
    setMsg("");
    setBusy(true);

    try {
      const redirectTo = Linking.createURL("auth-callback");

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setMsg(translateAuthError(error));
      } else {
        setMsg("Account erstellt. Bitte bestätige zuerst deine E-Mail.");
      }
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

      if (error) {
        setMsg(translateAuthError(error));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMsg("Gib zuerst deine E-Mail-Adresse ein.");
      return;
    }

    setMsg("");
    setBusy(true);

    try {
      const redirectTo = Linking.createURL("reset-password");

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo,
      });

      if (error) {
        setMsg(translateAuthError(error));
      } else {
        setMsg(
          "Falls ein Konto existiert, wurde dir eine E-Mail zum Zurücksetzen geschickt.",
        );
      }
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
            <Text style={s.h1}>LifeXP</Text>
          </View>

          <Text style={s.sub}>Willkommen zurück oder neu hier?</Text>

          <View style={{ height: 14 }} />

          <Text style={s.label}>E-Mail</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="deine@email.com"
            placeholderTextColor={theme.sub}
            style={s.input}
            editable={!busy}
            returnKeyType="next"
          />

          <View style={{ height: 12 }} />

          <Text style={s.label}>Passwort</Text>
          <TextInput
            value={pw}
            onChangeText={setPw}
            secureTextEntry
            placeholder="mind. 6 Zeichen"
            placeholderTextColor={theme.sub}
            style={s.input}
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canSubmit) signIn();
            }}
          />

          {!!msg && <Text style={s.msg}>{msg}</Text>}

          <View style={{ height: 14 }} />

          <TouchableOpacity
            onPress={signIn}
            disabled={!canSubmit}
            style={[s.btn, !canSubmit && { opacity: 0.5 }]}
            activeOpacity={0.85}
          >
            <Text style={s.btnT}>{busy ? "..." : "Einloggen"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={signUp}
            disabled={!canSubmit}
            style={[s.btnGhost, !canSubmit && { opacity: 0.5 }]}
            activeOpacity={0.85}
          >
            <Text style={s.btnGhostT}>
              {busy ? "..." : "Account erstellen"}
            </Text>
          </TouchableOpacity>

          <Pressable onPress={handleForgotPassword} style={s.help}>
            <Text style={s.helpT}>Passwort vergessen?</Text>
          </Pressable>
        </View>

        <Text style={s.footer}>LifeXP • Auth</Text>
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
    shadowColor: LIFE_GREEN,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  h1: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.text,
    letterSpacing: 0.2,
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
  btnGhost: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.35)",
    alignItems: "center",
  },
  btnGhostT: {
    color: theme.text,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  help: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 6,
  },
  helpT: {
    color: "rgba(34,197,94,0.95)",
    fontWeight: "800",
  },
  footer: {
    marginTop: 14,
    textAlign: "center",
    color: "rgba(255,255,255,0.18)",
    fontWeight: "800",
  },
});
