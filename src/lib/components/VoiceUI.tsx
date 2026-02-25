import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useSessionContext,
  useAgent,
  useChat,
} from "@livekit/components-react";
import { ThemeProvider } from "@thesysai/genui-sdk";

import {
  createTheme,
  themeToVars,
  DarkModeContext,
  ACTIVE_AGENT_STATES,
} from "./theme";
import { IdleScreen } from "./IdleScreen";
import { GenUIPanel } from "./GenUIPanel";
import { ControlTray } from "./ControlTray";
import styles from "./VoiceUI.module.css";

export function VoiceUI() {
  const session = useSessionContext();
  const agent = useAgent();
  const isAgentReady = ACTIVE_AGENT_STATES.includes(agent.state);
  const { send: sendChatMessage } = useChat();

  const [genUIContent, setGenUIContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [transcriptKey, setTranscriptKey] = useState(0);

  // ── Theme ──

  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    setMounted(true);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleTheme = useCallback(() => setDark((d) => !d), []);
  const theme = useMemo(() => createTheme(dark), [dark]);
  const themeStyle = useMemo(() => themeToVars(theme), [theme]);

  // ── Connection lifecycle ──

  const [startPending, setStartPending] = useState(false);

  useEffect(() => {
    if (session.isConnected) setStartPending(false);
  }, [session.isConnected]);

  const handleStart = useCallback(() => {
    setStartPending(true);
    session.start();
  }, [session]);

  const handleEnd = useCallback(() => {
    session.end();
    setGenUIContent("");
    setStartPending(false);
  }, [session]);

  const handleReset = useCallback(() => {
    session.end();
    setGenUIContent("");
    setIsStreaming(false);
    setTranscriptKey((k) => k + 1);
    setTimeout(() => session.start(), 300);
  }, [session]);

  // ── GenUI text stream ──

  useEffect(() => {
    const room = session.room;
    if (!room) return;

    const handleGenUI = (reader: AsyncIterable<string>) => {
      setIsStreaming(true);
      setIsProcessingAction(false);
      setGenUIContent("");
      let acc = "";
      (async () => {
        try {
          for await (const chunk of reader) {
            acc += chunk;
            setGenUIContent(acc);
          }
        } finally {
          setIsStreaming(false);
        }
      })();
    };

    room.registerTextStreamHandler("genui", handleGenUI);
    return () => {
      try {
        room.unregisterTextStreamHandler("genui");
      } catch {}
    };
  }, [session.room]);

  // ── GenUI actions ──

  const handleAction = useCallback(
    (event: { type?: string; params?: Record<string, any> }) => {
      switch (event.type) {
        case "open_url":
          window.open(event.params?.url, "_blank", "noopener,noreferrer");
          break;
        case "continue_conversation":
        default: {
          const message = event.params?.llmFriendlyMessage;
          if (message) {
            setIsProcessingAction(true);
            sendChatMessage(message);
          }
          break;
        }
      }
    },
    [sendChatMessage],
  );

  // ── Derived state ──

  const connStatus = !session.isConnected
    ? null
    : isAgentReady
      ? "connected"
      : "connecting";

  const agentStatus =
    session.isConnected && isAgentReady ? agent.state : null;

  if (!mounted) return <div className={styles.placeholder} />;

  return (
    <DarkModeContext.Provider value={{ dark, toggle: toggleTheme }}>
      <ThemeProvider mode={dark ? "dark" : "light"}>
        <div className={styles.root} style={themeStyle}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />

          {!session.isConnected ? (
            <IdleScreen
              onStart={handleStart}
              startPending={startPending}
            />
          ) : (
            <div className={styles.connected}>
              <GenUIPanel
                content={genUIContent}
                isStreaming={isStreaming}
                isProcessingAction={isProcessingAction}
                isAgentReady={isAgentReady}
                onAction={handleAction}
              />
              <ControlTray
                transcriptKey={transcriptKey}
                connStatus={connStatus}
                agentStatus={agentStatus}
                isAgentReady={isAgentReady}
                onReset={handleReset}
                onEnd={handleEnd}
              />
            </div>
          )}
        </div>
      </ThemeProvider>
    </DarkModeContext.Provider>
  );
}
