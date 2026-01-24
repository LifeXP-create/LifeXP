import React from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

const pad = n => String(n).padStart(2, "0");
const sanitizeTime = (t) => {
  const m = String(t || "").match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return "08:00";
  const hh = pad(Math.max(0, Math.min(23, Number(m[1]))));
  const mm = pad(Math.max(0, Math.min(59, Number(m[2]))));
  return `${hh}:${mm}`;
};

export default function AddEventModal({ visible, onClose, dateISO, onCreate }) {
  const [title, setTitle] = React.useState("");
  const [dISO, setDISO] = React.useState(dateISO);
  const [start, setStart] = React.useState("08:00");
  const [end, setEnd] = React.useState("09:00");
  const [location, setLocation] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    setTitle("");
    setDISO(dateISO);
    setStart("08:00");
    setEnd("09:00");
    setLocation("");
    setNote("");
  }, [visible, dateISO]);

  function create() {
    if (!title.trim() || !dISO) return;
    onCreate({
      title: title.trim(),
      dateISO: dISO,
      start: sanitizeTime(start),
      end: sanitizeTime(end),
      location: location.trim() || undefined,
      note: note.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }} keyboardVerticalOffset={80}>
          <View style={s.sheet}>
            <View style={s.header}>
              <TouchableOpacity onPress={onClose} style={s.hBtn}><Ionicons name="close" size={20} color={theme.text} /></TouchableOpacity>
              <Text style={s.hTitle}>Termin hinzufügen</Text>
              <TouchableOpacity onPress={create} style={[s.hBtn, s.primary]}><Text style={s.primaryT}>Speichern</Text></TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Label>Titel</Label>
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="z. B. Mathe Nachhilfe" placeholderTextColor="#778" />

              <Label>Datum (YYYY-MM-DD)</Label>
              <TextInput style={s.input} value={dISO} onChangeText={setDISO} placeholder="2025-10-31" placeholderTextColor="#778" />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Label>Start (HH:MM)</Label>
                  <TextInput style={s.input} value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" placeholder="08:00" placeholderTextColor="#778" />
                </View>
                <View style={{ flex: 1 }}>
                  <Label>Ende (HH:MM)</Label>
                  <TextInput style={s.input} value={end} onChangeText={setEnd} keyboardType="numbers-and-punctuation" placeholder="09:00" placeholderTextColor="#778" />
                </View>
              </View>

              <Label>Ort</Label>
              <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="z. B. Zimmer 302" placeholderTextColor="#778" />

              <Label>Notiz</Label>
              <TextInput style={[s.input, { minHeight: 80, textAlignVertical: "top" }]} multiline value={note} onChangeText={setNote} placeholder="Details…" placeholderTextColor="#778" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Label({ children }) { return <Text style={s.label}>{children}</Text>; }

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: theme.card, padding: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  hBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  hTitle: { color: theme.text, fontWeight: "800" },
  primary: { backgroundColor: theme.primary, borderRadius: 8, paddingHorizontal: 10 },
  primaryT: { color: "#001014", fontWeight: "800" },
  label: { color: theme.sub, marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 10, color: theme.text, backgroundColor: "#12151c" },
});
