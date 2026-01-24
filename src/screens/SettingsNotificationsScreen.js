// src/screens/SettingsNotificationsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

const STORAGE_KEY = "lifexp_notifications_v1";
const ANDROID_CHANNEL_ID = "lifexp-reminders";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function timeKey(t) {
  return `${pad2(t.hour)}:${pad2(t.minute)}`;
}
function uniqTimes(list) {
  const m = new Map();
  for (const t of list) m.set(timeKey(t), t);
  return Array.from(m.values()).sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

async function ensurePermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status === "granted") return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "LifeXP Reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function rescheduleLocalReminders(enabled, times) {
  // Wichtig: erst alles löschen, sonst kommen Duplikate.
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;
  if (!Array.isArray(times) || times.length === 0) return;

  await ensureAndroidChannel();

  for (const t of times) {
    // Korrektes Trigger-Objekt: MUSS ein `type` haben. :contentReference[oaicite:1]{index=1}
    const trigger =
      Platform.OS === "android"
        ? {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
            channelId: ANDROID_CHANNEL_ID,
          }
        : {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
          };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "LifeXP",
        body: "Deine Quests warten.",
        sound: true,
      },
      trigger,
    });
  }
}

export default function SettingsNotificationsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [times, setTimes] = useState([{ hour: 19, minute: 0 }]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  });

  const [saving, setSaving] = useState(false);

  const sortedTimes = useMemo(() => uniqTimes(times), [times]);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw);

        if (typeof s.enabled === "boolean") setEnabled(s.enabled);
        if (Array.isArray(s.times) && s.times.length) setTimes(uniqTimes(s.times));
      } catch {}
    })();
  }, []);

  // Save helper
  async function persist(nextEnabled, nextTimes) {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: nextEnabled,
        times: uniqTimes(nextTimes),
        updatedAt: Date.now(),
      })
    );
  }

  async function applySchedule(nextEnabled, nextTimes) {
    // iOS Expo Go kann lokale Notifications meist, Android ist eingeschränkt. (Warnung ist normal.)
    const ok = await ensurePermission();
    if (!ok) {
      Alert.alert("Benachrichtigungen deaktiviert", "Du hast keine Notification-Berechtigung gegeben. Aktiviere sie in iOS Einstellungen.");
      return false;
    }

    try {
      await rescheduleLocalReminders(nextEnabled, nextTimes);
      return true;
    } catch (e) {
      console.log("reschedule error:", e?.message || e);
      Alert.alert("Fehler", "Scheduling hat nicht geklappt. Siehe Log (reschedule error).");
      return false;
    }
  }

  async function onToggle(val) {
    const nextEnabled = val;
    setEnabled(nextEnabled);

    setSaving(true);
    try {
      const ok = await applySchedule(nextEnabled, sortedTimes);
      await persist(nextEnabled, sortedTimes);
      if (ok) {
        Alert.alert("Gespeichert", nextEnabled ? "Erinnerungen sind aktiv." : "Erinnerungen sind aus.");
      }
    } finally {
      setSaving(false);
    }
  }

  function openPicker() {
    const base = new Date();
    const first = sortedTimes[0] || { hour: 19, minute: 0 };
    base.setHours(first.hour, first.minute, 0, 0);
    setPickerValue(base);
    setPickerOpen(true);
  }

  function removeTime(idx) {
    const next = sortedTimes.filter((_, i) => i !== idx);
    setTimes(next);
  }

  async function addPickedTime() {
    const h = pickerValue.getHours();
    const m = pickerValue.getMinutes();
    const next = uniqTimes([...sortedTimes, { hour: h, minute: m }]);

    setTimes(next);
    setPickerOpen(false);

    setSaving(true);
    try {
      await persist(enabled, next);
      if (enabled) {
        const ok = await applySchedule(enabled, next);
        if (ok) Alert.alert("Hinzugefügt", `Erinnerung um ${pad2(h)}:${pad2(m)} gespeichert.`);
      } else {
        Alert.alert("Hinzugefügt", `Zeit ${pad2(h)}:${pad2(m)} gespeichert (Erinnerungen sind aktuell aus).`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveNow() {
    setSaving(true);
    try {
      await persist(enabled, sortedTimes);
      const ok = await applySchedule(enabled, sortedTimes);
      if (ok) Alert.alert("Gespeichert", "Deine Zeiten wurden übernommen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.title}>Notifications</Text>

      <View style={s.card}>
        <View style={s.row}>
          <View style={s.rowLeft}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
            <Text style={s.rowText}>Erinnerungen aktiv</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            thumbColor={enabled ? "#22c55e" : "#888"}
            trackColor={{ true: "#14532d", false: "#374151" }}
          />
        </View>

        <View style={s.divider} />

        <Text style={s.subTitle}>Tägliche Erinnerung</Text>
        <Text style={s.hint}>Du kannst mehrere Zeiten hinzufügen. Jede Zeit gilt jeden Tag.</Text>

        <TouchableOpacity style={s.bigBtn} onPress={openPicker} activeOpacity={0.9} disabled={saving}>
          <Ionicons name="time-outline" size={18} color={theme.text} />
          <Text style={s.bigBtnText}>Zeit auswählen</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.sub} />
        </TouchableOpacity>

        {sortedTimes.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {sortedTimes.map((t, idx) => (
              <View key={timeKey(t)} style={s.timeRow}>
                <Text style={s.timeText}>{pad2(t.hour)}:{pad2(t.minute)}</Text>
                <TouchableOpacity onPress={() => removeTime(idx)} style={s.trash} activeOpacity={0.85}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveNow} activeOpacity={0.9} disabled={saving}>
          <Text style={s.saveText}>Speichern</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Zeit hinzufügen</Text>

            <View style={s.pickerWrap}>
              <DateTimePicker
                value={pickerValue}
                mode="time"
                display="spinner"
                onChange={(e, date) => {
                  if (date) setPickerValue(date);
                }}
                style={{ alignSelf: "stretch" }}
              />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity onPress={() => setPickerOpen(false)} style={s.modalBtn} activeOpacity={0.9}>
                <Text style={s.modalBtnText}>Abbrechen</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={addPickedTime} style={[s.modalBtn, s.modalBtnPrimary]} activeOpacity={0.9}>
                <Text style={[s.modalBtnText, s.modalBtnTextPrimary]}>Zeit hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Text style={s.note}>
        Hinweis: In Expo Go gibt es Einschränkungen. Für Android brauchst du für Push (remote) definitiv einen Dev Build.
        Lokale, geplante Notifications sollten auf iOS normal funktionieren, wenn Permission erlaubt ist.
      </Text>
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
    padding: 14,
  },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowText: { color: theme.text, fontSize: 15, fontWeight: "800" },

  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },

  subTitle: { color: theme.text, fontWeight: "900", fontSize: 15, marginBottom: 6 },
  hint: { color: theme.sub, fontWeight: "700", fontSize: 12, marginBottom: 10 },

  bigBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  bigBtnText: { color: theme.text, fontWeight: "900", fontSize: 14, flex: 1 },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  timeText: { color: theme.text, fontWeight: "900", fontSize: 16 },
  trash: { paddingHorizontal: 6, paddingVertical: 6 },

  saveBtn: {
    marginTop: 14,
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#0b0b0b", fontWeight: "900", fontSize: 16 },

  modalOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#0b0b0b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 14,
  },
  modalTitle: { color: theme.text, fontWeight: "900", fontSize: 16, marginBottom: 10 },

  pickerWrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 6,
  },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  modalBtnPrimary: { backgroundColor: "#22c55e", borderColor: "transparent" },
  modalBtnText: { color: "#ffffff", fontWeight: "900" },
  modalBtnTextPrimary: { color: "#0b0b0b" },

  note: { marginTop: 12, color: theme.sub, fontWeight: "700", fontSize: 12, opacity: 0.85 },
});
