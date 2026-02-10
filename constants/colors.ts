const palette = {
  sky: "#00AEEF", // Vibrant Frutiger Aero Blue
  glass: "rgba(255, 255, 255, 0.7)",
  grass: "#7BC043", // Techno-Zen Green
  aqua: "#00F2FF",
  aurora: "#E0F7FA",
  zen: "#F0F4F8",
  cleanWhite: "#FFFFFF",
  deepSpace: "#010816",
  silver: "#C4CACE",
  glow: "rgba(0, 174, 239, 0.4)",
};

export default {
  light: {
    text: "#1A1A1A",
    textSecondary: "#5A6A7A",
    background: palette.aurora,
    card: palette.cleanWhite,
    tint: palette.sky,
    tintDark: "#0088CC",
    accent: palette.grass,
    danger: "#FF4D4D",
    border: "#D1E3E7",
    tabIconDefault: "#8E9EAB",
    tabIconSelected: palette.sky,
    glassEffect: palette.glass,
  },
  dark: {
    text: palette.cleanWhite,
    textSecondary: palette.silver,
    background: palette.deepSpace,
    card: "#0A1221",
    tint: palette.aqua,
    tintDark: palette.sky,
    accent: palette.grass,
    danger: "#FF4D4D",
    border: "#1E293B",
    tabIconDefault: "#475569",
    tabIconSelected: palette.aqua,
    glassEffect: "rgba(0, 0, 0, 0.6)",
  },
  palette,
};
