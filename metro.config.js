const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// 🔥 Backend & Server-Zeug komplett ignorieren
config.resolver.blockList = [/backend\/.*/, /backend\\.*/];

module.exports = config;
