// src/components/EditRoutineModal.js
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { theme } from "../theme";
import { AREAS } from "../context/AppState";

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const MONTHS = [
  { v: 1, label: "Jan" },
  { v: 2, label: "Feb" },
  { v: 3, label: "Mär" },
  { v: 4, label: "Apr" },
  { v: 5, label: "Mai" },
  { v: 6, label: "Jun" },
  { v: 7, label: "Jul" },
  { v: 8, label: "Aug" },
  { v: 9, label: "Sep" },
  { v: 10, label: "Okt" },
  { v: 11, label: "Nov" },
  { v: 12, label: "Dez" },
];

function daysInMonth(m) {
  if (m === 2) return 29;
  if ([4, 6, 9, 11].includes(m)) return 30;
  return 31;
}

const INTENSITY_OPTIONS = [
  { v: 1, label: "1×/Woche" },
  { v: 2, label: "2×/Woche" },
  { v: 3, label: "3×/Woche" },
  { v: 4, label: "4×/Woche" },
  { v: 5, label: "5×/Woche" },
  { v: 6, label: "6×/Woche" },
  { v: 7, label: "Jeden Tag" }, // = 7×/Woche
];

export default function EditRoutineModal({ visible, onClose, item, type = "recurring", onSave, onDelete }) {
  const isBad = type === "bad";

  const [title, setTitle] = React.useState("");
  const [area, setArea] = React.useState(isBad ? "Wellbeing" : "Productivity");
  const [kind, setKind] = React.useState("weekly");
  const [times, setTimes] = React.useState("2");

  // ✅ BadHabits: intensity = 1..7 (x pro Woche)
  const [intensity, setIntensity] = React.useState(2);

  const [weekDays, setWeekDays] = React.useState([]);
  const [monthDays, setMonthDays] = React.useState([]);
  const [yearDates, setYearDates] = React.useState([]);

  const [yyM, setYyM] = React.useState(1);
  const [yyD, setYyD] = React.useState(1);

  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setTitle(item?.title ?? "");
    setArea(item?.area ?? (isBad ? "Wellbeing" : "Productivity"));
    setKind(item?.kind ?? "weekly");
    setTimes(String(item?.times ?? 2));

    // ✅ fallback: wenn noch alte float-values gespeichert sind (0.2..1.0)
    const rawInt = item?.intensity;
    let int2 = 2;
    if (Number.isFinite(rawInt)) {
      if (rawInt <= 1.0) {
        // alt: 0.1..1.0 -> map auf 1..7
        int2 = clamp(Math.round(rawInt * 7), 1, 7);
      } else {
        // neu: 1..7
        int2 = clamp(Math.round(rawInt), 1, 7);
      }
    }
    setIntensity(int2);

    setWeekDays(item?.weekDays ?? []);
    setMonthDays(item?.monthDays ?? []);
    setYearDates(item?.yearDates ?? []);

    setYyM(1);
    setYyD(1);

    setNote(item?.note ?? "");
  }, [item, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const maxD = daysInMonth(yyM);
    if (yyD > maxD) setYyD(maxD);
  }, [yyM]); // eslint-disable-line react-hooks/exhaustive-deps

  function save() {
    if (!title.trim()) return;

    if (isBad) {
      onSave({
        title: title.trim(),
        area,
        intensity: clamp(Number(intensity || 2), 1, 7),
        note: note?.trim() ? note : undefined,
      });
    } else {
      const patch = {
        title: title.trim(),
        area,
        kind,
        times: Number(times),
        note: note?.trim() ? note : undefined,
      };

      if (kind === "weekly") patch.weekDays = weekDays;
      if (kind === "monthly") patch.monthDays = monthDays;
      if (kind === "yearly") patch.yearDates = yearDates;

      onSave(patch);
    }

    onClose();
  }

  const addYearDate = () => {
    const m = String(clamp(Number(yyM), 1, 12)).padStart(2, "0");
    const d = String(clamp(Number(yyD), 1, 31)).padStart(2, "0");
    const v = `${m}-${d}`;
    const set = new Set(yearDates || []);
    set.add(v);
    setYearDates([...set]);
  };

  const yearlyPreview = `${String(yyD).padStart(2, "0")}.${String(yyM).padStart(2, "0")}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
          keyboardVerticalOffset={80}
        >
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={onClose} style={s.hBtn}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>

              <Text style={s.hTitle}>{isBad ? "Bad Habit bearbeiten" : "Routine bearbeiten"}</Text>

              <TouchableOpacity onPress={save} style={s.saveBtn} activeOpacity={0.85}>
                <Text style={s.saveBtnT}>Speichern</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Label>Title</Label>
              <TextInput
                style={s.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Titel…"
                placeholderTextColor="#778"
              />

              <Label>Bereich</Label>
              <Row>
                {AREAS.map((a) => (
                  <Chip key={a} active={area === a} onPress={() => setArea(a)}>
                    {a}
                  </Chip>
                ))}
              </Row>

              {!isBad && (
                <>
                  <Label>Typ</Label>
                  <Row>
                    {["daily", "weekly", "monthly", "yearly"].map((k) => (
                      <Chip key={k} active={kind === k} onPress={() => setKind(k)}>
                        {cap(k)}
                      </Chip>
                    ))}
                  </Row>

                  {kind === "weekly" && (
                    <>
                      <Label>Wochentage</Label>
                      <Row>
                        {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((lbl, idx) => (
                          <ToggleChip
                            key={idx}
                            active={(weekDays || []).includes(idx)}
                            onPress={() => {
                              const set = new Set(weekDays || []);
                              set.has(idx) ? set.delete(idx) : set.add(idx);
                              setWeekDays([...set].sort((a, b) => a - b));
                            }}
                          >
                            {lbl}
                          </ToggleChip>
                        ))}
                      </Row>

                      <Label>Häufigkeit (falls keine Tage gewählt)</Label>
                      <Num value={times} onChange={setTimes} />
                    </>
                  )}

                  {kind === "monthly" && (
                    <>
                      <Label>Monatstage (1–31)</Label>
                      <Row>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
                          <ToggleChip
                            key={n}
                            active={(monthDays || []).includes(n)}
                            onPress={() => {
                              const set = new Set(monthDays || []);
                              set.has(n) ? set.delete(n) : set.add(n);
                              setMonthDays([...set].sort((a, b) => a - b));
                            }}
                          >
                            {String(n)}
                          </ToggleChip>
                        ))}
                      </Row>

                      <Label>Häufigkeit (falls keine Tage gewählt)</Label>
                      <Num value={times} onChange={setTimes} />
                    </>
                  )}

                  {kind === "yearly" && (
                    <>
                      <View style={s.subHeaderRow}>
                        <Text style={s.subHeaderTitle}>Feste Daten</Text>
                        <View style={s.previewPill}>
                          <Text style={s.previewPillT}>{yearlyPreview}</Text>
                        </View>
                      </View>

                      <View style={s.wheelWrap}>
                        <View style={s.wheelCol}>
                          <Text style={s.wheelLabel}>Monat</Text>
                          <View style={s.wheelBox}>
                            <Picker
                              selectedValue={yyM}
                              onValueChange={(v) => setYyM(Number(v))}
                              style={s.picker}
                              dropdownIconColor={theme.text}
                            >
                              {MONTHS.map((m) => (
                                <Picker.Item key={m.v} label={m.label} value={m.v} color={theme.text} />
                              ))}
                            </Picker>
                          </View>
                        </View>

                        <View style={s.wheelCol}>
                          <Text style={s.wheelLabel}>Tag</Text>
                          <View style={s.wheelBox}>
                            <Picker
                              selectedValue={yyD}
                              onValueChange={(v) => setYyD(Number(v))}
                              style={s.picker}
                              dropdownIconColor={theme.text}
                            >
                              {Array.from({ length: daysInMonth(yyM) }, (_, i) => i + 1).map((d) => (
                                <Picker.Item key={d} label={String(d)} value={d} color={theme.text} />
                              ))}
                            </Picker>
                          </View>
                        </View>
                      </View>

                      <View style={s.addYearRow}>
                        <TouchableOpacity onPress={addYearDate} style={s.addMiniBtn} activeOpacity={0.85}>
                          <Ionicons name="add" size={18} color="#001014" />
                          <Text style={s.addMiniBtnT}>Hinzufügen</Text>
                        </TouchableOpacity>
                      </View>

                      {Array.isArray(yearDates) && yearDates.length > 0 && (
                        <View style={s.chipsWrap}>
                          {yearDates.map((v) => (
                            <ToggleChip
                              key={v}
                              active
                              onPress={() => setYearDates((yearDates || []).filter((x) => x !== v))}
                            >
                              {v} ✕
                            </ToggleChip>
                          ))}
                        </View>
                      )}

                      <Label>Häufigkeit (falls keine Daten gewählt)</Label>
                      <Num value={times} onChange={setTimes} />
                    </>
                  )}
                </>
              )}

              {isBad && (
                <>
                  <Label>Intensität</Label>
                  <View style={s.pillSelect}>
                    {INTENSITY_OPTIONS.map((o) => {
                      const active = Number(intensity) === o.v;
                      return (
                        <TouchableOpacity
                          key={o.v}
                          onPress={() => setIntensity(o.v)}
                          style={[s.pill, active && s.pillA]}
                          activeOpacity={0.85}
                        >
                          <Text style={[s.pillT, active && s.pillTA]}>{o.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Label>KI-Notiz (optional)</Label>
              <TextInput
                style={[s.input, { minHeight: 90, textAlignVertical: "top" }]}
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Kontext für spätere KI-Analyse…"
                placeholderTextColor="#778"
              />

              <TouchableOpacity onPress={onDelete} style={s.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={s.deleteT}>Löschen</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}
function Row({ children }) {
  return <View style={s.row}>{children}</View>;
}
function Chip({ active, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipA]}>
      <Text style={[s.chipT, active && s.chipTA]}>{children}</Text>
    </TouchableOpacity>
  );
}
function ToggleChip({ active, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipA]}>
      <Text style={[s.chipT, active && s.chipTA]}>{children}</Text>
    </TouchableOpacity>
  );
}
function Num({ value, onChange, decimal = false }) {
  return (
    <TextInput
      style={s.input}
      value={value}
      onChangeText={(v) => onChange(v.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, ""))}
      keyboardType={decimal ? "decimal-pad" : "number-pad"}
    />
  );
}
function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: theme.card,
    padding: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  hBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  hTitle: { color: theme.text, fontWeight: "900" },

  saveBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveBtnT: { color: "#001014", fontWeight: "900" },

  label: { color: theme.sub, marginTop: 10, marginBottom: 6, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 12,
    color: theme.text,
    backgroundColor: "#12151c",
  },

  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },

  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  chipA: { backgroundColor: theme.primary, borderColor: "rgba(0,0,0,0)" },
  chipT: { color: theme.text, fontSize: 12, fontWeight: "700" },
  chipTA: { color: "#001014", fontWeight: "900" },

  // ✅ Bad Habit intensity selector pills
  pillSelect: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  pillA: { backgroundColor: theme.primary, borderColor: "rgba(0,0,0,0)" },
  pillT: { color: theme.text, fontSize: 12, fontWeight: "700" },
  pillTA: { color: "#001014", fontWeight: "900" },

  // Yearly section header
  subHeaderRow: {
    marginTop: 10,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subHeaderTitle: { color: theme.sub, fontWeight: "800" },
  previewPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  previewPillT: { color: theme.text, fontWeight: "900", fontSize: 12 },

  // Wheels
  wheelWrap: { flexDirection: "row", gap: 12, marginTop: 4 },
  wheelCol: { flex: 1 },
  wheelLabel: { color: theme.sub, fontSize: 12, marginBottom: 6, fontWeight: "700" },
  wheelBox: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#12151c",
  },
  picker: {
    color: theme.text,
    height: Platform.OS === "ios" ? 145 : 48,
  },

  addYearRow: { marginTop: 10, marginBottom: 6, flexDirection: "row", justifyContent: "flex-start" },
  addMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.primary,
  },
  addMiniBtnT: { color: "#001014", fontWeight: "900" },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
    marginTop: 2,
  },

  deleteBtn: {
    marginTop: 14,
    backgroundColor: "#ef4444",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 13,
  },
  deleteT: { color: "#fff", fontWeight: "900" },
});
