// app/auth-callback.js
import * as Linking from "expo-linking";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { supabase } from "../src/lib/supabase";

/**
 * Handles:
 * - Magic link / OAuth (access_token + refresh_token in URL hash/query)
 * - Email confirm (token_hash + type in query)
 *
 * If it's only an email-confirm without session tokens, we just redirect to /auth
 * (user then logs in normally).
 */
export default function AuthCallback() {
  useEffect(() => {
    let sub;

    const handleUrl = async (url) => {
      if (!url) return;

      // Expo / Supabase sometimes puts tokens in the hash (#...)
      // Example: myapp://auth-callback#access_token=...&refresh_token=...
      const [base, hash] = url.split("#");
      const queryPart = base.includes("?") ? base.split("?")[1] : "";
      const hashPart = hash || "";

      const params = new URLSearchParams(queryPart);
      const hashParams = new URLSearchParams(hashPart);

      const access_token =
        hashParams.get("access_token") || params.get("access_token");
      const refresh_token =
        hashParams.get("refresh_token") || params.get("refresh_token");

      // 1) If we got session tokens -> set session
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        return;
      }

      // 2) Email confirm links can come as token_hash + type
      const token_hash = params.get("token_hash");
      const type = params.get("type"); // "signup" etc.

      if (token_hash && type) {
        try {
          await supabase.auth.verifyOtp({ type, token_hash });
        } catch {
          // If verify fails, user can still just log in manually.
        }
      }
    };

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      await handleUrl(initialUrl);
    })();

    sub = Linking.addEventListener("url", async (e) => {
      await handleUrl(e.url);
    });

    return () => sub?.remove?.();
  }, []);

  // After handling we always go to auth; the gate will send logged-in users to /quests
  return <Redirect href="/auth" />;
}
