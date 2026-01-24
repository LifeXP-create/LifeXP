// src/components/ProfileEditor.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

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

export default function ProfileEditor({ profile, onChange }) {
  const p = profile || {};

  const [showGoalPresets, setShowGoalPresets] = useState(false);
  const [showInterestPresets, setShowInterestPresets] = useState(false);
  const [showPersonalityPresets, setShowPersonalityPresets] = useState(false);

  const goals = Array.isArray(p.goals) ? p.goals : [];
  const interests = Array.isArray(p.interests) ? p.interests : [];
  const personalityTags = Array.isArray(p.personalityTags)
    ? p.personalityTags
    : [];

  function update(patch) {
    onChange({ ...p, ...patch });
  }

  function toggleFromArray(key, value) {
    const current = Array.isArray(p[key]) ? p[key] : [];
    const exists = current.includes(value);
    const next = exists
      ? current.filter((x) => x !== value)
      : [...current, value];
    update({ [key]: next });
  }

  // Hilfsfunktion: wenn Textfeld leer ist, füllen wir es mit den gewählten Chips
  function syncTextFromArray(textKey, arrayKey) {
    const arr = Array.isArray(p[arrayKey]) ? p[arrayKey] : [];
    if (!p[textKey] && arr.length > 0) {
      update({ [textKey]: arr.join(", ") });
    }
  }

  return (
    <View>
      {/* Name */}
      <Text style={s.label}>Name</Text>
      <TextInput
        style={s.input}
        placeholder="Dein Name …"
        placeholderTextColor="#778"
        value={p.name || ""}
        onChangeText={(name) => update({ name })}
      />

      {/* Alter */}
      <Text style={s.label}>Alter</Text>
      <TextInput
        style={s.input}
        placeholder="z. B. 17"
        placeholderTextColor="#778"
        keyboardType="number-pad"
        value={p.age ? String(p.age) : ""}
        onChangeText={(age) =>
          update({ age: age ? Number.parseInt(age, 10) || null : null })
        }
      />

      {/* Geschlecht */}
      <Text style={s.label}>Geschlecht</Text>
      <View style={s.chipRow}>
        {[
          { key: "male", label: "männlich" },
          { key: "female", label: "weiblich" },
          { key: "diverse", label: "divers" },
        ].map((g) => {
          const active = p.gender === g.key;
          return (
            <TouchableOpacity
              key={g.key}
              onPress={() => update({ gender: g.key })}
              style={[s.chip, active && s.chipA]}
            >
              <Text style={[s.chipT, active && s.chipTA]}>{g.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ziele */}
      <Text style={s.sectionTitle}>Ziele</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="z. B. Schule, Sport, Business …"
          placeholderTextColor="#778"
          value={p.goalsText || ""}
          onChangeText={(goalsText) => update({ goalsText })}
        />
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setShowGoalPresets((v) => !v)}
        >
          <Ionicons
            name={showGoalPresets ? "chevron-up" : "add"}
            size={20}
            color="#001014"
          />
        </TouchableOpacity>
      </View>
      {showGoalPresets && (
        <View style={s.chipWrap}>
          {GOAL_PRESETS.map((g) => {
            const active = goals.includes(g);
            return (
              <TouchableOpacity
                key={g}
                style={[s.chipSmall, active && s.chipA]}
                onPress={() => {
                  toggleFromArray("goals", g);
                  syncTextFromArray("goalsText", "goals");
                }}
              >
                <Text style={[s.chipSmallT, active && s.chipTA]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Interessen */}
      <Text style={s.sectionTitle}>Interessen</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="z. B. Eishockey, Mathe, Beziehungen …"
          placeholderTextColor="#778"
          value={p.interestsText || ""}
          onChangeText={(interestsText) => update({ interestsText })}
        />
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setShowInterestPresets((v) => !v)}
        >
          <Ionicons
            name={showInterestPresets ? "chevron-up" : "add"}
            size={20}
            color="#001014"
          />
        </TouchableOpacity>
      </View>
      {showInterestPresets && (
        <View style={s.chipWrap}>
          {INTEREST_PRESETS.map((g) => {
            const active = interests.includes(g);
            return (
              <TouchableOpacity
                key={g}
                style={[s.chipSmall, active && s.chipA]}
                onPress={() => {
                  toggleFromArray("interests", g);
                  syncTextFromArray("interestsText", "interests");
                }}
              >
                <Text style={[s.chipSmallT, active && s.chipTA]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Persönlichkeit */}
      <Text style={s.sectionTitle}>Persönlichkeit</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="z. B. introvertiert, ehrgeizig, ruhig …"
          placeholderTextColor="#778"
          value={p.personalityText || ""}
          onChangeText={(personalityText) => update({ personalityText })}
        />
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => setShowPersonalityPresets((v) => !v)}
        >
          <Ionicons
            name={showPersonalityPresets ? "chevron-up" : "add"}
            size={20}
            color="#001014"
          />
        </TouchableOpacity>
      </View>
      {showPersonalityPresets && (
        <View style={s.chipWrap}>
          {PERSONALITY_PRESETS.map((g) => {
            const active = personalityTags.includes(g);
            return (
              <TouchableOpacity
                key={g}
                style={[s.chipSmall, active && s.chipA]}
                onPress={() => {
                  toggleFromArray("personalityTags", g);
                  syncTextFromArray("personalityText", "personalityTags");
                }}
              >
                <Text style={[s.chipSmallT, active && s.chipTA]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    color: theme.sub,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 13,
  },
  sectionTitle: {
    color: theme.text,
    marginTop: 18,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipA: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipT: {
    color: theme.text,
    fontSize: 12,
  },
  chipTA: {
    color: "#001014",
    fontWeight: "800",
  },
  chipSmall: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipSmallT: {
    color: theme.text,
    fontSize: 11,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
