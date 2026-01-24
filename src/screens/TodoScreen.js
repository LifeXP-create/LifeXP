import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppState";
import { theme } from "../theme";
import EditRoutineModal from "../components/EditRoutineModal";

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "bad", label: "Bad Habits" },
];

export default function TodoScreen() {
  const {
    recurring,
    badHabits,
    addRecurring,
    updateRecurring,
    removeRecurring,
    addBadHabit,
    updateBadHabit,
    removeBadHabit,
  } = useApp();

  const [tab, setTab] = useState("daily");
  const [title, setTitle] = useState("");
  const [times, setTimes] = useState(2);

  // Edit Modal (existing + create)
  const [editing, setEditing] = useState(null);
  const [editType, setEditType] = useState("recurring"); // "recurring" | "bad"
  const [showEdit, setShowEdit] = useState(false);

  const list = useMemo(() => {
    if (tab === "bad") return badHabits.map((b) => ({ ...b, _type: "bad" }));
    return recurring.filter((r) => r.kind === tab).map((r) => ({ ...r, _type: "recurring" }));
  }, [recurring, badHabits, tab]);

  function addQuick() {
    const t = title.trim();
    if (!t) return;

    if (tab === "bad") {
      addBadHabit({ title: t });
    } else if (tab === "daily") {
      addRecurring({ title: t, kind: "daily", times: 1 });
    } else {
      addRecurring({
        title: t,
        kind: tab,
        times: Math.max(1, Math.min(14, Number(times) || 1)),
      });
    }

    setTitle("");
  }

  function openEdit(item) {
    setEditing(item);
    setEditType(item._type);
    setShowEdit(true);
  }

  function openCreateModal() {
    const t = title.trim();
    const isBad = tab === "bad";

    // Dummy-Objekt für Modal, damit man direkt Bereich/Typ/Notiz setzen kann
    const draft = isBad
      ? {
          id: `draft_${Date.now()}`,
          title: t || "",
          area: "Wellbeing",
          intensity: 0.2,
          note: "",
        }
      : {
          id: `draft_${Date.now()}`,
          title: t || "",
          area: "Productivity",
          kind: tab, // daily/weekly/monthly/yearly
          times: tab === "daily" ? 1 : Math.max(1, Math.min(14, Number(times) || 1)),
          note: "",
          weekDays: [],
          monthDays: [],
          yearDates: [],
        };

    setEditing(draft);
    setEditType(isBad ? "bad" : "recurring");
    setShowEdit(true);
  }

  function onSaveEdit(patch) {
    if (!editing) return;

    // Create vs Update unterscheiden über draft_ prefix
    const isDraft = String(editing.id || "").startsWith("draft_");

    if (isDraft) {
      if (editType === "bad") {
        addBadHabit({
          title: patch.title,
          area: patch.area,
          intensity: patch.intensity,
          note: patch.note,
        });
      } else {
        addRecurring({
          title: patch.title,
          kind: patch.kind,
          times: patch.kind === "daily" ? 1 : patch.times,
          area: patch.area,
          weekDays: patch.weekDays,
          monthDays: patch.monthDays,
          yearDates: patch.yearDates,
          note: patch.note,
        });
      }
      setTitle("");
      setShowEdit(false);
      return;
    }

    // Normal edit existing
    if (editType === "bad") updateBadHabit(editing.id, patch);
    else updateRecurring(editing.id, patch);
  }

  function onDelete() {
    if (!editing) return;

    const isDraft = String(editing.id || "").startsWith("draft_");
    if (isDraft) {
      setShowEdit(false);
      return;
    }

    if (editType === "bad") removeBadHabit(editing.id);
    else removeRecurring(editing.id);
    setShowEdit(false);
  }

  return (
    <View style={s.c}>
      <Text style={s.h1}>Routinen</Text>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, tab === t.key && s.tabA]}
          >
            <Text style={[s.tabT, tab === t.key && s.tabTA]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.inputRow}>
        <Ionicons name="add-outline" size={20} color={theme.text} />

        <TextInput
          style={s.input}
          placeholder={tab === "bad" ? "Schlechte Gewohnheit…" : "Neue Routine…"}
          placeholderTextColor="#6b7280"
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={addQuick}
          returnKeyType="done"
        />

        {tab !== "daily" && tab !== "bad" && (
          <View style={s.times}>
            <Text style={s.small}>x/{tab === "weekly" ? "W" : tab === "monthly" ? "M" : "Y"}</Text>
            <TextInput
              style={s.timesInput}
              keyboardType="number-pad"
              maxLength={2}
              value={String(times)}
              onChangeText={(v) => setTimes(v.replace(/[^0-9]/g, ""))}
            />
          </View>
        )}

        {/* HIER: Blatt -> Edit. Öffnet Create-Modal */}
        <TouchableOpacity onPress={openCreateModal} style={s.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="create-outline" size={18} color={theme.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={addQuick} style={s.addBtn}>
          <Text style={s.addT}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={<Text style={s.empty}>Noch nichts hier.</Text>}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.title}</Text>

              {item._type === "recurring" && (
                <Text style={s.meta}>
                  {cap(item.kind)}
                  {item.kind !== "daily" && item.times ? ` · ${item.times}x` : ""}
                  {" · "}
                  {item.area}
                </Text>
              )}

              {item._type === "bad" && (
                <Text style={s.meta}>
                  Ziel: abgewöhnen · {item.area} · Intensität {item.intensity ?? 0.2}
                </Text>
              )}

              {!!item.note && (
                <Text style={s.notePreview} numberOfLines={2}>
                  {item.note}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
              <Ionicons name="create-outline" size={18} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => (item._type === "bad" ? removeBadHabit(item.id) : removeRecurring(item.id))}
              style={s.iconBtn}
            >
              <Ionicons name="trash-outline" size={18} color={theme.sub} />
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={s.noteFoot}>
        Jede Routine hat eine optionale „KI-Notiz“. Sie wird später für Analyse/Anpassung genutzt.
      </Text>

      <EditRoutineModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        item={editing}
        type={editType}
        onSave={onSaveEdit}
        onDelete={onDelete}
      />
    </View>
  );
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: theme.bg, padding: 16 },
  h1: { color: theme.text, fontSize: 22, fontWeight: "800", marginBottom: 8 },

  tabs: { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tabA: { backgroundColor: theme.primary },
  tabT: { color: theme.text, fontSize: 12 },
  tabTA: { color: "#001014", fontWeight: "800" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },
  input: { flex: 1, color: theme.text },

  addBtn: { backgroundColor: theme.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addT: { color: "#001014", fontWeight: "800" },

  times: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  small: { color: theme.sub, fontSize: 11 },
  timesInput: { color: theme.text, minWidth: 24, textAlign: "center" },

  iconBtn: { padding: 6 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: { color: theme.text, fontWeight: "700" },
  meta: { color: theme.sub, fontSize: 12, marginTop: 2 },

  notePreview: { color: theme.sub, fontSize: 12, marginTop: 6 },

  empty: { color: theme.sub, marginTop: 8 },
  noteFoot: { color: theme.sub, marginTop: 6, fontSize: 12, opacity: 0.9 },
});
