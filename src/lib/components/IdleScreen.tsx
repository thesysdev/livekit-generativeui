import { useState } from "react";
import { useDarkMode, STARTERS } from "./theme";
import { PlayIcon, SunIcon, MoonIcon } from "./icons";
import { SpinRing } from "./status-indicators";
import styles from "./IdleScreen.module.css";

interface IdleScreenProps {
  onStart: () => void;
  startPending: boolean;
}

export function IdleScreen({ onStart, startPending }: IdleScreenProps) {
  const { dark, toggle } = useDarkMode();
  const [themeAnim, setThemeAnim] = useState(false);

  const handleThemeToggle = () => {
    toggle();
    setThemeAnim(true);
    setTimeout(() => setThemeAnim(false), 520);
  };

  return (
    <div className={styles.root}>
      <button
        className={styles.themeToggle}
        onClick={handleThemeToggle}
        title={dark ? "Light mode" : "Dark mode"}
      >
        <span className={themeAnim ? styles.themeFlip : undefined} style={{ display: "flex" }}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </span>
      </button>

      <div className={styles.hero}>
        <h1 className={styles.title}>genie</h1>
        <p className={styles.subtitle}>
          Get Generative UI responses<br />for voice inputs
        </p>
      </div>

      <button
        className={`${styles.startBtn} ${startPending ? styles.loading : ""}`}
        onClick={startPending ? undefined : onStart}
      >
        {startPending ? (
          <>
            <SpinRing size={18} /> Connecting
          </>
        ) : (
          <>
            <PlayIcon /> Start
          </>
        )}
      </button>

      {!startPending && (
        <div className={styles.starters}>
          <span className={styles.startersLabel}>Try these</span>
          {STARTERS.map((s) => (
            <button key={s} className={styles.starterBtn} onClick={onStart}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
