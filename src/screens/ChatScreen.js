// src/screens/ChatScreen.js
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { sendChatMessage } from "../lib/chatClient";
import { theme } from "../theme";

export default function ChatScreen() {
  const nav = useNavigation();
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      from: "bot",
      text: "Hey, ich bin dein LifeXP-Coach. Was beschäftigt dich gerade?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  React.useLayoutEffect(() => {
    nav.setOptions({
      title: "Coach",
    });
  }, [nav]);

  const onSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      from: "user",
      text: trimmed,
    };

    setMessages((prev) => [userMsg, ...prev]);
    setInput("");
    setSending(true);

    try {
      const history = messages
        .slice()
        .reverse()
        .map((m) => ({
          role: m.from === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const answer = await sendChatMessage(history, trimmed);

      const botMsg = {
        id: `b_${Date.now()}`,
        from: "bot",
        text: answer,
      };
      setMessages((prev) => [botMsg, ...prev]);
    } catch (e) {
      console.error(e);
      const errMsg = {
        id: `err_${Date.now()}`,
        from: "bot",
        text:
          "Da ist gerade etwas schiefgelaufen. Check deine Internetverbindung " +
          "oder den API-Key in der .env-Datei.",
      };
      setMessages((prev) => [errMsg, ...prev]);
    } finally {
      setSending(false);
    }
  }, [input, sending, messages]);

  const renderItem = ({ item }) => {
    const isUser = item.from === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 82 : 0}
    >
      <View style={styles.container}>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={{ padding: 16 }}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Frag deinen Coach …"
            placeholderTextColor="#6b7280"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#001014" />
            ) : (
              <Ionicons name="send" size={20} color="#001014" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  container: { flex: 1 },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: theme.primary,
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
  },
  bubbleText: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1f2933",
    backgroundColor: "#020617",
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: "#020617",
    color: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
});
