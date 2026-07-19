export const styles = {
  page: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto",
    padding: "18px 16px 110px",
    color: "var(--p-text)",
    boxSizing: "border-box",
  },

  profileCard: {
    borderRadius: "30px",
    padding: "26px",
    background:
      "var(--p-hero-bg)",
    border: "1px solid var(--p-border-strong)",
    boxShadow: "var(--p-shadow-hero)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },

  kicker: {
    margin: "0 0 10px",
    color: "var(--p-brass)",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.16em",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.12,
    letterSpacing: "-0.05em",
  },

  profileSetupHint: {
    margin: "10px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  tierBadge: {
    flexShrink: 0,
    width: "92px",
    height: "92px",
    borderRadius: "24px",
    background: "var(--p-accent-bg)",
    border: "1px solid var(--p-accent-border)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  tierLabel: {
    color: "var(--p-text-muted)",
    fontSize: "11px",
    fontWeight: 900,
  },

  tierName: {
    marginTop: "6px",
    fontSize: "18px",
  },

  photoSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "24px",
  },

  photoCircle: {
    width: "108px",
    height: "108px",
    borderRadius: "30px",
    overflow: "hidden",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-strong)",
    flexShrink: 0,
  },

  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  photoPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "var(--p-text-muted)",
  },

  photoButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    flex: 1,
  },

  profileActionButton: {
    flex: "1 1 120px",
    minWidth: "120px",
  },

  photoButton: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  darkButton: {
    border: "1px solid var(--p-border-strong)",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "var(--p-bg-inner)",
    color: "var(--p-text)",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  profileSaveInlineButton: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "var(--p-accent)",
    color: "var(--p-on-accent)",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  profileNameBox: {
    marginTop: "18px",
    borderRadius: "20px",
    padding: "16px",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-soft)",
  },

  profileNameLabel: {
    display: "block",
    color: "var(--p-text-faint)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "8px",
  },

  profileName: {
    fontSize: "24px",
  },

  profileBio: {
    margin: "10px 0 0",
    color: "var(--p-text-soft)",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  profileSpecSummary: {
    margin: "10px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  profileSpecChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },

  profileSpecChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 11px",
    borderRadius: "999px",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-soft)",
    color: "var(--p-text-body)",
    fontSize: "12px",
    fontWeight: 700,
  },

  profileSpecChipLabel: {
    color: "var(--p-text-faint)",
    fontSize: "11px",
    fontWeight: 800,
  },

  profileEditPanel: {
    marginTop: "16px",
    borderRadius: "18px",
    background: "var(--p-card)",
    border: "1px solid var(--p-border)",
    overflow: "hidden",
  },

  profileEditToggle: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "16px 18px",
    border: "none",
    background: "transparent",
    color: "var(--p-text)",
    cursor: "pointer",
    textAlign: "left",
  },

  profileEditToggleCopy: {
    minWidth: 0,
    flex: 1,
  },

  profileEditToggleTitle: {
    margin: 0,
    fontSize: "14px",
    fontWeight: 900,
    color: "var(--p-text)",
  },

  profileEditToggleHint: {
    display: "block",
    marginTop: "5px",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  profileEditToggleAction: {
    flexShrink: 0,
    color: "#8a2e2e",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  profileEditContent: {
    padding: 0,
    borderTop: "none",
  },

  profileEditSection: {
    paddingTop: "16px",
  },

  profileEditSectionTitle: {
    margin: "0 0 14px",
    color: "#8a2e2e",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.14em",
  },

  bodySpecsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  fieldLabel: {
    display: "block",
    marginBottom: "12px",
    color: "#8a2e2e",
    fontSize: "13px",
    fontWeight: 800,
  },

  fieldHint: {
    display: "block",
    marginTop: "6px",
    color: "#a34a4a",
    fontSize: "11px",
    fontWeight: 600,
  },

  profileSaveFooter: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(138, 46, 46, 0.14)",
  },

  profileSaveButton: {
    width: "100%",
    minHeight: "48px",
    border: "none",
    borderRadius: "14px",
    background: "#8a2e2e",
    color: "#f5f1e8",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(70, 18, 18, 0.2)",
  },

  profileSaveError: {
    margin: "0 0 12px",
    color: "#8a2e2e",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  sectionDividerLabel: {
    margin: "18px 0 0",
    color: "#8a2e2e",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.16em",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "8px",
    backgroundColor: "#ffffff",
    color: "var(--p-text)",
    border: "1px solid rgba(138, 46, 46, 0.22)",
    borderRadius: "12px",
    padding: "12px 13px",
    fontSize: "14px",
    fontWeight: 700,
    outline: "none",
  },

  label: {
    display: "block",
    marginBottom: "12px",
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 800,
  },

  textarea: {
    width: "100%",
    minHeight: "84px",
    boxSizing: "border-box",
    marginTop: "8px",
    backgroundColor: "#ffffff",
    color: "var(--p-text)",
    border: "1px solid rgba(138, 46, 46, 0.22)",
    borderRadius: "12px",
    padding: "12px 13px",
    fontSize: "14px",
    fontWeight: 700,
    outline: "none",
    resize: "vertical",
    lineHeight: 1.5,
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginTop: "16px",
  },

  statBox: {
    borderRadius: "24px",
    padding: "18px",
    background: "var(--p-bg-panel)",
    border: "1px solid var(--p-border)",
  },

  statLabel: {
    display: "block",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "10px",
  },

  statValue: {
    display: "block",
    fontSize: "30px",
    lineHeight: 1,
  },

  cardMakerSection: {
    marginTop: "16px",
    scrollMarginTop: "18px",
    borderRadius: "26px",
    padding: "21px",
    background: "var(--p-bg-card)",
    border: "1px solid var(--p-border)",
  },

  cardStudioEntry: {
    width: "100%",
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "24px",
    padding: "22px",
    color: "var(--p-text)",
    border: "1px solid var(--p-border-strong)",
    background: "var(--p-hero-bg)",
    boxShadow: "var(--p-shadow-hero)",
  },

  cardStudioEntryKicker: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.04em",
    color: "var(--p-brass)",
  },

  cardStudioEntryTitle: {
    fontSize: "19px",
    fontWeight: 900,
  },

  cardStudioEntryDesc: {
    fontSize: "13px",
    lineHeight: 1.5,
    color: "var(--p-text-muted)",
  },

  cardStudioEntryCta: {
    marginTop: "6px",
    fontSize: "14px",
    fontWeight: 900,
    color: "var(--p-accent)",
  },

  studioBackButton: {
    marginBottom: "4px",
    alignSelf: "flex-start",
    border: "1px solid var(--p-border-strong)",
    borderRadius: "14px",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    background: "var(--p-bg-deep)",
    color: "var(--p-text)",
  },

  studioTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "6px",
    padding: "6px",
    borderRadius: "18px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
    margin: "12px 0 16px",
    position: "sticky",
    top: "10px",
    zIndex: 5,
    backdropFilter: "blur(10px)",
  },

  studioTab: {
    border: "none",
    borderRadius: "14px",
    padding: "10px 8px",
    background: "transparent",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  studioTabActive: {
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    boxShadow: "var(--p-shadow-accent)",
  },

  recentTrainingNotice: {
    marginBottom: "16px",
    padding: "15px",
    borderRadius: "18px",
    background: "var(--p-brass-bg)",
    border: "1px solid var(--p-brass-border)",
  },

  recentTrainingBadge: {
    display: "inline-block",
    marginBottom: "9px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "var(--p-brass)",
    color: "var(--p-on-accent)",
    fontSize: "11px",
    fontWeight: 900,
  },

  recentTrainingTitle: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "15px",
    fontWeight: 900,
    marginBottom: "5px",
  },

  recentTrainingText: {
    margin: 0,
    color: "var(--p-text-soft)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  selectorSection: {
    marginBottom: "16px",
  },

  logSelectList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  logSelectItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    border: "1px solid var(--p-border-soft)",
    borderRadius: "18px",
    background: "var(--p-bg-deep)",
    padding: "14px",
    color: "var(--p-text)",
    cursor: "pointer",
    textAlign: "left",
  },

  logSelectItemActive: {
    border: "1px solid var(--p-accent-solid)",
    background: "var(--p-accent-bg)",
  },

  logSelectCheck: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    border: "1px solid var(--p-border-strong)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 900,
    flexShrink: 0,
  },

  logSelectTitle: {
    display: "block",
    fontSize: "15px",
    fontWeight: 900,
  },

  logSelectMeta: {
    margin: "6px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.4,
  },

  cardPhotoBox: {
    marginTop: "6px",
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  cardMakerLabel: {
    margin: "0 0 8px",
    color: "var(--p-text)",
    fontSize: "14px",
    fontWeight: 900,
  },

  cardMakerHelp: {
    margin: "0 0 14px",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  cardMakerNameplateNote: {
    margin: "0 0 16px",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid var(--p-accent-border)",
    background: "var(--p-accent-bg)",
    color: "var(--p-text-body)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  cardPhotoButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "8px",
  },

  videoNotice: {
    margin: "12px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  filterSection: {
    marginBottom: "16px",
  },

  cardStyleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },

  cardStyleButton: {
    border: "1px solid var(--p-border-strong)",
    borderRadius: "16px",
    padding: "14px",
    background: "var(--p-bg-deep)",
    color: "var(--p-text)",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  activeCardStyleButton: {
    background: "var(--p-accent-bg)",
    color: "var(--p-accent)",
    border: "1px solid var(--p-accent-border)",
  },

  filterGroup: {
    marginBottom: "14px",
  },

  filterGroupLabel: {
    margin: "0 0 8px",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  filterButton: {
    border: "1px solid var(--p-border-strong)",
    borderRadius: "16px",
    padding: "10px 12px",
    background: "var(--p-bg-deep)",
    color: "var(--p-text)",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  activeFilterButton: {
    background: "var(--p-accent-bg)",
    border: "1px solid var(--p-accent-border)",
    color: "var(--p-accent-soft)",
  },

  filterChipTitle: {
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "-0.01em",
  },

  filterChipLock: {
    fontSize: "11px",
    fontWeight: 800,
    opacity: 0.72,
  },

  lockedFilterButton: {
    opacity: 0.52,
    cursor: "not-allowed",
  },

  livePreviewSection: {
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  livePreviewHeader: {
    marginBottom: "10px",
  },

  livePreviewFrame: {
    borderRadius: "18px",
    overflow: "hidden",
    border: "1px solid var(--p-border-soft)",
    background: "var(--p-bg-deep)",
  },

  livePreviewPhotoArea: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    overflow: "hidden",
    background: "#141414",
  },

  livePreviewImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  livePreviewOverlay: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },

  livePreviewBadge: {
    position: "absolute",
    left: "10px",
    bottom: "10px",
    padding: "10px 12px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    background: "rgba(0, 0, 0, 0.38)",
    backdropFilter: "blur(10px)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxWidth: "70%",
    pointerEvents: "none",
  },

  livePreviewBadgeKicker: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.06em",
    color: "rgba(255, 255, 255, 0.7)",
  },

  livePreviewBadgeValue: {
    fontSize: "18px",
    fontWeight: 950,
    letterSpacing: "-0.02em",
  },

  livePreviewBadgeSub: {
    fontSize: "11px",
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.76)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  livePreviewPosterLabel: {
    position: "absolute",
    left: "10px",
    top: "10px",
    padding: "10px 12px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    background: "rgba(0, 0, 0, 0.34)",
    backdropFilter: "blur(10px)",
    color: "#ffffff",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    maxWidth: "78%",
    pointerEvents: "none",
  },

  livePreviewPosterName: {
    fontSize: "14px",
    fontWeight: 950,
    letterSpacing: "-0.02em",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  livePreviewPosterEvent: {
    fontSize: "11px",
    fontWeight: 800,
    color: "rgba(255, 255, 255, 0.76)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  livePreviewSocialTag: {
    position: "absolute",
    left: "10px",
    top: "10px",
    padding: "7px 10px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.06em",
    pointerEvents: "none",
  },

  livePreviewEmpty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    fontWeight: 800,
    padding: "12px",
    textAlign: "center",
  },

  adjustSection: {
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  rangeLabel: {
    marginTop: "12px",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 900,
  },

  rangeInput: {
    width: "100%",
    accentColor: "#8a2e2e",
  },

  commentToggle: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "var(--p-text)",
    fontSize: "14px",
    fontWeight: 900,
  },

  commentCheckbox: {
    width: "18px",
    height: "18px",
    accentColor: "#8a2e2e",
  },

  commentToggleHelp: {
    margin: "8px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  trainingCard: {
    margin: "16px auto 0",
    width: "min(100%, 390px)",
    borderRadius: "30px",
    overflow: "hidden",
    border: "1px solid var(--p-border-soft)",
    boxShadow: "var(--p-shadow-hero)",
  },

  trainingCardPhotoArea: {
    position: "relative",
    minHeight: "650px",
    overflow: "hidden",
  },

  trainingCardImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    transformOrigin: "center",
  },

  trainingCardDefaultBg: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(255, 255, 255, 0.04), transparent 34%)",
  },

  trainingCardOverlay: {
    position: "absolute",
    inset: 0,
  },

  trainingCardTextLayer: {
    position: "relative",
    zIndex: 1,
    minHeight: "650px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "22px",
    boxSizing: "border-box",
  },

  trainingCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },

  trainingCardKicker: {
    color: "var(--p-text)",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.16em",
  },

  trainingCardBottomContent: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
  },


  basicPosterInfo: {
    width: "min(320px, 86%)",
    display: "flex",
    alignItems: "stretch",
    gap: "12px",
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },
  
  basicPosterLine: {
    width: "3px",
    borderRadius: "999px",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 51, 51, 0.85))",
    boxShadow: "0 0 18px rgba(255, 51, 51, 0.38)",
    flexShrink: 0,
  },
  
  basicPosterContent: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: 0,
  },
  
  basicPosterLabel: {
    color: "var(--p-text-muted)",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.16em",
  },
  
  basicTrainingLineList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  
  basicTrainingLine: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    color: "var(--p-text)",
    lineHeight: 1.18,
  },
  
  basicTrainingMore: {
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: "11px",
    fontWeight: 900,
  },
  
  basicCardComment: {
    margin: "4px 0 0",
    width: "min(270px, 94%)",
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: "12px",
    lineHeight: 1.45,
    fontWeight: 800,
  },
  
  basicFighterMeta: {
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "var(--p-text-body)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.04em",
  },


  levelUpInputBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, rgba(138, 46, 46, 0.12), rgba(0, 0, 0, 0.22))",
    border: "1px solid rgba(138, 46, 46, 0.24)",
  },

  levelUpCardTextLayer: {
    position: "relative",
    zIndex: 1,
    minHeight: "620px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px",
    boxSizing: "border-box",
    color: "var(--p-text)",
    textShadow: "0 5px 20px rgba(0, 0, 0, 0.98)",
    border: "1px solid rgba(138, 46, 46, 0.5)",
    borderRadius: "30px",
    background:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.18) 38%, rgba(0, 0, 0, 0.42))",
    boxShadow: "inset 0 0 32px rgba(138, 46, 46, 0.08)",
  },

  levelUpHeader: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: "9px",
    fontWeight: 950,
    letterSpacing: "0.16em",
  },

  levelUpBadge: {
    width: "38px",
    height: "38px",
    borderRadius: "13px",
    border: "1px solid rgba(138, 46, 46, 0.82)",
    background:
      "linear-gradient(145deg, rgba(138, 46, 46, 0.18), rgba(0, 0, 0, 0.42))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#8a2e2e",
    fontSize: "18px",
    boxShadow: "0 0 24px rgba(138, 46, 46, 0.2)",
  },

  levelUpMainBlock: {
    marginTop: "18px",
    maxWidth: "320px",
  },

  levelUpName: {
    margin: 0,
    color: "var(--p-text)",
    fontSize: "54px",
    lineHeight: 0.9,
    fontWeight: 950,
    letterSpacing: "-0.07em",
  },

  levelUpLabel: {
    display: "block",
    marginTop: "22px",
    color: "var(--p-text-strong)",
    fontSize: "15px",
    fontWeight: 950,
    letterSpacing: "0.14em",
  },

  levelUpNumber: {
    display: "block",
    marginTop: "0px",
    color: "#8a2e2e",
    fontSize: "104px",
    lineHeight: 0.86,
    fontWeight: 950,
    letterSpacing: "-0.09em",
    textShadow:
      "0 5px 20px rgba(0, 0, 0, 0.98), 0 0 24px rgba(138, 46, 46, 0.34)",
  },

  levelUpSlogan: {
    margin: "16px 0 0",
    color: "var(--p-text)",
    fontSize: "23px",
    lineHeight: 1.06,
    fontWeight: 950,
    letterSpacing: "-0.035em",
    textTransform: "uppercase",
    borderTop: "2px solid rgba(138, 46, 46, 0.8)",
    paddingTop: "12px",
    maxWidth: "300px",
  },

  levelUpBottomBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  levelUpStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "6px",
  },

  levelUpStatBox: {
    minHeight: "76px",
    padding: "8px 6px",
    borderRadius: "14px",
    background: "rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(138, 46, 46, 0.32)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "1px",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 900,
    lineHeight: 1.1,
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.22)",
  },

  levelUpStatIcon: {
    color: "#8a2e2e",
    fontSize: "16px",
    lineHeight: 1,
    marginBottom: "2px",
  },

  levelUpTierBox: {
    padding: "13px",
    borderRadius: "17px",
    background:
      "linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(138, 46, 46, 0.1))",
    border: "1px solid rgba(138, 46, 46, 0.58)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "9px",
    alignItems: "center",
    boxShadow: "0 12px 26px rgba(0, 0, 0, 0.28)",
  },

  levelUpTierLabel: {
    display: "block",
    color: "var(--p-text-soft)",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.12em",
  },

  levelUpTierName: {
    display: "block",
    color: "#8a2e2e",
    fontSize: "25px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },

  levelUpXpText: {
    color: "#8a2e2e",
    fontSize: "21px",
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  levelUpProgressTrack: {
    gridColumn: "1 / -1",
    height: "9px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.14)",
    overflow: "hidden",
    boxShadow: "inset 0 0 12px rgba(0, 0, 0, 0.38)",
  },

  levelUpProgressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #8a2e2e, #a34a4a)",
    boxShadow: "0 0 16px rgba(138, 46, 46, 0.42)",
  },

  socialCardTextLayer: {
    position: "relative",
    zIndex: 1,
    minHeight: "650px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px",
    boxSizing: "border-box",
    color: "var(--p-text)",
    textShadow: "0 2px 12px rgba(0, 0, 0, 0.85), 0 0 2px rgba(0, 0, 0, 0.9)",
  },

  socialCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "0.14em",
  },

  socialCardKicker: {
    color: "rgba(255, 255, 255, 0.86)",
  },

  socialCardBottom: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  socialTitle: {
    margin: 0,
    color: "var(--p-text)",
    fontSize: "24px",
    fontWeight: 950,
    lineHeight: 1.12,
    letterSpacing: "-0.04em",
    maxWidth: "320px",
  },

  socialComment: {
    margin: "9px 0 0",
    width: "min(310px, 88%)",
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: "13px",
    lineHeight: 1.45,
    fontWeight: 800,
  },

  socialMetricRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "7px",
  },

  socialMetricBox: {
    padding: "9px 8px",
    borderRadius: "14px",
    background: "rgba(0, 0, 0, 0.22)",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(6px)",
  },
  
  socialMetricLabel: {
    display: "block",
    color: "var(--p-text-muted)",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "5px",
  },

  socialMetricValue: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 950,
    lineHeight: 1.15,
  },

  posterInputBox: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid var(--p-border-soft)",
  },

  posterInputGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },

  posterInputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 70px",
    alignItems: "center",
    gap: "8px",
  },

  posterInputLabel: {
    display: "grid",
    gridTemplateColumns: "82px minmax(0, 1fr)",
    alignItems: "center",
    gap: "8px",
    color: "var(--p-text-body)",
    fontSize: "12px",
    fontWeight: 900,
  },

  posterInputLabelText: {
    color: "var(--p-text-body)",
    fontSize: "11px",
    fontWeight: 950,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  },

  posterInput: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 0,
    backgroundColor: "#050505",
    color: "var(--p-text)",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: "13px",
    padding: "11px",
    fontSize: "13px",
    fontWeight: 900,
    outline: "none",
  },

  posterToggleLabel: {
    height: "100%",
    minHeight: "42px",
    borderRadius: "13px",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-soft)",
    color: "var(--p-text-body)",
    fontSize: "11px",
    fontWeight: 950,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  posterToggleCheckbox: {
    width: "15px",
    height: "15px",
    accentColor: "#8a2e2e",
    margin: 0,
  },

  posterCardTextLayer: {
    position: "relative",
    zIndex: 2,
    minHeight: "700px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "18px 16px 20px",
    boxSizing: "border-box",
    color: "var(--p-text)",
    textAlign: "center",
    textShadow: "0 7px 24px rgba(0, 0, 0, 0.98)",
  },

  posterVignette: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    background:
      "radial-gradient(circle at 50% 16%, rgba(255, 255, 255, 0.08), transparent 26%), linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.08) 28%, rgba(0, 0, 0, 0.58) 70%, rgba(0, 0, 0, 0.96)), radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.46))",
    pointerEvents: "none",
  },

  posterHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "11px",
    fontWeight: 950,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
  },

  posterHeaderLine: {
    width: "58px",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 51, 51, 0.9), transparent)",
    flexShrink: 1,
  },

  posterCenterBlock: {
    marginTop: "auto",
    marginBottom: "10px",
    paddingTop: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  posterMainName: {
    margin: 0,
    maxWidth: "100%",
    color: "#f4f1ea",
    fontSize: "clamp(46px, 14vw, 92px)",
    lineHeight: 0.86,
    fontWeight: 950,
    letterSpacing: "-0.08em",
    textTransform: "uppercase",
    overflowWrap: "break-word",
    textShadow:
      "0 4px 0 rgba(0, 0, 0, 0.6), 0 14px 34px rgba(0, 0, 0, 0.95)",
  },

  posterSubtitle: {
    margin: "2px 0 0",
    color: "#8a2e2e",
    fontSize: "clamp(20px, 6.2vw, 38px)",
    lineHeight: 1,
    fontWeight: 950,
    fontStyle: "italic",
    letterSpacing: "-0.06em",
    textTransform: "uppercase",
    transform: "rotate(-3deg)",
  },

  posterStarLine: {
    margin: "14px 0 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    color: "#8a2e2e",
    fontSize: "15px",
  },

  posterStarRule: {
    width: "78px",
    height: "2px",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 51, 51, 0.9), transparent)",
  },

  posterEventTitle: {
    margin: "0",
    color: "#e72a22",
    fontSize: "clamp(28px, 8.3vw, 50px)",
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: "-0.035em",
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },

  posterDateText: {
    margin: "8px 0 0",
    color: "var(--p-text)",
    fontSize: "clamp(22px, 6.4vw, 38px)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },

  posterBottomBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },

  posterMetaText: {
    margin: 0,
    maxWidth: "94%",
    color: "#8a2e2e",
    fontSize: "9px",
    lineHeight: 1.45,
    fontWeight: 950,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },

  posterComment: {
    margin: 0,
    width: "min(360px, 92%)",
    color: "var(--p-text-body)",
    fontSize: "12px",
    lineHeight: 1.45,
    fontWeight: 850,
  },

  posterFooterText: {
    margin: "2px 0 0",
    maxWidth: "94%",
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: "9px",
    lineHeight: 1.55,
    fontWeight: 950,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },

  saveImageButton: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  disabledSaveButton: {
    background: "rgba(255, 255, 255, 0.14)",
    color: "rgba(255, 255, 255, 0.62)",
    cursor: "not-allowed",
    opacity: 0.82,
  },

  copyButton: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    borderRadius: "16px",
    padding: "15px",
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  shareHint: {
    margin: "12px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  exportPreviewBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "18px",
    background: "var(--p-bg-inner)",
    border: "1px solid var(--p-border-strong)",
  },

  exportPreviewTitle: {
    display: "block",
    color: "var(--p-text)",
    fontSize: "14px",
    fontWeight: 950,
    marginBottom: "6px",
  },

  exportPreviewText: {
    margin: "0 0 12px",
    color: "rgba(255, 255, 255, 0.62)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  exportPreviewImage: {
    width: "100%",
    maxHeight: "520px",
    objectFit: "contain",
    borderRadius: "16px",
    background: "var(--p-bg-deep)",
    border: "1px solid var(--p-border-soft)",
    display: "block",
  },

  exportPreviewButtonRow: {
    display: "grid",
    gridTemplateColumns: "1fr 0.7fr",
    gap: "8px",
    marginTop: "12px",
  },

  exportPreviewPrimaryButton: {
    border: "none",
    borderRadius: "14px",
    padding: "12px",
    background: "var(--p-accent-solid)",
    color: "var(--p-on-accent)",
    fontSize: "13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  exportPreviewSecondaryButton: {
    border: "1px solid var(--p-border-strong)",
    borderRadius: "14px",
    padding: "12px",
    background: "var(--p-bg-inner)",
    color: "var(--p-text)",
    fontSize: "13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  sectionCard: {
    marginTop: "16px",
    borderRadius: "26px",
    padding: "21px",
    background: "var(--p-bg-card)",
    border: "1px solid var(--p-border)",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "22px",
    letterSpacing: "-0.03em",
  },

  proofBox: {
    padding: "18px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
  },

  proofText: {
    margin: 0,
    color: "var(--p-text-body)",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  proofSmallText: {
    margin: "12px 0 0",
    color: "var(--p-text-faint)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  redText: {
    color: "var(--p-accent)",
  },

  emptyFeaturedLog: {
    padding: "18px",
    borderRadius: "18px",
    background: "var(--p-bg-subtle)",
    color: "var(--p-text-muted)",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  featuredLogList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  featuredLogItem: {
    padding: "16px",
    borderRadius: "20px",
    background: "var(--p-bg-subtle)",
    border: "1px solid var(--p-border-soft)",
  },

  featuredLogTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
  },

  featuredBadgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },

  featuredBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "var(--p-accent-bg)",
    color: "var(--p-accent-soft)",
    fontSize: "11px",
    fontWeight: 900,
  },

  featuredEditedBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--p-text-soft)",
    fontSize: "11px",
    fontWeight: 900,
  },

  featuredLogTitle: {
    margin: "10px 0 6px",
    fontSize: "17px",
    fontWeight: 900,
  },

  featuredLogMeta: {
    margin: 0,
    color: "var(--p-text-muted)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  featuredScore: {
    color: "var(--p-accent)",
    fontSize: "16px",
    whiteSpace: "nowrap",
  },

  featuredComment: {
    margin: "14px 0 0",
    padding: "13px",
    borderRadius: "16px",
    background: "var(--p-bg-inset)",
    color: "var(--p-text-body)",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 800,
  },

  achievementList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  achievementItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "18px",
    fontSize: "14px",
  },

  unlocked: {
    background: "var(--p-accent-bg)",
    color: "var(--p-text)",
    border: "1px solid var(--p-accent-border)",
  },

  locked: {
    background: "var(--p-bg-subtle)",
    color: "var(--p-text-faint)",
    border: "1px solid var(--p-border-soft)",
  },

  achievementIcon: {
    width: "38px",
    height: "30px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 900,
    flexShrink: 0,
  },

  achievementDescription: {
    margin: "5px 0 0",
    color: "var(--p-text-muted)",
    fontSize: "12px",
    lineHeight: 1.4,
  },
};
