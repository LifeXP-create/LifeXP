// src/components/EditEventModal.js
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
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { theme } from "../theme";

const pad = (n) => String(n).padStart(2, "0");
const isISODate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

function isoToDate(iso) {
  const [Y, M, D] = String(iso).split("-").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setFullYear(Y, (M || 1) - 1, D || 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

function timeStrToDate(timeStr) {
  const [h, m] = String(timeStr || "09:00").split(":").map((x) => parseInt(x, 10));
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function dateToTimeStr(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function clampEndAfterStart(startStr, endStr) {
  const s = timeStrToDate(startStr);
  const e = timeStrToDate(endStr);
  if (e.getTime() <= s.getTime()) {
    const fix = new Date(s);
    fix.setMinutes(fix.getMinutes() + 30);
    return dateToTimeStr(fix);
  }
  return endStr;
}

export default function EditEventModal({ visible, onClose, initDateISO, item, onSave, onDelete }) {
  const editing = !!item;
  const isIOS = Platform.OS === "ios";

  const [title, setTitle] = React.useState("");
  const [dateISO, setDateISO] = React.useState(isISODate(initDateISO) ? initDateISO : "");
  const [location, setLocation] = React.useState("");
  const [note, setNote] = React.useState("");

  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");

  // null | "date" | "start" | "end"
  const [picker, setPicker] = React.useState(null);

  React.useEffect(() => {
    setTitle(item?.title ?? "");
    setDateISO(isISODate(item?.dateISO) ? item.dateISO : isISODate(initDateISO) ? initDateISO : "");
    setLocation(item?.location ?? "");
    setNote(item?.note ?? "");
    setStartTime(item?.start ?? "09:00");
    setEndTime(item?.end ?? "10:00");
    setPicker(null);
  }, [item, initDateISO, visible]);

  function save() {
    const t = title.trim();
    if (!t) return;
    if (!isISODate(dateISO)) return;

    const endFixed = clampEndAfterStart(startTime, endTime);

    onSave({
      title: t,
      dateISO,
      start: startTime,
      end: endFixed,
      location: location?.trim() ? location.trim() : undefined,
      note: note?.trim() ? note.trim() : undefined,
    });
    onClose();
  }

  function setISOFromDate(d) {
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    setDateISO(`${y}-${m}-${dd}`);
  }

  const dateValue = React.useMemo(() => (isISODate(dateISO) ? isoToDate(dateISO) : new Date()), [dateISO]);
  const startValue = React.useMemo(() => timeStrToDate(startTime), [startTime]);
  const endValue = React.useMemo(() => timeStrToDate(endTime), [endTime]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={isIOS ? "padding" : "height"} style={s.kb} keyboardVerticalOffset={80}>
        <View style={s.sheet}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.hBtn}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>

            <Text style={s.hTitle}>{editing ? "Termin bearbeiten" : "Termin erstellen"}</Text>

            <TouchableOpacity onPress={save} style={s.saveBtn} activeOpacity={0.85}>
              <Text style={s.saveBtnT}>Speichern</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollbar weg: indicator off */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 18 }}
          >
            <Label>Titel</Label>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="z.B. Zahnarzt"
              placeholderTextColor="#778"
              returnKeyType="done"
            />

            <Label>Datum</Label>
            <TouchableOpacity onPress={() => setPicker("date")} style={[s.input, s.rowBtn]} activeOpacity={0.85}>
              <Text style={s.rowBtnText}>{isISODate(dateISO) ? dateISO : "Datum wählen…"}</Text>
              <Ionicons name="calendar-outline" size={18} color={theme.sub} />
            </TouchableOpacity>

            <Label>Zeit</Label>
            <View style={s.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.subLabel}>Start</Text>
                <TouchableOpacity onPress={() => setPicker("start")} style={[s.input, s.rowBtn]} activeOpacity={0.85}>
                  <Text style={s.timeText}>{startTime}</Text>
                  <Ionicons name="time-outline" size={18} color={theme.sub} />
                </TouchableOpacity>
              </View>

              <View style={{ width: 10 }} />

              <View style={{ flex: 1 }}>
                <Text style={s.subLabel}>Ende</Text>
                <TouchableOpacity onPress={() => setPicker("end")} style={[s.input, s.rowBtn]} activeOpacity={0.85}>
                  <Text style={s.timeText}>{endTime}</Text>
                  <Ionicons name="time-outline" size={18} color={theme.sub} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Picker bleibt offen bis "Fertig" (oder ausserhalb klicken). NICHT mehr auto-close beim Drehen. */}
            {!!picker && (
              <View style={s.pickerWrap}>
                <DateTimePicker
                  value={picker === "date" ? dateValue : picker === "start" ? startValue : endValue}
                  mode={picker === "date" ? "date" : "time"}
                  display={picker === "date" ? (isIOS ? "inline" : "default") : isIOS ? "spinner" : "default"}
                  minuteInterval={1}
                  onChange={(e, d) => {
                    if (!d) return;

                    // Android: "default" ist Dialog -> darf nach Auswahl schliessen.
                    if (!isIOS && (e?.type === "dismissed" || e?.type === "set")) {
                      if (e.type === "dismissed") {
                        setPicker(null);
                        return;
                      }
                    }

                    if (picker === "date") {
                      setISOFromDate(d);
                      if (!isIOS) setPicker(null);
                      return;
                    }

                    const t = dateToTimeStr(d);

                    if (picker === "start") {
                      setStartTime(t);
                      setEndTime((prev) => clampEndAfterStart(t, prev));
                      // iOS: NICHT schliessen
                      if (!isIOS) setPicker(null);
                      return;
                    }

                    if (picker === "end") {
                      setEndTime(() => clampEndAfterStart(startTime, t));
                      // iOS: NICHT schliessen
                      if (!isIOS) setPicker(null);
                      return;
                    }
                  }}
                />

                {/* iOS: einziges Closing */}
                {isIOS && (
                  <TouchableOpacity onPress={() => setPicker(null)} style={s.doneBtn} activeOpacity={0.85}>
                    <Text style={s.doneBtnT}>Fertig</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Label>Ort (optional)</Label>
            <TextInput
              style={s.input}
              value={location}
              onChangeText={setLocation}
              placeholder="z.B. Burgdorf"
              placeholderTextColor="#778"
            />

            <Label>Notiz (optional)</Label>
            <TextInput
              style={[s.input, { minHeight: 90, textAlignVertical: "top" }]}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Details…"
              placeholderTextColor="#778"
            />

            {editing && (
              <TouchableOpacity onPress={onDelete} style={s.deleteBtn} activeOpacity={0.9}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={s.deleteT}>Löschen</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  kb: { flex: 1, justifyContent: "flex-end" },

  sheet: {
    backgroundColor: theme.card,
    padding: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  hBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  hTitle: { color: theme.text, fontWeight: "900" },

  saveBtn: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  saveBtnT: { color: "#001014", fontWeight: "900" },

  label: { color: theme.sub, marginTop: 10, marginBottom: 6, fontWeight: "700" },
  subLabel: { color: theme.sub, fontSize: 12, marginBottom: 6, fontWeight: "700", opacity: 0.9 },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 12,
    color: theme.text,
    backgroundColor: "#12151c",
  },

  rowBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowBtnText: { color: theme.text, fontWeight: "800" },
  timeText: { color: theme.text, fontWeight: "900", fontSize: 18 },

  timeRow: { flexDirection: "row", alignItems: "flex-start" },

  pickerWrap: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#0b0f16",
    padding: 8,
    overflow: "hidden",
  },

  doneBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  doneBtnT: { color: theme.text, fontWeight: "900" },

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
