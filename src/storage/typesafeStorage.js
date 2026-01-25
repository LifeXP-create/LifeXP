import { getOrCreateUserId } from "../lib/userId";
import { createLocalAsyncDriver } from "./drivers/localAsync";
import { createStorage } from "./index";

let _storage = null;

export async function getStorage() {
  if (_storage) return _storage;
  const userId = await getOrCreateUserId();
  const driver = createLocalAsyncDriver({ userId });
  _storage = createStorage(driver);
  return _storage;
}
