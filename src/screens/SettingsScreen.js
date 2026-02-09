// src/screens/SettingsScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { getOrCreateUserId } from "../lib/userId";

const STORAGE_KEY_BASE = "profile_v2";
const storageKeyForUser = (userId) => `${STORAGE_KEY_BASE}:${userId}`;

const GENDER = ["männlich", "weiblich", "divers"];

// ----- PRESETS -----
const GOAL_PRESETS = [
  "Schule / Noten verbessern",
  "Sport / Fitness",
  "Business / Geld",
  "Beziehungen",
  "Mentale Gesundheit",
  "Selbstbewusstsein",
  "Fokus & Konzentration",
];

const INTEREST_PRESETS = [
  "Eishockey",
  "Fussball",
  "Krafttraining",
  "Mathe",
  "Informatik",
  "Business / Startups",
  "Gaming",
  "Musik",
  "Psychologie",
  "Soziale Events",
];

const PERSONALITY_PRESETS = [
  "introvertiert",
  "extrovertiert",
  "ehrgeizig",
  "kreativ",
  "ruhig",
  "chaotisch",
  "zielorientiert",
];

const OTHER_PRESETS = [
  "Schlaf / Energie",
  "Ernährung",
  "Stress / Belastung",
  "Familie",
  "Finanzen",
  "Schule / Druck",
  "Gesundheit allgemein",
  "Zeitmanagement",
];

/** kleine Helper */
const pad2 = (n) => String(n).padStart(2, "0");
const parseHHMM = (str) => {
  const m = String(str).match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  let h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  let min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return { hour: h, minute: min };
};

export default function SettingsScreen({ navigation }) {
  /** Profil */
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("männlich");

  const [goals, setGoals] = useState([]);
  const [goalInput, setGoalInput] = useState("");

  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");

  const [personality, setPersonality] = useState([]);
  const [personalityInput, setPersonalityInput] = useState("");

  const [others, setOthers] = useState([]);
  const [otherInput, setOtherInput] = useState("");

  // Preset-Panels ein/aus
  const [showGoalPresets, setShowGoalPresets] = useState(false);
  const [showInterestPresets, setShowInterestPresets] = useState(false);
  const [showPersonalityPresets, setShowPersonalityPresets] = useState(false);
  const [showOtherPresets, setShowOtherPresets] = useState(false);

  /** Notifications */
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [times, setTimes] = useState([{ hour: 19, minute: 0 }]); // default 19:00
  const [timeInput, setTimeInput] = useState("19:00");

  useEffect(() => {
    (async () => {
      try {
        const userId = await getOrCreateUserId();
        const raw = await AsyncStorage.getItem(storageKeyForUser(userId));
        if (!raw) return;

        const p = JSON.parse(raw);
        p.name && setName(p.name);
        p.age && setAge(String(p.age));
        p.gender && setGender(p.gender);
        Array.isArray(p.goals) && setGoals(p.goals);
        Array.isArray(p.interests) && setInterests(p.interests);
        Array.isArray(p.personality) && setPersonality(p.personality);
        Array.isArray(p.others) && setOthers(p.others);

        if (typeof p.notifEnabled === "boolean")
          setNotifEnabled(p.notifEnabled);
        if (Array.isArray(p.notifTimes) && p.notifTimes.length)
          setTimes(p.notifTimes);
      } catch {
        // ignore corrupted save
      }
    })();
  }, []);

  /** add/remove tags */
  const addTag = (value, list, setList, setInput) => {
    const v = String(value || "").trim();
    if (!v) return;
    if (list.includes(v)) {
      setInput && setInput("");
      return;
    }
    setList([...list, v]);
    setInput && setInput("");
  };

  const removeTag = (tag, list, setList) => {
    setList(list.filter((t) => t !== tag));
  };

  /** notif time handling */
  const addTime = () => {
    const parsed = parseHHMM(timeInput);
    if (!parsed) {
      Alert.alert(
        "Ungültige Zeit",
        "Bitte im Format HH:MM eingeben (z. B. 08:30).",
      );
      return;
    }
    const exists = times.some(
      (t) => t.hour === parsed.hour && t.minute === parsed.minute,
    );
    if (exists) {
      setTimeInput("");
      return;
    }
    setTimes(
      [...times, parsed].sort(
        (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
      ),
    );
    setTimeInput("");
  };

  const removeTime = (idx) => setTimes(times.filter((_, i) => i !== idx));

  /** permission + scheduling */
  const ensureNotifPermission = async () => {
    if (!Device.isDevice) {
      Alert.alert(
        "Hinweis",
        "Benachrichtigungen funktionieren nur auf echten Geräten.",
      );
      return false;
    }
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== "granted") return false;
    }
    return true;
  };

  const rescheduleNotifications = async (enabled, timeList) => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!enabled || !timeList.length) return;

    for (const t of timeList) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "LifeXP",
          body: "Deine Quests warten ✨",
          sound: true,
        },
        trigger: {
          hour: t.hour,
          minute: t.minute,
          repeats: true,
          channelId: Platform.OS === "android" ? "lifexp-daily" : undefined,
        },
      });
    }
  };

  /** speichern */
  const save = async () => {
    if (notifEnabled) {
      const ok = await ensureNotifPermission();
      if (!ok) {
        Alert.alert(
          "Berechtigung benötigt",
          "Bitte Benachrichtigungen in den Systemeinstellungen erlauben.",
        );
      }
    }
    await rescheduleNotifications(notifEnabled, times);

    const profile = {
      name: name.trim(),
      age: Number(age) || null,
      gender,
      goals,
      interests,
      personality,
      others,
      notifEnabled,
      notifTimes: times,
      updatedAt: Date.now(),
    };

    const userId = await getOrCreateUserId();
    await AsyncStorage.setItem(
      storageKeyForUser(userId),
      JSON.stringify(profile),
    );
    navigation?.goBack?.();
  };

  /** UI */
  const Chip = ({ label, onRemove }) => (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.chipX}>
        <Text style={styles.chipXText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0b0b0b" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 82 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* -------- Profil -------- */}
          <Text style={styles.section}>Profil</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Dein Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
          />

          <Text style={styles.label}>Alter</Text>
          <TextInput
            style={styles.input}
            placeholder="z. B. 18"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            returnKeyType="done"
          />

          <Text style={styles.label}>Geschlecht</Text>
          <View style={styles.rowWrap}>
            {GENDER.map((g) => {
              const active = gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.toggle, active && styles.toggleActive]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      active && styles.toggleTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* -------- Ziele -------- */}
          <Text style={styles.section}>Ziele</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Schule, Sport, Business …"
              placeholderTextColor="#9ca3af"
              value={goalInput}
              onChangeText={setGoalInput}
              returnKeyType="done"
              onSubmitEditing={() =>
                addTag(goalInput, goals, setGoals, setGoalInput)
              }
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowGoalPresets((x) => !x)}
            >
              <Text style={styles.presetText}>
                {showGoalPresets ? "▼" : "≡"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => addTag(goalInput, goals, setGoals, setGoalInput)}
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {goals.map((g) => (
              <Chip
                key={g}
                label={g}
                onRemove={() => removeTag(g, goals, setGoals)}
              />
            ))}
          </View>
          {showGoalPresets && (
            <View style={styles.tagWrap}>
              {GOAL_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.chip}
                  onPress={() => addTag(p, goals, setGoals, null)}
                >
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* -------- Interessen -------- */}
          <Text style={styles.section}>Interessen</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Fussball, Mathe, Beziehungen …"
              placeholderTextColor="#9ca3af"
              value={interestInput}
              onChangeText={setInterestInput}
              returnKeyType="done"
              onSubmitEditing={() =>
                addTag(interestInput, interests, setInterests, setInterestInput)
              }
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowInterestPresets((x) => !x)}
            >
              <Text style={styles.presetText}>
                {showInterestPresets ? "▼" : "≡"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() =>
                addTag(interestInput, interests, setInterests, setInterestInput)
              }
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {interests.map((i) => (
              <Chip
                key={i}
                label={i}
                onRemove={() => removeTag(i, interests, setInterests)}
              />
            ))}
          </View>
          {showInterestPresets && (
            <View style={styles.tagWrap}>
              {INTEREST_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.chip}
                  onPress={() => addTag(p, interests, setInterests, null)}
                >
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* -------- Persönlichkeit -------- */}
          <Text style={styles.section}>Persönlichkeit</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. introvertiert, ehrgeizig, ruhig …"
              placeholderTextColor="#9ca3af"
              value={personalityInput}
              onChangeText={setPersonalityInput}
              returnKeyType="done"
              onSubmitEditing={() =>
                addTag(
                  personalityInput,
                  personality,
                  setPersonality,
                  setPersonalityInput,
                )
              }
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowPersonalityPresets((x) => !x)}
            >
              <Text style={styles.presetText}>
                {showPersonalityPresets ? "▼" : "≡"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() =>
                addTag(
                  personalityInput,
                  personality,
                  setPersonality,
                  setPersonalityInput,
                )
              }
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {personality.map((p) => (
              <Chip
                key={p}
                label={p}
                onRemove={() => removeTag(p, personality, setPersonality)}
              />
            ))}
          </View>
          {showPersonalityPresets && (
            <View style={styles.tagWrap}>
              {PERSONALITY_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.chip}
                  onPress={() => addTag(p, personality, setPersonality, null)}
                >
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* -------- Sonstiges -------- */}
          <Text style={styles.section}>Sonstiges</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Schlaf, Stress, Familie …"
              placeholderTextColor="#9ca3af"
              value={otherInput}
              onChangeText={setOtherInput}
              returnKeyType="done"
              onSubmitEditing={() =>
                addTag(otherInput, others, setOthers, setOtherInput)
              }
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowOtherPresets((x) => !x)}
            >
              <Text style={styles.presetText}>
                {showOtherPresets ? "▼" : "≡"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() =>
                addTag(otherInput, others, setOthers, setOtherInput)
              }
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {others.map((o) => (
              <Chip
                key={o}
                label={o}
                onRemove={() => removeTag(o, others, setOthers)}
              />
            ))}
          </View>
          {showOtherPresets && (
            <View style={styles.tagWrap}>
              {OTHER_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.chip}
                  onPress={() => addTag(p, others, setOthers, null)}
                >
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* -------- Notifications -------- */}
          <Text style={styles.section}>Benachrichtigungen</Text>

          <View style={styles.notifRow}>
            <Text style={styles.notifLabel}>Erinnerungen aktiv</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              thumbColor={notifEnabled ? "#22c55e" : "#888"}
              trackColor={{ true: "#14532d", false: "#374151" }}
            />
          </View>

          {notifEnabled && (
            <>
              <View style={[styles.inputRow, { marginTop: 6 }]}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="HH:MM (z. B. 08:30)"
                  placeholderTextColor="#9ca3af"
                  value={timeInput}
                  onChangeText={setTimeInput}
                  returnKeyType="done"
                  onSubmitEditing={addTime}
                />
                <TouchableOpacity style={styles.plusBtn} onPress={addTime}>
                  <Text style={styles.plusText}>＋</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagWrap}>
                {times.map((t, idx) => (
                  <View
                    key={`${t.hour}:${t.minute}-${idx}`}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>
                      {pad2(t.hour)}:{pad2(t.minute)}
                    </Text>
                    <TouchableOpacity
                      style={styles.chipX}
                      onPress={() => removeTime(idx)}
                    >
                      <Text style={styles.chipXText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Speichern</Text>
          </TouchableOpacity>
          <View style={{ height: 36 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/** Styles */
const styles = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingTop: 10 },

  section: {
    color: "#cbd5e1",
    fontWeight: "800",
    fontSize: 15,
    marginTop: 22,
    marginBottom: 10,
  },

  label: { color: "#98a2b3", fontWeight: "700", marginBottom: 8, marginTop: 6 },

  input: {
    backgroundColor: "#111827",
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#2b3443",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputFlex: { flex: 1 },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  toggle: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2b3443",
    backgroundColor: "#0f172a",
  },
  toggleActive: { borderColor: "#22c55e", backgroundColor: "#083c2b" },
  toggleText: { color: "#e5e7eb", fontWeight: "700" },
  toggleTextActive: { color: "#22c55e" },

  plusBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: {
    color: "#0b0b0b",
    fontWeight: "900",
    fontSize: 22,
    lineHeight: 22,
  },

  presetBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    height: 48,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2b3443",
  },
  presetText: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 18,
  },

  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#2b3443",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { color: "#e5e7eb", fontWeight: "700" },
  chipX: { paddingHorizontal: 4, paddingVertical: 2 },
  chipXText: { color: "#9aa5b1", fontSize: 16, fontWeight: "900" },

  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#2b3443",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  notifLabel: { color: "#e5e7eb", fontWeight: "700" },

  saveBtn: {
    marginTop: 28,
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#0b0b0b", fontWeight: "900", fontSize: 16 },
});
