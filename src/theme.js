import { Platform } from "react-native";

export const theme = {
  bg: "#0A0B0F",
  card: "#111319",
  text: "#E6E8EE",
  sub: "#9AA4B2",
  primary: "#00E6A8",
  primary2: "#00B3FF",
  radius: 16,
  spacing: 16,
  areaColors: {
    Body: "#22c55e",
    Mind: "#60a5fa",
    Social: "#a78bfa",
    Productivity: "#f59e0b",
    Wellbeing: "#06b6d4",
  },
};

export const shadow = Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 6 },
});
