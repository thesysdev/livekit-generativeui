"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SessionProvider,
  useSessionContext,
  useAgent,
  useSession,
  RoomAudioRenderer,
  useTrackToggle,
  useChat,
  useVoiceAssistant,
  useLocalParticipant,
  useTranscriptions,
} from "@livekit/components-react";
import { TokenSource, Track } from "livekit-client";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";

export default function VoicePage() {
  const tokenSource = useMemo(
    () => TokenSource.endpoint("/api/connection-details"),
    [],
  );
  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <RoomAudioRenderer />
      <VoiceUI />
    </SessionProvider>
  );
}

const ACTIVE_AGENT_STATES = ["listening", "thinking", "speaking"];

function VoiceUI() {
  const session = useSessionContext();
  const agent = useAgent();
  const isAgentReady = ACTIVE_AGENT_STATES.includes(agent.state);
  const { send: sendChatMessage } = useChat();
  const [genUIContent, setGenUIContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [transcriptKey, setTranscriptKey] = useState(0);

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

  const handleEnd = useCallback(() => {
    session.end();
    setGenUIContent("");
  }, [session]);

  const handleReset = useCallback(() => {
    session.end();
    setGenUIContent("");
    setIsStreaming(false);
    setTranscriptKey((k) => k + 1);
    setTimeout(() => session.start(), 300);
  }, [session]);

  const handleAction = useCallback(
    (event: any) => {
      console.log("Action received:", event);
      if (event.type === "continue_conversation") {
        const message = event.params?.llmFriendlyMessage;
        if (message) {
          setIsProcessingAction(true);
          sendChatMessage(message);
        }
      }
    },
    [sendChatMessage],
  );

  return (
    <ThemeProvider>
      <div className="h-dvh flex flex-col overflow-hidden font-sans">
        {/* GenUI area */}
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          {genUIContent && !isProcessingAction ? (
            <div className="w-full max-w-225">
              <C1Component
                c1Response={genUIContent}
                isStreaming={isStreaming}
                onAction={handleAction}
              />
            </div>
          ) : isStreaming || isProcessingAction ? (
            <div className="w-full max-w-225">
              <GenUISkeleton />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#999] text-base">
              {session.isConnected && !isAgentReady ? (
                <ConnectingIndicator />
              ) : session.isConnected ? (
                <span className="text-center">
                  Ask me anything — I can search the web,
                  <br />
                  show products, visualize data, and more.
                </span>
              ) : (
                "Click Start to begin"
              )}
            </div>
          )}
        </div>

        {/* Live transcript strip */}
        {session.isConnected && <TranscriptStrip key={transcriptKey} />}

        {/* Controls */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-4 bg-white">
          <AgentStateIndicator
            state={agent.state}
            isConnected={session.isConnected}
            isAgentReady={isAgentReady}
          />

          {!session.isConnected ? (
            <button
              onClick={() => session.start()}
              className="px-8 py-3 rounded-full border-none bg-blue-600 text-white text-base font-semibold cursor-pointer"
            >
              Start
            </button>
          ) : (
            <>
              <MicToggle disabled={!isAgentReady} />
              <button
                onClick={handleReset}
                title="Reset — end and restart the conversation"
                className="w-10 h-10 rounded-full border border-gray-300 bg-transparent text-gray-500 text-base cursor-pointer flex items-center justify-center"
              >
                ↺
              </button>
              <button
                onClick={handleEnd}
                className="px-6 py-2.5 rounded-full border border-red-600 bg-transparent text-red-600 text-sm cursor-pointer"
              >
                End
              </button>
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

function TranscriptStrip() {
  const { agentTranscriptions, state: agentState } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const userTranscriptions = useTranscriptions({
    participantIdentities: localParticipant ? [localParticipant.identity] : [],
  });

  const agentTurnStartRef = useRef(0);
  const prevAgentStateRef = useRef<string>("");
  const [lastAgentText, setLastAgentText] = useState("");

  useEffect(() => {
    const prev = prevAgentStateRef.current;
    const curr = agentState;

    if (curr === "speaking" && prev !== "speaking") {
      agentTurnStartRef.current = agentTranscriptions.length;
    }

    if (curr !== "speaking" && prev === "speaking") {
      const text = agentTranscriptions
        .slice(agentTurnStartRef.current)
        .map((s) => s.text)
        .join(" ")
        .trim();
      if (text) setLastAgentText(text);
    }

    prevAgentStateRef.current = curr;
  }, [agentState]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveAgentText = agentTranscriptions
    .slice(agentTurnStartRef.current)
    .map((s) => s.text)
    .join(" ")
    .trim();

  const agentText = liveAgentText || lastAgentText;
  const userText = userTranscriptions.at(-1)?.text ?? "";

  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    if (agentState !== "speaking") return;
    const id = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(id);
  }, [agentState]);

  if (!userText && !agentText) return null;

  return (
    <div className="px-6 pt-2.5 pb-3 bg-[#f8f9fa] border-t border-[#f0f0f0] flex flex-col gap-1">
      {userText && (
        <TranscriptRow
          label="You"
          text={userText}
          labelColor="#999"
          textColor="#666"
        />
      )}
      {agentText && (
        <TranscriptRow
          label="AI"
          text={agentText}
          labelColor="#2563eb"
          textColor="#111"
          cursor={agentState === "speaking" ? cursorOn : undefined}
        />
      )}
    </div>
  );
}

function TranscriptRow({
  label,
  text,
  labelColor,
  textColor,
  cursor,
}: {
  label: string;
  text: string;
  labelColor: string;
  textColor: string;
  cursor?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 min-h-5">
      <span
        className="text-[10px] font-bold tracking-[0.6px] uppercase min-w-5.5 pt-0.75 shrink-0"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span
        className="text-[13px] leading-normal line-clamp-2"
        style={{ color: textColor }}
      >
        {text}
        {cursor !== undefined && (
          <span
            className={`inline-block w-[1.5px] h-3 bg-blue-600 ml-px align-middle transition-opacity duration-100 ${
              cursor ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </span>
    </div>
  );
}

function AgentStateIndicator({
  state,
  isConnected,
  isAgentReady,
}: {
  state: string;
  isConnected: boolean;
  isAgentReady: boolean;
}) {
  const stateColors: Record<string, string> = {
    listening: "#22c55e",
    thinking: "#f59e0b",
    speaking: "#2563eb",
  };
  const color = stateColors[state] ?? "#d1d5db";
  const label = isConnected && !isAgentReady ? "connecting..." : state;
  const dotColor = isConnected && !isAgentReady ? "#f59e0b" : color;

  return (
    <div className="flex items-center gap-1.5 min-w-22.5">
      <span
        className="w-1.75 h-1.75 rounded-full shrink-0"
        style={{
          background: dotColor,
          boxShadow:
            isConnected && !isAgentReady
              ? `0 0 6px ${dotColor}`
              : state === "speaking" || state === "listening"
                ? `0 0 6px ${color}`
                : "none",
        }}
      />
      <span className="text-[13px] text-[#888]">{label}</span>
    </div>
  );
}

function ConnectingIndicator() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-base text-[#999]">Getting ready{dots}</span>
      <span className="text-[13px] text-[#bbb]">
        Please wait until the agent is ready before speaking
      </span>
    </div>
  );
}

function GenUISkeleton() {
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setPulse((v) => !v), 700);
    return () => clearInterval(id);
  }, []);
  const bg = pulse ? "bg-gray-200" : "bg-gray-100";
  return (
    <div className="flex flex-col gap-4 py-2">
      <div
        className={`h-6 w-2/5 rounded-md transition-colors duration-700 ease-in-out ${bg}`}
      />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-45 rounded-xl transition-colors duration-700 ease-in-out ${bg}`}
          />
        ))}
      </div>
      <div
        className={`h-4 w-[70%] rounded-md transition-colors duration-700 ease-in-out ${bg}`}
      />
      <div
        className={`h-4 w-1/2 rounded-md transition-colors duration-700 ease-in-out ${bg}`}
      />
    </div>
  );
}

function MicToggle({ disabled }: { disabled?: boolean }) {
  const { enabled, toggle } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  return (
    <button
      onClick={() => toggle()}
      disabled={disabled}
      className={`w-12 h-12 rounded-full border-none text-white text-xl ${
        disabled
          ? "bg-gray-300 cursor-not-allowed opacity-60"
          : enabled
            ? "bg-blue-600 cursor-pointer"
            : "bg-red-600 cursor-pointer"
      }`}
      title={disabled ? "Waiting for agent..." : enabled ? "Mute" : "Unmute"}
    >
      {enabled ? "🎤" : "🔇"}
    </button>
  );
}
