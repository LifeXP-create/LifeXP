// app/settings/permissions.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/theme";

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("lifexp-default", {
    name: "LifeXP",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: theme.accent,
  });
}

function StatusPill({ status }) {
  const map = {
    granted: { label: "aktiv", color: "#22c55e" },
    denied: { label: "abgelehnt", color: "#ef4444" },
    undetermined: { label: "nicht gesetzt", color: "#f59e0b" },
  };
  const s = map[status] || map.undetermined;

  return (
    <View style={[styles.pill, { borderColor: s.color, backgroundColor: "rgba(255,255,255,0.04)" }]}>
      <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function PermissionsScreen() {
  const [notifStatus, setNotifStatus] = useState("undetermined");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const p = await Notifications.getPermissionsAsync();
    setNotifStatus(p.status || "undetermined");
  };

  useEffect(() => {
    ensureAndroidChannel();
    refresh();
  }, []);

  const requestNotifications = async () => {
    if (!Device.isDevice) {
      setNotifStatus("denied");
      return;
    }

    setBusy(true);
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status === "granted") {
        setNotifStatus("granted");
        return;
      }

      const req = await Notifications.requestPermissionsAsync();
      setNotifStatus(req.status || "undetermined");
    } finally {
      setBusy(false);
    }
  };

  const openSystemSettings = async () => {
    // iOS/Android: öffnet App-Settings wie bei „anderen Apps“
    await Linking.openSettings();
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>App-Berechtigungen</Text>
      <Text style={styles.sub}>
        Wenn du ablehnst, funktionieren einzelne Features nicht. Du kannst das später jederzeit in den Systemeinstellungen ändern.
      </Text>

      <View style={styles.card}>
        <View style={styles.rowTop}>
          <View style={styles.rowLeft}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
            <Text style={styles.rowTitle}>Benachrichtigungen</Text>
          </View>
          <StatusPill status={notifStatus} />
        </View>

        <Text style={styles.rowDesc}>
          Erinnerungen und geplante Hinweise. Bei Ablehnung gibt es keine Push-Reminder.
        </Text>

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.7 }]}
            onPress={requestNotifications}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Erlauben</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={openSystemSettings} activeOpacity={0.85}>
            <Text style={styles.btnGhostText}>In Einstellungen öffnen</Text>
          </TouchableOpacity>
        </View>

        {notifStatus === "denied" ? (
          <Text style={styles.deniedHint}>
            Abgelehnt. Das System zeigt das Popup meist nicht nochmals. Nutze „In Einstellungen öffnen“.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Hinweis</Text>
        <Text style={styles.small}>
          iOS “Screen Time / App Usage” und echtes TikTok-Erkennen kann man nicht einfach mit Standard-Expo-Rechten machen.
          Dafür braucht es separate Plattform-APIs und meist native Module.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  h1: { color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 6 },
  h2: { color: theme.text, fontSize: 14, fontWeight: "900", marginBottom: 6 },
  sub: { color: theme.sub, fontSize: 13, fontWeight: "700", marginBottom: 14, opacity: 0.9 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 14,
  },

  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowTitle: { color: theme.text, fontSize: 15, fontWeight: "900" },
  rowDesc: { marginTop: 10, color: theme.sub, fontSize: 13, fontWeight: "700", opacity: 0.9 },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillText: { fontWeight: "900", fontSize: 12 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  btnPrimary: { backgroundColor: theme.accent },
  btnPrimaryText: { color: "#001014", fontWeight: "900" },
  btnGhost: { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  btnGhostText: { color: theme.text, fontWeight: "900" },

  deniedHint: { marginTop: 10, color: "#ef4444", fontWeight: "800", fontSize: 12, opacity: 0.95 },
  small: { color: theme.sub, fontSize: 12, fontWeight: "700", opacity: 0.9, lineHeight: 16 },
});
