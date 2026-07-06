// src/storage/typesafeStorage.js
import { supabase } from "../lib/supabase";
import { createLocalAsyncDriver } from "./drivers/localAsync";
import { createStorage } from "./index";

async function getAuthedUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const uid = data?.session?.user?.id ? String(data.session.user.id) : null;
  return uid; // null wenn nicht eingeloggt
}

// Gibt entweder ein Storage-Objekt zurück oder null (wenn nicht eingeloggt)
export async function getStorage() {
  const userId = await getAuthedUserId();
  if (!userId) return null;

  const driver = createLocalAsyncDriver(userId);
  return createStorage(driver);
}
