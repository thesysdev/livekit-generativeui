import { useEffect, useState } from "react";
import { C1Component } from "@thesysai/genui-sdk";
import styles from "./GenUIPanel.module.css";

interface GenUIPanelProps {
  content: string;
  isStreaming: boolean;
  isProcessingAction: boolean;
  isAgentReady: boolean;
  onAction: (event: { type?: string; params?: Record<string, any> }) => void;
}

export function GenUIPanel({
  content,
  isStreaming,
  isProcessingAction,
  isAgentReady,
  onAction,
}: GenUIPanelProps) {
  if (content && !isProcessingAction) {
    return (
      <div className={styles.root}>
        <div className={styles.content}>
          <C1Component
            c1Response={content}
            isStreaming={isStreaming}
            onAction={onAction}
          />
        </div>
      </div>
    );
  }

  if (isStreaming || isProcessingAction) {
    return (
      <div className={styles.root}>
        <div className={styles.content}>
          <Skeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.emptyState}>
        {!isAgentReady ? (
          <ConnectingIndicator />
        ) : (
          <span className={styles.emptyText}>
            Ask me anything — I can search the web,
            <br />
            show products, visualize data, and more.
          </span>
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skelLine} style={{ width: "40%" }} />
      <div className={styles.skelCards}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={styles.skelCard}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <div className={styles.skelLineB} style={{ width: "70%", animationDelay: "0.3s" }} />
      <div className={styles.skelLineB} style={{ width: "50%", animationDelay: "0.45s" }} />
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
    <div className={styles.connecting}>
      <span className={styles.connectingText}>Getting ready{dots}</span>
      <span className={styles.connectingSub}>
        Please wait until the agent is ready before speaking
      </span>
    </div>
  );
}
