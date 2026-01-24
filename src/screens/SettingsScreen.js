// Änderungen:
// - Email placeholder: "Deine E-Mail" (statt beispiel@email.com)
// - Optional: helperText direkt unter dem Feld, damit es klar ist

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "profile_v2";
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

const isValidEmail = (v) => {
  const s = String(v || "").trim();
  if (!s) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
};

export default function SettingsScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const [showGoalPresets, setShowGoalPresets] = useState(false);
  const [showInterestPresets, setShowInterestPresets] = useState(false);
  const [showPersonalityPresets, setShowPersonalityPresets] = useState(false);
  const [showOtherPresets, setShowOtherPresets] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        p.name && setName(String(p.name));
        p.email && setEmail(String(p.email));
        p.age !== undefined && p.age !== null && setAge(String(p.age));
        p.gender && setGender(p.gender);

        Array.isArray(p.goals) && setGoals(p.goals);
        Array.isArray(p.interests) && setInterests(p.interests);
        Array.isArray(p.personality) && setPersonality(p.personality);
        Array.isArray(p.others) && setOthers(p.others);
      } catch {}
    })();
  }, []);

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

  const save = async () => {
    const emailTrim = String(email || "").trim();
    if (!isValidEmail(emailTrim)) {
      alert("Bitte gib eine gültige E-Mail ein (oder lass das Feld leer).");
      return;
    }

    const profile = {
      name: name.trim(),
      email: emailTrim || null,
      age: Number(age) || null,
      gender,
      goals,
      interests,
      personality,
      others,
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    navigation?.goBack?.();
  };

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
          <Text style={styles.section}>Profil</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Dein Name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            autoCapitalize="words"
          />

          <Text style={styles.label}>E-Mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Deine E-Mail"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            returnKeyType="done"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helper}>
            Optional. Für Account/Sync später.
          </Text>

          <Text style={styles.label}>Alter</Text>
          <TextInput
            style={styles.input}
            placeholder="Dein Alter"
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
                  <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Ziele */}
          <Text style={styles.section}>Ziele</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Schule, Sport, Business …"
              placeholderTextColor="#9ca3af"
              value={goalInput}
              onChangeText={setGoalInput}
              returnKeyType="done"
              onSubmitEditing={() => addTag(goalInput, goals, setGoals, setGoalInput)}
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowGoalPresets((x) => !x)}
            >
              <Text style={styles.presetText}>{showGoalPresets ? "▼" : "≡"}</Text>
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
              <Chip key={g} label={g} onRemove={() => removeTag(g, goals, setGoals)} />
            ))}
          </View>
          {showGoalPresets && (
            <View style={styles.tagWrap}>
              {GOAL_PRESETS.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => addTag(p, goals, setGoals, null)}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Interessen */}
          <Text style={styles.section}>Interessen</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Eishockey, Mathe, Beziehungen …"
              placeholderTextColor="#9ca3af"
              value={interestInput}
              onChangeText={setInterestInput}
              returnKeyType="done"
              onSubmitEditing={() => addTag(interestInput, interests, setInterests, setInterestInput)}
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowInterestPresets((x) => !x)}
            >
              <Text style={styles.presetText}>{showInterestPresets ? "▼" : "≡"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => addTag(interestInput, interests, setInterests, setInterestInput)}
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {interests.map((i) => (
              <Chip key={i} label={i} onRemove={() => removeTag(i, interests, setInterests)} />
            ))}
          </View>
          {showInterestPresets && (
            <View style={styles.tagWrap}>
              {INTEREST_PRESETS.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => addTag(p, interests, setInterests, null)}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Persönlichkeit */}
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
                addTag(personalityInput, personality, setPersonality, setPersonalityInput)
              }
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowPersonalityPresets((x) => !x)}
            >
              <Text style={styles.presetText}>{showPersonalityPresets ? "▼" : "≡"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => addTag(personalityInput, personality, setPersonality, setPersonalityInput)}
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {personality.map((p) => (
              <Chip key={p} label={p} onRemove={() => removeTag(p, personality, setPersonality)} />
            ))}
          </View>
          {showPersonalityPresets && (
            <View style={styles.tagWrap}>
              {PERSONALITY_PRESETS.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => addTag(p, personality, setPersonality, null)}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Sonstiges */}
          <Text style={styles.section}>Sonstiges</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              placeholder="z. B. Schlaf, Stress, Familie …"
              placeholderTextColor="#9ca3af"
              value={otherInput}
              onChangeText={setOtherInput}
              returnKeyType="done"
              onSubmitEditing={() => addTag(otherInput, others, setOthers, setOtherInput)}
            />
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setShowOtherPresets((x) => !x)}
            >
              <Text style={styles.presetText}>{showOtherPresets ? "▼" : "≡"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={() => addTag(otherInput, others, setOthers, setOtherInput)}
            >
              <Text style={styles.plusText}>＋</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagWrap}>
            {others.map((o) => (
              <Chip key={o} label={o} onRemove={() => removeTag(o, others, setOthers)} />
            ))}
          </View>
          {showOtherPresets && (
            <View style={styles.tagWrap}>
              {OTHER_PRESETS.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => addTag(p, others, setOthers, null)}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Speichern</Text>
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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

  helper: {
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 2,
    fontWeight: "700",
    fontSize: 12,
  },

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
  plusText: { color: "#0b0b0b", fontWeight: "900", fontSize: 22, lineHeight: 22 },

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
  presetText: { color: "#e5e7eb", fontWeight: "900", fontSize: 18 },

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

  saveBtn: {
    marginTop: 28,
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveText: { color: "#0b0b0b", fontWeight: "900", fontSize: 16 },
});
