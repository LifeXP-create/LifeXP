import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "lifexp_user_id_v1";

function makeId() {
  // simple pseudo-uuid
  return "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export async function getOrCreateUserId() {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;

  const id = makeId();
  await AsyncStorage.setItem(KEY, id);
  return id;
}

export async function resetUserId() {
  await AsyncStorage.removeItem(KEY);
}
