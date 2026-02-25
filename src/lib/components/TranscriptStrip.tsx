import { useEffect, useMemo, useRef, useState } from "react";
import {
  useVoiceAssistant,
  useLocalParticipant,
  useTranscriptions,
} from "@livekit/components-react";
import styles from "./TranscriptStrip.module.css";

export function TranscriptStrip() {
  const { agentTranscriptions, state: agentState } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const rawUserTranscriptions = useTranscriptions({
    participantIdentities: localParticipant ? [localParticipant.identity] : [],
  });

  const userTurnStartRef = useRef(0);
  const agentTurnStartRef = useRef(0);
  const prevAgentStateRef = useRef("");
  const [lastUserText, setLastUserText] = useState("");
  const [lastAgentText, setLastAgentText] = useState("");

  const dedupedUserSegments = useMemo(() => {
    const bySegment = new Map<string, string>();
    for (const t of rawUserTranscriptions) {
      const segId = t.streamInfo.attributes?.["lk.segment_id"] ?? t.streamInfo.id;
      const isFinal = t.streamInfo.attributes?.["lk.transcription_final"] === "true";
      if (isFinal) {
        bySegment.set(segId, t.text);
      } else if (!bySegment.has(segId)) {
        bySegment.set(segId, t.text);
      }
    }
    return [...bySegment.values()];
  }, [rawUserTranscriptions]);

  useEffect(() => {
    const prev = prevAgentStateRef.current;
    const curr = agentState;

    if (curr === "speaking" && prev !== "speaking") {
      agentTurnStartRef.current = agentTranscriptions.length;
      const text = dedupedUserSegments
        .slice(userTurnStartRef.current)
        .join(" ")
        .trim();
      if (text) setLastUserText(text);
      userTurnStartRef.current = dedupedUserSegments.length;
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

  const liveUserText = dedupedUserSegments
    .slice(userTurnStartRef.current)
    .join(" ")
    .trim();

  const liveAgentText = agentTranscriptions
    .slice(agentTurnStartRef.current)
    .map((s) => s.text)
    .join(" ")
    .trim();

  const userText = liveUserText || lastUserText;
  const agentText = liveAgentText || lastAgentText;

  // Blinking cursor while agent is speaking
  const [cursorOn, setCursorOn] = useState(true);
  useEffect(() => {
    if (agentState !== "speaking") return;
    const id = setInterval(() => setCursorOn((v) => !v), 500);
    return () => clearInterval(id);
  }, [agentState]);

  if (!userText && !agentText) return null;

  return (
    <div className={styles.root}>
      {userText && (
        <div className={styles.row}>
          <span className={`${styles.label} ${styles.userLabel}`}>You</span>
          <div className={styles.rowContent}>
            <span className={styles.userText}>{userText}</span>
          </div>
        </div>
      )}
      {agentText && (
        <div className={styles.row}>
          <span className={`${styles.label} ${styles.agentLabel}`}>AI</span>
          <div className={styles.rowContent}>
            <span className={styles.agentText}>
              {agentText}
              {agentState === "speaking" && (
                <span
                  className={`${styles.cursor} ${cursorOn ? styles.cursorOn : styles.cursorOff}`}
                />
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
