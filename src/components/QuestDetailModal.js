// src/components/QuestDetailModal.js
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useApp } from "../context/AppState";
import { theme } from "../theme";
import FeedbackSheet from "./FeedbackSheet";

const LIFE_GREEN = "#22c55e";
const INFO_BLUE = "#38bdf8";
const WELL_TURQ = "#14b8a6";

const AREA_COLOR = {
  Body: LIFE_GREEN,
  Mind: "#a78bfa",
  Social: "#9ca3af",
  Productivity: "#fbbf24",
  Wellbeing: WELL_TURQ,
  Erinnerung: INFO_BLUE,
};

function mmss(totalSec) {
  const s = Math.max(0, Math.floor(Number(totalSec) || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function storageKey(questId) {
  return `quest_detail_v1:${questId}`;
}

export default function QuestDetailModal({
  visible,
  onClose,
  quest,
  type = "daily", // "daily" | "quick" | "recurring"
  onComplete, // (questId) => void
  onRate, // (questId, actionOrObj) => void
  canDelete = true,
}) {
  const app = useApp();
  const requestQuestHelp =
    typeof app?.requestQuestHelp === "function" ? app.requestQuestHelp : null;

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // ---- Notes + Timer (persisted per quest) ----
  const [notes, setNotes] = useState("");
  const [timerSec, setTimerSec] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);
  const saveDebounceRef = useRef(null);

  const qid = quest?.id ? String(quest.id) : null;

  const stripe = AREA_COLOR[quest?.area] || LIFE_GREEN;
  const title = String(quest?.title || "").trim();
  const area = String(quest?.area || "").trim();

  const ai = quest?.ai || {};
  const help = ai?.help || {};
  const loading = ai?.loading || {};
  const error = ai?.error || {};

  const hasAnyHelp = useMemo(() => {
    return (
      !!help?.explain?.text ||
      !!help?.steps?.text ||
      (Array.isArray(help?.steps?.steps) && help?.steps?.steps.length > 0) ||
      !!help?.easier?.text ||
      !!help?.harder?.text
    );
  }, [help]);

  // Load persisted state when opening / quest changes
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!qid) return;
      try {
        const raw = await AsyncStorage.getItem(storageKey(qid));
        if (!raw) {
          if (!cancelled) {
            setNotes("");
            setTimerSec(0);
            setRunning(false);
          }
          return;
        }
        const obj = JSON.parse(raw);
        if (!cancelled) {
          setNotes(typeof obj?.notes === "string" ? obj.notes : "");
          setTimerSec(Number.isFinite(obj?.timerSec) ? obj.timerSec : 0);
          setRunning(false); // nie automatisch weiterlaufen nach reopen
        }
      } catch {
        if (!cancelled) {
          setNotes("");
          setTimerSec(0);
          setRunning(false);
        }
      }
    }

    if (visible) load();

    return () => {
      cancelled = true;
    };
  }, [qid, visible]);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => {
      setTimerSec((s) => s + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running]);

  // Persist notes/timer (debounced)
  useEffect(() => {
    if (!qid || !visible) return;

    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const payload = JSON.stringify({ notes, timerSec });
        await AsyncStorage.setItem(storageKey(qid), payload);
      } catch {}
    }, 250);

    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [notes, timerSec, qid, visible]);

  const ask = async (action) => {
    if (!requestQuestHelp || !qid) return;
    await requestQuestHelp(qid, action);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimerSec(0);
  };

  const closeAll = () => {
    setRunning(false);
    onClose?.();
  };

  return (
    <Modal
      visible={!!visible}
      transparent={false}
      animationType="slide"
      onRequestClose={closeAll}
    >
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.header}>
          <View style={[s.stripe, { backgroundColor: stripe }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.hArea}>{area || "Quest"}</Text>
            <Text style={s.hTitle} numberOfLines={2}>
              {title || "—"}
            </Text>
          </View>

          <TouchableOpacity onPress={closeAll} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Body (scrollable) */}
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator
        >
          {/* 1) Details */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Details</Text>
            <Text style={s.p}>{title || "—"}</Text>

            {!!area ? (
              <Text style={s.meta}>
                Bereich: <Text style={s.metaStrong}>{area}</Text>
              </Text>
            ) : null}
          </View>

          {/* 2) KI Hilfe */}
          <View style={s.card}>
            <Text style={s.cardTitle}>KI-Hilfe</Text>
            <Text style={s.small}>
              Wenn die Quest unklar ist: Erklärung/Schritte oder
              einfacher/schwerer.
            </Text>

            <View style={s.row}>
              <ActionBtn
                label={loading.explain ? "Erklären…" : "Erklären"}
                icon="help-circle-outline"
                onPress={() => ask("explain")}
                disabled={!requestQuestHelp || !!loading.explain}
              />
              <ActionBtn
                label={loading.steps ? "Schritte…" : "Schritte"}
                icon="list-outline"
                onPress={() => ask("steps")}
                disabled={!requestQuestHelp || !!loading.steps}
              />
            </View>

            <View style={s.row}>
              <ActionBtn
                label={loading.easier ? "Einfacher…" : "Einfacher"}
                icon="remove-circle-outline"
                onPress={() => ask("easier")}
                disabled={!requestQuestHelp || !!loading.easier}
              />
              <ActionBtn
                label={loading.harder ? "Schwerer…" : "Schwerer"}
                icon="add-circle-outline"
                onPress={() => ask("harder")}
                disabled={!requestQuestHelp || !!loading.harder}
              />
            </View>

            {(error.explain || error.steps || error.easier || error.harder) && (
              <View style={s.errBox}>
                <Text style={s.errTitle}>KI konnte nicht helfen</Text>
                <Text style={s.errText}>
                  {String(
                    error.explain ||
                      error.steps ||
                      error.easier ||
                      error.harder,
                  ).slice(0, 240)}
                </Text>
              </View>
            )}

            {hasAnyHelp ? (
              <View style={{ marginTop: 10 }}>
                {help?.explain?.text ? (
                  <Block title="Erklärung" text={help.explain.text} />
                ) : null}

                {help?.steps?.text || (help?.steps?.steps || []).length ? (
                  <View style={s.block}>
                    <Text style={s.blockTitle}>Schritte</Text>
                    {help?.steps?.text ? (
                      <Text style={s.blockText}>{help.steps.text}</Text>
                    ) : null}
                    {(help?.steps?.steps || []).map((st, idx) => (
                      <Text key={idx} style={s.step}>
                        {idx + 1}. {st}
                      </Text>
                    ))}
                  </View>
                ) : null}

                {help?.easier?.text ? (
                  <Block title="Einfachere Version" text={help.easier.text} />
                ) : null}

                {help?.harder?.text ? (
                  <Block title="Schwierigere Version" text={help.harder.text} />
                ) : null}
              </View>
            ) : null}
          </View>

          {/* 3) Notes */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Notizen</Text>
            <Text style={s.small}>
              Schreib hier rein, was du gemacht hast, Probleme, Ergebnis, etc.
              Wird pro Quest gespeichert.
            </Text>

            <View style={s.noteBox}>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notizen…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                style={s.noteInput}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* 4) Timer */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Timer</Text>

            <View style={s.timerRow}>
              <Text style={s.timerValue}>{mmss(timerSec)}</Text>

              <View style={s.timerBtns}>
                <TouchableOpacity
                  style={[s.tbtn, running && s.tbtnActive]}
                  onPress={() => setRunning((r) => !r)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={running ? "pause" : "play"}
                    size={18}
                    color={running ? "#001014" : theme.text}
                  />
                  <Text style={[s.tbtnT, running && s.tbtnTActive]}>
                    {running ? "Pause" : "Start"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.tbtnGhost}
                  onPress={resetTimer}
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={18} color={theme.text} />
                  <Text style={s.tbtnTG}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={s.small}>
              Tipp: Starte den Timer, wenn du die Quest wirklich machst. Das ist
              später gutes Training-Data.
            </Text>
          </View>

          <View style={{ height: 14 }} />
        </ScrollView>

        {/* Footer (NOT scrollable) */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.btn, s.btnDone]}
            onPress={() => qid && onComplete?.(qid)}
            activeOpacity={0.9}
          >
            <Ionicons name="checkmark" size={18} color="#001014" />
            <Text style={s.btnDoneText}>Als erledigt markieren</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.btnMore]}
            onPress={() => setFeedbackOpen(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.text} />
            <Text style={s.btnMoreText}>Mehr</Text>
          </TouchableOpacity>
        </View>

        <FeedbackSheet
          visible={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          canDelete={!!canDelete}
          onPick={(pick) => {
            setFeedbackOpen(false);
            if (!qid) return;

            if (typeof pick === "string") {
              onRate?.(qid, pick);
              return;
            }
            if (
              pick &&
              typeof pick === "object" &&
              pick.action === "to_routine"
            ) {
              onRate?.(qid, pick);
              return;
            }
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function ActionBtn({ label, icon, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[s.actionBtn, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={18} color={theme.text} />
      <Text style={s.actionBtnT}>{label}</Text>
    </TouchableOpacity>
  );
}

function Block({ title, text }) {
  return (
    <View style={s.block}>
      <Text style={s.blockTitle}>{title}</Text>
      <Text style={s.blockText}>{String(text || "").trim()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },

  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  stripe: { width: 4, height: 44, borderRadius: 999 },

  hArea: { color: theme.sub, fontWeight: "900", fontSize: 12, opacity: 0.9 },
  hTitle: {
    color: theme.text,
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 12,
  },

  cardTitle: { color: theme.text, fontWeight: "900", fontSize: 16 },
  p: { color: theme.text, marginTop: 10, fontSize: 16, fontWeight: "800" },

  meta: { color: theme.sub, marginTop: 10, fontWeight: "800" },
  metaStrong: { color: theme.text, fontWeight: "900" },

  small: { color: theme.sub, marginTop: 8, fontWeight: "700", lineHeight: 18 },

  // Timer
  timerRow: { marginTop: 12, gap: 10 },
  timerValue: {
    color: theme.text,
    fontWeight: "900",
    fontSize: 36,
    letterSpacing: 0.4,
  },
  timerBtns: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  tbtn: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tbtnActive: { backgroundColor: LIFE_GREEN, borderColor: "rgba(0,0,0,0)" },
  tbtnT: { color: theme.text, fontWeight: "900" },
  tbtnTActive: { color: "#001014" },

  tbtnGhost: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tbtnTG: { color: theme.text, fontWeight: "900" },

  // Notes
  noteBox: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  noteInput: {
    minHeight: 140,
    padding: 12,
    color: theme.text,
    fontWeight: "700",
    lineHeight: 20,
  },

  // KI Buttons
  row: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  actionBtn: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  actionBtnT: { color: theme.text, fontWeight: "900", fontSize: 13 },

  // KI Blocks
  block: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  blockTitle: { color: theme.text, fontWeight: "900", marginBottom: 6 },
  blockText: { color: theme.text, fontWeight: "700", lineHeight: 20 },
  step: { color: theme.text, fontWeight: "700", marginTop: 6, lineHeight: 20 },

  // KI Error
  errBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(239,68,68,0.10)",
  },
  errTitle: { color: "rgba(255,255,255,0.98)", fontWeight: "900" },
  errText: { color: "rgba(239,68,68,0.95)", marginTop: 6, fontWeight: "800" },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: theme.bg,
    flexDirection: "row",
    gap: 10,
  },

  btn: {
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },

  btnDone: { flex: 1, backgroundColor: LIFE_GREEN },
  btnDoneText: { color: "#001014", fontWeight: "900" },

  btnMore: {
    width: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  btnMoreText: { color: theme.text, fontWeight: "900" },
});
