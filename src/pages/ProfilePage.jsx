import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../store/TrainingContext";
import FighterSpecCard from "../components/FighterSpecCard";
import { getFighterProgress, MAX_FIGHTER_LEVEL, getLogExp } from "../utils/fighterProgress";
import { getLevelTitle, getNextTitleMilestone } from "../utils/fighterTitles";
import { isVeteranFilterUnlocked } from "../utils/veteranPerks";
import { buildWeeklyReport } from "../utils/trainingStats";
import { validateBodySpecFields } from "../utils/bodySpecs";
import {
  EXPERIENCE_LEVELS,
  formatWeightClassOption,
  syncListingFromProfile,
  WEIGHT_CLASSES,
} from "../utils/sparringPartners";
import { suggestWeightClass } from "../data/proBoxingWeightClasses";
import { styles } from "./ProfilePage.styles";
import {
  getDisplayComment,
  getRounds,
  getTodayString,
  getTotalMinutes,
  getTrainingStreak,
  isIOSLikeDevice,
  resizeImage,
} from "./profilePage/profileCardUtils";
import {
  CARD_FILTERS,
  CARD_FILTER_GROUPS,
  CARD_STYLES,
  applyPixelImageFilter,
  getCardBackground,
  getCardPreviewOverlay,
  getImageFilter,
} from "./profilePage/cardConfig";

export default function ProfilePage({
  scrollTarget,
  cardMakerFocusLogId = null,
  fighterLevel = 1,
  onStartTraining,
}) {
  const {
    logs,
    profile,
    userId,
    weeklyScore,
    updateProfile,
    updateProfilePhoto,
    removeProfilePhoto,
  } = useTraining();

  const fileInputRef = useRef(null);
  const cardMediaInputRef = useRef(null);
  const trainingCardRef = useRef(null);
  const cardMakerRef = useRef(null);
  const videoObjectUrlRef = useRef(null);

  const startsInQuickCardFlow =
    scrollTarget === "cardMaker" && Boolean(cardMakerFocusLogId);

  const [profileView, setProfileView] = useState(
    scrollTarget === "cardMaker" ? "studio" : "nameplate"
  );
  const [studioTab, setStudioTab] = useState(
    startsInQuickCardFlow ? "design" : "select"
  );
  const [isQuickCardFlow, setIsQuickCardFlow] = useState(startsInQuickCardFlow);
  const [nickname, setNickname] = useState(profile.nickname || "나");
  const [bio, setBio] = useState(
    profile.bio || "아직 초보지만 링에 계속 올라가는 중"
  );
  const [heightCm, setHeightCm] = useState(profile.heightCm || "");
  const [weightKg, setWeightKg] = useState(profile.weightKg || "");
  const [reachCm, setReachCm] = useState(profile.reachCm || "");
  const [weightClass, setWeightClass] = useState(profile.weightClass || "라이트급");
  const [experience, setExperience] = useState(profile.experience || "1년차");
  const [area, setArea] = useState(profile.area || "");
  const [weightClassTouched, setWeightClassTouched] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [selectedLogIds, setSelectedLogIds] = useState(
    cardMakerFocusLogId ? [cardMakerFocusLogId] : []
  );
  const [cardMedia, setCardMedia] = useState("");
  const [cardMediaType, setCardMediaType] = useState("");
  const [cardMediaReady, setCardMediaReady] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("levelup");
  const selectedFilterRef = useRef("levelup");
  const [filterIntensity, setFilterIntensity] = useState(75);
  const [photoScale, setPhotoScale] = useState(100);
  const [copied, setCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [customTrainingTitle, setCustomTrainingTitle] = useState("");
  const [levelUpLevel, setLevelUpLevel] = useState("56");
  const [levelUpSlogan, setLevelUpSlogan] = useState("ONE ROUND AT A TIME");
  const [cardStyle, setCardStyle] = useState("basic");
  const cardStyleRef = useRef("basic");
  const exportGenerationRef = useRef(0);
  const [posterMainName, setPosterMainName] = useState("");
  const [posterSubtitle, setPosterSubtitle] = useState("THE ROOKIE");
  const [posterEventTitle, setPosterEventTitle] = useState("TRAINING DAY");
  const [posterDateText, setPosterDateText] = useState("JUNE 27");
  const [posterMetaText, setPosterMetaText] = useState(
    "BOXING TRAINING POSTER | RISING FIGHTER"
  );
  const [posterFooterText, setPosterFooterText] = useState(
    "EVERY ROUND WRITES YOUR STORY"
  );
  const [posterVisible, setPosterVisible] = useState({
    mainName: true,
    subtitle: true,
    eventTitle: true,
    date: true,
    meta: true,
    footer: true,
  });

  const posterExportRef = useRef({
    selectedFilter: "levelup",
    filterIntensity: 75,
    photoScale: 100,
    cardMedia: "",
    cardMediaType: "",
    showComment: true,
    fields: {
      mainName: "",
      subtitle: "THE ROOKIE",
      eventTitle: "TRAINING DAY",
      date: "JUNE 27",
      meta: "BOXING TRAINING POSTER | RISING FIGHTER",
      footer: "EVERY ROUND WRITES YOUR STORY",
    },
    visible: {
      mainName: true,
      subtitle: true,
      eventTitle: true,
      date: true,
      meta: true,
      footer: true,
    },
  });

  // iPhone에서는 저장 버튼을 누른 뒤 이미지를 만드는 시간이 길면
  // 공유/다운로드 권한이 끊길 수 있다. 그래서 저장 이미지를 미리 만들어 둔다.
  const exportCacheRef = useRef({
    key: "",
    style: "",
    dataUrl: "",
    file: null,
    filename: "",
  });
  const preparingExportKeyRef = useRef("");
  const [exportPreview, setExportPreview] = useState(null);

  useEffect(() => {
    setNickname(profile.nickname || "나");
    setBio(profile.bio || "아직 초보지만 링에 계속 올라가는 중");
    setHeightCm(profile.heightCm || "");
    setWeightKg(profile.weightKg || "");
    setReachCm(profile.reachCm || "");
    setWeightClass(profile.weightClass || "라이트급");
    setExperience(profile.experience || "1년차");
    setArea(profile.area || "");
  }, [profile]);

  useEffect(() => {
    if (weightClassTouched || !weightKg) return;

    setWeightClass(suggestWeightClass(weightKg));
  }, [weightKg, weightClassTouched]);

  const profileSpecSummary = useMemo(() => {
    const parts = [];

    if (profile.heightCm) parts.push(`${profile.heightCm}cm`);
    if (profile.weightKg) parts.push(`${profile.weightKg}kg`);
    if (profile.reachCm) parts.push(`리치 ${profile.reachCm}cm`);
    if (profile.weightClass) parts.push(profile.weightClass);
    if (profile.experience) parts.push(profile.experience);
    if (profile.area) parts.push(profile.area);

    return parts.join(" · ");
  }, [profile]);

  const profileStats = useMemo(() => {
    const totalLogs = logs.length;

    const totalRounds = logs.reduce((sum, log) => {
      return sum + getRounds(log);
    }, 0);

    const totalMinutes = logs.reduce((sum, log) => {
      return sum + getTotalMinutes(log);
    }, 0);

    const today = getTodayString();
    const todayLogs = logs.filter((log) => log.date === today);

    const timerLogs = logs.filter((log) => log.source === "timer");
    const manualLogs = logs.filter((log) => log.source === "manual");
    const weeklyRounds = buildWeeklyReport(logs).totalRounds;

    const fighterProgress = getFighterProgress(logs);

    return {
      totalLogs,
      totalRounds,
      weeklyRounds,
      totalMinutes,
      todayCount: todayLogs.length,
      timerCount: timerLogs.length,
      manualCount: manualLogs.length,
      fighterProgress,
      levelLabel: fighterProgress.levelLabel,
      level: fighterProgress.level,
      totalXp: fighterProgress.totalExp,
      currentLevelXp: fighterProgress.currentLevelExp,
      nextLevelXp: fighterProgress.nextLevelExp,
      fighterTitle: fighterProgress.fighterTitle,
      fighterTitleEn: fighterProgress.fighterTitleEn,
      careerStageKo: fighterProgress.careerStageKo,
      xpToNextLevel: fighterProgress.xpToNextLevel,
      progressPercent: fighterProgress.progressPercent,
      isMaxLevel: fighterProgress.isMaxLevel,
      nextLevelExp: fighterProgress.nextLevelExp,
    };
  }, [logs]);

  useEffect(() => {
    setSelectedLogIds((prev) => {
      if (logs.length === 0) {
        return prev.length > 0 ? prev : [];
      }

      if (
        cardMakerFocusLogId &&
        logs.some((log) => log.id === cardMakerFocusLogId)
      ) {
        return [cardMakerFocusLogId];
      }

      if (prev.length === 0) {
        return [logs[0].id];
      }

      const logIds = new Set(logs.map((log) => log.id));
      const validIds = prev.filter((id) => logIds.has(id));

      if (validIds.length === 0) {
        return [logs[0].id];
      }

      return validIds;
    });
  }, [logs, cardMakerFocusLogId]);

  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollTarget !== "cardMaker") return;

    setProfileView("studio");

    if (cardMakerFocusLogId) {
      setIsQuickCardFlow(true);
      setStudioTab("design");
      setSelectedLogIds([cardMakerFocusLogId]);
      track("card_maker_quick_flow", { hasFocusLog: true });
    } else {
      setIsQuickCardFlow(false);
      setStudioTab("select");
    }

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        cardMakerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [scrollTarget, cardMakerFocusLogId]);

  function handleSelectCardStyle(styleId) {
    cardStyleRef.current = styleId;
    posterExportRef.current.cardStyle = styleId;
    exportGenerationRef.current += 1;
    exportCacheRef.current = {
      key: "",
      style: "",
      dataUrl: "",
      file: null,
      filename: "",
      promise: null,
    };
    preparingExportKeyRef.current = "";
    setExportPreview(null);
    setCardStyle(styleId);
  }

  useEffect(() => {
    cardStyleRef.current = cardStyle;
    posterExportRef.current.cardStyle = cardStyle;
  }, [cardStyle]);

  useEffect(() => {
    if (cardStyle === "poster") {
      posterExportRef.current.showComment = false;
      setShowComment(false);
    }
  }, [cardStyle]);

  useEffect(() => {
    selectedFilterRef.current = selectedFilter;
    posterExportRef.current.selectedFilter = selectedFilter;
  }, [selectedFilter]);

  function handleSelectFilter(filterId) {
    if (!isVeteranFilterUnlocked(filterId, profileStats.level)) {
      return;
    }

    // 모바일에서 테마 버튼을 누른 직후 바로 저장해도
    // canvas export가 이전 테마 값을 쓰지 않도록 ref에도 즉시 저장한다.
    selectedFilterRef.current = filterId;
    posterExportRef.current.selectedFilter = filterId;
    setSelectedFilter(filterId);
  }

  function updateFilterIntensity(value) {
    posterExportRef.current.filterIntensity = value;
    setFilterIntensity(value);
  }

  function updatePhotoScale(value) {
    posterExportRef.current.photoScale = value;
    setPhotoScale(value);
  }

  function updateShowComment(checked) {
    posterExportRef.current.showComment = checked;
    setShowComment(checked);
  }

  function updatePosterField(field, value) {
    posterExportRef.current.fields = {
      ...posterExportRef.current.fields,
      [field]: value,
    };

    if (field === "mainName") setPosterMainName(value);
    if (field === "subtitle") setPosterSubtitle(value);
    if (field === "eventTitle") setPosterEventTitle(value);
    if (field === "date") setPosterDateText(value);
    if (field === "meta") setPosterMetaText(value);
    if (field === "footer") setPosterFooterText(value);
  }

  const selectedLogs = useMemo(() => {
    return logs.filter((log) => selectedLogIds.includes(log.id));
  }, [logs, selectedLogIds]);

  const latestLog = logs[0];
  const isLatestLogSelected = latestLog
    ? selectedLogIds.includes(latestLog.id)
    : false;

  const quickFlowLog = useMemo(() => {
    if (!isQuickCardFlow || selectedLogIds.length !== 1) return null;
    return logs.find((log) => log.id === selectedLogIds[0]) || null;
  }, [isQuickCardFlow, selectedLogIds, logs]);

  const visibleCardLogs = selectedLogs.slice(0, 3);
  const hiddenCardLogCount = Math.max(0, selectedLogs.length - 3);

  const cardTotalRounds = selectedLogs.reduce((sum, log) => {
    return sum + getRounds(log);
  }, 0);

  const cardTotalMinutes = selectedLogs.reduce((sum, log) => {
    return sum + getTotalMinutes(log);
  }, 0);

  const levelUpDisplayName = String(
    profile.nickname || nickname || "JOUN"
  ).trim().toUpperCase();
  const levelUpDisplayLevel =
    String(levelUpLevel || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 3) || "1";
  const levelUpDisplaySlogan = String(
    levelUpSlogan || "ONE ROUND AT A TIME"
  ).trim().toUpperCase();
  const levelUpStreakDays = getTrainingStreak(logs);

  useEffect(() => {
    setLevelUpLevel(String(profileStats.level));
  }, [profileStats.level]);

  useEffect(() => {
    setPosterSubtitle(
      profileStats.fighterTitleEn ||
        profileStats.fighterTitle ||
        "RING ENTRANT"
    );
  }, [profileStats.fighterTitle, profileStats.fighterTitleEn]);

  useEffect(() => {
    setPosterMainName((current) => {
      if (current.trim()) return current;
      return (profile.nickname || "나").trim();
    });
  }, [profile.nickname]);

  function scrollToCardMaker() {
    setProfileView("studio");
    setIsQuickCardFlow(false);
    setStudioTab("select");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function backToNameplate() {
    setProfileView("nameplate");
    setIsQuickCardFlow(false);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  const growthPreview = useMemo(() => {
    const isMax = profileStats.isMaxLevel;
    const nextTitle = !isMax ? getNextTitleMilestone(profileStats.level) : null;

    return {
      isMax,
      nextTitle,
      xpToNext: profileStats.xpToNextLevel,
      progressPercent: profileStats.progressPercent,
      currentTitleEn:
        profileStats.fighterTitleEn || profileStats.fighterTitle || "FIGHTER",
    };
  }, [profileStats]);

  const levelUpProgressPercent = growthPreview.progressPercent;
  const levelUpNextExp = growthPreview.xpToNext;

  const levelUpTheme = getPosterCanvasTheme(selectedFilter);
  const levelUpAccent = levelUpTheme.accent;
  const levelUpAccentSoft = levelUpTheme.accentSoft;

  const mainComment = useMemo(() => {
    const firstLogWithComment = selectedLogs.find(
      (log) => log.publicComment || log.memo
    );

    return firstLogWithComment
      ? getDisplayComment(firstLogWithComment)
      : "오늘의 훈련을 끝까지 버텼다.";
  }, [selectedLogs]);

  function getCardLogTitle(log, index) {
    const customTitle = customTrainingTitle.trim();

    if (selectedLogs.length === 1 && index === 0 && customTitle) {
      return customTitle;
    }

    if (log.type === "직접 설정 루틴") {
      return "";
    }

    return log.type;
  }

  const primaryCardTitle =
    customTrainingTitle.trim() ||
    selectedLogs
      .map((log, index) => getCardLogTitle(log, index))
      .find(Boolean) ||
    "BOXING TRAINING";

  const posterMainNameText =
    posterMainName.trim() || profile.nickname || "JO WOON";
  const posterSubtitleText = posterSubtitle.trim() || "THE ROOKIE";
  const posterEventTitleText = posterEventTitle.trim() || "TRAINING DAY";
  const posterDateTextValue = posterDateText.trim() || "JUNE 27";
  const posterMetaTextValue =
    posterMetaText.trim() || "BOXING TRAINING POSTER | RISING FIGHTER";
  const posterFooterTextValue =
    posterFooterText.trim() || "EVERY ROUND WRITES YOUR STORY";

  const posterTextLines = [
    posterVisible.mainName ? posterMainNameText : "",
    posterVisible.subtitle ? posterSubtitleText : "",
    posterVisible.eventTitle ? posterEventTitleText : "",
    posterVisible.date ? posterDateTextValue : "",
    posterVisible.meta ? posterMetaTextValue : "",
    posterVisible.footer ? posterFooterTextValue : "",
  ].filter(Boolean);

  function getCardExportKey() {
    return JSON.stringify({
      cardStyle,
      selectedFilter,
      filterIntensity,
      photoScale,
      cardMedia,
      cardMediaType,
      selectedLogIds,
      customTrainingTitle,
      levelUpLevel,
      levelUpSlogan,
      showComment,
      profileNickname: profile.nickname || "",
      profileTier: profileStats.levelLabel,
      cardTotalRounds,
      cardTotalMinutes,
      mainComment,
      posterMainName,
      posterSubtitle,
      posterEventTitle,
      posterDateText,
      posterMetaText,
      posterFooterText,
      posterVisible,
      selectedLogs: selectedLogs.map((log) => ({
        id: log.id,
        type: log.type,
        rounds: getRounds(log),
        minutes: log.minutes || log.duration || 0,
        date: log.date || "",
        memo: log.memo || "",
        publicComment: log.publicComment || "",
      })),
    });
  }

  const currentExportKey = getCardExportKey();

  function handlePosterVisibleChange(field, checked) {
    posterExportRef.current.visible = {
      ...posterExportRef.current.visible,
      [field]: checked,
    };

    setPosterVisible((prev) => ({
      ...prev,
      [field]: checked,
    }));
  }

  function clearVideoObjectUrl() {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  }

  function handleSaveProfile() {
    setSaveError("");

    try {
      const validated = validateBodySpecFields({
        nickname,
        heightCm,
        weightKg,
        reachCm,
        weightClass,
        experience,
        area,
        sparringStyle: profile.sparringStyle,
      });

      const nextProfile = {
        ...profile,
        ...validated,
        bio: bio.trim(),
        onboardingComplete: profile.onboardingComplete ?? true,
      };

      updateProfile(nextProfile);
      syncListingFromProfile(nextProfile, userId, {
        fighterLevel: profileStats.level,
      });
      setIsSaving(true);
      setIsProfileEditOpen(false);

      setTimeout(() => {
        setIsSaving(false);
      }, 900);
    } catch (error) {
      setSaveError(error.message || "프로필 저장에 실패했습니다.");
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어.");
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      updateProfilePhoto(resizedImage);
    } catch {
      alert("사진 업로드에 실패했어. 다른 사진으로 다시 시도해줘.");
    }
  }

  async function handleCardMediaChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type.startsWith("image/")) {
      try {
        clearVideoObjectUrl();

        setCardMediaReady(false);
        setCardMedia("");
        setCardMediaType("");
        posterExportRef.current.cardMedia = "";
        posterExportRef.current.cardMediaType = "";

        const resizedImage = await resizeImage(file);

        posterExportRef.current.cardMedia = resizedImage;
        posterExportRef.current.cardMediaType = "image";
        setCardMedia(resizedImage);
        setCardMediaType("image");
      } catch {
        setCardMediaReady(true);
        alert("카드 사진 업로드에 실패했어. 다른 사진으로 다시 시도해줘.");
      }

      return;
    }

    if (file.type.startsWith("video/")) {
      clearVideoObjectUrl();

      const videoUrl = URL.createObjectURL(file);
      videoObjectUrlRef.current = videoUrl;

      posterExportRef.current.cardMedia = videoUrl;
      posterExportRef.current.cardMediaType = "video";
      setCardMediaReady(true);
      setCardMedia(videoUrl);
      setCardMediaType("video");
      return;
    }

    alert("이미지 또는 동영상 파일만 업로드할 수 있어.");
  }

  function handleRemovePhoto() {
    const ok = window.confirm("프로필 사진을 삭제할까요?");
    if (!ok) return;

    removeProfilePhoto();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveCardMedia() {
    clearVideoObjectUrl();
    posterExportRef.current.cardMedia = "";
    posterExportRef.current.cardMediaType = "";
    setCardMedia("");
    setCardMediaType("");
    setCardMediaReady(true);

    if (cardMediaInputRef.current) {
      cardMediaInputRef.current.value = "";
    }
  }

  function toggleLogSelection(logId) {
    setSelectedLogIds((prev) => {
      if (prev.includes(logId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== logId);
      }

      return [...prev, logId];
    });
  }

  

  function loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("이미지를 캔버스에 불러오지 못했어요."));
      image.src = src;
    });
  }

  function drawCoverImage(ctx, image, x, y, width, height, scalePercent = 100) {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;

    if (!imageWidth || !imageHeight) return;

    const baseScale = Math.max(width / imageWidth, height / imageHeight);
    // POSTER 저장에서는 사진이 반드시 화면을 채워야 하므로 100%보다 작게 줄이지 않는다.
    const safeScale = Math.max(scalePercent / 100, 0.85);
    const finalScale = baseScale * safeScale;
    const drawWidth = imageWidth * finalScale;
    const drawHeight = imageHeight * finalScale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  function drawTextFit(ctx, text, x, y, maxWidth, options = {}) {
    const {
      size = 80,
      minSize = 32,
      weight = 900,
      family = 'Arial, sans-serif',
      align = 'center',
      color = '#ffffff',
      baseline = 'alphabetic',
      shadow = true,
      strokeColor = 'rgba(0, 0, 0, 0.72)',
      strokeWidth = 0,
    } = options;

    if (!text) return size;

    const safeText = String(text).replace(/\s+/g, ' ').trim();
    let fontSize = size;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillStyle = color;
    ctx.lineJoin = 'round';

    while (fontSize > minSize) {
      ctx.font = `${weight} ${fontSize}px ${family}`;
      if (ctx.measureText(safeText).width <= maxWidth) break;
      fontSize -= 2;
    }

    ctx.font = `${weight} ${fontSize}px ${family}`;

    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }

    // 저장용 canvas에서는 글자 간격을 직접 쪼개 그리지 않는다.
    // iPhone에서 I 같은 얇은 글자가 사라지는 문제가 생겨서 fillText 한 번으로 그린다.
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.strokeText(safeText, x, y);
    }

    ctx.fillText(safeText, x, y);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    return fontSize;
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, options = {}) {
    const {
      size = 34,
      weight = 800,
      family = "Arial, sans-serif",
      lineHeight = 46,
      maxLines = 2,
      color = "rgba(255, 255, 255, 0.86)",
      align = "center",
    } = options;

    if (!text) return y;

    ctx.font = `${weight} ${size}px ${family}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "top";

    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth || !line) {
        line = testLine;
      } else {
        lines.push(line);
        line = word;
      }
    });

    if (line) lines.push(line);

    lines.slice(0, maxLines).forEach((lineText, index) => {
      const finalText = index === maxLines - 1 && lines.length > maxLines
        ? `${lineText}...`
        : lineText;
      ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 5;
      ctx.fillText(finalText, x, y + index * lineHeight);
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    return y + Math.min(lines.length, maxLines) * lineHeight;
  }

  function getPosterCanvasTheme(filterId) {
    if (filterId === "levelup") {
      return {
        bgA: "#1d1607",
        bgB: "#030303",
        bgC: "#090603",
        accent: "#d6a234",
        accentSoft: "rgba(214, 162, 52, 0.28)",
        overlayTop: "rgba(0, 0, 0, 0.36)",
        overlayMid: "rgba(0, 0, 0, 0.18)",
        overlayBottom: "rgba(0, 0, 0, 0.92)",
      };
    }

    if (filterId === "red") {
      return {
        bgA: "#330606",
        bgB: "#050000",
        bgC: "#150000",
        accent: "#ff3333",
        accentSoft: "rgba(255, 51, 51, 0.32)",
        overlayTop: "rgba(0, 0, 0, 0.32)",
        overlayMid: "rgba(40, 0, 0, 0.18)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "dark") {
      return {
        bgA: "#111111",
        bgB: "#020202",
        bgC: "#000000",
        accent: "#f2f2f2",
        accentSoft: "rgba(255, 255, 255, 0.18)",
        overlayTop: "rgba(0, 0, 0, 0.42)",
        overlayMid: "rgba(0, 0, 0, 0.18)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "gold") {
      return {
        bgA: "#2b1a00",
        bgB: "#070503",
        bgC: "#1a0f00",
        accent: "#f5b942",
        accentSoft: "rgba(245, 185, 66, 0.24)",
        overlayTop: "rgba(0, 0, 0, 0.32)",
        overlayMid: "rgba(0, 0, 0, 0.16)",
        overlayBottom: "rgba(0, 0, 0, 0.88)",
      };
    }

    if (filterId === "blue") {
      return {
        bgA: "#061a3d",
        bgB: "#020510",
        bgC: "#020915",
        accent: "#3a7bff",
        accentSoft: "rgba(58, 123, 255, 0.24)",
        overlayTop: "rgba(0, 0, 0, 0.34)",
        overlayMid: "rgba(0, 0, 0, 0.16)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "mono") {
      return {
        bgA: "#2b2b2b",
        bgB: "#050505",
        bgC: "#111111",
        accent: "#ffffff",
        accentSoft: "rgba(255, 255, 255, 0.2)",
        overlayTop: "rgba(0, 0, 0, 0.38)",
        overlayMid: "rgba(0, 0, 0, 0.14)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "chrome") {
      return {
        bgA: "#3a3a3a",
        bgB: "#060606",
        bgC: "#1a1a1a",
        accent: "#f4f4f4",
        accentSoft: "rgba(255, 255, 255, 0.28)",
        overlayTop: "rgba(0, 0, 0, 0.32)",
        overlayMid: "rgba(0, 0, 0, 0.12)",
        overlayBottom: "rgba(0, 0, 0, 0.88)",
      };
    }

    if (filterId === "future") {
      return {
        bgA: "#1c0b3d",
        bgB: "#03020b",
        bgC: "#061526",
        accent: "#8b5cf6",
        accentSoft: "rgba(14, 165, 233, 0.24)",
        overlayTop: "rgba(0, 0, 0, 0.32)",
        overlayMid: "rgba(0, 0, 0, 0.14)",
        overlayBottom: "rgba(0, 0, 0, 0.88)",
      };
    }

    if (filterId === "vintage") {
      return {
        bgA: "#3a2412",
        bgB: "#090503",
        bgC: "#1d1208",
        accent: "#d9a15f",
        accentSoft: "rgba(217, 161, 95, 0.26)",
        overlayTop: "rgba(0, 0, 0, 0.3)",
        overlayMid: "rgba(0, 0, 0, 0.12)",
        overlayBottom: "rgba(0, 0, 0, 0.86)",
      };
    }

    if (filterId === "semipro") {
      return {
        bgA: "#2b1c08",
        bgB: "#070402",
        bgC: "#1a1206",
        accent: "#e8b448",
        accentSoft: "rgba(232, 180, 72, 0.28)",
        overlayTop: "rgba(0, 0, 0, 0.32)",
        overlayMid: "rgba(0, 0, 0, 0.14)",
        overlayBottom: "rgba(0, 0, 0, 0.88)",
      };
    }

    if (filterId === "champion") {
      return {
        bgA: "#2a1800",
        bgB: "#050301",
        bgC: "#1a1000",
        accent: "#ffd648",
        accentSoft: "rgba(255, 214, 72, 0.3)",
        overlayTop: "rgba(0, 0, 0, 0.3)",
        overlayMid: "rgba(0, 0, 0, 0.12)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "goat") {
      return {
        bgA: "#1f1408",
        bgB: "#020101",
        bgC: "#120a04",
        accent: "#ffe48c",
        accentSoft: "rgba(255, 228, 140, 0.32)",
        overlayTop: "rgba(0, 0, 0, 0.34)",
        overlayMid: "rgba(0, 0, 0, 0.14)",
        overlayBottom: "rgba(0, 0, 0, 0.92)",
      };
    }

    return {
      bgA: "#2a0606",
      bgB: "#050505",
      bgC: "#180000",
      accent: "#ff3b3b",
      accentSoft: "rgba(255, 59, 59, 0.26)",
      overlayTop: "rgba(0, 0, 0, 0.32)",
      overlayMid: "rgba(0, 0, 0, 0.14)",
      overlayBottom: "rgba(0, 0, 0, 0.9)",
    };
  }

  function drawPosterBackground(ctx, width, height, theme) {
    const base = ctx.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, theme.bgA);
    base.addColorStop(0.44, theme.bgB);
    base.addColorStop(1, theme.bgC);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);

    const topGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.12,
      10,
      width * 0.5,
      height * 0.12,
      width * 0.72
    );
    topGlow.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    topGlow.addColorStop(0.32, theme.accentSoft);
    topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawPosterOverlay(ctx, width, height, theme) {
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, theme.overlayTop);
    overlay.addColorStop(0.32, theme.overlayMid);
    overlay.addColorStop(0.62, "rgba(0, 0, 0, 0.34)");
    overlay.addColorStop(1, theme.overlayBottom);
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    const lowerGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.73,
      10,
      width * 0.5,
      height * 0.73,
      width * 0.78
    );
    lowerGlow.addColorStop(0, theme.accentSoft);
    lowerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lowerGlow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawSocialMoodOverlay(ctx, width, height, theme, hasPhoto, natural = false) {
    const mood = ctx.createLinearGradient(0, 0, 0, height);

    if (natural) {
      mood.addColorStop(0, hasPhoto ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.06)");
      mood.addColorStop(0.35, "rgba(0, 0, 0, 0.03)");
      mood.addColorStop(0.68, "rgba(0, 0, 0, 0.1)");
      mood.addColorStop(1, hasPhoto ? "rgba(0, 0, 0, 0.28)" : "rgba(0, 0, 0, 0.18)");
    } else {
      mood.addColorStop(0, hasPhoto ? "rgba(0, 0, 0, 0.28)" : "rgba(0, 0, 0, 0.12)");
      mood.addColorStop(0.35, "rgba(0, 0, 0, 0.08)");
      mood.addColorStop(0.68, "rgba(0, 0, 0, 0.24)");
      mood.addColorStop(1, "rgba(0, 0, 0, 0.64)");
    }
  
    ctx.fillStyle = mood;
    ctx.fillRect(0, 0, width, height);
  
    const accentGlow = ctx.createRadialGradient(
      width * 0.82,
      height * 0.12,
      10,
      width * 0.82,
      height * 0.12,
      width * 0.72
    );
  
    accentGlow.addColorStop(0, theme.accentSoft);
    accentGlow.addColorStop(0.38, "rgba(0, 0, 0, 0)");
    accentGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    if (!natural) {
      ctx.fillStyle = accentGlow;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = accentGlow;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      width * 0.2,
      width * 0.5,
      height * 0.45,
      width * 0.9
    );

    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.72, natural ? "rgba(0, 0, 0, 0.04)" : "rgba(0, 0, 0, 0.08)");
    vignette.addColorStop(1, natural ? "rgba(0, 0, 0, 0.14)" : "rgba(0, 0, 0, 0.42)");
  
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  
  function drawPosterDivider(ctx, y, width, centerX, theme) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.fillRect(190, y, 270, 3);
    ctx.fillRect(width - 460, y, 270, 3);
    ctx.restore();
  }

  function drawPosterTextTop(ctx, text, x, y, maxWidth, options = {}) {
    const usedSize = drawTextFit(ctx, text, x, y, maxWidth, {
      ...options,
      baseline: "top",
    });

    return Math.ceil(usedSize * (options.lineHeightRatio || 1.12));
  }

  async function createPosterCanvasDataUrl(filterIdForExport) {
    const exportSnapshot = posterExportRef.current || {};
    const exportFields = exportSnapshot.fields || {};
    const exportVisible = exportSnapshot.visible || posterVisible;
    const exportFilterId =
      filterIdForExport ||
      exportSnapshot.selectedFilter ||
      selectedFilterRef.current ||
      selectedFilter ||
      "levelup";
  
    const exportFilterIntensity =
      typeof exportSnapshot.filterIntensity === "number"
        ? exportSnapshot.filterIntensity
        : filterIntensity;
  
    const exportPhotoScale =
      typeof exportSnapshot.photoScale === "number"
        ? exportSnapshot.photoScale
        : photoScale;
  
    const exportCardMedia = exportSnapshot.cardMedia || cardMedia;
    const exportCardMediaType = exportSnapshot.cardMediaType || cardMediaType;
  
    const exportMainNameText = String(
      exportFields.mainName || posterMainName || profile.nickname || "JO WOON"
    ).trim();
  
    const exportSubtitleText = String(
      exportFields.subtitle || posterSubtitle || "THE ROOKIE"
    ).trim();
  
    const exportEventTitleText = String(
      exportFields.eventTitle || posterEventTitle || "TRAINING DAY"
    ).trim();
  
    const exportDateTextValue = String(
      exportFields.date || posterDateText || "JUNE 27"
    ).trim();
  
    const exportMetaTextValue = String(
      exportFields.meta || posterMetaText || "BOXING TRAINING POSTER | RISING FIGHTER"
    ).trim();
  
    const exportFooterTextValue = String(
      exportFields.footer || posterFooterText || "EVERY ROUND WRITES YOUR STORY"
    ).trim();
  
    const canvas = document.createElement("canvas");
    const width = 1080;
    const height = 1920;
    const centerX = width / 2;
    const theme = getPosterCanvasTheme(exportFilterId);
  
    canvas.width = width;
    canvas.height = height;
  
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error("캔버스를 만들지 못했어요.");
    }
  
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  
    drawPosterBackground(ctx, width, height, theme);

    let hasPosterPhoto = false;

    const candidateImageSources = [];

    if (exportCardMediaType === "image" && exportCardMedia) {
      candidateImageSources.push(exportCardMedia);
    }

    const previewImage = trainingCardRef.current?.querySelector('img[alt="훈련 카드"]');

    if (previewImage?.src && !candidateImageSources.includes(previewImage.src)) {
      candidateImageSources.push(previewImage.src);
    }

    for (const imageSrc of candidateImageSources) {
      try {
        const image = await loadCanvasImage(imageSrc);
        const canUseCanvasFilter = "filter" in ctx;

        ctx.save();

        if (canUseCanvasFilter) {
          ctx.filter = getImageFilter(exportFilterId, exportFilterIntensity);
        }

        drawCoverImage(
          ctx,
          image,
          0,
          0,
          width,
          height,
          Math.max(exportPhotoScale, 100)
        );

        ctx.filter = "none";

        if (!canUseCanvasFilter) {
          applyPixelImageFilter(
            ctx,
            0,
            0,
            width,
            height,
            exportFilterId,
            exportFilterIntensity
          );
        }

        ctx.restore();
        hasPosterPhoto = true;
        break;
      } catch (error) {
        console.warn("포스터 사진 캔버스 로드 실패:", error);
      }
    }
  
    const globalShade = ctx.createLinearGradient(0, 0, 0, height);
  
    globalShade.addColorStop(
      0,
      hasPosterPhoto ? "rgba(0, 0, 0, 0.36)" : "rgba(0, 0, 0, 0.08)"
    );
    globalShade.addColorStop(
      0.22,
      hasPosterPhoto ? "rgba(0, 0, 0, 0.12)" : "rgba(0, 0, 0, 0.02)"
    );
    globalShade.addColorStop(
      0.48,
      hasPosterPhoto ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.14)"
    );
    globalShade.addColorStop(0.66, "rgba(0, 0, 0, 0.5)");
    globalShade.addColorStop(1, "rgba(0, 0, 0, 0.96)");
  
    ctx.fillStyle = globalShade;
    ctx.fillRect(0, 0, width, height);
  
    const topGlow = ctx.createRadialGradient(centerX, 165, 8, centerX, 165, 720);
  
    topGlow.addColorStop(0, "rgba(255, 255, 255, 0.22)");
    topGlow.addColorStop(0.34, theme.accentSoft);
    topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);
  
    const nameGlow = ctx.createRadialGradient(
      centerX,
      1190,
      20,
      centerX,
      1190,
      760
    );
  
    nameGlow.addColorStop(0, theme.accentSoft);
    nameGlow.addColorStop(0.4, "rgba(0, 0, 0, 0)");
    nameGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  
    ctx.fillStyle = nameGlow;
    ctx.fillRect(0, 0, width, height);
  
    ctx.save();
    ctx.strokeStyle = hasPosterPhoto
      ? "rgba(255, 255, 255, 0.16)"
      : theme.accentSoft;
    ctx.lineWidth = 4;
    ctx.strokeRect(34, 34, width - 68, height - 68);
    ctx.restore();
  
    ctx.save();
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.78;
    ctx.fillRect(120, 118, 255, 4);
    ctx.fillRect(width - 375, 118, 255, 4);
    ctx.globalAlpha = 1;
  
    drawTextFit(ctx, "FIGHTER PROFILE", centerX, 92, 430, {
      size: 34,
      minSize: 24,
      weight: 950,
      family: "Arial Black, Arial, sans-serif",
      color: "rgba(255, 255, 255, 0.94)",
      strokeWidth: 3,
      baseline: "top",
      shadow: false,
    });
  
    ctx.restore();
  
    let mainY = 970;
    const mainBottomLimit = 1588;
  
    if (exportVisible.mainName) {
      const usedHeight = drawPosterTextTop(
        ctx,
        exportMainNameText.toUpperCase(),
        centerX,
        mainY,
        980,
        {
          size: 190,
          minSize: 78,
          weight: 950,
          family: "Impact, Arial Black, Arial, sans-serif",
          color: "#ffffff",
          strokeWidth: 10,
          lineHeightRatio: 0.9,
        }
      );
  
      mainY += Math.max(usedHeight, 144) + 2;
    }
  
    if (exportVisible.subtitle && mainY < mainBottomLimit) {
      const usedHeight = drawPosterTextTop(
        ctx,
        exportSubtitleText.toUpperCase(),
        centerX,
        mainY,
        840,
        {
          size: 58,
          minSize: 28,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          color: theme.accent,
          strokeWidth: 5,
          lineHeightRatio: 0.98,
        }
      );
  
      mainY += Math.max(usedHeight, 56) + 28;
    }
  
    if ((exportVisible.eventTitle || exportVisible.date) && mainY < mainBottomLimit) {
      drawPosterDivider(ctx, mainY + 10, width, centerX, theme);
      mainY += 58;
    }
  
    if (exportVisible.eventTitle && mainY < mainBottomLimit) {
      const usedHeight = drawPosterTextTop(
        ctx,
        exportEventTitleText.toUpperCase(),
        centerX,
        mainY,
        920,
        {
          size: 96,
          minSize: 40,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          color: theme.accent,
          strokeWidth: 7,
          lineHeightRatio: 0.92,
        }
      );
  
      mainY += Math.max(usedHeight, 86) + 10;
    }
  
    if (exportVisible.date && mainY < mainBottomLimit) {
      drawPosterTextTop(
        ctx,
        exportDateTextValue.toUpperCase(),
        centerX,
        mainY,
        760,
        {
          size: 54,
          minSize: 26,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          color: theme.accent,
          strokeWidth: 5,
          lineHeightRatio: 1.0,
        }
      );
    }
  
    if (exportVisible.meta) {
      ctx.save();
      ctx.fillStyle = theme.accent;
      ctx.fillRect(150, 1642, width - 300, 5);
      ctx.restore();
  
      drawPosterTextTop(
        ctx,
        exportMetaTextValue.toUpperCase(),
        centerX,
        1674,
        910,
        {
          size: 28,
          minSize: 17,
          weight: 900,
          family: "Arial Black, Arial, sans-serif",
          color: theme.accent,
          strokeWidth: 3,
          lineHeightRatio: 1.05,
        }
      );
    }
  
    if (exportVisible.footer) {
      drawPosterTextTop(
        ctx,
        exportFooterTextValue.toUpperCase(),
        centerX,
        1830,
        900,
        {
          size: 30,
          minSize: 18,
          weight: 900,
          family: "Arial Black, Arial, sans-serif",
          color: theme.accent,
          strokeWidth: 3,
          lineHeightRatio: 1.05,
        }
      );
    }
  
    const vignette = ctx.createRadialGradient(
      centerX,
      height * 0.48,
      width * 0.2,
      centerX,
      height * 0.48,
      width * 0.94
    );
  
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.72, "rgba(0, 0, 0, 0.12)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.48)");
  
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  
    return canvas.toDataURL("image/png", 1);
  }



  function roundRect(ctx, x, y, width, height, radius) {
    const safeRadius = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + safeRadius, y);
    ctx.lineTo(x + width - safeRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
    ctx.lineTo(x + width, y + height - safeRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
    ctx.lineTo(x + safeRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
    ctx.lineTo(x, y + safeRadius);
    ctx.quadraticCurveTo(x, y, x + safeRadius, y);
    ctx.closePath();
  }

  function drawContainImage(ctx, image, x, y, width, height, scalePercent = 100) {
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;

    if (!imageWidth || !imageHeight) return;

    const baseScale = Math.min(width / imageWidth, height / imageHeight);
    const safeScale = Math.max(scalePercent / 100, 0.7);
    const finalScale = baseScale * safeScale;
    const drawWidth = imageWidth * finalScale;
    const drawHeight = imageHeight * finalScale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }

  async function drawCardPhotoToCanvas(ctx, width, height, options = {}) {
    const {
      fit = "cover",
      filterId = "levelup",
      filterIntensityValue = 75,
      scalePercent = 100,
      topInset = 0,
      bottomInset = 0,
    } = options;

    const availableHeight = height - topInset - bottomInset;
    const exportSnapshot = posterExportRef.current || {};
    const exportCardMedia = exportSnapshot.cardMedia || cardMedia;
    const exportCardMediaType = exportSnapshot.cardMediaType || cardMediaType;
    const candidateImageSources = [];

    if (exportCardMediaType === "image" && exportCardMedia) {
      candidateImageSources.push(exportCardMedia);
    }

    const previewImage = trainingCardRef.current?.querySelector('img[alt="훈련 카드"]');
    if (previewImage?.src && !candidateImageSources.includes(previewImage.src)) {
      candidateImageSources.push(previewImage.src);
    }

    for (const imageSrc of candidateImageSources) {
      try {
        const image = await loadCanvasImage(imageSrc);
        const canUseCanvasFilter = "filter" in ctx;

        ctx.save();

        if (canUseCanvasFilter) {
          ctx.filter = getImageFilter(filterId, filterIntensityValue);
        }

        if (fit === "contain") {
          drawContainImage(ctx, image, 0, topInset, width, availableHeight, scalePercent);
        } else {
          drawCoverImage(ctx, image, 0, topInset, width, availableHeight, Math.max(scalePercent, 100));
        }

        ctx.filter = "none";

        if (!canUseCanvasFilter) {
          applyPixelImageFilter(
            ctx,
            0,
            topInset,
            width,
            availableHeight,
            filterId,
            filterIntensityValue
          );
        }

        ctx.restore();
        return true;
      } catch (error) {
        console.warn("카드 사진 캔버스 로드 실패:", error);
      }
    }

    return false;
  }

  async function createTrainingCardCanvasDataUrl(styleIdForExport) {
    const exportSnapshot = posterExportRef.current || {};
    const exportFilterId =
      exportSnapshot.selectedFilter ||
      selectedFilterRef.current ||
      selectedFilter ||
      "levelup";
    const exportFilterIntensity =
      typeof exportSnapshot.filterIntensity === "number"
        ? exportSnapshot.filterIntensity
        : filterIntensity;
    const exportPhotoScale =
      typeof exportSnapshot.photoScale === "number"
        ? exportSnapshot.photoScale
        : photoScale;
    const isSocialExport = styleIdForExport === "social";
    const width = 1080;
    const height = isSocialExport ? 1920 : 1600;
    const theme = getPosterCanvasTheme(exportFilterId);
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("캔버스를 만들지 못했어요.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    drawPosterBackground(ctx, width, height, theme);

        const hasPhoto = await drawCardPhotoToCanvas(ctx, width, height, {
          fit: "cover",
          filterId: exportFilterId,
          filterIntensityValue: exportFilterIntensity,
          scalePercent: isSocialExport
            ? exportPhotoScale
            : Math.max(exportPhotoScale, 100),
          topInset: 0,
          bottomInset: 0,
        });

        if (!isSocialExport) {
          drawPosterOverlay(ctx, width, height, theme);
        }

        if (isSocialExport) {
          ctx.save();
          ctx.globalAlpha = 0.74;
          drawPosterOverlay(ctx, width, height, theme);
          ctx.restore();
          drawSocialMoodOverlay(ctx, width, height, theme, hasPhoto, true);
        }
        
    if (!isSocialExport) {
      const bottomShade = ctx.createLinearGradient(0, height * 0.48, 0, height);
    
      bottomShade.addColorStop(0, "rgba(0, 0, 0, 0)");
      bottomShade.addColorStop(
        0.45,
        hasPhoto ? "rgba(0, 0, 0, 0.38)" : "rgba(0, 0, 0, 0.2)"
      );
      bottomShade.addColorStop(1, "rgba(0, 0, 0, 0.92)");
    
      ctx.fillStyle = bottomShade;
      ctx.fillRect(0, 0, width, height);
    }

    if (isSocialExport) {
      drawTextFit(ctx, "BOXING TRAINING", 64, 72, 520, {

        size: 34,
        minSize: 24,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: theme.accent,
        strokeWidth: 3,
        baseline: "top",
      });

      drawTextFit(ctx, profileStats.levelLabel, width - 64, 72, 240, {
        size: 34,
        minSize: 22,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "right",
        color: "#ffffff",
        strokeWidth: 3,
        baseline: "top",
      });

      // SOCIAL 저장에서는 사진 위에 별도 그라데이션 패널을 깔지 않는다.

      drawPosterTextTop(ctx, primaryCardTitle.toUpperCase(), 70, 1556, 940, {
        size: 84,
        minSize: 44,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        strokeWidth: 6,
        lineHeightRatio: 0.96,
      });

      if (showComment) {
        drawWrappedText(ctx, mainComment, 70, 1648, 910, {
          size: 34,
          weight: 850,
          lineHeight: 48,
          maxLines: 2,
          color: "rgba(255, 255, 255, 0.82)",
          align: "left",
        });
      }

      const metricY = 1766;
      const metricW = 290;
      const metricGap = 34;
      const metricX = 70;
      const metrics = [
        ["WEEK", `${profileStats.weeklyRounds}R`],
        ["TOTAL", `${profileStats.totalRounds}R`],
        ["FIGHTER", profile.nickname || "나"],
      ];

      metrics.forEach(([label, value], index) => {
        const x = metricX + index * (metricW + metricGap);
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        roundRect(ctx, x, metricY, metricW, 112, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 2;
        ctx.stroke();

        drawTextFit(ctx, label, x + 26, metricY + 24, metricW - 52, {
          size: 23,
          minSize: 18,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "left",
          color: theme.accent,
          baseline: "top",
          shadow: false,
        });

        drawTextFit(ctx, value, x + 26, metricY + 58, metricW - 52, {
          size: 32,
          minSize: 20,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "left",
          color: "#ffffff",
          strokeWidth: 2,
          baseline: "top",
        });
      });
    } else {
      const accent = theme.accent || "#d6a234";
      const cardPadding = 58;

      const sideShade = ctx.createLinearGradient(0, 0, width * 0.75, 0);
      sideShade.addColorStop(0, "rgba(0, 0, 0, 0.76)");
      sideShade.addColorStop(0.58, "rgba(0, 0, 0, 0.42)");
      sideShade.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = sideShade;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.strokeStyle = "rgba(214, 162, 52, 0.7)";
      ctx.lineWidth = 4;
      roundRect(ctx, 34, 34, width - 68, height - 68, 42);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
      roundRect(ctx, 78, 74, 112, 112, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(214, 162, 52, 0.78)";
      ctx.lineWidth = 4;
      ctx.stroke();
      drawTextFit(ctx, "ID", 134, 94, 78, {
        size: 56,
        minSize: 42,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        color: accent,
        strokeWidth: 2,
        baseline: "top",
      });
      ctx.restore();

      drawTextFit(ctx, "PERSONAL TRAINING ID", 210, 108, 520, {
        size: 32,
        minSize: 22,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "rgba(255, 255, 255, 0.92)",
        strokeWidth: 3,
        baseline: "top",
      });

      drawTextFit(ctx, levelUpDisplayName, cardPadding, 210, 720, {
        size: 154,
        minSize: 72,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        strokeWidth: 8,
        baseline: "top",
      });

      drawTextFit(ctx, "LEVEL", cardPadding, 420, 240, {
        size: 44,
        minSize: 30,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        strokeWidth: 4,
        baseline: "top",
      });

      drawTextFit(ctx, levelUpDisplayLevel, cardPadding, 470, 420, {
        size: 210,
        minSize: 110,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: accent,
        strokeWidth: 8,
        baseline: "top",
      });

      ctx.save();
      ctx.fillStyle = accent;
      ctx.fillRect(cardPadding, 744, 300, 6);
      ctx.restore();

      drawWrappedText(ctx, levelUpDisplaySlogan, cardPadding, 790, 620, {
        size: 64,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        lineHeight: 72,
        maxLines: 2,
        color: "#ffffff",
        align: "left",
      });

      const statY = 1096;
      const statW = 292;
      const statH = 178;
      const statGap = 34;
      const statItems = [
        ["W", `${profileStats.weeklyRounds}`, "ROUNDS", "THIS WEEK"],
        ["T", `${profileStats.totalRounds}`, "ROUNDS", "TOTAL"],
        ["S", `${levelUpStreakDays || 1}`, "STREAK", "DAYS"],
      ];

      statItems.forEach(([icon, value, labelA, labelB], index) => {
        const x = 68 + index * (statW + statGap);
        ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
        roundRect(ctx, x, statY, statW, statH, 26);
        ctx.fill();
        ctx.strokeStyle = "rgba(214, 162, 52, 0.62)";
        ctx.lineWidth = 3;
        ctx.stroke();

        drawTextFit(ctx, icon, x + 32, statY + 38, 58, {
          size: 42,
          minSize: 32,
          weight: 950,
          align: "left",
          color: accent,
          baseline: "top",
          shadow: false,
        });

        drawTextFit(ctx, value, x + statW - 34, statY + 36, statW - 112, {
          size: 56,
          minSize: 32,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "right",
          color: "#ffffff",
          strokeWidth: 4,
          baseline: "top",
        });

        drawTextFit(ctx, labelA, x + statW - 34, statY + 98, statW - 80, {
          size: 27,
          minSize: 20,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "right",
          color: accent,
          baseline: "top",
          shadow: false,
        });

        drawTextFit(ctx, labelB, x + statW - 34, statY + 130, statW - 80, {
          size: 24,
          minSize: 18,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "right",
          color: "#ffffff",
          baseline: "top",
          shadow: false,
        });
      });

      const tierX = 68;
      const tierY = 1350;
      const tierW = width - 136;
      const tierH = 176;
      ctx.fillStyle = "rgba(0, 0, 0, 0.66)";
      roundRect(ctx, tierX, tierY, tierW, tierH, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(214, 162, 52, 0.7)";
      ctx.lineWidth = 3;
      ctx.stroke();

      drawTextFit(ctx, "NEXT LEVEL:", tierX + 36, tierY + 34, 280, {
        size: 36,
        minSize: 24,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "rgba(255, 255, 255, 0.86)",
        baseline: "top",
        shadow: false,
      });

      drawTextFit(
        ctx,
        growthPreview.isMax
          ? "MAX"
          : growthPreview.nextTitle?.en || growthPreview.currentTitleEn,
        tierX + 330,
        tierY + 26,
        330,
        {
        size: 76,
        minSize: 44,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: accent,
        strokeWidth: 4,
        baseline: "top",
      });

      drawTextFit(
        ctx,
        growthPreview.isMax ? "LV.100" : `${levelUpNextExp || 0} EXP`,
        tierX + tierW - 42,
        tierY + 36,
        220,
        {
        size: 56,
        minSize: 34,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "right",
        color: accent,
        strokeWidth: 4,
        baseline: "top",
      });

      ctx.save();
      const barX = tierX + 36;
      const barY = tierY + 122;
      const barW = tierW - 72;
      const barH = 28;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      roundRect(ctx, barX, barY, barW, barH, 14);
      ctx.fill();
      ctx.fillStyle = accent;
      roundRect(ctx, barX, barY, barW * (levelUpProgressPercent / 100), barH, 14);
      ctx.fill();
      ctx.restore();
    }

    return canvas.toDataURL("image/png", 1);
  }

  function dataUrlToBlob(dataUrl) {
    const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error("DATA_URL_PARSE_FAILED");
    }

    const [, mime, base64] = match;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  async function dataUrlToPngFile(dataUrl, filename) {
    try {
      const blob = dataUrlToBlob(dataUrl);
      return new File([blob], filename, { type: "image/png" });
    } catch (error) {
      // 일부 브라우저/인앱 웹뷰에서 base64 파싱이 막히는 경우가 있어 fetch로 폴백한다.
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      return new File([blob], filename, { type: "image/png" });
    }
  }

  async function buildCardExportDataUrl(styleOverride = null) {
    const exportStyle = styleOverride || cardStyleRef.current || cardStyle;
    const filterIdForExport =
      posterExportRef.current.selectedFilter ||
      selectedFilterRef.current ||
      selectedFilter ||
      "levelup";

    if (exportStyle === "poster") {
      return createPosterCanvasDataUrl(filterIdForExport);
    }

    if (exportStyle === "social") {
      return createTrainingCardCanvasDataUrl("social");
    }

    return createTrainingCardCanvasDataUrl("basic");
  }

  async function prepareCardExport({ force = false } = {}) {
    const key = getCardExportKey();
    const styleForExport = cardStyleRef.current || cardStyle;
    const generation = exportGenerationRef.current;

    if (
      !force &&
      exportCacheRef.current.key === key &&
      exportCacheRef.current.style === styleForExport &&
      exportCacheRef.current.file
    ) {
      return exportCacheRef.current;
    }

    if (preparingExportKeyRef.current === key && exportCacheRef.current.promise) {
      return exportCacheRef.current.promise;
    }

    preparingExportKeyRef.current = key;

    const promise = (async () => {
      const filename =
        styleForExport === "poster"
          ? `boxing-fighter-poster-${Date.now()}.png`
          : styleForExport === "basic"
          ? `boxing-level-up-card-${Date.now()}.png`
          : `boxing-story-${Date.now()}.png`;

      const dataUrl = await buildCardExportDataUrl(styleForExport);

      if (generation !== exportGenerationRef.current) {
        throw new Error("EXPORT_STALE");
      }

      const file = await dataUrlToPngFile(dataUrl, filename);

      const cache = { key, style: styleForExport, dataUrl, file, filename };
      exportCacheRef.current = cache;

      return cache;
    })();

    exportCacheRef.current = {
      ...exportCacheRef.current,
      key,
      promise,
    };

    try {
      return await promise;
    } finally {
      if (preparingExportKeyRef.current === key) {
        preparingExportKeyRef.current = "";
      }
    }
  }

  function showExportPreview(cache) {
    if (!cache?.dataUrl) return;

    setExportPreview({
      dataUrl: cache.dataUrl,
      file: cache.file || null,
      filename: cache.filename || `boxing-training-card-${Date.now()}.png`,
      style: cache.style || cardStyleRef.current || cardStyle,
    });
  }

  function shareOrDownloadPreparedExport(cache) {
    if (!cache?.file || !cache?.dataUrl) {
      throw new Error("저장할 이미지가 아직 준비되지 않았어요.");
    }

    const exportStyle = cache.style || cardStyleRef.current || cardStyle;
    const shareData = {
      title: "Boxing Training Card",
      text:
        exportStyle === "poster"
          ? "오늘의 파이터 포스터"
          : exportStyle === "social"
          ? "오늘의 스토리 훈련 카드"
          : "오늘의 레벨업 훈련 카드",
      files: [cache.file],
    };

    // iPhone에서는 사용자 클릭 직후 같은 call stack 안에서 navigator.share를 호출해야 안정적이다.
    // 그래서 이 함수 안에서는 share 전에 await, 이미지 생성, setState를 하지 않는다.
    if (
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [cache.file] }))
    ) {
      const sharePromise = navigator.share(shareData);

      if (sharePromise && typeof sharePromise.catch === "function") {
        sharePromise.catch((error) => {
          if (error?.name === "AbortError") return;
          console.warn("공유창 열기 실패:", error);
          showExportPreview(cache);
        });
      }

      return;
    }

    // iPhone에서 파일 다운로드는 사진앱 저장과 다르게 동작할 수 있다.
    // 공유 API가 막히면 바로 이미지 미리보기를 띄워 길게 눌러 저장할 수 있게 한다.
    if (isIOSLikeDevice()) {
      showExportPreview(cache);
      return;
    }

    const link = document.createElement("a");
    link.download = cache.filename;
    link.href = cache.dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function handleSaveCardImage() {
    if (cardMediaType === "video") {
      alert(
        "영상 카드는 다음 단계에서 저장 기능을 붙일게. 지금은 사진 카드만 이미지 저장이 가능해."
      );
      return;
    }

    const styleToExport = cardStyleRef.current || cardStyle;
    track("card_save", { style: styleToExport });

    if (!trainingCardRef.current) {
      alert("저장할 카드가 아직 준비되지 않았어.");
      return;
    }

    if (isCardImagePreparing) {
      alert("사진을 불러오는 중이야. 잠시 뒤 다시 시도해줘.");
      return;
    }

    const key = getCardExportKey();
    const cache = exportCacheRef.current;

    if (
      cache.key === key &&
      cache.style === styleToExport &&
      cache.file &&
      cache.dataUrl
    ) {
      try {
        shareOrDownloadPreparedExport(cache);
      } catch (error) {
        console.error(error);
        showExportPreview(cache);
      }
      return;
    }

    try {
      setIsSavingImage(true);
      const freshCache = await prepareCardExport({ force: true });
      shareOrDownloadPreparedExport(freshCache);
    } catch (error) {
      if (error?.message === "EXPORT_STALE") {
        return;
      }

      console.error(error);
      const fallback = exportCacheRef.current;

      if (
        fallback?.dataUrl &&
        fallback.style === styleToExport &&
        fallback.key === key
      ) {
        showExportPreview(fallback);
      } else {
        alert("이미지를 만들지 못했어. 사진과 설정을 확인한 뒤 다시 시도해줘.");
      }
    } finally {
      setIsSavingImage(false);
    }
  }

  async function handleCopyTrainingCardText() {
    if (selectedLogs.length === 0) {
      alert("먼저 운동을 하나 이상 선택해줘.");
      return;
    }

    const logLines = selectedLogs
      .map((log, index) => {
        const title = getCardLogTitle(log, index);
        const trainingInfo = `${getRounds(log)}R · ${
          log.minutes || log.duration
        }min`;

        return title ? `${title}\n${trainingInfo}` : trainingInfo;
      })
      .join("\n\n");

    const commentText = showComment
      ? `

COMMENT
${mainComment}`
      : "";

    const mediaText =
      cardMediaType === "video" ? "\n\nMEDIA\nVideo training card preview" : "";

    const text =
      cardStyle === "poster"
        ? `[FIGHTER POSTER]
${posterTextLines.join("\n")}${commentText}${mediaText}`
        : `[TRAINING CARD]
${profile.nickname || "나"} · ${profileStats.levelLabel}

${logLines}${commentText}${mediaText}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      alert("복사에 실패했어. 브라우저 권한 문제일 수 있어.");
    }
  }

  useEffect(() => {
    setExportPreview(null);

    if (cardMediaType === "video") return;

    if (cardMediaType === "image" && cardMedia && !cardMediaReady) {
      return;
    }

    const timer = setTimeout(() => {
      // 저장 버튼을 빠르게 누를 때를 대비해 이미지를 미리 만들어 캐시에 채워둔다.
      prepareCardExport({ force: true }).catch((error) => {
        if (error?.message === "EXPORT_STALE") return;
        console.warn("저장 이미지 미리 준비 실패:", error);
      });
    }, 650);

    return () => {
      clearTimeout(timer);
    };
  }, [currentExportKey, cardMediaReady, cardMediaType, cardMedia]);

  const cardPreviewHeight =
    cardStyle === "poster"
      ? "620px"
      : cardStyle === "social"
        ? undefined
        : "560px";

  const posterPreviewTheme = getPosterCanvasTheme(selectedFilter);
  const posterPreviewAccent = posterPreviewTheme.accent;
  const posterPreviewLine = `linear-gradient(90deg, transparent, ${posterPreviewAccent}, transparent)`;

  const isCardImagePreparing =
    cardMediaType === "image" && Boolean(cardMedia) && !cardMediaReady;

  const isSaveCardDisabled =
    cardMediaType === "video" || isSavingImage || isCardImagePreparing;

  const activeCardStyle =
    CARD_STYLES.find((style) => style.id === cardStyle) || CARD_STYLES[0];
  const baseCardSaveLabel =
    cardStyle === "social"
      ? "STORY 카드 저장 (9:16)"
      : cardStyle === "poster"
      ? "POSTER 카드 저장"
      : "LEVEL UP 카드 저장";
  const cardSaveLabel =
    isQuickCardFlow && cardMedia
      ? `인증 카드 저장·공유하기`
      : baseCardSaveLabel;

  return (
    <main style={styles.page} className="profile-page">
      {profileView === "nameplate" && (
        <>
      <FighterSpecCard
        profile={profile}
        logs={logs}
        weeklyScore={weeklyScore}
        titleBadge={profileStats.fighterTitleEn}
        careerStageKo={profileStats.careerStageKo}
        streakDays={levelUpStreakDays}
        onOpenCardMaker={scrollToCardMaker}
        onUploadPhoto={() => fileInputRef.current?.click()}
        onRemovePhoto={handleRemovePhoto}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="profile-edit-toggle"
          style={styles.profileEditToggle}
          onClick={() => setIsProfileEditOpen((open) => !open)}
          aria-expanded={isProfileEditOpen}
        >
          <div style={styles.profileEditToggleCopy}>
            <p style={styles.profileEditToggleTitle}>프로필 · 신체 스펙 수정</p>
            <span
              className="profile-edit-toggle-hint"
              style={styles.profileEditToggleHint}
            >
              {isProfileEditOpen
                ? "닉네임, 소개, 키·체중·체급 등을 수정할 수 있어요."
                : profileSpecSummary || "탭해서 프로필과 신체 스펙을 수정하세요."}
            </span>
          </div>
          <span
            className="profile-edit-toggle-action"
            style={styles.profileEditToggleAction}
          >
            {isProfileEditOpen ? "접기 ▲" : "펼치기 ▼"}
          </span>
        </button>

        {isProfileEditOpen ? (
          <div
            className="profile-edit-content"
            style={styles.profileEditContent}
          >
            <div style={styles.profileEditSection}>
              <p style={styles.profileEditSectionTitle}>PROFILE</p>

              <label style={styles.fieldLabel}>
                닉네임
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 조운 파이터"
                  style={styles.input}
                />
              </label>

              <label style={styles.fieldLabel}>
                한 줄 소개
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="예: 아직 초보지만 매주 링에 올라가는 중"
                  style={styles.textarea}
                />
              </label>
            </div>

            <div style={styles.profileEditSection}>
              <p style={styles.profileEditSectionTitle}>BODY SPECS</p>

              <div className="profile-body-specs-grid" style={styles.bodySpecsGrid}>
                <label style={styles.fieldLabel}>
                  키 (cm)
                  <input
                    type="number"
                    inputMode="numeric"
                    min="120"
                    max="230"
                    value={heightCm}
                    onChange={(event) => setHeightCm(event.target.value)}
                    placeholder="175"
                    style={styles.input}
                  />
                </label>

                <label style={styles.fieldLabel}>
                  몸무게 (kg)
                  <input
                    type="number"
                    inputMode="decimal"
                    min="35"
                    max="200"
                    step="0.1"
                    value={weightKg}
                    onChange={(event) => setWeightKg(event.target.value)}
                    placeholder="70"
                    style={styles.input}
                  />
                </label>
              </div>

              <label style={styles.fieldLabel}>
                리치 (cm)
                <span style={styles.fieldHint}>선택 입력</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="100"
                  max="250"
                  value={reachCm}
                  onChange={(event) => setReachCm(event.target.value)}
                  placeholder="178"
                  style={styles.input}
                />
              </label>

              <label style={styles.fieldLabel}>
                체급
                <select
                  value={weightClass}
                  onChange={(event) => {
                    setWeightClassTouched(true);
                    setWeightClass(event.target.value);
                  }}
                  style={styles.input}
                >
                  {WEIGHT_CLASSES.filter((item) => item !== "상관없음").map(
                    (item) => (
                      <option key={item} value={item}>
                        {formatWeightClassOption(item)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                경력
                <select
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  style={styles.input}
                >
                  {EXPERIENCE_LEVELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.fieldLabel}>
                활동 지역
                <span style={styles.fieldHint}>선택 입력 · 예: 강남, 홍대</span>
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  placeholder="강남, 홍대"
                  style={styles.input}
                />
              </label>
            </div>

            <div style={styles.profileSaveFooter}>
              {saveError ? (
                <p style={styles.profileSaveError}>{saveError}</p>
              ) : null}
              <button
                type="button"
                style={styles.profileSaveButton}
                onClick={handleSaveProfile}
              >
                {isSaving ? "저장 완료!" : "변경사항 저장"}
              </button>
            </div>
          </div>
        ) : null}
      </FighterSpecCard>

      <section style={styles.statGrid}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>누적 라운드</span>
          <strong style={styles.statValue}>{profileStats.totalRounds}R</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statLabel}>훈련 기록</span>
          <strong style={styles.statValue}>{profileStats.totalLogs}회</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statLabel}>운동 시간</span>
          <strong style={styles.statValue}>{profileStats.totalMinutes}분</strong>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statLabel}>오늘 완료</span>
          <strong style={styles.statValue}>{profileStats.todayCount}회</strong>
        </div>
      </section>

      <button
        type="button"
        style={styles.cardStudioEntry}
        onClick={scrollToCardMaker}
      >
        <span style={styles.cardStudioEntryKicker}>NAMEPLATE · CARD MAKER</span>
        <strong style={styles.cardStudioEntryTitle}>훈련 인증 카드 만들기</strong>
        <span style={styles.cardStudioEntryDesc}>
          사진과 필터로 나만의 파이터 카드·포스터를 만들어 저장하고 공유하세요.
        </span>
        <span style={styles.cardStudioEntryCta}>카드 만들기 열기 →</span>
      </button>

      <section style={styles.sectionCard}>
        <p style={styles.kicker}>PROOF OF TRAINING</p>
        <h2 style={styles.sectionTitle}>훈련 증명</h2>

        <div style={styles.proofBox}>
          <p style={styles.proofText}>
            나는 지금까지 총{" "}
            <strong style={styles.redText}>
              {profileStats.totalRounds}라운드
            </strong>
            를 버텼고,{" "}
            <strong style={styles.redText}>{profileStats.totalLogs}번</strong>의
            훈련 기록을 남겼다.
          </p>

          <p style={styles.proofSmallText}>
            자동 기록 {profileStats.timerCount}개 · 수동 기록{" "}
            {profileStats.manualCount}개
          </p>
        </div>
      </section>
        </>
      )}

      {profileView === "studio" && (
        <>
      <button
        type="button"
        style={styles.studioBackButton}
        onClick={backToNameplate}
      >
        ← 명패로 돌아가기
      </button>

      <section ref={cardMakerRef} style={styles.cardMakerSection}>
        <p style={styles.kicker}>NAMEPLATE · CARD MAKER</p>
        <h2 style={styles.sectionTitle}>훈련 인증 카드 만들기</h2>

        <p style={styles.cardMakerNameplateNote}>
          명패 스펙 {profileStats.levelLabel} · 이번 주 {profileStats.weeklyRounds}R ·
          누적 {profileStats.totalRounds}R가 카드에 반영됩니다.
        </p>

        <div className="studio-tabs" style={styles.studioTabs} role="tablist" aria-label="카드 만들기 단계">
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === "select"}
            onClick={() => setStudioTab("select")}
            className="studio-tab"
            style={{
              ...styles.studioTab,
              ...(studioTab === "select" ? styles.studioTabActive : {}),
            }}
          >
            1) 운동
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={studioTab === "design"}
            onClick={() => setStudioTab("design")}
            className="studio-tab"
            style={{
              ...styles.studioTab,
              ...(studioTab === "design" ? styles.studioTabActive : {}),
            }}
          >
            2) 사진·필터·저장
          </button>
        </div>

        {isQuickCardFlow && quickFlowLog ? (
          <div className="card-quick-flow-hero" style={styles.quickCardFlowHero}>
            <p style={styles.quickCardFlowKicker}>방금 훈련 인증</p>
            <div className="quick-card-flow-statline" style={styles.quickCardFlowStatline}>
              <strong>{getRounds(quickFlowLog)}R</strong>
              <span aria-hidden="true">·</span>
              <em>+{getLogExp(quickFlowLog)} EXP</em>
            </div>
            <p style={styles.quickCardFlowCopy}>
              {quickFlowLog.type} · {getTotalMinutes(quickFlowLog)}분
            </p>
            {!cardMedia ? (
              <button
                type="button"
                className="card-quick-flow-photo-cta"
                style={styles.quickCardFlowPhotoCta}
                onClick={() => cardMediaInputRef.current?.click()}
              >
                훈련 사진 넣고 카드 완성하기
              </button>
            ) : (
              <p style={styles.quickCardFlowReady}>
                사진이 준비됐어요. 스타일을 고르고 아래에서 저장·공유하세요.
              </p>
            )}
          </div>
        ) : latestLog && isLatestLogSelected ? (
          <div style={styles.recentTrainingNotice}>
            <span style={styles.recentTrainingBadge}>최근 훈련 선택됨</span>

            <div>
              <strong style={styles.recentTrainingTitle}>{latestLog.type}</strong>

              <p style={styles.recentTrainingText}>
                {getRounds(latestLog)}R ·{" "}
                {latestLog.minutes || latestLog.duration}min 훈련이 카드에
                자동 선택됐어요. 이제 사진이나 영상을 넣고 인증 카드로
                저장해보세요.
              </p>
            </div>
          </div>
        ) : null}

        {logs.length === 0 ? (
          <div style={styles.emptyFeaturedLog}>
            아직 선택할 운동 기록이 없어. 타이머를 완료하거나 기록 화면에서
            운동을 직접 작성해줘.
          </div>
        ) : (
          <>
              <p style={styles.cardMakerHelp}>
                카드 하단에 이번 주 {profileStats.weeklyRounds}R · 누적{" "}
                {profileStats.totalRounds}R가 표시됩니다.
              </p>

              {studioTab === "select" ? (
              <div style={styles.selectorSection}>
              <p style={styles.cardMakerLabel}>1. 운동 여러 개 선택</p>
              <p style={styles.cardMakerHelp}>
                카드에 넣고 싶은 운동을 여러 개 선택해. 마지막 1개는 해제되지
                않게 해둘게.
              </p>

              <div style={styles.logSelectList}>
                {logs.slice(0, 10).map((log) => {
                  const isSelected = selectedLogIds.includes(log.id);

                  return (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => toggleLogSelection(log.id)}
                      style={{
                        ...styles.logSelectItem,
                        ...(isSelected ? styles.logSelectItemActive : {}),
                      }}
                    >
                      <div style={styles.logSelectCheck}>
                        {isSelected ? "·" : ""}
                      </div>

                      <div style={{ flex: 1 }}>
                        <strong style={styles.logSelectTitle}>{log.type}</strong>
                        <p style={styles.logSelectMeta}>
                          {getRounds(log)}R · {log.minutes || log.duration}min ·{" "}
                          {log.conditionLabel || "보통"} · {log.date}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
              ) : null}

            {studioTab === "design" ? (
              <>
            <div style={styles.cardPhotoBox}>
              <div>
                <p style={styles.cardMakerLabel}>2. 카드 사진/영상 선택</p>
                <p style={styles.cardMakerHelp}>
                  오늘 훈련한 사진이나 영상을 넣어줘. 사진 카드는 이미지로
                  저장할 수 있고, 영상은 지금은 카드 안에서 미리보기만 가능해.
                </p>
              </div>

              <input
                ref={cardMediaInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleCardMediaChange}
                style={{ display: "none" }}
              />

              <div style={styles.cardPhotoButtonRow}>
                <button
                  type="button"
                  style={styles.photoButton}
                  onClick={() => cardMediaInputRef.current?.click()}
                >
                  훈련 사진/영상 넣기
                </button>

                {cardMedia && (
                  <button
                    type="button"
                    style={styles.darkButton}
                    onClick={handleRemoveCardMedia}
                  >
                    선택한 사진/영상 지우기
                  </button>
                )}
              </div>

              {cardMediaType === "video" && (
                <p style={styles.videoNotice}>
                  영상 카드는 현재 미리보기만 가능해. 영상 저장 기능은 다음
                  단계에서 붙일게.
                </p>
              )}
            </div>

            <div style={styles.filterSection}>
              <p style={styles.cardMakerLabel}>3. 카드 스타일 선택</p>

              <div className="card-style-grid" style={styles.cardStyleGrid}>
                {CARD_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    style={{
                      ...styles.cardStyleButton,
                      ...(cardStyle === style.id
                        ? styles.activeCardStyleButton
                        : {}),
                    }}
                    onClick={() => handleSelectCardStyle(style.id)}
                  >
                    <strong>{style.name}</strong>
                    <span>{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <p style={styles.cardMakerLabel}>4. 카드 테마 선택</p>

              {CARD_FILTER_GROUPS.map((groupName) => {
                const groupFilters = CARD_FILTERS.filter(
                  (filter) => (filter.group || "기본") === groupName
                );

                if (groupFilters.length === 0) return null;

                return (
                  <div key={groupName} style={styles.filterGroup}>
                    <p style={styles.filterGroupLabel}>{groupName}</p>
                    <div className="filter-grid" style={styles.filterGrid}>
                      {groupFilters.map((filter) => {
                        const isLocked = !isVeteranFilterUnlocked(
                          filter.id,
                          profileStats.level
                        );

                        return (
                          <button
                            key={filter.id}
                            type="button"
                            style={{
                              ...styles.filterButton,
                              ...(selectedFilter === filter.id
                                ? styles.activeFilterButton
                                : {}),
                              ...(isLocked ? styles.lockedFilterButton : {}),
                            }}
                            onClick={() => handleSelectFilter(filter.id)}
                            disabled={isLocked}
                          >
                            <strong style={styles.filterChipTitle}>{filter.name}</strong>
                            {isLocked ? (
                              <span style={styles.filterChipLock}>
                                LV. {filter.veteranLevel} 해금
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.adjustSection}>
              <p style={styles.cardMakerLabel}>5. 사진/영상 조절</p>

              <label style={styles.rangeLabel}>
                <span>테마 강도</span>
                <strong>{filterIntensity}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterIntensity}
                onChange={(event) =>
                  updateFilterIntensity(Number(event.target.value))
                }
                style={styles.rangeInput}
              />

              <label style={styles.rangeLabel}>
                <span>사진 크기</span>
                <strong>{photoScale}%</strong>
              </label>
              <input
                type="range"
                min="85"
                max="120"
                value={photoScale}
                onChange={(event) => updatePhotoScale(Number(event.target.value))}
                style={styles.rangeInput}
              />

              <label style={styles.commentToggle}>
                <input
                  type="checkbox"
                  checked={showComment}
                  onChange={(event) => updateShowComment(event.target.checked)}
                  style={styles.commentCheckbox}
                />

                <span>카드에 코멘트 표시하기</span>
              </label>

              <p style={styles.commentToggleHelp}>
                끄면 카드 이미지와 공유 문구에서 코멘트가 빠져.
              </p>

              {cardStyle === "basic" ? (
                <div style={styles.levelUpInputBox}>
                  <p style={styles.cardMakerLabel}>LEVEL UP 입력</p>
                  <p style={styles.cardMakerHelp}>
                    업로드한 사진 위에 표시할 레벨과 한 줄 문구를 정해줘.
                  </p>

                  <label style={styles.label}>
                    레벨
                    <input
                      value={levelUpLevel}
                      onChange={(event) =>
                        setLevelUpLevel(
                          event.target.value.replace(/[^0-9]/g, "").slice(0, 3)
                        )
                      }
                      placeholder="예: 56"
                      inputMode="numeric"
                      style={styles.input}
                    />
                  </label>

                  <label style={{ ...styles.label, marginTop: "12px" }}>
                    카드 문구
                    <input
                      value={levelUpSlogan}
                      onChange={(event) => setLevelUpSlogan(event.target.value)}
                      placeholder="예: ONE ROUND AT A TIME"
                      style={styles.input}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <label style={{ ...styles.label, marginTop: "16px" }}>
                    카드에 보여줄 이름
                    <input
                      value={customTrainingTitle}
                      onChange={(event) =>
                        setCustomTrainingTitle(event.target.value)
                      }
                      placeholder="예: 아침 샌드백"
                      style={styles.input}
                    />
                  </label>

                  <p style={styles.commentToggleHelp}>
                    비워두면 “직접 설정 루틴”은 카드에 표시되지 않아. 이름을 쓰면
                    카드와 공유 문구에 그 이름이 표시돼.
                  </p>
                </>
              )}

              {cardStyle === "poster" && (
                <div style={styles.posterInputBox}>
                  <p style={styles.cardMakerLabel}>POSTER 입력</p>
                  <p style={styles.cardMakerHelp}>
                    사진은 자동으로 깔리고, 아래 글자만 바꾸면 한 사람 주인공
                    포스터처럼 만들어져.
                  </p>

                  <div style={styles.posterInputGrid}>
                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>메인 이름</span>
                        <input
                          value={posterMainName}
                          onChange={(event) =>
                            updatePosterField("mainName", event.target.value)
                          }
                          placeholder={profile.nickname || "JO WOON"}
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.mainName}
                          onChange={(event) =>
                            handlePosterVisibleChange(
                              "mainName",
                              event.target.checked
                            )
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>

                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>서브 문구</span>
                        <input
                          value={posterSubtitle}
                          onChange={(event) =>
                            updatePosterField("subtitle", event.target.value)
                          }
                          placeholder="THE ROOKIE"
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.subtitle}
                          onChange={(event) =>
                            handlePosterVisibleChange(
                              "subtitle",
                              event.target.checked
                            )
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>

                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>이벤트</span>
                        <input
                          value={posterEventTitle}
                          onChange={(event) =>
                            updatePosterField("eventTitle", event.target.value)
                          }
                          placeholder="TRAINING DAY"
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.eventTitle}
                          onChange={(event) =>
                            handlePosterVisibleChange(
                              "eventTitle",
                              event.target.checked
                            )
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>

                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>날짜</span>
                        <input
                          value={posterDateText}
                          onChange={(event) =>
                            updatePosterField("date", event.target.value)
                          }
                          placeholder="JUNE 27"
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.date}
                          onChange={(event) =>
                            handlePosterVisibleChange("date", event.target.checked)
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>

                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>보조 문구</span>
                        <input
                          value={posterMetaText}
                          onChange={(event) =>
                            updatePosterField("meta", event.target.value)
                          }
                          placeholder="BOXING TRAINING POSTER | RISING FIGHTER"
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.meta}
                          onChange={(event) =>
                            handlePosterVisibleChange("meta", event.target.checked)
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>

                    <div style={styles.posterInputRow}>
                      <label style={styles.posterInputLabel}>
                        <span style={styles.posterInputLabelText}>하단 문구</span>
                        <input
                          value={posterFooterText}
                          onChange={(event) =>
                            updatePosterField("footer", event.target.value)
                          }
                          placeholder="EVERY ROUND WRITES YOUR STORY"
                          style={styles.posterInput}
                        />
                      </label>

                      <label style={styles.posterToggleLabel}>
                        <input
                          type="checkbox"
                          checked={posterVisible.footer}
                          onChange={(event) =>
                            handlePosterVisibleChange("footer", event.target.checked)
                          }
                          style={styles.posterToggleCheckbox}
                        />
                        표시
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="training-card-preview-wrap" style={styles.livePreviewSection}>
              <div style={styles.livePreviewHeader}>
                <p style={styles.cardMakerLabel}>결과 미리보기</p>
                <p style={styles.cardMakerHelp}>
                  선택한 카드 스타일(레벨업·스토리·포스터)이 아래에 그대로 반영됩니다.
                </p>
              </div>
            <div
              ref={trainingCardRef}
              style={{
                ...styles.trainingCard,
                background: getCardBackground(selectedFilter),
              }}
            >
              <div
                style={{
                  ...styles.trainingCardPhotoArea,
                  ...(cardStyle === "social"
                    ? { minHeight: 0, aspectRatio: "9 / 16" }
                    : { minHeight: cardPreviewHeight }),
                }}
              >
                {cardMediaType === "image" && cardMedia && (
                  <img
                    src={cardMedia}
                    alt="훈련 카드"
                    onLoad={async (event) => {
                      const image = event.currentTarget;

                      if (image.decode) {
                        try {
                          await image.decode();
                        } catch {
                          // decode 실패해도 렌더링은 완료된 것으로 처리
                        }
                      }

                      setCardMediaReady(true);
                    }}
                    onError={() => setCardMediaReady(true)}
                    style={{
                      ...styles.trainingCardImage,
                      objectFit: "cover",
                      filter: getImageFilter(selectedFilter, filterIntensity),
                      transform:
                        cardStyle === "social"
                          ? `scale(${photoScale / 100})`
                          : `scale(${Math.max(photoScale, 100) / 100})`,
                                          }}
                  />
                )}

                {cardMediaType === "video" && cardMedia && (
                  <video
                    src={cardMedia}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                      ...styles.trainingCardImage,
                      objectFit: "cover",
                      filter: getImageFilter(selectedFilter, filterIntensity),
                      transform:
                        cardStyle === "social"
                          ? `scale(${photoScale / 100})`
                          : `scale(${Math.max(photoScale, 100) / 100})`,
                    }}
                  />
                )}

                {!cardMedia && <div style={styles.trainingCardDefaultBg} />}

                <div
                  style={{
                    ...styles.trainingCardOverlay,
                    background: getCardPreviewOverlay(
                      cardStyle,
                      selectedFilter,
                      filterIntensity
                    ),
                    mixBlendMode: "normal",
                  }}
                />

                {cardStyle === "basic" ? (
                    <div
                      style={{
                        ...styles.levelUpCardTextLayer,
                        border: `1px solid ${levelUpAccentSoft}`,
                        boxShadow: `inset 0 0 32px ${levelUpAccentSoft}`,
                      }}
                    >
                    <div style={styles.levelUpHeader}>
                    <div
                          style={{
                            ...styles.levelUpBadge,
                            color: levelUpAccent,
                            border: `1px solid ${levelUpAccent}`,
                            boxShadow: `0 0 24px ${levelUpAccentSoft}`,
                          }}
                        >
                          ID
                        </div>
                      <span>PERSONAL TRAINING ID</span>
                    </div>

                    <div style={styles.levelUpMainBlock}>
                      <h2 style={styles.levelUpName}>{levelUpDisplayName}</h2>

                      <span style={styles.levelUpLabel}>LEVEL</span>
                      <strong
                    style={{
                      ...styles.levelUpNumber,
                      color: levelUpAccent,
                      textShadow: `0 5px 20px rgba(0, 0, 0, 0.98), 0 0 24px ${levelUpAccentSoft}`,
                    }}
                  >
                    {levelUpDisplayLevel}
                  </strong>

                  <p
                      style={{
                        ...styles.levelUpSlogan,
                        borderTop: `2px solid ${levelUpAccent}`,
                      }}
                    >
                      {levelUpDisplaySlogan}
                    </p>
                    </div>

                    <div style={styles.levelUpBottomBlock}>
                      <div style={styles.levelUpStatsRow}>
                        <div style={styles.levelUpStatBox}>
                          <strong>{profileStats.weeklyRounds}</strong>
                          <span>ROUNDS</span>
                          <small>THIS WEEK</small>
                        </div>

                        <div style={styles.levelUpStatBox}>
                          <strong>{profileStats.totalRounds}</strong>
                          <span>ROUNDS</span>
                          <small>TOTAL</small>
                        </div>

                        <div style={styles.levelUpStatBox}>
                          <strong>{levelUpStreakDays || 1}</strong>
                          <span>STREAK</span>
                          <small>DAYS</small>
                        </div>
                      </div>

                      <div
                        style={{
                          ...styles.levelUpTierBox,
                          border: `1px solid ${levelUpAccent}`,
                          boxShadow: `0 12px 26px rgba(0, 0, 0, 0.28), 0 0 18px ${levelUpAccentSoft}`,
                        }}
                      >
                        <div>
                        <strong style={{ ...styles.levelUpTierName, color: levelUpAccent }}>
                          {growthPreview.isMax
                            ? "MAX LEVEL"
                            : growthPreview.nextTitle?.en ||
                              growthPreview.currentTitleEn}
                        </strong>
                          
                        </div>

                        <strong style={{ ...styles.levelUpXpText, color: levelUpAccent }}>
                          {growthPreview.isMax
                            ? "LV.100"
                            : `${levelUpNextExp || 0} EXP`}
                        </strong>

                        <div style={styles.levelUpProgressTrack}>
                        <div
                          style={{
                            ...styles.levelUpProgressFill,
                            width: `${levelUpProgressPercent}%`,
                            background: `linear-gradient(90deg, ${levelUpAccent}, #ffffff)`,
                            boxShadow: `0 0 16px ${levelUpAccentSoft}`,
                          }}
                        />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : cardStyle === "poster" ? (
                  <div
                    style={{
                      ...styles.posterCardTextLayer,
                      minHeight: cardPreviewHeight,
                    }}
                  >
                    <div style={styles.posterHeader}>
                      <span
                        style={{
                          ...styles.posterHeaderLine,
                          background: posterPreviewLine,
                        }}
                      />
                      <strong>FIGHTER PROFILE</strong>
                      <span
                        style={{
                          ...styles.posterHeaderLine,
                          background: posterPreviewLine,
                        }}
                      />
                    </div>

                    <div style={styles.posterCenterBlock}>
                      {posterVisible.mainName && (
                        <h2 style={styles.posterMainName}>
                          {posterMainNameText}
                        </h2>
                      )}

                      {posterVisible.subtitle && (
                        <p
                          style={{
                            ...styles.posterSubtitle,
                            color: posterPreviewAccent,
                          }}
                        >
                          {posterSubtitleText}
                        </p>
                      )}

                      {(posterVisible.eventTitle || posterVisible.date) && (
                        <div
                          style={{
                            ...styles.posterStarLine,
                            color: posterPreviewAccent,
                          }}
                        >
                          <span
                            style={{
                              ...styles.posterStarRule,
                              background: posterPreviewLine,
                            }}
                          />
                          <span
                            style={{
                              ...styles.posterStarRule,
                              background: posterPreviewLine,
                            }}
                          />
                        </div>
                      )}

                      {posterVisible.eventTitle && (
                        <p
                          style={{
                            ...styles.posterEventTitle,
                            color: posterPreviewAccent,
                          }}
                        >
                          {posterEventTitleText}
                        </p>
                      )}

                      {posterVisible.date && (
                        <p
                          style={{
                            ...styles.posterDateText,
                            color: posterPreviewAccent,
                          }}
                        >
                          {posterDateTextValue}
                        </p>
                      )}
                    </div>

                    <div style={styles.posterBottomBlock}>
                      {posterVisible.meta && (
                        <p
                          style={{
                            ...styles.posterMetaText,
                            color: posterPreviewAccent,
                          }}
                        >
                          {posterMetaTextValue}
                        </p>
                      )}

                      {showComment && (
                        <p style={styles.posterComment}>{mainComment}</p>
                      )}

                      {posterVisible.footer && (
                        <p
                          style={{
                            ...styles.posterFooterText,
                            color: posterPreviewAccent,
                          }}
                        >
                          {posterFooterTextValue}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      ...styles.socialCardTextLayer,
                      ...(cardStyle === "social"
                        ? { position: "absolute", inset: 0, minHeight: 0 }
                        : { minHeight: cardPreviewHeight }),
                    }}
                  >
                    <div style={styles.socialCardTop}>
                      <span
                        style={{
                          ...styles.socialCardKicker,
                          color: posterPreviewAccent,
                        }}
                      >
                        BOXING TRAINING
                      </span>
                      <strong>{profileStats.levelLabel}</strong>
                    </div>

                    <div style={styles.socialCardBottom}>
                      <div>
                        <p style={styles.socialTitle}>{primaryCardTitle}</p>

                        {showComment && (
                          <p style={styles.socialComment}>{mainComment}</p>
                        )}
                      </div>

                      <div style={styles.socialMetricRow}>
                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>WEEK</span>
                          <strong style={styles.socialMetricValue}>
                            {profileStats.weeklyRounds}R
                          </strong>
                        </div>

                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>TOTAL</span>
                          <strong style={styles.socialMetricValue}>
                            {profileStats.totalRounds}R
                          </strong>
                        </div>

                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>STREAK</span>
                          <strong style={styles.socialMetricValue}>
                            {levelUpStreakDays || 1}d
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            </div>

            <button
              type="button"
              className="save-image-button"
              style={{
                ...styles.saveImageButton,
                ...(isSaveCardDisabled ? styles.disabledSaveButton : {}),
              }}
              onClick={isSaveCardDisabled ? undefined : handleSaveCardImage}
              disabled={isSaveCardDisabled}
            >
              {cardMediaType === "video"
                ? "영상 저장은 다음 단계"
                : isSavingImage
                ? "이미지 저장 중..."
                : isCardImagePreparing
                ? "사진 준비 중..."
                : cardSaveLabel}
            </button>

            <button
              type="button"
              style={styles.copyButton}
              onClick={handleCopyTrainingCardText}
            >
              {copied ? "공유 문구 복사 완료!" : "공유 문구 복사하기"}
            </button>

            <p style={styles.shareHint}>
              선택한 <strong>{activeCardStyle.name}</strong> 스타일 그대로 저장됩니다.
              {cardStyle === "social"
                ? " 1080×1920 인스타 스토리 비율이에요."
                : cardStyle === "poster"
                ? " 세로 포스터 비율이에요."
                : " 레벨업 카드 비율이에요."}
            </p>

            {exportPreview && (
              <div style={styles.exportPreviewBox}>
                <strong style={styles.exportPreviewTitle}>iPhone 저장 안내</strong>
                <p style={styles.exportPreviewText}>
                  공유창이 안 뜨면 아래 이미지를 길게 누르고 “사진에 저장”을 선택해.
                </p>

                <img
                  src={exportPreview.dataUrl}
                  alt="저장할 카드 미리보기"
                  style={styles.exportPreviewImage}
                />

                <div style={styles.exportPreviewButtonRow}>
                  <button
                    type="button"
                    style={styles.exportPreviewPrimaryButton}
                    onClick={() => shareOrDownloadPreparedExport(exportPreview)}
                  >
                    공유창 다시 열기
                  </button>

                  <button
                    type="button"
                    style={styles.exportPreviewSecondaryButton}
                    onClick={() => setExportPreview(null)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
              </>
            ) : null}
          </>
        )}
      </section>
        </>
      )}
    </main>
  );
}