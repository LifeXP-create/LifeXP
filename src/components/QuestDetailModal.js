// src/components/QuestDetailModal.js
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { theme } from "../theme";

const LIFE_GREEN = "#22c55e";

export default function QuestDetailModal({
  visible,
  onClose,
  quest,
  onMarkDone,
  onMore, // öffnet dein Feedback/More Sheet
  onAskHelp, // (action) => void
}) {
  const ai = quest?.ai || {};
  const help = ai.help || {};
  const loading = ai.loading || {};
  const error = ai.error || {};

  const blocks = useMemo(() => {
    const out = [];

    if (help.explain?.text)
      out.push({ title: "Erklärung", text: help.explain.text });
    if (help.steps?.steps?.length)
      out.push({ title: "Schritte", steps: help.steps.steps });
    if (help.easier?.text)
      out.push({ title: "Leichter", text: help.easier.text });
    if (help.harder?.text)
      out.push({ title: "Schwieriger", text: help.harder.text });

    return out;
  }, [help]);

  if (!quest) return null;

  const Btn = ({ label, icon, action }) => {
    const busy = !!loading[action];
    return (
      <TouchableOpacity
        style={s.smallBtn}
        onPress={() => onAskHelp?.(action)}
        activeOpacity={0.85}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Ionicons name={icon} size={18} color={theme.text} />
        )}
        <Text style={s.smallBtnT}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{quest.title}</Text>
              <Text style={s.sub}>{quest.area || "Quest"}</Text>
            </View>

            <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.sub} />
            </TouchableOpacity>
          </View>

          <View style={s.btnRow}>
            <Btn label="Erklären" icon="help-circle-outline" action="explain" />
            <Btn label="Schritte" icon="list-outline" action="steps" />
            <Btn
              label="Leichter"
              icon="arrow-down-circle-outline"
              action="easier"
            />
            <Btn
              label="Schwieriger"
              icon="arrow-up-circle-outline"
              action="harder"
            />
          </View>

          {!!error.explain ||
          !!error.steps ||
          !!error.easier ||
          !!error.harder ? (
            <Text style={s.err}>
              KI-Fehler:{" "}
              {error.explain || error.steps || error.easier || error.harder}
            </Text>
          ) : null}

          {blocks.length ? (
            <View style={s.blocks}>
              {blocks.map((b) => (
                <View key={b.title} style={s.block}>
                  <Text style={s.blockH}>{b.title}</Text>
                  {b.steps ? (
                    b.steps.map((st, i) => (
                      <Text key={i} style={s.blockT}>
                        {i + 1}. {st}
                      </Text>
                    ))
                  ) : (
                    <Text style={s.blockT}>{b.text}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={s.hint}>
              Tipp: Drück auf „Erklären“ oder „Schritte“, wenn dir die Quest
              nicht klar ist.
            </Text>
          )}

          <View style={s.bottomRow}>
            <TouchableOpacity
              style={s.moreBtn}
              onPress={onMore}
              activeOpacity={0.9}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={theme.text}
              />
              <Text style={s.moreT}>Mehr</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.doneBtn, quest.done && { opacity: 0.5 }]}
              onPress={onMarkDone}
              disabled={quest.done}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark" size={18} color="#001014" />
              <Text style={s.doneT}>Als erledigt markieren</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // ~3/4 Höhe
  sheet: {
    height: "75%",
    backgroundColor: theme.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },

  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sub: { color: theme.sub, marginTop: 6, fontWeight: "800" },

  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  smallBtnT: { color: theme.text, fontWeight: "900" },

  err: { color: "#ef4444", marginTop: 10, fontWeight: "800" },
  hint: { color: theme.sub, marginTop: 12, fontWeight: "800", opacity: 0.9 },

  blocks: { marginTop: 12, gap: 10 },
  block: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  blockH: { color: theme.text, fontWeight: "900", marginBottom: 6 },
  blockT: {
    color: theme.text,
    fontWeight: "700",
    lineHeight: 20,
    opacity: 0.95,
  },

  bottomRow: { flexDirection: "row", gap: 10, marginTop: "auto" },

  moreBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  moreT: { color: theme.text, fontWeight: "900" },

  doneBtn: {
    flex: 2,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: LIFE_GREEN,
  },
  doneT: { color: "#001014", fontWeight: "900" },
});
