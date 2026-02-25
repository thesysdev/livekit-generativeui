import { createContext, useContext, type CSSProperties } from "react";

export type Theme = ReturnType<typeof createTheme>;

export function createTheme(dark: boolean) {
  const d = dark;
  return {
    // Layout
    bg:               d ? "#08080d"                : "#f3f4f8",
    text:             d ? "#eeeef6"                : "#111827",
    sub:              d ? "#52525b"                : "#9ca3af",
    subHover:         d ? "#a1a1aa"                : "#6b7280",
    divider:          d ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)",
    hoverBgFaint:     d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",

    // Blobs
    blob1:            d ? "rgba(99,102,241,0.07)"  : "rgba(99,102,241,0.05)",
    blob2:            d ? "rgba(139,92,246,0.05)"  : "rgba(139,92,246,0.04)",

    // Buttons
    btnBg:            d ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    btnBgHover:       d ? "rgba(255,255,255,0.11)" : "rgba(0,0,0,0.08)",
    btnBorder:        d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
    btnBorderHover:   d ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)",

    // Start button / mic active
    startBg:          d ? "#ffffff"                : "#0f172a",
    startText:        d ? "#0f172a"                : "#ffffff",
    startShadow:      d ? "0 8px 36px rgba(255,255,255,0.12)"  : "0 8px 36px rgba(15,23,42,0.22)",
    startShadowHov:   d ? "0 12px 44px rgba(255,255,255,0.20)" : "0 12px 44px rgba(15,23,42,0.30)",

    // Title shimmer
    shimmer:          d
      ? "linear-gradient(135deg,#fff 0%,#fff 40%,rgba(255,255,255,0.22) 50%,#fff 60%,#fff 100%)"
      : "linear-gradient(135deg,#000 0%,#000 40%,rgba(0,0,0,0.15) 50%,#000 60%,#000 100%)",

    // Control tray bar
    barBg:            d ? "rgba(10,10,18,0.94)"    : "rgba(255,255,255,0.94)",
    barBorder:        d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)",

    // Skeleton
    skeletonA:        d ? "rgba(255,255,255,0.08)" : "#e5e7eb",
    skeletonB:        d ? "rgba(255,255,255,0.04)" : "#f3f4f6",

    // Transcript
    transcriptBg:     d ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    transcriptBorder: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    userLabel:        d ? "#71717a" : "#999",
    userText:         d ? "#a1a1aa" : "#666",
    agentLabel:       d ? "#818cf8" : "#2563eb",
    agentText:        d ? "#e5e7eb" : "#111",

    // Status chip colors
    connConnecting:   d ? "#fbbf24" : "#92400e",
    connConnected:    d ? "#4ade80" : "#15803d",
    connDisconnected: d ? "#f87171" : "#be123c",
    agentSpeaking:    d ? "#a78bfa" : "#6d28d9",
    agentListening:   d ? "#60a5fa" : "#1d4ed8",
    agentThinking:    d ? "#fb923c" : "#c2410c",

    // Mic ring (per agent state)
    ringSpeaking:     d ? "#a78bfa" : "#7c3aed",
    ringListening:    d ? "#60a5fa" : "#3b82f6",
    ringThinking:     d ? "#fb923c" : "#ea580c",

    // Mic default shadow
    micShadow:        d ? "0 4px 20px rgba(255,255,255,0.15)" : "none",
  };
}

export function themeToVars(theme: Theme): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    vars[`--t-${key}`] = value;
  }
  return vars as CSSProperties;
}

type DarkModeValue = { dark: boolean; toggle: () => void };

export const DarkModeContext = createContext<DarkModeValue>({
  dark: false,
  toggle: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

export const STARTERS = [
  "Help me plan a trip",
  "Compare Apple and Tesla stocks",
  "Who won at Oscars this year",
];

export const ACTIVE_AGENT_STATES = ["listening", "thinking", "speaking"];
