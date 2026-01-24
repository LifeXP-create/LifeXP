import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppState";
import { theme } from "../theme";

const MAP = {
  quests: "checkmark-done-circle-outline",
  todos: "list-outline",
  calendar: "calendar-outline",
  character: "person-circle-outline",
  settings: "settings-outline",
};

export default function TabIcon({ routeName, color }) {
  const { todos, quests } = useApp();
  const openTodos = todos.filter(t => !t.done).length;
  const openQuests = quests.filter(q => !q.done).length;

  const badge =
    routeName === "todos" ? openTodos :
    routeName === "quests" ? openQuests : 0;

  return (
    <View>
      <Ionicons name={MAP[routeName]} size={22} color={color} />
      {badge > 0 && (
        <View style={s.badge}>
          <Text style={s.btxt}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  badge:{ position:"absolute", right:-8, top:-6, backgroundColor:theme.primary2, paddingHorizontal:5, minWidth:18, height:18, borderRadius:9, alignItems:"center", justifyContent:"center" },
  btxt:{ color:"#001014", fontSize:10, fontWeight:"800" },
});
