import AsyncStorage from "@react-native-async-storage/async-storage";

const K = {
  profile: "lifexp_profile_v1",
  quests: "lifexp_quests_v1",
  completions: "lifexp_completions_v1",
  xp: "lifexp_xp_v1",
};

async function read(key, fallback) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function write(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function createLocalAsyncDriver({ userId }) {
  const key = (base) => `${base}:${userId}`;

  return {
    async getProfile() {
      return await read(key(K.profile), null);
    },
    async upsertProfile(profile) {
      await write(key(K.profile), profile);
      return profile;
    },

    async listQuests() {
      return await read(key(K.quests), []);
    },
    async upsertQuest(quest) {
      const list = await read(key(K.quests), []);
      const idx = list.findIndex((q) => q.id === quest.id);
      if (idx >= 0) list[idx] = quest;
      else list.unshift(quest);
      await write(key(K.quests), list);
      return quest;
    },
    async deleteQuest(questId) {
      const list = await read(key(K.quests), []);
      await write(
        key(K.quests),
        list.filter((q) => q.id !== questId),
      );
    },

    async listCompletions(dateISO) {
      const list = await read(key(K.completions), []);
      return dateISO ? list.filter((c) => c.dateISO === dateISO) : list;
    },
    async addCompletion(completion) {
      const list = await read(key(K.completions), []);
      if (!list.some((c) => c.id === completion.id)) list.unshift(completion);
      await write(key(K.completions), list);
      return completion;
    },
    async deleteCompletion(completionId) {
      const list = await read(key(K.completions), []);
      await write(
        key(K.completions),
        list.filter((c) => c.id !== completionId),
      );
    },

    async listXP() {
      return await read(key(K.xp), []);
    },
    async addXP(xpEvent) {
      const list = await read(key(K.xp), []);
      list.unshift(xpEvent);
      await write(key(K.xp), list);
      return xpEvent;
    },
    async clearXP() {
      await write(key(K.xp), []);
    },
  };
}
