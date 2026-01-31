import AsyncStorage from "@react-native-async-storage/async-storage";

export const PROFILE_V2_KEY = "profile_v2";

export async function loadProfileV2() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_V2_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
