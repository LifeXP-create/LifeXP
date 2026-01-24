// src/components/QuestItem.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

const AREA_COLORS = {
  Body: "#22c55e",
  Mind: "#3b82f6",
  Social: "#a855f7",
  Productivity: "#f59e0b",
  Wellbeing: "#38bdf8",
};

export default function QuestItem({ q, onToggle, onLongPress, onMore }) {
  const color = AREA_COLORS[q.area] || "#6b7280";
  const done = !!q.done;

  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        s.container,
        pressed && { opacity: 0.85 },
        done && s.containerDone,
      ]}
    >
      {/* linke Farbleiste */}
      <View style={[s.bar, { backgroundColor: color }]} />

      {/* Inhalt */}
      <View style={s.content}>
        <Text style={[s.title, done && s.titleDone]} numberOfLines={1}>
          {q.title}
        </Text>
        <Text style={s.meta}>
          {q.area} · Diff {q.difficulty ?? 2}
        </Text>
      </View>

      {/* Check-Circle */}
      <TouchableOpacity
        onPress={onToggle}
        style={s.checkBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          style={[
            s.checkCircle,
            done && { borderColor: theme.primary, backgroundColor: theme.primary + "33" },
          ]}
        >
          {done && (
            <Ionicons
              name="checkmark"
              size={14}
              color={theme.primary}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Neuer Feedback-Button */}
      {onMore && (
        <TouchableOpacity
          onPress={onMore}
          style={s.moreBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={theme.sub}
          />
        </TouchableOpacity>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#020617",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.18)",
  },
  containerDone: {
    opacity: 0.6,
  },
  bar: {
    width: 3,
    borderRadius: 999,
    marginRight: 10,
    alignSelf: "stretch",
  },
  content: {
    flex: 1,
  },
  title: {
    color: "#e5e7eb",
    fontWeight: "700",
    fontSize: 15,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  meta: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 12,
  },
  checkBtn: {
    marginLeft: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#4b5563",
    alignItems: "center",
    justifyContent: "center",
  },
  moreBtn: {
    marginLeft: 6,
    paddingLeft: 4,
  },
});
