// src/storage/typesafeStorage.js
import { supabase } from "../lib/supabase";
import { createLocalAsyncDriver } from "./drivers/localAsync";
import { createStorage } from "./index";

async function getAuthedUserId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  const uid = session?.user?.id ? String(session.user.id) : null;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export async function getStorage() {
  const userId = await getAuthedUserId();
  const driver = createLocalAsyncDriver(userId);
  return createStorage(driver);
}
