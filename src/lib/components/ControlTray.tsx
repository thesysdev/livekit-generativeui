import { useState, type CSSProperties } from "react";
import { useTrackToggle } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useDarkMode } from "./theme";
import {
  MicIcon, MicOffIcon, XIcon, ResetIcon,
  SunIcon, MoonIcon, WifiOffIcon,
} from "./icons";
import { SpinRing, SoundBars, ThinkDots, PulseCircle } from "./status-indicators";
import { TranscriptStrip } from "./TranscriptStrip";
import styles from "./ControlTray.module.css";

interface ControlTrayProps {
  transcriptKey: number;
  connStatus: string | null;
  agentStatus: string | null;
  isAgentReady: boolean;
  onReset: () => void;
  onEnd: () => void;
}

export function ControlTray({
  transcriptKey,
  connStatus,
  agentStatus,
  isAgentReady,
  onReset,
  onEnd,
}: ControlTrayProps) {
  const { dark, toggle } = useDarkMode();
  const [themeAnim, setThemeAnim] = useState(false);

  const handleThemeToggle = () => {
    toggle();
    setThemeAnim(true);
    setTimeout(() => setThemeAnim(false), 520);
  };

  return (
    <div className={styles.root}>
      <TranscriptStrip key={transcriptKey} />

      <div className={styles.controls}>
        {/* Theme toggle — wide screens only */}
        <div className={`${styles.themeWrap} ${styles.wideOnly}`}>
          <button
            className={styles.trayBtn}
            onClick={handleThemeToggle}
            title={dark ? "Light mode" : "Dark mode"}
          >
            <span className={themeAnim ? styles.themeFlip : undefined} style={{ display: "flex" }}>
              {dark ? <SunIcon /> : <MoonIcon />}
            </span>
          </button>
        </div>

        <div className={styles.center}>
          <ConnChip key={connStatus} status={connStatus} />
          <div className={`${styles.dividerLeft} ${styles.wideOnly}`} />
          <div className={`${styles.dividerRight} ${styles.wideOnly}`} />

          <div className={styles.actions}>
            <button
              className={`${styles.trayBtn} ${styles.trayBtnLg}`}
              onClick={onReset}
              title="Reset"
            >
              <ResetIcon />
            </button>
            <MicToggle disabled={!isAgentReady} agentStatus={agentStatus} />
            <button className={styles.endBtn} onClick={onEnd} title="End call">
              <XIcon />
            </button>
          </div>

          <AgentChip key={agentStatus} status={agentStatus} />
        </div>
      </div>
    </div>
  );
}

// ── Connection status chip ──

const CONN_LABELS: Record<string, string> = {
  connecting: "Connecting",
  connected: "Connected",
  disconnected: "Disconnected",
};

const CONN_STYLES: Record<string, string> = {
  connecting: styles.connConnecting,
  connected: styles.connConnected,
  disconnected: styles.connDisconnected,
};

function ConnChip({ status }: { status: string | null }) {
  if (!status || !CONN_LABELS[status]) return null;
  return (
    <div className={`${styles.chip} ${styles.chipLeft} ${styles.wideOnly} ${CONN_STYLES[status]}`}>
      {status === "connecting" && <SpinRing size={13} />}
      {status === "connected" && <div className={styles.blinkDot} />}
      {status === "disconnected" && <WifiOffIcon size={13} />}
      {CONN_LABELS[status]}
    </div>
  );
}

// ── Agent status chip ──

const AGENT_LABELS: Record<string, string> = {
  speaking: "Speaking",
  listening: "Listening",
  thinking: "Thinking",
};

const AGENT_STYLES: Record<string, string> = {
  speaking: styles.agentSpeaking,
  listening: styles.agentListening,
  thinking: styles.agentThinking,
};

function AgentChip({ status }: { status: string | null }) {
  if (!status || !AGENT_LABELS[status]) return null;
  return (
    <div className={`${styles.chip} ${styles.chipRight} ${styles.wideOnly} ${AGENT_STYLES[status]}`}>
      {status === "speaking" && <SoundBars count={4} height={16} />}
      {status === "listening" && <PulseCircle />}
      {status === "thinking" && <ThinkDots />}
      {AGENT_LABELS[status]}
    </div>
  );
}

// ── Mic toggle ──

const RING_VARS: Record<string, string> = {
  speaking: "var(--t-ringSpeaking)",
  listening: "var(--t-ringListening)",
  thinking: "var(--t-ringThinking)",
};

function MicToggle({
  disabled,
  agentStatus,
}: {
  disabled?: boolean;
  agentStatus: string | null;
}) {
  const { enabled, toggle } = useTrackToggle({
    source: Track.Source.Microphone,
  });
  const muted = !enabled;
  const ringColor = agentStatus ? RING_VARS[agentStatus] : undefined;

  const wrapStyle: CSSProperties | undefined = ringColor
    ? ({ "--ring": ringColor } as CSSProperties)
    : undefined;

  const btnStyle: CSSProperties | undefined =
    ringColor && !disabled
      ? {
          boxShadow: `0 0 20px color-mix(in srgb, ${ringColor} 27%, transparent)`,
        }
      : undefined;

  const className = [
    styles.micBtn,
    muted && styles.micMuted,
    disabled && styles.micDisabled,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.micWrap} style={wrapStyle}>
      {ringColor && !disabled && <div className={styles.micRing} />}
      <button
        className={className}
        style={btnStyle}
        onClick={() => toggle()}
        disabled={disabled}
        title={disabled ? "Waiting for agent..." : muted ? "Unmute" : "Mute"}
      >
        {muted || disabled ? <MicOffIcon size={32} /> : <MicIcon size={32} />}
      </button>
    </div>
  );
}
