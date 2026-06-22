export const styles = {
  page: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto",
    padding: "18px 16px 110px",
    color: "#ffffff",
    boxSizing: "border-box",
  },

  profileCard: {
    borderRadius: "30px",
    padding: "26px",
    background:
      "radial-gradient(circle at 90% 10%, rgba(255, 51, 51, 0.42), transparent 34%), linear-gradient(145deg, #222222, #050505)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 22px 55px rgba(0, 0, 0, 0.45)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
  },

  kicker: {
    margin: "0 0 10px",
    color: "#ff5555",
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

  tierBadge: {
    flexShrink: 0,
    width: "92px",
    height: "92px",
    borderRadius: "24px",
    background: "rgba(255, 59, 59, 0.16)",
    border: "1px solid rgba(255, 85, 85, 0.5)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  tierLabel: {
    color: "rgba(255, 255, 255, 0.55)",
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
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
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
    color: "rgba(255, 255, 255, 0.5)",
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
    background: "#ff3333",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  darkButton: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  profileSaveInlineButton: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 14px",
    background: "#ffffff",
    color: "#050505",
    fontSize: "14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  profileNameBox: {
    marginTop: "18px",
    borderRadius: "20px",
    padding: "16px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  profileNameLabel: {
    display: "block",
    color: "rgba(255, 255, 255, 0.45)",
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
    color: "rgba(255, 255, 255, 0.68)",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  profileEditInsideBox: {
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },

  label: {
    display: "block",
    marginBottom: "14px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "8px",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #44444a",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: 800,
    outline: "none",
  },

  textarea: {
    width: "100%",
    minHeight: "88px",
    boxSizing: "border-box",
    marginTop: "8px",
    backgroundColor: "#050505",
    color: "#ffffff",
    border: "1px solid #44444a",
    borderRadius: "14px",
    padding: "13px",
    fontSize: "15px",
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
    background: "#171717",
    border: "1px solid rgba(255, 255, 255, 0.09)",
  },

  statLabel: {
    display: "block",
    color: "rgba(255, 255, 255, 0.52)",
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
    background: "#121212",
    border: "1px solid rgba(255, 255, 255, 0.09)",
  },

  recentTrainingNotice: {
    marginBottom: "16px",
    padding: "15px",
    borderRadius: "18px",
    background: "rgba(255, 51, 51, 0.1)",
    border: "1px solid rgba(255, 85, 85, 0.28)",
  },

  recentTrainingBadge: {
    display: "inline-block",
    marginBottom: "9px",
    padding: "6px 9px",
    borderRadius: "999px",
    background: "#ff3333",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: 900,
  },

  recentTrainingTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
    marginBottom: "5px",
  },

  recentTrainingText: {
    margin: 0,
    color: "rgba(255, 255, 255, 0.68)",
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
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "18px",
    background: "#050505",
    padding: "14px",
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  logSelectItemActive: {
    border: "1px solid #ff3333",
    background: "rgba(255, 51, 51, 0.08)",
  },

  logSelectCheck: {
    width: "24px",
    height: "24px",
    borderRadius: "999px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
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
    color: "rgba(255, 255, 255, 0.54)",
    fontSize: "13px",
    lineHeight: 1.4,
  },

  cardPhotoBox: {
    marginTop: "6px",
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  cardMakerLabel: {
    margin: "0 0 8px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  cardMakerHelp: {
    margin: "0 0 14px",
    color: "rgba(255, 255, 255, 0.56)",
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
    color: "rgba(255, 255, 255, 0.55)",
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
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "14px",
    background: "#050505",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  activeCardStyleButton: {
    background: "#ffffff",
    color: "#050505",
    border: "1px solid #ffffff",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },

  filterButton: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "16px",
    padding: "13px",
    background: "#050505",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  activeFilterButton: {
    background: "#d6a234",
    border: "1px solid #d6a234",
    color: "#050505",
  },

  adjustSection: {
    marginBottom: "16px",
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },

  rangeLabel: {
    marginTop: "12px",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 900,
  },

  rangeInput: {
    width: "100%",
    accentColor: "#d6a234",
  },

  commentToggle: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 900,
  },

  commentCheckbox: {
    width: "18px",
    height: "18px",
    accentColor: "#d6a234",
  },

  commentToggleHelp: {
    margin: "8px 0 0",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  trainingCard: {
    margin: "16px auto 0",
    width: "min(100%, 390px)",
    borderRadius: "30px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 22px 55px rgba(0, 0, 0, 0.45)",
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
    color: "#ffffff",
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
    color: "rgba(255, 255, 255, 0.56)",
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
    color: "#ffffff",
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
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "0.04em",
  },


  levelUpInputBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(214, 162, 52, 0.08)",
    border: "1px solid rgba(214, 162, 52, 0.22)",
  },

  levelUpCardTextLayer: {
    position: "relative",
    zIndex: 1,
    minHeight: "650px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px",
    boxSizing: "border-box",
    color: "#ffffff",
    textShadow: "0 5px 20px rgba(0, 0, 0, 0.98)",
    border: "1px solid rgba(214, 162, 52, 0.48)",
    borderRadius: "30px",
  },

  levelUpHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "0.16em",
  },

  levelUpBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "14px",
    border: "1px solid rgba(214, 162, 52, 0.74)",
    background: "rgba(0, 0, 0, 0.38)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#d6a234",
    fontSize: "20px",
    boxShadow: "0 0 24px rgba(214, 162, 52, 0.16)",
  },

  levelUpMainBlock: {
    marginTop: "24px",
    maxWidth: "330px",
  },

  levelUpName: {
    margin: 0,
    color: "#ffffff",
    fontSize: "64px",
    lineHeight: 0.92,
    fontWeight: 950,
    letterSpacing: "-0.07em",
  },

  levelUpLabel: {
    display: "block",
    marginTop: "24px",
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: 950,
    letterSpacing: "0.08em",
  },

  levelUpNumber: {
    display: "block",
    marginTop: "4px",
    color: "#d6a234",
    fontSize: "96px",
    lineHeight: 0.92,
    fontWeight: 950,
    letterSpacing: "-0.08em",
  },

  levelUpSlogan: {
    margin: "18px 0 0",
    color: "#ffffff",
    fontSize: "27px",
    lineHeight: 1.06,
    fontWeight: 950,
    letterSpacing: "-0.03em",
    textTransform: "uppercase",
    borderTop: "2px solid rgba(214, 162, 52, 0.72)",
    paddingTop: "14px",
  },

  levelUpBottomBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  levelUpStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  levelUpStatBox: {
    minHeight: "94px",
    padding: "10px 8px",
    borderRadius: "16px",
    background: "rgba(0, 0, 0, 0.46)",
    border: "1px solid rgba(214, 162, 52, 0.34)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    textAlign: "center",
  },

  levelUpStatIcon: {
    color: "#d6a234",
    fontSize: "19px",
    lineHeight: 1,
  },

  levelUpTierBox: {
    padding: "15px",
    borderRadius: "18px",
    background: "rgba(0, 0, 0, 0.62)",
    border: "1px solid rgba(214, 162, 52, 0.55)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center",
  },

  levelUpTierLabel: {
    display: "block",
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.08em",
  },

  levelUpTierName: {
    display: "block",
    color: "#d6a234",
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 950,
  },

  levelUpXpText: {
    color: "#d6a234",
    fontSize: "24px",
    fontWeight: 950,
  },

  levelUpProgressTrack: {
    gridColumn: "1 / -1",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.14)",
    overflow: "hidden",
  },

  levelUpProgressFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #d6a234, #ffd46a)",
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
    color: "#ffffff",
    textShadow: "0 5px 18px rgba(0, 0, 0, 0.95)",
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
    color: "#ffffff",
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
    background: "rgba(0, 0, 0, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backdropFilter: "none",
  },
  
  socialMetricLabel: {
    display: "block",
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "0.12em",
    marginBottom: "5px",
  },

  socialMetricValue: {
    display: "block",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 950,
    lineHeight: 1.15,
  },

  posterInputBox: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "12px",
    fontWeight: 900,
  },

  posterInputLabelText: {
    color: "rgba(255, 255, 255, 0.72)",
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
    color: "#ffffff",
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
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.78)",
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
    accentColor: "#ff3333",
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
    color: "#ffffff",
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
    color: "#ff3333",
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
    color: "#ff3333",
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
    color: "#ffffff",
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
    color: "#ff3333",
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
    color: "rgba(255, 255, 255, 0.78)",
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
    background: "#ffffff",
    color: "#050505",
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
    background: "#ff3333",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  shareHint: {
    margin: "12px 0 0",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  exportPreviewBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
  },

  exportPreviewTitle: {
    display: "block",
    color: "#ffffff",
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
    background: "#050505",
    border: "1px solid rgba(255, 255, 255, 0.1)",
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
    background: "#ffffff",
    color: "#050505",
    fontSize: "13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  exportPreviewSecondaryButton: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "14px",
    padding: "12px",
    background: "rgba(255, 255, 255, 0.06)",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  sectionCard: {
    marginTop: "16px",
    borderRadius: "26px",
    padding: "21px",
    background: "#121212",
    border: "1px solid rgba(255, 255, 255, 0.09)",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "22px",
    letterSpacing: "-0.03em",
  },

  proofBox: {
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.05)",
  },

  proofText: {
    margin: 0,
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: "15px",
    lineHeight: 1.6,
  },

  proofSmallText: {
    margin: "12px 0 0",
    color: "rgba(255, 255, 255, 0.46)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  redText: {
    color: "#ff5555",
  },

  emptyFeaturedLog: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.05)",
    color: "rgba(255, 255, 255, 0.55)",
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
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
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
    background: "rgba(255, 51, 51, 0.14)",
    color: "#ff7777",
    fontSize: "11px",
    fontWeight: 900,
  },

  featuredEditedBadge: {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
    color: "rgba(255, 255, 255, 0.65)",
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
    color: "rgba(255, 255, 255, 0.52)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  featuredScore: {
    color: "#ff5555",
    fontSize: "16px",
    whiteSpace: "nowrap",
  },

  featuredComment: {
    margin: "14px 0 0",
    padding: "13px",
    borderRadius: "16px",
    background: "rgba(0, 0, 0, 0.28)",
    color: "rgba(255, 255, 255, 0.82)",
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
    background: "rgba(255, 51, 51, 0.12)",
    color: "#ffffff",
    border: "1px solid rgba(255, 85, 85, 0.26)",
  },

  locked: {
    background: "rgba(255, 255, 255, 0.04)",
    color: "rgba(255, 255, 255, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
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
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: "12px",
    lineHeight: 1.4,
  },
};
