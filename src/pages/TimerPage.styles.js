export const styles = {
  page: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
    padding: "18px 14px 110px",
    boxSizing: "border-box",
    color: "var(--p-text)",
  },

  heroCard: {
    background: "var(--p-hero-bg)",
    border: "1px solid var(--p-border)",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "14px",
    boxShadow: "var(--p-shadow-hero)",
  },

  kicker: {
    color: "var(--p-accent)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1px",
    marginBottom: "8px",
  },

  title: {
    fontSize: "26px",
    lineHeight: 1.2,
    margin: "0 0 8px",
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },

  subtitle: {
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.55,
    margin: "0 0 14px",
  },

  soundBox: {
    backgroundColor: "var(--p-bg-deep)",
    border: "1px solid var(--p-border)",
    borderRadius: "16px",
    padding: "12px",
  },

  soundHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  soundText: {
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 900,
  },

  soundStatus: {
    color: "var(--p-accent)",
    fontSize: "12px",
    fontWeight: 950,
  },

  soundOptionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },

  soundOptionButton: {
    width: "100%",
    border: "1px solid var(--p-border)",
    borderRadius: "14px",
    padding: "11px 12px",
    backgroundColor: "var(--p-bg-panel)",
    color: "var(--p-text)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
    textAlign: "left",
  },

  activeSoundOptionButton: {
    backgroundColor: "var(--p-accent-solid)",
    border: "1px solid var(--p-accent-solid)",
    color: "var(--p-on-accent)",
  },

  soundOptionLabel: {
    fontSize: "13px",
    fontWeight: 950,
  },

  soundOptionDescription: {
    color: "var(--p-text-soft)",
    fontSize: "11px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  headsetTip: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid var(--p-border-soft)",
    backgroundColor: "var(--p-bg-panel)",
    display: "grid",
    gap: "6px",
  },

  headsetTipTitle: {
    fontSize: "12px",
    fontWeight: 900,
    color: "var(--p-text)",
  },

  headsetTipCopy: {
    fontSize: "11px",
    lineHeight: 1.45,
    color: "var(--p-text-muted)",
  },

  timerCard: {
    backgroundColor: "var(--p-bg-panel)",
    border: "1px solid var(--p-border)",
    borderRadius: "26px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "14px",
    boxShadow: "var(--p-shadow-hero)",
  },

  timerTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  },

  phaseBadge: {
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: 900,
  },

  prepBadge: {
    backgroundColor: "var(--p-surface)",
    color: "var(--p-on-surface)",
  },

  workBadge: {
    backgroundColor: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
  },

  restBadge: {
    backgroundColor: "#6d8aa0",
    color: "#0e1519",
  },

  doneBadge: {
    backgroundColor: "#7d9d84",
    color: "#0d1710",
  },

  roundText: {
    color: "var(--p-accent)",
    fontSize: "14px",
    fontWeight: 900,
  },

  currentRoundName: {
    minHeight: "22px",
    fontSize: "17px",
    fontWeight: 900,
    marginBottom: "8px",
  },

  timeText: {
    fontSize: "62px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "1px",
    margin: "14px 0 18px",
  },

  sessionInfoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginBottom: "16px",
  },

  sessionInfoBox: {
    backgroundColor: "var(--p-bg-inner)",
    border: "1px solid var(--p-border)",
    borderRadius: "14px",
    padding: "10px 6px",
  },

  sessionInfoLabel: {
    display: "block",
    color: "var(--p-text-faint)",
    fontSize: "11px",
    fontWeight: 800,
    marginBottom: "4px",
  },

  sessionInfoValue: {
    color: "var(--p-text)",
    fontSize: "15px",
  },

  doneBox: {
    backgroundColor: "var(--p-done-bg)",
    border: "1px solid var(--p-accent-border)",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "14px",
  },

  completeTitle: {
    color: "var(--p-done-title)",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "1px",
    marginBottom: "6px",
  },

  savedText: {
    color: "var(--p-done-text)",
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.5,
    margin: "0 0 12px",
  },

  growthResult: {
    marginBottom: "12px",
    padding: "12px",
    border: "1px solid var(--p-accent-border)",
    borderRadius: "15px",
    background: "var(--p-bg-subtle)",
  },

  levelUpBadge: {
    display: "inline-block",
    marginBottom: "10px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.08em",
  },

  growthResultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "6px",
  },

  growthResultItem: {
    minWidth: 0,
    padding: "8px 4px",
    borderRadius: "11px",
    background: "var(--p-bg-inner)",
  },

  growthResultLabel: {
    display: "block",
    marginBottom: "5px",
    color: "var(--p-text-muted)",
    fontSize: "9px",
    fontWeight: 800,
  },

  growthResultValue: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "14px",
  },

  growthResultSub: {
    display: "block",
    marginTop: "3px",
    color: "var(--p-growth-soft)",
    fontSize: "10px",
    fontWeight: 800,
  },

  growthExpValue: {
    display: "block",
    color: "var(--p-growth)",
    fontSize: "13px",
  },

  levelProgressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
  },

  levelText: {
    color: "var(--p-text)",
    fontSize: "12px",
  },

  levelProgressText: {
    color: "var(--p-text-muted)",
    fontSize: "10px",
    fontWeight: 800,
  },

  levelProgressTrack: {
    height: "7px",
    marginTop: "7px",
    overflow: "hidden",
    borderRadius: "999px",
    background: "var(--p-bg-subtle)",
  },

  levelProgressFill: {
    height: "100%",
    minWidth: "3px",
    borderRadius: "999px",
    background: "var(--p-growth-fill)",
  },

  nextLevelText: {
    margin: "7px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "10px",
    textAlign: "right",
  },

  unlockNotice: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid var(--p-accent-border)",
    background: "var(--p-accent-bg)",
    textAlign: "left",
  },

  unlockNoticeLabel: {
    display: "block",
    marginBottom: "6px",
    color: "var(--p-accent)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },

  unlockNoticeTitle: {
    margin: 0,
    color: "var(--p-text)",
    fontSize: "20px",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },

  unlockNoticeItem: {
    margin: "4px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.06em",
  },

  unlockNoticeFlavor: {
    margin: "8px 0 0",
    color: "var(--p-text-soft)",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  unlockNoticeSub: {
    margin: "10px 0 0",
    paddingTop: "8px",
    borderTop: "1px solid var(--p-accent-border)",
    color: "var(--p-accent)",
    fontSize: "12px",
    fontWeight: 800,
  },

  goLogButton: {
    width: "100%",
    backgroundColor: "var(--p-accent)",
    color: "var(--p-on-accent)",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    marginTop: "8px",
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-strong)",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  homeResultButton: {
    width: "100%",
    marginTop: "8px",
    backgroundColor: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    border: "none",
    borderRadius: "14px",
    padding: "13px 16px",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  textResultButton: {
    width: "100%",
    marginTop: "6px",
    padding: "8px",
    border: "none",
    background: "transparent",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  buttonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  startButton: {
    backgroundColor: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    border: "none",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  pauseButton: {
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text)",
    border: "none",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  resetButton: {
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-strong)",
    borderRadius: "15px",
    padding: "15px",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  routineCard: {
    backgroundColor: "var(--p-bg-panel)",
    border: "1px solid var(--p-border)",
    borderRadius: "24px",
    padding: "16px",
    marginBottom: "14px",
  },

  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  cardTitle: {
    fontSize: "17px",
    margin: 0,
    fontWeight: 950,
  },

  cardHint: {
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
  },

  routineButtonGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "12px",
  },

  routineButton: {
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text-body)",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "18px",
    padding: "18px 10px",
    fontSize: "16px",
    fontWeight: 950,
    cursor: "pointer",
    minHeight: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  activeRoutineButton: {
    backgroundColor: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    border: "1px solid var(--p-accent-solid)",
  },

  selectedRoutineBox: {
    backgroundColor: "var(--p-bg-deep)",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "18px",
    padding: "14px",
  },

  selectedRoutineTitle: {
    fontSize: "16px",
    fontWeight: 950,
    marginBottom: "6px",
  },

  selectedRoutineDescription: {
    color: "var(--p-text-muted)",
    fontSize: "12px",
    marginTop: 0,
    marginBottom: "12px",
    lineHeight: 1.5,
  },

  roundPreviewGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },

  settingCard: {
    backgroundColor: "var(--p-bg-card)",
    border: "1px solid var(--p-border)",
    borderRadius: "24px",
    padding: "16px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "12px",
    color: "var(--p-text-body)",
    fontSize: "13px",
    fontWeight: 850,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "var(--p-input-bg)",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-strong)",
    borderRadius: "12px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: 800,
    outline: "none",
  },

  settingGroup: {
    backgroundColor: "var(--p-bg-deep)",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "18px",
    padding: "14px",
    marginBottom: "12px",
  },

  settingLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },

  settingLabel: {
    color: "var(--p-text-body)",
    fontSize: "13px",
    fontWeight: 900,
  },

  timeDisplay: {
    color: "var(--p-text)",
    fontSize: "18px",
    fontWeight: 950,
    letterSpacing: "0.5px",
  },

  timeButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "8px",
  },

  timeAdjustButton: {
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "12px",
    padding: "12px 6px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
  },

  quickButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginBottom: "8px",
  },

  quickSelectButton: {
    backgroundColor: "var(--p-bg-inner)",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "12px",
    padding: "12px 6px",
    fontSize: "13px",
    fontWeight: 900,
    cursor: "pointer",
  },

  activeQuickSelectButton: {
    backgroundColor: "var(--p-accent-solid)",
    border: "1px solid var(--p-accent-solid)",
  },

  curriculumGuide: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "18px",
    background: "var(--p-bg-deep)",
    border: "1px solid var(--p-border)",
    textAlign: "left",
  },

  curriculumGuideCompactHead: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },

  curriculumGoalCompact: {
    margin: "4px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  curriculumToggleButton: {
    width: "100%",
    marginBottom: "10px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid var(--p-border-soft)",
    background: "var(--p-bg-inner)",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  curriculumEndButton: {
    width: "100%",
    marginTop: "10px",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid var(--p-accent-border)",
    background: "transparent",
    color: "var(--p-accent-soft)",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
  },

  curriculumGuideKicker: {
    color: "var(--p-brass)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.12em",
  },

  curriculumGuideTitle: {
    color: "var(--p-text)",
    fontSize: "16px",
    fontWeight: 900,
    lineHeight: 1.35,
  },

  curriculumGoal: {
    margin: "0 0 12px",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  curriculumFocus: {
    padding: "12px 14px",
    borderRadius: "14px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
    marginBottom: "12px",
  },

  curriculumFocusLabel: {
    display: "block",
    color: "var(--p-accent)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.08em",
    marginBottom: "6px",
  },

  curriculumFocusName: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "17px",
    fontWeight: 950,
    lineHeight: 1.3,
  },

  curriculumFocusDuration: {
    display: "inline-block",
    marginTop: "6px",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "var(--p-bg-inner)",
    color: "var(--p-text-muted)",
    fontSize: "10px",
    fontWeight: 800,
    fontStyle: "normal",
  },

  curriculumFocusDescription: {
    margin: "8px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  curriculumDrillList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: "8px",
  },

  curriculumDrillItem: {
    padding: "10px 12px",
    borderRadius: "12px",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-soft)",
  },

  curriculumDrillItemActive: {
    border: "1px solid var(--p-accent)",
    background: "var(--p-bg-subtle)",
  },

  curriculumDrillName: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 900,
  },

  curriculumDrillDuration: {
    display: "inline-block",
    marginTop: "4px",
    color: "var(--p-text-muted)",
    fontSize: "10px",
    fontWeight: 800,
  },

  curriculumDrillDescription: {
    margin: "4px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  curriculumDrillHeading: {
    margin: "0 0 8px",
    color: "var(--p-text-muted)",
    fontSize: "11px",
    fontWeight: 800,
  },
};
