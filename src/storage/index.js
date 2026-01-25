export function createStorage(driver) {
  return {
    getProfile: () => driver.getProfile(),
    upsertProfile: (profile) => driver.upsertProfile(profile),

    listQuests: () => driver.listQuests(),
    upsertQuest: (quest) => driver.upsertQuest(quest),
    deleteQuest: (questId) => driver.deleteQuest(questId),

    listCompletions: (dateISO) => driver.listCompletions(dateISO),
    addCompletion: (completion) => driver.addCompletion(completion),
    deleteCompletion: (completionId) => driver.deleteCompletion(completionId),

    listXP: () => driver.listXP(),
    addXP: (xpEvent) => driver.addXP(xpEvent),
    clearXP: () => driver.clearXP(),
  };
}
