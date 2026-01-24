import React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { theme } from "../theme";

const { width, height } = Dimensions.get("window");
const hexA = (hex, a = 0.12) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};
const rngFrom = (seed) => () =>
  ((seed = Math.imul(1664525, seed + 1013904223)) >>> 0) / 2 ** 32;

export default function UniverseCanvas({
  perArea,
  mode = "overview", // "overview" | "zoom"
  selectedArea = null,
  onGalaxyPress = () => {},
  positionsPx = null,
  bottomReserve = 160,
}) {
  const H = height - bottomReserve;

  // große Welt
  const WORLD_W = width * 3.5;
  const WORLD_H = H * 3.0;

  const keys = React.useMemo(() => Object.keys(perArea), [perArea]);

  // Galaxie-Positionen mit Mindestabstand
  const worldPositions = React.useMemo(() => {
    if (positionsPx) return positionsPx;
    const r = rngFrom(77);
    const pts = [];
    const minD = Math.min(WORLD_W, WORLD_H) * 0.28;
    const tryPlace = () => ({
      x: (0.08 + 0.84 * r()) * WORLD_W,
      y: (0.10 + 0.80 * r()) * WORLD_H,
    });
    keys.forEach((k) => {
      let p = tryPlace(), tries = 0;
      while (
        pts.some((q) => (p.x - q.x) ** 2 + (p.y - q.y) ** 2 < minD * minD) &&
        tries < 200
      ) {
        p = tryPlace();
        tries++;
      }
      pts.push({ key: k, ...p });
    });
    return pts;
  }, [keys]); // eslint-disable-line

  // Sterne
  const stars = React.useMemo(() => {
    const r1 = rngFrom(11), r2 = rngFrom(23), r3 = rngFrom(37);
    const mk = (n, r, s, o1, o2) =>
      Array.from({ length: n }, (_, i) => ({
        k: i,
        x: r() * WORLD_W,
        y: r() * WORLD_H,
        s,
        o: o1 + r() * (o2 - o1),
      }));
    return {
      far: mk(420, r1, 1, 0.25, 0.55),
      mid: mk(300, r2, 1, 0.35, 0.85),
      near: mk(180, r3, 2, 0.6, 1.0),
    };
  }, []); // fixed

  // Pan + Fling
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const maxX = Math.max(0, WORLD_W - width);
  const maxY = Math.max(0, WORLD_H - H);

  const pan = React.useRef(new Animated.ValueXY({ x: maxX / 2, y: maxY / 2 }))
    .current;
  const panRaw = React.useRef({ x: maxX / 2, y: maxY / 2 }).current;
  const velocity = React.useRef({ vx: 0, vy: 0 });

  const responder = React.useMemo(
    () =>
      PanResponder.create({
        // Taps dürfen durchgehen
        onStartShouldSetPanResponder: () => false,
        // Greife nur bei relevanter Bewegung
        onMoveShouldSetPanResponder: (_, g) =>
          mode === "overview" && (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8),
        onPanResponderGrant: () => {
          pan.stopAnimation(({ x, y }) => {
            panRaw.x = x;
            panRaw.y = y;
          });
        },
        onPanResponderMove: (_, g) => {
          const nx = clamp(panRaw.x - g.dx, 0, maxX);
          const ny = clamp(panRaw.y - g.dy, 0, maxY);
          pan.setValue({ x: nx, y: ny });
          velocity.current = { vx: -g.vx, vy: -g.vy };
        },
        onPanResponderRelease: () => {
          const { vx, vy } = velocity.current;
          Animated.decay(pan, {
            velocity: { x: vx * 0.9, y: vy * 0.9 },
            deceleration: 0.995,
            useNativeDriver: false, // JS-Driver wegen left/top
          }).start(() => {
            pan.stopAnimation(({ x, y }) =>
              pan.setValue({ x: clamp(x, 0, maxX), y: clamp(y, 0, maxY) })
            );
          });
        },
      }),
    [mode, maxX, maxY]
  );

  // Twinkle (JS-Driver)
  const tw = React.useRef(
    Array.from({ length: 60 }, () => new Animated.Value(Math.random() * 0.6 + 0.2))
  ).current;
  React.useEffect(() => {
    tw.forEach((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 650 + (i % 7) * 90, useNativeDriver: false }),
          Animated.timing(v, { toValue: 0.25, duration: 580 + (i % 5) * 100, useNativeDriver: false }),
        ])
      ).start()
    );
  }, [tw]);

  // Zoom-Ansicht
  if (mode === "zoom" && selectedArea) {
    const col = perArea[selectedArea]?.color || "#7dd3fc";
    return (
      <View style={[s.fill, { backgroundColor: "#000" }]}>
        {stars.far.map((st) => (
          <View
            key={`zf${st.k}`}
            style={[
              s.star,
              { left: st.x % width, top: st.y % H, width: st.s, height: st.s, opacity: st.o },
            ]}
          />
        ))}
        <View style={s.sunWrap}>
          <View style={[s.sunCore, { backgroundColor: col }]} />
          <View style={[s.sunGlow, { borderColor: col }]} />
        </View>
      </View>
    );
  }

  // Parallax-Mapper
  const par = (wx, f) => Animated.subtract(wx, Animated.divide(pan.x, f));
  const parY = (wy, f) => Animated.subtract(wy, Animated.divide(pan.y, f));
  const mapX = (wx) => Animated.subtract(wx, pan.x);
  const mapY = (wy) => Animated.subtract(wy, pan.y);

  return (
    // Panning nur auf der Hintergrundfläche, damit Touchables klickbar bleiben
    <View style={s.fill}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-only" {...responder.panHandlers}>
        {/* Sterne */}
        {stars.far.map((st) => (
          <Animated.View
            key={`f${st.k}`}
            style={[
              s.star,
              { left: par(st.x, 1.4), top: parY(st.y, 1.4), width: st.s, height: st.s, opacity: st.o },
            ]}
          />
        ))}
        {stars.mid.map((st, i) => (
          <Animated.View
            key={`m${st.k}`}
            style={[
              s.star,
              { left: par(st.x, 1.1), top: parY(st.y, 1.1), width: st.s, height: st.s, opacity: tw[i % tw.length] },
            ]}
          />
        ))}
        {stars.near.map((st) => (
          <Animated.View
            key={`n${st.k}`}
            style={[
              s.starNear,
              { left: mapX(st.x), top: mapY(st.y), width: st.s, height: st.s, opacity: st.o },
            ]}
          />
        ))}

        {/* Halos + Galaxien */}
        {worldPositions.map((p) => {
          const lvl = Math.max(1, perArea[p.key]?.level || 1);
          const size = 12 + lvl * 6;
          const halo = 220 + lvl * 50;
          const col = perArea[p.key]?.color || "#93c5fd";
          const sx = mapX(new Animated.Value(p.x));
          const sy = mapY(new Animated.Value(p.y));

          return (
            <Animated.View key={`g${p.key}`} pointerEvents="box-none">
              <Animated.View
                style={[
                  s.halo,
                  {
                    left: Animated.subtract(sx, halo / 2),
                    top: Animated.subtract(sy, halo / 2),
                    width: halo,
                    height: halo,
                    backgroundColor: hexA(col, 0.12),
                    borderColor: hexA(col, 0.25),
                  },
                ]}
              />
              {/* Der Punkt selbst bleibt separat und clickable */}
              <Animated.View
                style={[
                  s.dot,
                  {
                    left: Animated.subtract(sx, size / 2),
                    top: Animated.subtract(sy, size / 2),
                    width: size,
                    height: size,
                    backgroundColor: col,
                  },
                ]}
                pointerEvents="box-none"
              >
                <TouchableOpacity
                  style={{ flex: 1, borderRadius: 999 }}
                  activeOpacity={0.9}
                  onPress={() => {
                    pan.stopAnimation(({ x, y }) => {
                      const screenX = p.x - x;
                      const screenY = p.y - y;
                      onGalaxyPress(p.key, { key: p.key, x: screenX, y: screenY });
                    });
                  }}
                />
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  star: { position: "absolute", backgroundColor: "#cbd5e1", borderRadius: 2 },
  starNear: { position: "absolute", backgroundColor: "#e5e7eb", borderRadius: 2 },
  halo: { position: "absolute", borderRadius: 9999, borderWidth: 1 },
  dot: { position: "absolute", borderRadius: 999, overflow: "hidden", opacity: 0.95 },
  sunWrap: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  sunCore: { width: 130, height: 130, borderRadius: 999, opacity: 0.95 },
  sunGlow: { position: "absolute", width: 230, height: 230, borderRadius: 999, borderWidth: 2, opacity: 0.35 },
});
