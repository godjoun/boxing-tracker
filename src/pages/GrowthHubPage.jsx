import { useMemo } from "react";
import { useTraining } from "../store/TrainingContext";
import { getFighterProgress } from "../utils/fighterProgress";
import { buildAllTimeStats } from "../utils/trainingStats";

export default function GrowthHubPage({
  onOpenStats,
  onOpenWeekly,
  onOpenJourney,
  onStartTraining,
}) {
  const { logs, weeklyScore } = useTraining();

  const { fighter, stats } = useMemo(() => {
    return {
      fighter: getFighterProgress(logs),
      stats: buildAllTimeStats(logs),
    };
  }, [logs]);

  const isEmpty = fighter.totalLogs === 0;

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
    <main className="hub-page">
      <header style={styles.header}>
        <h1 style={styles.title}>성장</h1>
        <p style={styles.subtitle}>
          내 훈련이 어떻게 쌓이고 있는지 한눈에 확인하세요.
        </p>
      </header>

      {isEmpty ? (
        <section style={styles.emptyCard}>
          <p style={styles.emptyKicker}>FIRST ROUND</p>
          <h2 style={styles.emptyTitle}>아직 훈련 기록이 없어요</h2>
          <p style={styles.emptyText}>
            타이머로 첫 라운드를 완료하면 EXP가 쌓이고, 여기에 성장 데이터가
            표시됩니다.
          </p>
          <button
            type="button"
            style={styles.emptyButton}
            onClick={onStartTraining}
          >
            3R 바로 시작하기
          </button>
        </section>
      ) : null}

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
          <span style={styles.summaryLabel}>이번 주 EXP</span>
          <strong style={styles.summaryValue}>{weeklyScore}</strong>
        </div>
      </section>

      <p style={styles.expHint}>주간 EXP = 이번 주 획득한 경험치 합계입니다.</p>

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
    color: "var(--p-text-muted)",
  },

  emptyCard: {
    borderRadius: "22px",
    padding: "20px",
    marginBottom: "14px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
    color: "var(--p-text)",
  },

  emptyKicker: {
    margin: "0 0 6px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    color: "var(--p-accent)",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    fontWeight: 900,
  },

  emptyText: {
    margin: "0 0 16px",
    fontSize: "13px",
    lineHeight: 1.55,
    color: "var(--p-text-muted)",
  },

  emptyButton: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "14px",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
    background: "linear-gradient(135deg, #e8c66a, #c49a2e)",
    color: "#1f1a12",
  },

  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "8px",
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  expHint: {
    margin: "0 0 18px",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "var(--p-text-muted)",
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
    color: "var(--p-text-muted)",
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
    background: "var(--p-bg-deep)",
    border: "1px solid var(--p-border-strong)",
    color: "var(--p-text)",
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
    color: "var(--p-text-muted)",
  },

  tileArrow: {
    flexShrink: 0,
    fontSize: "18px",
    fontWeight: 900,
    color: "var(--p-text-faint)",
  },
};
