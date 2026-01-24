// src/lib/notifications.js
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export const ANDROID_CHANNEL_ID = "lifexp-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotifPermission() {
  if (!Device.isDevice) return { ok: false, reason: "no_device" };

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === "granted") return { ok: true };

  const req = await Notifications.requestPermissionsAsync();
  if (req.status === "granted") return { ok: true };

  return { ok: false, reason: "denied" };
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "LifeXP Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleDailyReminder({ hour, minute, title, body }) {
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title || "LifeXP",
      body: body || "Deine Quests warten.",
      sound: "default",
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

export async function scheduleWeeklySummary({ weekday, hour, minute, title, body }) {
  // weekday: 1..7 (1=Sun in iOS? Bei Expo ist weekday 1=Sunday, 2=Monday ... 7=Saturday)
  // Wenn du “Montag” willst: weekday=2
  await ensureAndroidChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: title || "LifeXP",
      body: body || "Dein Wochen-Check-in.",
      sound: "default",
    },
    trigger: {
      weekday,
      hour,
      minute,
      repeats: true,
      channelId: Platform.OS === "android" ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}
