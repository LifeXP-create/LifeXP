// app/auth-callback.js
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../src/lib/supabase";
import { theme } from "../src/theme";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let sub;

    const handleUrl = async (url) => {
      if (!url) {
        router.replace("/auth");
        return;
      }

      const [base, hash] = url.split("#");
      const queryPart = base.includes("?") ? base.split("?")[1] : "";
      const hashPart = hash || "";

      const params = new URLSearchParams(queryPart);
      const hashParams = new URLSearchParams(hashPart);

      const access_token =
        hashParams.get("access_token") || params.get("access_token");
      const refresh_token =
        hashParams.get("refresh_token") || params.get("refresh_token");

      const token_hash = params.get("token_hash");
      const type = params.get("type") || hashParams.get("type");

      try {
        // Fall 1: Session-Tokens direkt im Link
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });

          if (type === "recovery") {
            router.replace("/reset-password");
            return;
          }

          router.replace("/auth");
          return;
        }

        // Fall 2: token_hash + type (z.B. recovery oder signup)
        if (token_hash && type) {
          await supabase.auth.verifyOtp({ type, token_hash });

          if (type === "recovery") {
            router.replace("/reset-password");
            return;
          }

          router.replace("/auth");
          return;
        }

        router.replace("/auth");
      } catch {
        router.replace("/auth");
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
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}
