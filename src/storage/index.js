// src/storage/index.js
// Storage-Interface: später Driver austauschen, Code bleibt gleich

export function createStorage(driver) {
  return {
    // AppState (globaler Save fürs AppState.js)
    getAppState: () => driver.getAppState(),
    upsertAppState: (state) => driver.upsertAppState(state),

    // Profile
    getProfile: () => driver.getProfile(),
    upsertProfile: (profile) => driver.upsertProfile(profile),

    // Quests
    listQuests: () => driver.listQuests(),
    upsertQuest: (quest) => driver.upsertQuest(quest),
    deleteQuest: (questId) => driver.deleteQuest(questId),

    // Completions
    listCompletions: (dateISO) => driver.listCompletions(dateISO),
    addCompletion: (completion) => driver.addCompletion(completion),
    deleteCompletion: (completionId) => driver.deleteCompletion(completionId),

    // XP events
    listXP: () => driver.listXP(),
    addXP: (xpEvent) => driver.addXP(xpEvent),
    clearXP: () => driver.clearXP(),
  };
}
