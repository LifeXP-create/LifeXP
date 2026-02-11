// src/components/FeedbackSheet.js
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

export default function FeedbackSheet({
  visible,
  onClose,
  onPick,
  canDelete = false,
}) {
  const RowBtn = ({ icon, label, onPress, color = theme.text }) => (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={s.t}>{label}</Text>
    </TouchableOpacity>
  );
  const Chip = ({ label, onPress }) => (
    <TouchableOpacity onPress={onPress} style={s.chip}>
      <Text style={s.chipT}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.h1}>Feedback</Text>

          <RowBtn
            icon="thumbs-up-outline"
            label="Hat mir gefallen"
            onPress={() => {
              onPick("like");
              onClose();
            }}
          />
          <RowBtn
            icon="fitness-outline"
            label="War zu schwer"
            onPress={() => {
              onPick("hard");
              onClose();
            }}
          />
          <RowBtn
            icon="eye-off-outline"
            label="Irrelevant"
            onPress={() => {
              onPick("irrelevant");
              onClose();
            }}
          />

          <View style={{ marginTop: 8 }}>
            <RowBtn
              icon="repeat-outline"
              label="Zu To-Do hinzufügen:"
              onPress={() => {}}
            />
            <View style={s.chipsRow}>
              {["daily", "weekly", "monthly", "yearly"].map((k) => (
                <Chip
                  key={k}
                  label={cap(k)}
                  onPress={() => {
                    onPick({ action: "to_routine", kind: k });
                    onClose();
                  }}
                />
              ))}
            </View>
          </View>

          {canDelete && (
            <RowBtn
              icon="trash-outline"
              label="Quest entfernen"
              color="#ef4444"
              onPress={() => {
                onPick("delete");
                onClose();
              }}
            />
          )}

          <TouchableOpacity style={s.cancel} onPress={onClose}>
            <Text style={s.cancelT}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: theme.card,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  h1: { color: theme.text, fontWeight: "800", fontSize: 16, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  t: { color: theme.text, fontSize: 15 },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
    marginLeft: 30,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipT: { color: theme.text, fontSize: 12 },
  cancel: { alignSelf: "center", marginTop: 6, opacity: 0.9 },
  cancelT: { color: theme.sub },
});
