import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import { getFighterProgress } from "../utils/fighterProgress";
import { buildAllTimeStats } from "../utils/trainingStats";

export default function GrowthHubPage({
  onOpenStats,
  onOpenWeekly,
  onOpenJourney,
}) {
  const { logs, weeklyScore } = useTraining();

  const { fighter, stats } = useMemo(() => {
    return {
      fighter: getFighterProgress(logs),
      stats: buildAllTimeStats(logs),
    };
  }, [logs]);

  const items = [
    {
      id: "stats",
      icon: "↗",
      title: "성장 분석",
      description: "라운드·볼륨과 훈련 구성 분석",
      onClick: onOpenStats,
    },
    {
      id: "weekly",
      icon: "W",
      title: "주간 리포트",
      description: "이번 주 훈련 요약",
      onClick: onOpenWeekly,
    },
    {
      id: "journey",
      icon: "F",
      title: "나의 여정",
      description: "타임라인 · 칭호 도감 · 업적",
      onClick: onOpenJourney,
    },
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>성장</h1>
        <p style={styles.subtitle}>
          내 훈련이 어떻게 쌓이고 있는지 한눈에 확인하세요.
        </p>
      </header>

      <section style={styles.summaryCard}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>레벨</span>
          <strong style={styles.summaryValue}>LV.{fighter.level}</strong>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>누적 라운드</span>
          <strong style={styles.summaryValue}>{stats.totalRounds}R</strong>
        </div>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>이번 주 점수</span>
          <strong style={styles.summaryValue}>{weeklyScore}점</strong>
        </div>
      </section>

      <div style={styles.grid}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            style={styles.tile}
            onClick={item.onClick}
          >
            <span style={styles.tileIcon} aria-hidden="true">
              {item.icon}
            </span>
            <div style={styles.tileText}>
              <strong style={styles.tileTitle}>{item.title}</strong>
              <small style={styles.tileDesc}>{item.description}</small>
            </div>
            <span style={styles.tileArrow} aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto",
    padding: "24px 16px 40px",
    boxSizing: "border-box",
  },

  header: {
    marginBottom: "18px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "26px",
    fontWeight: 900,
  },

  subtitle: {
    margin: 0,
    fontSize: "13px",
    lineHeight: 1.5,
    color: "var(--p-text-muted, rgba(255,255,255,0.6))",
  },

  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "18px",
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle, rgba(255,255,255,0.05))",
    border: "1px solid var(--p-border-soft, rgba(255,255,255,0.08))",
  },

  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "center",
    textAlign: "center",
  },

  summaryLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--p-text-muted, rgba(255,255,255,0.55))",
  },

  summaryValue: {
    fontSize: "18px",
    fontWeight: 900,
  },

  grid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  tile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    textAlign: "left",
    borderRadius: "18px",
    padding: "18px",
    cursor: "pointer",
    background: "var(--p-bg-deep, #16181c)",
    border: "1px solid var(--p-border-strong, rgba(255,255,255,0.12))",
    color: "var(--p-text, #fff)",
  },

  tileIcon: {
    flexShrink: 0,
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    fontSize: "18px",
    fontWeight: 900,
    background: "rgba(232, 198, 106, 0.14)",
    color: "#e8c66a",
  },

  tileText: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  tileTitle: {
    fontSize: "16px",
    fontWeight: 900,
  },

  tileDesc: {
    fontSize: "12px",
    color: "var(--p-text-muted, rgba(255,255,255,0.6))",
  },

  tileArrow: {
    flexShrink: 0,
    fontSize: "18px",
    fontWeight: 900,
    color: "var(--p-text-muted, rgba(255,255,255,0.4))",
  },
};
