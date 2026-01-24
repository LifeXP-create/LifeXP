import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "../theme";
import UniverseCanvas from "../components/UniverseCanvas";
import { useApp } from "../context/AppState";

export default function CharacterScreen() {
  const { profile, areas, setProfile } = useApp();

  // "overview" zeigt alle Galaxien, "zoom" zeigt eine
  const [mode, setMode] = React.useState("overview"); // "overview" | "zoom"
  const [selected, setSelected] = React.useState(null);

  const perArea = React.useMemo(
    () => ({
      mind: { name: "Neural Nebula", color: "#c084fc", level: areas.mind?.level ?? 1, xp: areas.mind?.xp ?? 0 },
      body: { name: "Atlas Reach", color: "#22d3ee", level: areas.body?.level ?? 1, xp: areas.body?.xp ?? 0 },
      social: { name: "Aurora Nexus", color: "#fb7185", level: areas.social?.level ?? 1, xp: areas.social?.xp ?? 0 },
      prod: { name: "Vector Forge", color: "#f59e0b", level: areas.prod?.level ?? 1, xp: areas.prod?.xp ?? 0 },
      well: { name: "Zen Cluster", color: "#22c55e", level: areas.well?.level ?? 1, xp: areas.well?.xp ?? 0 },
    }),
    [areas]
  );

  // Sofortiger Wechsel ohne Animation
  const openGalaxy = (key) => {
    setSelected(key);
    setMode("zoom");
  };

  // Zurück zur Übersicht
  const backToOverview = () => {
    setMode("overview");
    setSelected(null);
  };

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.title}>Life Universe</Text>
        <View style={s.badges}>
          <View style={s.badge}><Text style={s.badgeTxt}>Lvl {profile?.level ?? 1}</Text></View>
          <View style={s.badge}><Text style={s.badgeTxt}>{profile?.streak ?? 0} / 7d</Text></View>
        </View>
      </View>

      <View style={s.space}>
        <UniverseCanvas
          perArea={perArea}
          mode={mode}
          selectedArea={selected}
          onGalaxyPress={(key) => openGalaxy(key)} // sofort
          bottomReserve={200}
        />
        {mode === "zoom" && (
          <TouchableOpacity style={s.backBtn} onPress={backToOverview}>
            <Text style={s.backTxt}>Zur Übersicht</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Liste unten – bleibt wie gehabt */}
      <View style={s.list}>
        {Object.entries(perArea).map(([key, a]) => (
          <TouchableOpacity key={key} style={s.card} onPress={() => openGalaxy(key)}>
            <View style={[s.dot, { backgroundColor: a.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{a.name}</Text>
              <Text style={s.cardMeta}>
                {labelFor(key)} · L{a.level} · {a.xp}/100 XP
              </Text>
            </View>
            <Text style={s.chev}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const labelFor = (k) =>
  k === "mind" ? "Mind" :
  k === "body" ? "Body" :
  k === "social" ? "Social" :
  k === "prod" ? "Productivity" : "Wellbeing";

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg },
  header: { paddingTop: 12, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: theme.text, fontSize: 28, fontWeight: "800" },
  badges: { flexDirection: "row", gap: 10 },
  badge: { backgroundColor: "#10b981", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTxt: { color: "#071317", fontWeight: "700" },

  space: { flex: 1, overflow: "hidden" },
  backBtn: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  backTxt: { color: "#e5e7eb", fontWeight: "700" },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 14, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 8 },
  cardTitle: { color: theme.text, fontWeight: "800", fontSize: 16 },
  cardMeta: { color: theme.sub, marginTop: 2 },
  chev: { color: theme.sub, fontSize: 22, marginLeft: 8 },
});
