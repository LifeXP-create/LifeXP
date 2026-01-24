// src/screens/QuestsScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Platform,
  TextInput,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useApp, requiredXPForLevel } from "../context/AppState";
import { theme } from "../theme";

const LIFE_GREEN = "#22c55e";
const INFO_BLUE = "#38bdf8";
const WELL_TURQ = "#14b8a6";
const BAD_RED = "#ef4444";
const BAD_AMBER = "#f97316";

const AREA_COLOR = {
  Body: LIFE_GREEN,
  Mind: "#a78bfa",
  Social: "#9ca3af",
  Productivity: "#fbbf24",
  Wellbeing: WELL_TURQ,
  Erinnerung: INFO_BLUE,
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toLocalISODate(d) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

function addDaysLocalISO(baseISO, days) {
  const d = new Date(`${baseISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function formatDE(dateISO) {
  if (!dateISO || typeof dateISO !== "string" || dateISO.length < 10) return "";
  const y = dateISO.slice(0, 4);
  const m = dateISO.slice(5, 7);
  const d = dateISO.slice(8, 10);
  return `${d}.${m}.${y}`;
}

function freqLabelFromDueKind(dueKind) {
  if (dueKind === "badhabit" || dueKind === "bad_habit") return "Verzicht · Heute";
  if (dueKind === "weekly_fixed") return "Fix · Woche";
  if (dueKind === "weekly_quota") return "Woche";
  if (dueKind === "monthly_fixed") return "Fix · Monat";
  if (dueKind === "monthly_quota") return "Monat";
  if (dueKind === "yearly_fixed") return "Fix · Jahr";
  if (dueKind === "yearly_quota") return "Jahr";
  if (dueKind === "daily") return "Täglich";
  return "Routine";
}

function progressLabel(item) {
  const times = Math.max(1, Number(item?.times || 1));

  if (
    item?._dueKind === "weekly_quota" ||
    item?._dueKind === "monthly_quota" ||
    item?._dueKind === "yearly_quota"
  ) {
    const remaining = Math.max(0, Number(item?._remaining ?? times));
    const done = Math.max(0, Math.min(times, times - remaining));
    return `${done}/${times}`;
  }

  if (item?._dueKind === "daily") return "Heute";
  if (item?._dueKind?.includes("_fixed")) return "Heute";
  if (item?._dueKind === "badhabit" || item?._dueKind === "bad_habit") return "Heute";
  return "";
}

function Chip({ active, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipA]} activeOpacity={0.85}>
      <Text style={[s.chipT, active && s.chipTA]}>{children}</Text>
    </TouchableOpacity>
  );
}

function normalizeBadHabitTitle(title) {
  const t = String(title || "").trim();
  return t.replace(/^(don['’]?t|dont)\s*do\s*:\s*/i, "").trim();
}

export default function QuestsScreen() {
  const app = useApp();
  const {
    quests,

    quickQuests,
    addQuickQuest,
    completeQuickQuest,
    removeQuickQuest,

    recurring,
    getDueRecurringForDate,
    completeRecurringForToday,
    removeRecurring,

    addRecurring,

    completeBadHabitForToday,
    removeBadHabit,

    completeQuest,
    rateQuest,

    profile,
    streak,
  } = app;

  const [selected, setSelected] = useState(null);

  const [qqText, setQqText] = useState("");

  const [qqDueDateISO, setQqDueDateISO] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [adoptOpen, setAdoptOpen] = useState(false);
  const [adoptQuestId, setAdoptQuestId] = useState(null);
  const [adoptKind, setAdoptKind] = useState("daily");
  const [adoptTimes, setAdoptTimes] = useState("1");
  const [adoptWeekDays, setAdoptWeekDays] = useState([]);

  const closeFeedback = () => setSelected(null);

  const lvl = Math.max(1, profile?.level || 1);
  const xp = Math.max(0, profile?.xp || 0);
  const req = Math.max(1, requiredXPForLevel(lvl));
  const progress = Math.min(1, xp / req);
  const xpLabel = useMemo(() => `${xp}/${req} XP`, [xp, req]);

  // ✅ Filter-Regel:
  // - Manuell erstellte Erinnerungen (fromEvent !== true) => IMMER anzeigen
  // - Kalender-Erinnerungen (fromEvent === true) => NUR heute + morgen
  const filteredQuickQuests = useMemo(() => {
    const todayLocal = toLocalISODate(new Date());
    const tomorrowLocal = addDaysLocalISO(todayLocal, 1);

    return (quickQuests || []).filter((q) => {
      if (q?.fromEvent) {
        return q?.dueDateISO === todayLocal || q?.dueDateISO === tomorrowLocal;
      }
      return true; // manuell: datum egal
    });
  }, [quickQuests]);

  const submitQuickQuest = () => {
    const t = qqText.trim();
    if (!t) return;

    // ✅ manuell (datum kann gesetzt sein, aber ist fürs Anzeigen egal)
    addQuickQuest(t, "Erinnerung", qqDueDateISO, "manual");

    setQqText("");
    setQqDueDateISO(null);
  };

  const dueRecurring = useMemo(() => {
    if (typeof getDueRecurringForDate !== "function") return [];
    const today = new Date().toISOString().slice(0, 10);
    return getDueRecurringForDate(today);
  }, [getDueRecurringForDate, recurring]);

  const openAdoptFromDailyQuest = (questId) => {
    setAdoptQuestId(questId);
    setAdoptKind("daily");
    setAdoptTimes("1");
    setAdoptWeekDays([]);
    setAdoptOpen(true);
  };

  const confirmAdopt = () => {
    if (typeof addRecurring !== "function") {
      setAdoptOpen(false);
      return;
    }

    const q = (quests || []).find((x) => x.id === adoptQuestId);
    if (!q?.title) {
      setAdoptOpen(false);
      return;
    }

    const kind = adoptKind;
    const timesNum = clamp(Number(adoptTimes || 1), 1, 14);

    const payload = {
      title: q.title,
      kind,
      area: q.area || "Productivity",
      difficulty: q.difficulty ?? 2,
      times: kind === "daily" ? 1 : timesNum,
    };

    if (kind === "weekly" && adoptWeekDays.length) payload.weekDays = adoptWeekDays;

    addRecurring(payload);
    setAdoptOpen(false);
  };

  const renderDailyItem = ({ item }) => {
    const done = !!item.done;
    const stripe = AREA_COLOR[item.area] || LIFE_GREEN;

    return (
      <View style={[s.card, done && s.cardDone]}>
        <View style={[s.stripe, { backgroundColor: stripe }]} />

        <View style={s.cardLeft}>
          <Text style={[s.title, done && s.titleDone]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.sub, done && s.subDone]} numberOfLines={1}>
            {item.area}
          </Text>
        </View>

        <View style={s.cardRight}>
          <TouchableOpacity style={s.checkBtn} onPress={() => !done && completeQuest(item.id)} activeOpacity={0.8}>
            {done ? <Ionicons name="checkmark" size={18} color={LIFE_GREEN} /> : <View style={s.circleOpen} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => setSelected({ id: item.id, type: "daily" })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.sub} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuickItem = ({ item }) => {
    const todayLocal = toLocalISODate(new Date());
    const urgent = !!item?.dueDateISO && item.dueDateISO === todayLocal;

    const stripe = urgent ? BAD_RED : AREA_COLOR[item.area] || INFO_BLUE;

    const subLine = `${item.area || "Erinnerung"}${item.dueDateISO ? ` | ${formatDE(item.dueDateISO)}` : ""}`;

    return (
      <View style={[s.card, urgent && s.cardUrgent]}>
        <View style={[s.stripe, { backgroundColor: stripe }]} />

        <View style={s.cardLeft}>
          <Text style={[s.title, urgent && s.titleUrgent]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.sub, urgent && s.subUrgent]} numberOfLines={1}>
            {subLine}
          </Text>
        </View>

        <View style={s.cardRight}>
          <TouchableOpacity style={s.checkBtn} onPress={() => completeQuickQuest(item.id)} activeOpacity={0.8}>
            <View style={[s.circleOpen, urgent && s.circleUrgent]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => setSelected({ id: item.id, type: "quick" })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.sub} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderRecurringItem = ({ item }) => {
    const area = item?._area || item?.area || "Productivity";
    const isBadHabit = item?._dueKind === "badhabit" || item?._dueKind === "bad_habit";

    const stripe = isBadHabit ? BAD_AMBER : AREA_COLOR[area] || LIFE_GREEN;

    const freq = freqLabelFromDueKind(item?._dueKind);
    const prog = progressLabel(item);
    const metaRight = prog ? `${freq} · ${prog}` : `${freq}`;
    const subLine = `${area} · ${metaRight}`;

    const cleanTitle = isBadHabit ? normalizeBadHabitTitle(item.title) : item.title;
    const shownTitle = isBadHabit ? `Don't do: ${cleanTitle}` : cleanTitle;

    return (
      <View style={[s.card, isBadHabit && s.cardBad]}>
        <View style={[s.stripe, { backgroundColor: stripe }]} />

        <View style={s.cardLeft}>
          <Text style={[s.title, isBadHabit && s.titleBad]} numberOfLines={1}>
            {shownTitle}
          </Text>

          <Text style={[s.sub, isBadHabit && s.subBad]} numberOfLines={1}>
            {subLine}
          </Text>
        </View>

        <View style={s.cardRight}>
          <TouchableOpacity
            style={s.checkBtn}
            onPress={() => (isBadHabit ? completeBadHabitForToday(item.id) : completeRecurringForToday(item.id))}
            activeOpacity={0.8}
          >
            {isBadHabit ? (
              <Ionicons name="shield-checkmark-outline" size={20} color={BAD_AMBER} />
            ) : (
              <View style={s.circleOpen} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.menuBtn}
            onPress={() => setSelected({ id: item.id, type: "recurring", dueKind: item?._dueKind })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.sub} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListHeader = (
    <View>
      <View style={s.headerCard}>
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>
            <Text style={s.green}>Level {lvl}</Text>
            <Text style={s.dot}> • </Text>
            <Text style={s.green}>Streak {streak}</Text>
          </Text>

          <View style={s.xpPill}>
            <Text style={s.xpPillText}>{xpLabel}</Text>
          </View>
        </View>

        <View style={s.barOuter}>
          <View style={[s.barInner, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.sectionTitle}>Erinnerungen</Text>
        <View style={s.sectionLine} />
      </View>

      <View style={s.quickRow}>
        <View style={s.quickInputWrap}>
          <TextInput
            value={qqText}
            onChangeText={setQqText}
            placeholder="Quest hinzufügen..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={s.quickInput}
            returnKeyType="done"
            onSubmitEditing={submitQuickQuest}
          />
        </View>

        <TouchableOpacity
          style={[s.quickIcon, qqDueDateISO && { backgroundColor: "rgba(56,189,248,0.18)" }]}
          onPress={() => {
            const base = qqDueDateISO ? new Date(`${qqDueDateISO}T00:00:00`) : new Date();
            setTempDate(base);
            setShowDatePicker(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={20} color={qqDueDateISO ? INFO_BLUE : theme.text} />
        </TouchableOpacity>

        {qqDueDateISO ? (
          <TouchableOpacity style={s.quickIcon} onPress={() => setQqDueDateISO(null)} activeOpacity={0.85}>
            <Ionicons name="close-outline" size={22} color={theme.sub} />
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={s.quickPlus} onPress={submitQuickQuest} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#001014" />
        </TouchableOpacity>
      </View>

      {qqDueDateISO ? (
        <Text style={s.deadlineHint}>Gewähltes Datum: {formatDE(qqDueDateISO)}</Text>
      ) : (
        <Text style={s.deadlineHint}>Kein Datum gesetzt</Text>
      )}

      {filteredQuickQuests?.length ? (
        <FlatList
          data={filteredQuickQuests}
          keyExtractor={(item) => item.id}
          renderItem={renderQuickItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 6 }}
        />
      ) : null}

      <View style={[s.sectionRow, { marginTop: 6 }]}>
        <Text style={s.sectionTitle}>Routinen</Text>
        <View style={s.sectionLine} />
      </View>

      {dueRecurring?.length ? (
        <FlatList
          data={dueRecurring}
          keyExtractor={(item) => `${item._dueKind || "r"}_${item.id}`}
          renderItem={renderRecurringItem}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 6 }}
        />
      ) : null}

      <View style={[s.sectionRow, { marginTop: 6 }]}>
        <Text style={s.sectionTitle}>Tägliche Quests</Text>
        <View style={s.sectionLine} />
      </View>
    </View>
  );

  return (
    <View style={s.wrap}>
      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        renderItem={renderDailyItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={s.overlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={s.pickerSheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Datum wählen</Text>

            <View style={s.pickerWrap}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(e, d) => {
                  if (!d) return;
                  setTempDate(d);
                }}
                themeVariant="dark"
              />
            </View>

            <View style={s.pickerActions}>
              <TouchableOpacity
                style={[s.pickerBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={s.pickerBtnTextSub}>Abbrechen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.pickerBtn, { backgroundColor: INFO_BLUE }]}
                onPress={() => {
                  setQqDueDateISO(toLocalISODate(tempDate));
                  setShowDatePicker(false);
                }}
              >
                <Text style={s.pickerBtnText}>Übernehmen</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={closeFeedback}>
        <Pressable style={s.overlay} onPress={closeFeedback}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Feedback</Text>

            {selected?.type === "daily" ? (
              <>
                <TouchableOpacity
                  style={s.sheetRow}
                  onPress={() => {
                    const id = selected.id;
                    closeFeedback();
                    openAdoptFromDailyQuest(id);
                  }}
                >
                  <Ionicons name="repeat-outline" size={18} color={LIFE_GREEN} />
                  <Text style={s.sheetText}>Als Routine übernehmen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetRow}
                  onPress={() => {
                    rateQuest(selected.id, "like");
                    closeFeedback();
                  }}
                >
                  <Ionicons name="thumbs-up-outline" size={18} color={LIFE_GREEN} />
                  <Text style={s.sheetText}>Hat mir gefallen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetRow}
                  onPress={() => {
                    rateQuest(selected.id, "hard");
                    closeFeedback();
                  }}
                >
                  <Ionicons name="heart-dislike-outline" size={18} color={LIFE_GREEN} />
                  <Text style={s.sheetText}>War zu schwer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.sheetRow}
                  onPress={() => {
                    rateQuest(selected.id, "irrelevant");
                    closeFeedback();
                  }}
                >
                  <Ionicons name="eye-off-outline" size={18} color={LIFE_GREEN} />
                  <Text style={s.sheetText}>Irrelevant</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.sheetRow, { marginTop: 6 }]}
                  onPress={() => {
                    rateQuest(selected.id, "delete");
                    closeFeedback();
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={LIFE_GREEN} />
                  <Text style={s.sheetText}>Löschen</Text>
                </TouchableOpacity>
              </>
            ) : selected?.type === "quick" ? (
              <TouchableOpacity
                style={s.sheetRow}
                onPress={() => {
                  removeQuickQuest(selected.id);
                  closeFeedback();
                }}
              >
                <Ionicons name="trash-outline" size={18} color={BAD_RED} />
                <Text style={s.sheetText}>Erinnerung löschen</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={s.sheetRow}
                onPress={() => {
                  const isBad = selected?.dueKind === "badhabit" || selected?.dueKind === "bad_habit";
                  if (isBad) removeBadHabit(selected.id);
                  else removeRecurring(selected.id);
                  closeFeedback();
                }}
              >
                <Ionicons name="trash-outline" size={18} color={BAD_RED} />
                <Text style={s.sheetText}>
                  {selected?.dueKind === "badhabit" || selected?.dueKind === "bad_habit"
                    ? "Anti-Gewohnheit löschen"
                    : "Routine löschen"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.cancelBtn} onPress={closeFeedback}>
              <Text style={s.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={adoptOpen} transparent animationType="fade" onRequestClose={() => setAdoptOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setAdoptOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Routine übernehmen</Text>

            <Text style={s.label}>Typ</Text>
            <View style={s.row}>
              <Chip active={adoptKind === "daily"} onPress={() => setAdoptKind("daily")}>
                Daily
              </Chip>
              <Chip active={adoptKind === "weekly"} onPress={() => setAdoptKind("weekly")}>
                Weekly
              </Chip>
              <Chip active={adoptKind === "monthly"} onPress={() => setAdoptKind("monthly")}>
                Monthly
              </Chip>
              <Chip active={adoptKind === "yearly"} onPress={() => setAdoptKind("yearly")}>
                Yearly
              </Chip>
            </View>

            {adoptKind !== "daily" ? (
              <>
                <Text style={s.label}>Häufigkeit (Quota)</Text>
                <TextInput
                  style={s.input}
                  value={adoptTimes}
                  onChangeText={(v) => setAdoptTimes(v.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="z.B. 3"
                  placeholderTextColor="#778"
                />
              </>
            ) : (
              <Text style={s.label}>Daily ist immer 1× pro Tag</Text>
            )}

            {adoptKind === "weekly" ? (
              <>
                <Text style={s.label}>Fixe Wochentage (optional)</Text>
                <View style={s.row}>
                  {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((lbl, idx) => {
                    const active = adoptWeekDays.includes(idx);
                    return (
                      <Chip
                        key={idx}
                        active={active}
                        onPress={() => {
                          const set = new Set(adoptWeekDays);
                          set.has(idx) ? set.delete(idx) : set.add(idx);
                          setAdoptWeekDays([...set].sort((a, b) => a - b));
                        }}
                      >
                        {lbl}
                      </Chip>
                    );
                  })}
                </View>
                <Text style={[s.label, { marginTop: 6 }]}>
                  Wenn du keine Tage wählst: Weekly-Quota (erscheint jeden Tag bis erfüllt).
                </Text>
              </>
            ) : null}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={[s.pickerBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]}
                onPress={() => setAdoptOpen(false)}
              >
                <Text style={s.pickerBtnTextSub}>Abbrechen</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.pickerBtn, { backgroundColor: LIFE_GREEN }]} onPress={confirmAdopt}>
                <Text style={s.pickerBtnText}>Übernehmen</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  headerCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.4,
    color: theme.text,
  },
  green: { color: LIFE_GREEN },
  dot: { color: theme.sub },
  xpPill: {
    backgroundColor: LIFE_GREEN,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  xpPillText: { color: "#001014", fontWeight: "900", fontSize: 16 },

  barOuter: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.18)",
    overflow: "hidden",
  },
  barInner: { height: "100%", borderRadius: 999, backgroundColor: LIFE_GREEN },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    color: theme.text,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.2,
    opacity: 0.9,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(34,197,94,0.35)",
    borderRadius: 999,
  },

  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  quickInputWrap: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quickInput: { color: theme.text, fontWeight: "800", fontSize: 15 },

  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  quickPlus: {
    width: 54,
    height: 44,
    borderRadius: 14,
    backgroundColor: LIFE_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },

  deadlineHint: {
    color: theme.sub,
    fontWeight: "800",
    fontSize: 12,
    marginBottom: 10,
    opacity: 0.9,
  },

  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardDone: { opacity: 0.45 },

  cardBad: {
    borderColor: "rgba(249,115,22,0.35)",
    backgroundColor: "rgba(249,115,22,0.08)",
  },
  titleBad: { color: "rgba(255,255,255,0.98)" },
  subBad: { color: "rgba(249,115,22,0.95)" },

  cardUrgent: {
    borderColor: "rgba(239,68,68,0.45)",
    backgroundColor: "rgba(239,68,68,0.10)",
  },
  titleUrgent: { color: "rgba(255,255,255,0.98)" },
  subUrgent: { color: "rgba(239,68,68,0.95)" },
  circleUrgent: { borderColor: "rgba(239,68,68,0.55)" },

  stripe: { width: 4, height: 44, borderRadius: 999, marginRight: 14 },

  cardLeft: { flex: 1, paddingRight: 12 },
  title: { color: theme.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
  titleDone: { textDecorationLine: "line-through" },

  sub: { color: theme.sub, marginTop: 6, fontWeight: "800", fontSize: 16 },
  subDone: { textDecorationLine: "line-through" },

  cardRight: { flexDirection: "row", alignItems: "center", gap: 14 },

  checkBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  circleOpen: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)" },

  menuBtn: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },

  sheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
  },

  pickerSheet: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingBottom: Platform.OS === "ios" ? 26 : 16,
  },
  pickerWrap: {
    marginTop: 6,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  pickerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerBtnText: { color: "#001014", fontWeight: "900" },
  pickerBtnTextSub: { color: theme.sub, fontWeight: "900" },

  sheetTitle: { color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 10 },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  sheetText: { color: theme.text, fontSize: 15, fontWeight: "800" },

  cancelBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cancelText: { color: theme.sub, fontWeight: "900" },

  label: { color: theme.sub, marginTop: 6, marginBottom: 6, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 10,
    color: theme.text,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  chipA: { backgroundColor: LIFE_GREEN, borderColor: "rgba(0,0,0,0.0)" },
  chipT: { color: theme.text, fontSize: 12, fontWeight: "800" },
  chipTA: { color: "#001014", fontWeight: "900", fontSize: 12 },
});
