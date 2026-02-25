import styles from "./status-indicators.module.css";

export function SpinRing({ size = 13 }: { size?: number }) {
  return (
    <div
      className={styles.spinRing}
      style={{ width: size, height: size }}
    />
  );
}

export function SoundBars({ count = 4, height = 16 }: { count?: number; height?: number }) {
  const heights = [42, 82, 55, 90, 62, 75];
  return (
    <div className={styles.bars} style={{ height }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={styles.bar}
          style={{
            height: `${heights[i % heights.length]}%`,
            animationDuration: `${0.44 + i * 0.13}s`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ThinkDots() {
  return (
    <div className={styles.dots}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={styles.dot}
          style={{ animationDelay: `${i * 0.21}s` }}
        />
      ))}
    </div>
  );
}

export function PulseCircle() {
  return (
    <div className={styles.pulseWrap}>
      <div className={styles.pulseOuter} />
      <div className={styles.pulseInner} />
    </div>
  );
}
