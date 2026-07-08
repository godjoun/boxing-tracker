import { useMemo } from "react";
import {
  getCurriculumProgress,
  getRecommendedSession,
} from "../utils/homeCurriculum";
import { isComboCreatorUnlocked, COMBO_CREATOR_UNLOCK_LEVEL } from "../utils/featureUnlocks";

export default function TrainingHubPage({
  fighterLevel = 1,
  onStartSession,
  onOpenTimer,
  onOpenCurriculum,
  onOpenComboCreator,
  onOpenStrength,
}) {
  const { progress, recommended } = useMemo(() => {
    const curriculumProgress = getCurriculumProgress();
    return {
      progress: curriculumProgress,
      recommended: getRecommendedSession(curriculumProgress),
    };
  }, []);

  const comboUnlocked = isComboCreatorUnlocked(fighterLevel);

  const secondaryItems = [
    {
      id: "curriculum",
      icon: "C",
      title: "커리큘럼 전체",
      description: "4주 프로그램 보기",
      onClick: onOpenCurriculum,
      locked: false,
    },
    {
      id: "combo",
      icon: "◆",
      title: "콤보 만들기",
      description: comboUnlocked
        ? "나만의 섀도우 루틴"
        : `LV.${COMBO_CREATOR_UNLOCK_LEVEL} 해금`,
      onClick: onOpenComboCreator,
      locked: !comboUnlocked,
    },
    {
      id: "strength",
      icon: "B",
      title: "훈련법 추천",
      description: "몸강화 · 요일별",
      onClick: onOpenStrength,
      locked: false,
    },
  ];

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>훈련</h1>
        <p style={styles.subtitle}>
          오늘 할 훈련을 고르세요. 커리큘럼을 따라가거나 바로 라운드를
          돌릴 수 있어요.
        </p>
      </header>

      <section style={styles.primaryCard}>
        <span style={styles.cardKicker}>오늘의 커리큘럼</span>

        {recommended ? (
          <>
            <div style={styles.recommendMeta}>
              {recommended.weekLabel ? (
                <span style={styles.badge}>{recommended.weekLabel}</span>
              ) : null}
              {recommended.code ? (
                <span style={styles.badgeMuted}>{recommended.code}</span>
              ) : null}
            </div>

            <h2 style={styles.recommendTitle}>{recommended.title}</h2>
            {recommended.goal ? (
              <p style={styles.recommendGoal}>{recommended.goal}</p>
            ) : null}

            <div style={styles.progressRow}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress.progressPercent}%`,
                  }}
                />
              </div>
              <span style={styles.progressText}>
                {progress.completedCount}/{progress.totalSessions}
              </span>
            </div>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => onStartSession?.(recommended)}
            >
              오늘 세션 시작 →
            </button>
          </>
        ) : (
          <>
            <h2 style={styles.recommendTitle}>커리큘럼 완주 🎉</h2>
            <p style={styles.recommendGoal}>
              모든 세션을 마쳤어요. 원하는 세션을 다시 골라 훈련하세요.
            </p>
            <button
              type="button"
              style={styles.primaryButton}
              onClick={onOpenCurriculum}
            >
              커리큘럼 다시 보기 →
            </button>
          </>
        )}
      </section>

      <section style={styles.quickCard}>
        <div style={styles.quickText}>
          <span style={styles.cardKicker}>빠른 타이머</span>
          <strong style={styles.quickTitle}>3R · 6R · 9R 라운드</strong>
          <span style={styles.quickDesc}>커리큘럼 없이 바로 라운드 돌리기</span>
        </div>
        <button type="button" style={styles.quickButton} onClick={onOpenTimer}>
          타이머 열기
        </button>
      </section>

      <section>
        <p style={styles.sectionLabel}>더 많은 훈련</p>
        <div style={styles.grid}>
          {secondaryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              style={{
                ...styles.tile,
                ...(item.locked ? styles.tileLocked : {}),
              }}
              onClick={item.onClick}
            >
              <span style={styles.tileIcon} aria-hidden="true">
                {item.icon}
              </span>
              <strong style={styles.tileTitle}>{item.title}</strong>
              <small style={styles.tileDesc}>{item.description}</small>
            </button>
          ))}
        </div>
      </section>
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
    color: "var(--p-text-muted)",
  },

  primaryCard: {
    borderRadius: "24px",
    padding: "22px",
    marginBottom: "14px",
    background:
      "radial-gradient(circle at 82% 8%, rgba(214, 162, 52, 0.28), transparent 42%), linear-gradient(150deg, #1b1509, #0b0b0c)",
    border: "1px solid rgba(214, 162, 52, 0.3)",
    color: "#fff",
  },

  cardKicker: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "rgba(232, 198, 106, 0.95)",
  },

  recommendMeta: {
    display: "flex",
    gap: "6px",
    margin: "12px 0 8px",
  },

  badge: {
    fontSize: "11px",
    fontWeight: 800,
    padding: "3px 9px",
    borderRadius: "999px",
    background: "rgba(232, 198, 106, 0.16)",
    color: "#e8c66a",
  },

  badgeMuted: {
    fontSize: "11px",
    fontWeight: 800,
    padding: "3px 9px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255,255,255,0.66)",
  },

  recommendTitle: {
    margin: "0 0 6px",
    fontSize: "22px",
    fontWeight: 900,
  },

  recommendGoal: {
    margin: "0 0 16px",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.72)",
  },

  progressRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },

  progressTrack: {
    flex: 1,
    height: "8px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #e8c66a, #c49a2e)",
  },

  progressText: {
    fontSize: "12px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.72)",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
    background: "linear-gradient(135deg, #e8c66a, #c49a2e)",
    color: "#1f1a12",
  },

  quickCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    borderRadius: "20px",
    padding: "18px",
    marginBottom: "22px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  quickText: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  quickTitle: {
    fontSize: "16px",
    fontWeight: 900,
    color: "var(--p-text)",
  },

  quickDesc: {
    fontSize: "12px",
    color: "var(--p-text-muted)",
  },

  quickButton: {
    flexShrink: 0,
    border: "1px solid var(--p-border-strong)",
    borderRadius: "14px",
    padding: "12px 16px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    background: "var(--p-bg-deep)",
    color: "var(--p-text)",
  },

  sectionLabel: {
    margin: "0 0 10px",
    fontSize: "13px",
    fontWeight: 900,
    color: "var(--p-text)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },

  tile: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    textAlign: "left",
    borderRadius: "18px",
    padding: "16px",
    cursor: "pointer",
    background: "var(--p-bg-deep)",
    border: "1px solid var(--p-border-strong)",
    color: "var(--p-text)",
  },

  tileLocked: {
    opacity: 0.55,
  },

  tileIcon: {
    fontSize: "18px",
    fontWeight: 900,
    color: "var(--p-accent, #e8c66a)",
  },

  tileTitle: {
    fontSize: "15px",
    fontWeight: 900,
  },

  tileDesc: {
    fontSize: "12px",
    color: "var(--p-text-muted)",
  },
};
