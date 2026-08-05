import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import { useTraining } from "../store/TrainingContext";
import FighterSpecCard from "../components/FighterSpecCard";
import { getFighterProgress } from "../utils/fighterProgress";
import { getCareerTierState } from "../utils/monthlySeason";
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
import { BRAND_NAME } from "../utils/brand";
import { RELEASE_SCOPE } from "../utils/releaseScope";
import { isDevSurfaceLog } from "../utils/devMode";
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
  SIMPLE_CARD_LOOKS,
  applyPixelImageFilter,
  getCardBackground,
  getCardPreviewOverlay,
  getImageFilter,
} from "./profilePage/cardConfig";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";
import {
  buildCommunityTraces,
  pickSparringLogs,
} from "../utils/communityTraces";
import { listExchangeEventsAsync } from "../utils/dojoExchange";

export default function ProfilePage({
  scrollTarget,
  cardMakerFocusLogId = null,
  onStudioModeChange,
  onStudioBack,
  onOpenGrowth,
  onGoLog,
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
  const rivalCardRef = useRef(null);
  const videoObjectUrlRef = useRef(null);

  const startsInQuickCardFlow =
    scrollTarget === "cardMaker" && Boolean(cardMakerFocusLogId);

  const [profileView, setProfileView] = useState(
    scrollTarget === "cardMaker" ? "studio" : "nameplate"
  );
  const [supportDetailsOpen, setSupportDetailsOpen] = useState(
    RELEASE_SCOPE.rivals && scrollTarget === "rivalCard"
  );

  useEffect(() => {
    onStudioModeChange?.(profileView === "studio");
  }, [profileView, onStudioModeChange]);

  useEffect(() => {
    return () => onStudioModeChange?.(false);
  }, [onStudioModeChange]);

  const [studioPanel, setStudioPanel] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showCardDate, setShowCardDate] = useState(true);
  const [showCardGym, setShowCardGym] = useState(true);
  const [showCardRounds, setShowCardRounds] = useState(true);
  const [savedShareReady, setSavedShareReady] = useState(false);
  const [, setIsQuickCardFlow] = useState(startsInQuickCardFlow);
  const [nickname, setNickname] = useState(profile.nickname || "나");
  const [bio, setBio] = useState(
    profile.bio || "아직 초보지만 링에 계속 올라가는 중"
  );
  const [heightCm, setHeightCm] = useState(profile.heightCm || "");
  const [weightKg, setWeightKg] = useState(profile.weightKg || "");
  const [reachCm, setReachCm] = useState(profile.reachCm || "");
  const [weightClass, setWeightClass] = useState(
    profile.weightClass ||
      (profile.weightKg ? suggestWeightClass(profile.weightKg) : "라이트급")
  );
  const [experience, setExperience] = useState(profile.experience || "1년차");
  const [area, setArea] = useState(profile.area || "");
  const weightClassTouchedRef = useRef(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [exchangeEvents, setExchangeEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listExchangeEventsAsync(userId, { includePast: true })
      .then((result) => {
        if (!cancelled) {
          setExchangeEvents(Array.isArray(result?.events) ? result.events : []);
        }
      })
      .catch(() => {
        if (!cancelled) setExchangeEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const [selectedLogIds, setSelectedLogIds] = useState(
    cardMakerFocusLogId ? [cardMakerFocusLogId] : []
  );
  const [cardMedia, setCardMedia] = useState("");
  const [cardMediaType, setCardMediaType] = useState("");
  const [cardMediaReady, setCardMediaReady] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("mono");
  const selectedFilterRef = useRef("mono");
  const [filterIntensity] = useState(75);
  const [photoScale] = useState(100);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [customTrainingTitle] = useState("");
  const [levelUpLevel, setLevelUpLevel] = useState(() =>
    String(getFighterProgress(logs).level)
  );
  const [levelUpSlogan, setLevelUpSlogan] = useState("ONE ROUND AT A TIME");
  const [cardStyle] = useState("basic");
  const cardStyleRef = useRef("basic");
  const exportGenerationRef = useRef(0);
  const [posterMainName, setPosterMainName] = useState(() =>
    (profile.nickname || "나").trim()
  );
  const [posterSubtitle, setPosterSubtitle] = useState(() => {
    const fighterProgress = getFighterProgress(logs);
    return (
      fighterProgress.fighterTitleEn ||
      fighterProgress.fighterTitle ||
      "RING ENTRANT"
    );
  });
  const [posterEventTitle, setPosterEventTitle] = useState("TRAINING DAY");
  const [posterDateText, setPosterDateText] = useState("");
  const [posterMetaText, setPosterMetaText] = useState(
    "BOXING TRAINING POSTER | RISING FIGHTER"
  );
  const [posterFooterText, setPosterFooterText] = useState(
    "EVERY ROUND WRITES YOUR STORY"
  );
  const [posterVisible] = useState({
    mainName: true,
    subtitle: true,
    eventTitle: true,
    date: true,
    meta: true,
    footer: true,
  });

  const posterExportRef = useRef({
    selectedFilter: "mono",
    filterIntensity: 75,
    photoScale: 100,
    cardMedia: "",
    cardMediaType: "",
    showComment: true,
    fields: {
      mainName: "",
      subtitle: "THE ROOKIE",
      eventTitle: "TRAINING DAY",
      date: "",
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
    const timer = setTimeout(() => {
      setNickname(profile.nickname || "나");
      setBio(profile.bio || "아직 초보지만 링에 계속 올라가는 중");
      setHeightCm(profile.heightCm || "");
      setWeightKg(profile.weightKg || "");
      setReachCm(profile.reachCm || "");
      setWeightClass(
        profile.weightClass ||
          (profile.weightKg ? suggestWeightClass(profile.weightKg) : "라이트급")
      );
      setExperience(profile.experience || "1년차");
      setArea(profile.area || "");
    }, 0);

    return () => clearTimeout(timer);
  }, [profile]);

  const profileTrustMeta = useMemo(() => {
    const parts = [];
    if (area || profile.area) parts.push(area || profile.area);
    if (profile.homeGymName) parts.push(profile.homeGymName);
    if (weightClass || profile.weightClass) {
      parts.push(weightClass || profile.weightClass);
    }
    if (experience || profile.experience) {
      parts.push(experience || profile.experience);
    }
    return parts.join(" · ");
  }, [
    area,
    weightClass,
    experience,
    profile.area,
    profile.homeGymName,
    profile.weightClass,
    profile.experience,
  ]);

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
    const timer = setTimeout(() => {
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
    }, 0);

    return () => clearTimeout(timer);
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

    if (typeof window !== "undefined") {
      const frame = window.requestAnimationFrame(() => {
        setProfileView("studio");

        if (cardMakerFocusLogId) {
          setIsQuickCardFlow(true);
          setStudioPanel(null);
          setSelectedLogIds([cardMakerFocusLogId]);
          track("card_maker_quick_flow", { hasFocusLog: true });
        } else {
          setIsQuickCardFlow(false);
          setStudioPanel(null);
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
        cardMakerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, [scrollTarget, cardMakerFocusLogId]);

  useEffect(() => {
    if (!RELEASE_SCOPE.rivals || scrollTarget !== "rivalCard") return;

    if (typeof window !== "undefined") {
      let scrollFrame;
      const frame = window.requestAnimationFrame(() => {
        setProfileView("nameplate");
        setSupportDetailsOpen(true);
        scrollFrame = window.requestAnimationFrame(() => {
          rivalCardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });

      return () => {
        window.cancelAnimationFrame(frame);
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      };
    }
  }, [scrollTarget]);


  useEffect(() => {
    cardStyleRef.current = cardStyle;
    posterExportRef.current.cardStyle = cardStyle;
  }, [cardStyle]);

  const activePhotoFilterId = selectedFilter;

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

  const cardTotalRounds = selectedLogs.reduce((sum, log) => {
    return sum + getRounds(log);
  }, 0);

  const cardTotalMinutes = selectedLogs.reduce((sum, log) => {
    return sum + getTotalMinutes(log);
  }, 0);

  const levelUpDisplayLevel =
    String(levelUpLevel || "")
      .replace(/[^0-9]/g, "")
      .slice(0, 3) || "1";
  const levelUpDisplaySlogan = String(
    levelUpSlogan || "ONE ROUND AT A TIME"
  ).trim().toUpperCase();
  const levelUpStreakDays = getTrainingStreak(logs);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLevelUpLevel(String(profileStats.level));
    }, 0);

    return () => clearTimeout(timer);
  }, [profileStats.level]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosterSubtitle(
        profileStats.fighterTitleEn ||
          profileStats.fighterTitle ||
          "RING ENTRANT"
      );
    }, 0);

    return () => clearTimeout(timer);
  }, [profileStats.fighterTitle, profileStats.fighterTitleEn]);

  function scrollToCardMaker() {
    setProfileView("studio");
    setIsQuickCardFlow(false);
    setStudioPanel(null);
    setSavedShareReady(false);

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

  useEffect(() => {
    posterExportRef.current.mainComment = mainComment;
  }, [mainComment]);

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

  const cardGymLabel =
    profile.homeGymName || profile.area || "";
  const cardDateLabel = useMemo(() => {
    const raw = selectedLogs[0]?.date || latestLog?.date || "";
    if (!raw) return "";
    const parts = String(raw).split("-");
    if (parts.length !== 3) return raw;
    return `${Number(parts[1])}월 ${Number(parts[2])}일`;
  }, [selectedLogs, latestLog]);

  useEffect(() => {
    if (!cardDateLabel) return;
    const timer = setTimeout(() => {
      if (!posterDateText.trim()) {
        updatePosterField("date", cardDateLabel);
      }
    }, 0);
    return () => clearTimeout(timer);
    // Only seed empty date once from the selected training log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardDateLabel]);

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
      showCardDate,
      showCardGym,
      showCardRounds,
      cardDateLabel,
      cardGymLabel,
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
      alert(
        "지금은 사진만 카드에 넣을 수 있어요. 영상 저장은 준비 중이라 사진으로 올려 주세요."
      );
      event.target.value = "";
      return;
    }

    alert("이미지 파일만 업로드할 수 있어요.");
    event.target.value = "";
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

  async function drawProfileAvatarToCanvas(ctx, x, y, size, accent) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(x, y, size, size);

    if (profile.photo) {
      try {
        const avatar = await loadCanvasImage(profile.photo);
        drawCoverImage(ctx, avatar, x, y, size, size, 100);
      } catch (error) {
        console.warn("프로필 사진 캔버스 로드 실패:", error);
      }
    }

    if (!profile.photo) {
      ctx.fillStyle = accent;
      ctx.font = `950 ${Math.round(size * 0.42)}px Arial Black, Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        String(profile.nickname || "R").trim().slice(0, 1).toUpperCase(),
        x + size / 2,
        y + size / 2 + 2
      );
    }

    ctx.restore();
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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
        bgA: "#333333",
        bgB: "#050505",
        bgC: "#111111",
        accent: "#ffffff",
        accentSoft: "rgba(255, 255, 255, 0.2)",
        overlayTop: "rgba(0, 0, 0, 0.38)",
        overlayMid: "rgba(0, 0, 0, 0.14)",
        overlayBottom: "rgba(0, 0, 0, 0.9)",
      };
    }

    if (filterId === "relentless") {
      return {
        bgA: "#34363a",
        bgB: "#030303",
        bgC: "#111214",
        accent: "#f4f1ea",
        accentSoft: "rgba(255, 255, 255, 0.2)",
        overlayTop: "rgba(0, 0, 0, 0.34)",
        overlayMid: "rgba(0, 0, 0, 0.2)",
        overlayBottom: "rgba(0, 0, 0, 0.96)",
        spotlight: true,
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

  function drawNoPhotoCardArt(ctx, width, height, theme) {
    ctx.save();

    const diagonal = ctx.createLinearGradient(0, 0, width, height);
    diagonal.addColorStop(0, "rgba(255, 255, 255, 0)");
    diagonal.addColorStop(0.46, theme.accentSoft);
    diagonal.addColorStop(0.54, "rgba(255, 255, 255, 0.04)");
    diagonal.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = diagonal;
    ctx.beginPath();
    ctx.moveTo(width * 0.44, 0);
    ctx.lineTo(width * 0.76, 0);
    ctx.lineTo(width * 0.46, height);
    ctx.lineTo(width * 0.14, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = theme.accentSoft;
    ctx.lineWidth = Math.max(2, width * 0.003);
    ctx.globalAlpha = 0.72;
    [0.2, 0.32, 0.44].forEach((ratio) => {
      ctx.beginPath();
      ctx.arc(
        width * 0.82,
        height * 0.22,
        width * ratio,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    });

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    ctx.font = `950 ${Math.round(width * 0.72)}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R", width * 0.7, height * 0.48);

    ctx.globalAlpha = 0.14;
    ctx.font = `900 ${Math.round(width * 0.052)}px Arial Black, Arial, sans-serif`;
    ctx.letterSpacing = `${Math.round(width * 0.012)}px`;
    ctx.fillText(BRAND_NAME, width * 0.5, height * 0.16);

    ctx.restore();
  }

  function drawPosterDivider(ctx, y, width) {
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

    if (!hasPosterPhoto) {
      drawNoPhotoCardArt(ctx, width, height, theme);
    }
  
    // POSTER 저장 이미지는 사진 위 검정 그라데이션을 쓰지 않는다.
  
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
      drawPosterDivider(ctx, mainY + 10, width);
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
    const exportStyleId =
      styleIdForExport ||
      exportSnapshot.cardStyle ||
      cardStyleRef.current ||
      cardStyle ||
      "basic";
    const rawExportFilterId =
      exportSnapshot.selectedFilter ||
      selectedFilterRef.current ||
      selectedFilter ||
      "levelup";
    // LEVEL UP도 선택한 MONO/FILM/DARK 사진 필터를 그대로 쓴다.
    const exportPhotoFilterId = rawExportFilterId;
    const exportFilterIntensity =
      typeof exportSnapshot.filterIntensity === "number"
        ? exportSnapshot.filterIntensity
        : filterIntensity;
    const exportPhotoScale =
      typeof exportSnapshot.photoScale === "number"
        ? exportSnapshot.photoScale
        : photoScale;
    const exportShowComment =
      typeof exportSnapshot.showComment === "boolean"
        ? exportSnapshot.showComment
        : showComment;
    const exportMainComment =
      exportSnapshot.mainComment || mainComment;
    const isSocialExport = exportStyleId === "social";
    const width = 1080;
    const height = isSocialExport ? 1920 : 1600;
    const theme = getPosterCanvasTheme(rawExportFilterId);
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
          filterId: exportPhotoFilterId,
          filterIntensityValue: exportFilterIntensity,
          scalePercent: isSocialExport
            ? exportPhotoScale
            : Math.max(exportPhotoScale, 100),
          topInset: 0,
          bottomInset: 0,
        });

        if (!hasPhoto) {
          drawNoPhotoCardArt(ctx, width, height, theme);
        }

        // STORY / LEVEL UP 저장 이미지는 사진 위 검정 그라데이션을 깔지 않는다.

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

      if (exportShowComment) {
        drawWrappedText(ctx, exportMainComment, 70, 1648, 910, {
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
      const left = 70;

      const sideShade = ctx.createLinearGradient(0, 0, width, 0);
      sideShade.addColorStop(0, "rgba(0, 0, 0, 0.82)");
      sideShade.addColorStop(0.62, "rgba(0, 0, 0, 0.34)");
      sideShade.addColorStop(1, "rgba(0, 0, 0, 0.08)");
      ctx.fillStyle = sideShade;
      ctx.fillRect(0, 0, width, height);

      drawTextFit(ctx, BRAND_NAME, left, 66, 430, {
        size: 50,
        minSize: 36,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        baseline: "top",
        shadow: false,
      });

      drawTextFit(ctx, "TRAINING RESULT", width - left, 79, 300, {
        size: 25,
        minSize: 18,
        weight: 900,
        family: "Arial Black, Arial, sans-serif",
        align: "right",
        color: accent,
        baseline: "top",
        shadow: false,
      });

      await drawProfileAvatarToCanvas(ctx, left, 168, 106, accent);

      drawTextFit(ctx, profile.nickname || "나", 204, 180, 600, {
        size: 40,
        minSize: 25,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        baseline: "top",
        shadow: false,
      });

      drawTextFit(
        ctx,
        `${profileStats.levelLabel} · ${
          profileStats.fighterTitleEn || "FIGHTER"
        }`,
        204,
        232,
        650,
        {
          size: 25,
          minSize: 18,
          weight: 850,
          family: "Arial, sans-serif",
          align: "left",
          color: accent,
          baseline: "top",
          shadow: false,
        }
      );

      drawTextFit(ctx, primaryCardTitle.toUpperCase(), left, 350, 690, {
        size: 68,
        minSize: 38,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        baseline: "top",
      });

      drawTextFit(ctx, `LV.${levelUpDisplayLevel}`, 790, 366, 220, {
        size: 36,
        minSize: 24,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "right",
        color: accent,
        baseline: "top",
        shadow: false,
      });

      drawTextFit(ctx, "ROUNDS COMPLETED", left, 475, 500, {
        size: 29,
        minSize: 22,
        weight: 900,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "rgba(255, 255, 255, 0.55)",
        baseline: "top",
        shadow: false,
      });

      drawTextFit(ctx, `+${cardTotalRounds}R`, left, 525, 650, {
        size: 200,
        minSize: 110,
        weight: 950,
        family: "Impact, Arial Black, Arial, sans-serif",
        align: "left",
        color: accent,
        baseline: "top",
      });

      ctx.save();
      ctx.globalAlpha = 0.18;
      drawTextFit(ctx, "↑", 960, 455, 350, {
        size: 420,
        minSize: 260,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "right",
        color: accent,
        baseline: "top",
        shadow: false,
      });
      ctx.restore();

      const detailItems = [
        ["TRAINING TIME", `${cardTotalMinutes} MIN`],
        ["CAREER ROUNDS", `${profileStats.totalRounds} R`],
      ];

      detailItems.forEach(([label, value], index) => {
        const y = 880 + index * 150;
        drawTextFit(ctx, label, left, y, 360, {
          size: 26,
          minSize: 20,
          weight: 850,
          family: "Arial, sans-serif",
          align: "left",
          color: "rgba(255, 255, 255, 0.48)",
          baseline: "top",
          shadow: false,
        });
        drawTextFit(ctx, value, left, y + 40, 470, {
          size: 55,
          minSize: 34,
          weight: 950,
          family: "Arial Black, Arial, sans-serif",
          align: "left",
          color: "#ffffff",
          baseline: "top",
        });
      });

      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      roundRect(ctx, left, 1325, width - left * 2, 190, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (exportShowComment) {
        drawWrappedText(ctx, exportMainComment, left, 1248, width - left * 2, {
          size: 28,
          weight: 800,
          lineHeight: 38,
          maxLines: 2,
          color: "rgba(255, 255, 255, 0.78)",
          align: "left",
        });
      }

      drawTextFit(ctx, levelUpDisplaySlogan, left + 34, 1360, 650, {
        size: 42,
        minSize: 26,
        weight: 950,
        family: "Arial Black, Arial, sans-serif",
        align: "left",
        color: "#ffffff",
        baseline: "top",
      });

      drawTextFit(
        ctx,
        `${levelUpStreakDays || 1} DAY STREAK`,
        width - left - 34,
        1430,
        300,
        {
          size: 28,
          minSize: 20,
          weight: 900,
          family: "Arial Black, Arial, sans-serif",
          align: "right",
          color: accent,
          baseline: "top",
          shadow: false,
        }
      );
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
    } catch {
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
          ? "오늘의 포스터"
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
        "지금은 사진만 저장할 수 있어요. 영상을 지우고 사진으로 다시 만들어 주세요."
      );
      return;
    }

    const styleToExport = cardStyleRef.current || cardStyle;
    track("card_save", { style: styleToExport });
    setSavedShareReady(false);

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

    async function finishSave(readyCache) {
      // 저장 = 파일 확보. 공유는 저장 후 별도 버튼으로 연다.
      if (isIOSLikeDevice()) {
        showExportPreview(readyCache);
      } else {
        const link = document.createElement("a");
        link.download = readyCache.filename;
        link.href = readyCache.dataUrl;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setSavedShareReady(true);
    }

    if (
      cache.key === key &&
      cache.style === styleToExport &&
      cache.file &&
      cache.dataUrl
    ) {
      try {
        await finishSave(cache);
      } catch (error) {
        console.error(error);
        showExportPreview(cache);
        setSavedShareReady(true);
      }
      return;
    }

    try {
      setIsSavingImage(true);
      const freshCache = await prepareCardExport({ force: true });
      await finishSave(freshCache);
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
        setSavedShareReady(true);
      } else {
        alert("이미지를 만들지 못했어. 사진과 설정을 확인한 뒤 다시 시도해줘.");
      }
    } finally {
      setIsSavingImage(false);
    }
  }

  function handleShareSavedCard() {
    const cache = exportCacheRef.current;
    if (!cache?.dataUrl || !cache?.file) {
      alert("먼저 명패를 저장해 주세요.");
      return;
    }
    shareOrDownloadPreparedExport(cache);
  }

  useEffect(() => {
    const previewTimer = setTimeout(() => {
      setExportPreview(null);
    }, 0);

    if (cardMediaType === "video") {
      return () => clearTimeout(previewTimer);
    }

    if (cardMediaType === "image" && cardMedia && !cardMediaReady) {
      return () => clearTimeout(previewTimer);
    }

    const timer = setTimeout(() => {
      // 저장 버튼을 빠르게 누를 때를 대비해 이미지를 미리 만들어 캐시에 채워둔다.
      prepareCardExport({ force: true }).catch((error) => {
        if (error?.message === "EXPORT_STALE") return;
        console.warn("저장 이미지 미리 준비 실패:", error);
      });
    }, 650);

    return () => {
      clearTimeout(previewTimer);
      clearTimeout(timer);
    };
    // Preview cache rebuilds on export inputs; prepareCardExport is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExportKey, cardMediaReady, cardMediaType, cardMedia]);

  const cardPreviewHeight =
    cardStyle === "poster"
      ? "620px"
      : cardStyle === "social"
        ? undefined
        : "560px";

  const isCardImagePreparing =
    cardMediaType === "image" && Boolean(cardMedia) && !cardMediaReady;

  const isSaveCardDisabled =
    cardMediaType === "video" || isSavingImage || isCardImagePreparing;

  const cardSaveLabel = "명패 저장하기";
  const activeSimpleLook =
    SIMPLE_CARD_LOOKS.find((look) => look.id === selectedFilter) ||
    SIMPLE_CARD_LOOKS[0];
  const tierState = getCareerTierState(profileStats.level);
  const recentLogs = logs
    .filter((log) => {
      if (isDevSurfaceLog(log)) return false;
      const rounds = getRounds(log);
      const minutes = Number(log.minutes || log.duration || 0);
      return rounds > 0 || minutes > 0;
    })
    .slice(0, 2);
  const communityTraces = useMemo(
    () =>
      buildCommunityTraces({
        profile,
        exchangeEvents,
        sparringLogs: pickSparringLogs(logs),
      }),
    [profile, exchangeEvents, logs]
  );
  const hasTrainingTrace =
    profileStats.totalRounds > 0 || profileStats.totalMinutes > 0;
  const hasExchangeTrace =
    communityTraces.recent.length > 0 ||
    Number(communityTraces.summary?.exchangeCount || 0) > 0 ||
    Number(communityTraces.summary?.sparringCount || 0) > 0 ||
    Number(communityTraces.summary?.gymCount || 0) > 0;
  const fighterProgress = getFighterProgress(logs);

  return (
    <main style={styles.page} className="profile-page">
      {profileView === "nameplate" && (
        <>
      <header className="profile-page-header profile-page-header-tab">
        <h1>프로필</h1>
      </header>
      <div className="profile-hub-layout">
      <div className="profile-hub-primary">
      <FighterSpecCard
        layout="hub"
        profile={{
          ...profile,
          nickname,
          bio,
          heightCm: heightCm || profile.heightCm,
          weightKg: weightKg || profile.weightKg,
          reachCm: reachCm || profile.reachCm,
          weightClass: weightClass || profile.weightClass,
          experience: experience || profile.experience,
          area: area || profile.area,
        }}
        logs={logs}
        weeklyScore={weeklyScore}
        careerStageKo={profileStats.careerStageKo}
        streakDays={levelUpStreakDays}
        showSpecChips={false}
        showProgress={false}
        showStats={false}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: "none" }}
        />

        {!isProfileEditOpen && profileTrustMeta ? (
          <p className="profile-trust-meta">{profileTrustMeta}</p>
        ) : null}

        <button
          type="button"
          className="profile-edit-toggle"
          style={styles.profileEditToggle}
          onClick={() => setIsProfileEditOpen((open) => !open)}
          aria-expanded={isProfileEditOpen}
        >
          <div style={styles.profileEditToggleCopy}>
            <p style={styles.profileEditToggleTitle}>프로필 수정</p>
            <span
              className="profile-edit-toggle-hint"
              style={styles.profileEditToggleHint}
            >
              {isProfileEditOpen
                ? "사진 · 닉네임 · 소개 · 스펙을 수정합니다."
                : "사진 · 닉네임 · 소개를 수정하세요."}
            </span>
          </div>
          <span
            className="profile-edit-toggle-action"
            style={styles.profileEditToggleAction}
          >
            {isProfileEditOpen ? "접기 ▲" : "수정 →"}
          </span>
        </button>

        {isProfileEditOpen ? (
          <div className="profile-edit-content" style={styles.profileEditContent}>
            <div style={styles.profileEditSection}>
              <p
                className="profile-edit-section-title"
                style={styles.profileEditSectionTitle}
              >
                PROFILE
              </p>

              <div className="profile-edit-photo-row">
                <button
                  type="button"
                  className="profile-edit-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profile?.photo ? "사진 변경" : "사진 추가"}
                </button>
                {profile?.photo ? (
                  <button
                    type="button"
                    className="profile-edit-photo-btn is-ghost"
                    onClick={handleRemovePhoto}
                  >
                    삭제
                  </button>
                ) : null}
              </div>

              <label style={styles.fieldLabel}>
                닉네임
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="예: 조운"
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

            <details className="profile-edit-more">
              <summary>신체 스펙 · 지역 (선택)</summary>
            <div style={styles.profileEditSection}>
              <p
                className="profile-edit-section-title"
                style={styles.profileEditSectionTitle}
              >
                BODY SPECS
              </p>

              <div
                className="profile-body-specs-grid"
                style={styles.bodySpecsGrid}
              >
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
                    onChange={(event) => {
                      const nextWeightKg = event.target.value;
                      setWeightKg(nextWeightKg);

                      if (!weightClassTouchedRef.current && nextWeightKg) {
                        setWeightClass(suggestWeightClass(nextWeightKg));
                      }
                    }}
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
                    weightClassTouchedRef.current = true;
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
              {profile.homeGymName ? (
                <div style={styles.fieldLabel}>
                  내 체육관
                  <span style={styles.fieldHint}>
                    전체 → 함께하기에서 변경할 수 있습니다
                  </span>
                  <strong>{profile.homeGymName}</strong>
                  {profile.homeGymAddress ? (
                    <span style={styles.fieldHint}>{profile.homeGymAddress}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
            </details>

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

      <section className="profile-trace-summary" aria-label="내 훈련의 흔적">
        <p className="home-section-label">MY TRACE</p>
        <h2>내 훈련의 흔적</h2>
        <div className="profile-trace-stats is-inline">
          <div>
            <span>누적 라운드</span>
            <strong>{profileStats.totalRounds}R</strong>
          </div>
          <div>
            <span>링 위의 시간</span>
            <strong>{profileStats.totalMinutes}분</strong>
          </div>
          <div>
            <span>연속 훈련</span>
            <strong>
              {hasTrainingTrace ? levelUpStreakDays || 0 : 0}일
            </strong>
          </div>
        </div>
      </section>

      <section className="profile-hub-card profile-recent-logs" aria-label="최근 훈련">
        <div className="profile-season-head">
          <div>
            <p className="home-section-label">RECENT</p>
            <h2>최근 훈련</h2>
          </div>
          {onGoLog ? (
            <button
              type="button"
              className="profile-section-link is-inline"
              onClick={onGoLog}
            >
              기록 탭으로
            </button>
          ) : null}
        </div>

        {recentLogs.length === 0 ? (
          <div className="profile-empty-block">
            <p className="profile-empty-copy">아직 남겨진 훈련이 없습니다.</p>
            <p className="profile-empty-copy is-secondary">
              첫 훈련이 이곳에 쌓입니다.
            </p>
          </div>
        ) : (
          <ul className="profile-recent-list">
            {recentLogs.map((log) => (
              <li key={log.id}>
                <strong>{log.type || "훈련"}</strong>
                <span>
                  {getRounds(log) ? `${getRounds(log)}R · ` : ""}
                  {log.minutes || log.duration || 0}분 ·{" "}
                  {String(log.date || "").replaceAll("-", ".")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      <div className="profile-hub-secondary">
      <button
        type="button"
        className="profile-studio-entry profile-hub-card is-secondary-cta"
        style={styles.cardStudioEntry}
        onClick={scrollToCardMaker}
      >
        <span style={styles.cardStudioEntryKicker}>NAMEPLATE</span>
        <strong style={styles.cardStudioEntryTitle}>훈련 명패 만들기</strong>
        <span style={styles.cardStudioEntryDesc}>
          오늘 버텨낸 훈련을 한 장면으로 남깁니다.
        </span>
        <span style={styles.cardStudioEntryCta}>명패 만들기 →</span>
      </button>

      {hasExchangeTrace ? (
      <section className="profile-trace-summary profile-exchange-traces" aria-label="교류의 흔적">
        <p className="home-section-label">EXCHANGE TRACE</p>
        <h2>교류의 흔적</h2>
        <div className="profile-trace-stats is-inline">
          <div>
            <span>교류</span>
            <strong>{communityTraces.summary.exchangeCount}</strong>
          </div>
          <div>
            <span>스파링</span>
            <strong>{communityTraces.summary.sparringCount}</strong>
          </div>
          <div>
            <span>체육관</span>
            <strong>{communityTraces.summary.gymCount}</strong>
          </div>
        </div>
        {communityTraces.recent.length > 0 ? (
          <ul className="profile-recent-list profile-exchange-list">
            {communityTraces.recent.slice(0, 3).map((item) => (
              <li key={item.id}>
                <strong>
                  <em className="profile-exchange-type">{item.type}</em>
                  {item.title}
                </strong>
                <span>{item.meta || item.date}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      ) : null}

      <section className="profile-level-strip" aria-label="레벨 · EXP">
        <div className="profile-level-strip-head">
          <strong>LV.{fighterProgress.level}</strong>
          <span>
            {fighterProgress.isMaxLevel
              ? "MAX"
              : `${fighterProgress.currentLevelExp} / ${fighterProgress.nextLevelExp} EXP`}
          </span>
        </div>
        <div className="profile-level-strip-bar" aria-hidden="true">
          <i style={{ width: `${fighterProgress.progressPercent}%` }} />
        </div>
        {onOpenGrowth ? (
          <button
            type="button"
            className="profile-section-link is-inline"
            onClick={onOpenGrowth}
          >
            성장 자세히
          </button>
        ) : null}
      </section>

      {RELEASE_SCOPE.rivals ? (
      <details
        className="profile-hub-card profile-more-fold"
        open={supportDetailsOpen}
        onToggle={(event) => setSupportDetailsOpen(event.currentTarget.open)}
      >
        <summary>라이벌 카드 · 성장 자세히</summary>
        <section
          id="profile-rival-card"
          ref={rivalCardRef}
          className="profile-rival-card-section"
          aria-label="라이벌 카드"
        >
          <div className="profile-rival-card-head">
            <p className="home-section-label">RIVAL</p>
            <h2>라이벌 카드</h2>
            <p className="profile-rival-card-desc">
              커뮤니티에서 나를 보여줄 카드입니다.
            </p>
          </div>
          <SparringPartnerPanel variant="profile" embedded />
        </section>

      <section className="profile-season-summary" aria-label="이번 시즌">
        <div className="profile-season-head">
          <div>
            <p className="home-section-label">SEASON</p>
            <h2>이번 시즌</h2>
          </div>
          <strong className="profile-season-stage">{tierState.current.stage}</strong>
        </div>
        <p className="profile-season-copy">
          {tierState.isMaxTier
            ? "커리어 최고 구간에 있습니다."
            : `${tierState.next.stage}까지 ${tierState.levelsToNextTier} LV · LV. ${tierState.next.from}`}
        </p>
        <div className="growth-hub-progress-track" aria-hidden="true">
          <div
            className="growth-hub-progress-fill"
            style={{ width: `${tierState.progressPercent}%` }}
          />
        </div>
      </section>
      </details>
      ) : null}
      </div>
      </div>
        </>
      )}

      {profileView === "studio" && (
        <>
      <button
        type="button"
        style={styles.studioBackButton}
        onClick={onStudioBack || backToNameplate}
      >
        ← {onStudioBack ? "전체 메뉴로" : "명패로 돌아가기"}
      </button>

      <section ref={cardMakerRef} style={styles.cardMakerSection} className="nameplate-simple-studio">
        <p style={styles.kicker}>NAMEPLATE</p>
        <h2 style={styles.sectionTitle}>명패 만들기</h2>
        <p style={styles.cardMakerNameplateNote}>
          사진 → 문구 → 스타일 → 저장. 필요한 것만 남겼습니다.
        </p>

        {logs.length === 0 ? (
          <div style={styles.emptyFeaturedLog}>
            아직 훈련 기록이 없어요. 타이머를 완료하거나 기록에서 운동을 남기면
            날짜·라운드가 자동으로 채워집니다.
          </div>
        ) : null}

        <div className="nameplate-preview-stage" style={styles.livePreviewSection}>
          <button
            type="button"
            className="nameplate-preview-hit"
            aria-label="사진 변경"
            onClick={() => {
              setStudioPanel("photo");
              cardMediaInputRef.current?.click();
            }}
            style={{
              display: "block",
              width: "100%",
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              ref={trainingCardRef}
              style={{
                ...styles.trainingCard,
                background: getCardBackground(selectedFilter),
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  ...styles.trainingCardPhotoArea,
                  minHeight: cardPreviewHeight,
                }}
              >
                {cardMediaType === "image" && cardMedia ? (
                  <img
                    src={cardMedia}
                    alt="훈련 카드"
                    onLoad={async (event) => {
                      const image = event.currentTarget;
                      if (image.decode) {
                        try {
                          await image.decode();
                        } catch {
                          // ignore decode failures
                        }
                      }
                      setCardMediaReady(true);
                    }}
                    onError={() => setCardMediaReady(true)}
                    style={{
                      ...styles.trainingCardImage,
                      objectFit: "cover",
                      filter: getImageFilter(activePhotoFilterId, filterIntensity),
                      transform: `scale(${Math.max(photoScale, 100) / 100})`,
                    }}
                  />
                ) : null}

                {!cardMedia ? (
                  <div
                    className={`training-card-no-photo is-${cardStyle}`}
                    style={styles.trainingCardDefaultBg}
                    aria-hidden="true"
                  >
                    <span className="training-card-no-photo-brand">
                      {BRAND_NAME}
                    </span>
                    <span className="training-card-no-photo-mark">R</span>
                    <span className="training-card-no-photo-ring ring-one" />
                    <span className="training-card-no-photo-ring ring-two" />
                    <span className="training-card-no-photo-slash" />
                  </div>
                ) : null}

                <div
                  style={{
                    ...styles.trainingCardOverlay,
                    background: getCardPreviewOverlay(
                      cardStyle,
                      activePhotoFilterId,
                      filterIntensity
                    ),
                    mixBlendMode: "normal",
                  }}
                />

                <div
                  className="level-up-performance-card"
                  style={{
                    borderColor: levelUpAccentSoft,
                    boxShadow: `inset 0 0 32px ${levelUpAccentSoft}`,
                  }}
                >
                  <div className="level-up-performance-brand">
                    <strong>{BRAND_NAME}</strong>
                    <span>TRAINING RESULT</span>
                  </div>

                  <div className="level-up-performance-profile">
                    <div
                      className="level-up-card-avatar"
                      style={{
                        borderColor: levelUpAccent,
                        boxShadow: `0 0 24px ${levelUpAccentSoft}`,
                      }}
                    >
                      {profile.photo ? (
                        <img src={profile.photo} alt="" />
                      ) : (
                        <span style={{ color: levelUpAccent }}>
                          {(profile.nickname || "R").slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="level-up-card-identity">
                      <span>{profile.nickname || "나"}</span>
                      <small style={{ color: levelUpAccent }}>
                        {profileStats.levelLabel} ·{" "}
                        {profileStats.fighterTitleEn || "FIGHTER"}
                      </small>
                    </div>
                  </div>

                  <div className="level-up-performance-main">
                    <div className="level-up-performance-title-row">
                      <h2>{primaryCardTitle}</h2>
                      <span style={{ color: levelUpAccent }}>
                        LV.{levelUpDisplayLevel}
                      </span>
                    </div>

                    {showCardRounds ? (
                      <>
                        <p className="level-up-performance-label">
                          ROUNDS COMPLETED
                        </p>
                        <strong
                          className="level-up-performance-value"
                          style={{
                            color: levelUpAccent,
                            textShadow: `0 0 26px ${levelUpAccentSoft}`,
                          }}
                        >
                          +{cardTotalRounds}R
                        </strong>
                      </>
                    ) : null}

                    <div className="level-up-performance-details">
                      {showCardDate ? (
                        <div>
                          <span>DATE</span>
                          <strong>{cardDateLabel || "—"}</strong>
                        </div>
                      ) : null}
                      {showCardGym ? (
                        <div>
                          <span>GYM</span>
                          <strong>{cardGymLabel || "—"}</strong>
                        </div>
                      ) : null}
                      {!showCardDate && !showCardGym ? (
                        <div>
                          <span>TRAINING TIME</span>
                          <strong>{cardTotalMinutes} MIN</strong>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {showComment ? (
                    <p className="level-up-performance-comment">{mainComment}</p>
                  ) : null}

                  <div className="level-up-performance-footer">
                    <span>{levelUpDisplaySlogan}</span>
                    <strong>{levelUpStreakDays || 1} DAY STREAK</strong>
                  </div>
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="nameplate-slogan-edit"
            onClick={() => setStudioPanel("text")}
            style={{
              width: "100%",
              marginTop: 10,
              padding: "12px 14px",
              border: "1px solid var(--p-border-soft, rgba(255,255,255,0.12))",
              borderRadius: 14,
              background: "var(--p-bg-subtle, rgba(255,255,255,0.04))",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <small style={{ display: "block", opacity: 0.65, fontWeight: 800 }}>
              문구
            </small>
            <strong>{levelUpDisplaySlogan}</strong>
          </button>
        </div>

        <input
          ref={cardMediaInputRef}
          type="file"
          accept="image/*"
          onChange={handleCardMediaChange}
          style={{ display: "none" }}
        />

        <div
          className="nameplate-edit-menu"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            margin: "16px 0 12px",
          }}
        >
          {[
            ["photo", "사진"],
            ["text", "문구"],
            ["style", "스타일"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() =>
                setStudioPanel((current) => (current === id ? null : id))
              }
              style={{
                minHeight: 44,
                borderRadius: 12,
                border:
                  studioPanel === id
                    ? "1px solid #8a2e2e"
                    : "1px solid var(--p-border-soft, rgba(255,255,255,0.12))",
                background:
                  studioPanel === id
                    ? "rgba(138, 46, 46, 0.16)"
                    : "var(--p-bg-deep, transparent)",
                color: "inherit",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {studioPanel === "photo" ? (
          <div style={styles.cardPhotoBox}>
            <div style={styles.cardPhotoButtonRow}>
              <button
                type="button"
                style={styles.photoButton}
                onClick={() => cardMediaInputRef.current?.click()}
              >
                {cardMedia ? "사진 바꾸기" : "사진 선택"}
              </button>
              {cardMedia ? (
                <button
                  type="button"
                  style={styles.darkButton}
                  onClick={handleRemoveCardMedia}
                >
                  사진 지우기
                </button>
              ) : null}
            </div>
            {cardMediaType === "video" ? (
              <p style={styles.videoNotice}>
                예전에 고른 영상이 남아 있어요. 지우고 사진으로 바꿔 주세요.
              </p>
            ) : null}
          </div>
        ) : null}

        {studioPanel === "text" ? (
          <div style={styles.levelUpInputBox}>
            <label style={styles.label}>
              카드 문구
              <input
                value={levelUpSlogan}
                onChange={(event) => setLevelUpSlogan(event.target.value)}
                placeholder="예: ONE ROUND AT A TIME"
                style={styles.input}
              />
            </label>
          </div>
        ) : null}

        {studioPanel === "style" ? (
          <div style={styles.filterSection}>
            <div className="filter-grid" style={styles.filterGrid}>
              {SIMPLE_CARD_LOOKS.map((look) => (
                <button
                  key={look.id}
                  type="button"
                  style={{
                    ...styles.filterButton,
                    ...(selectedFilter === look.id
                      ? styles.activeFilterButton
                      : {}),
                  }}
                  onClick={() => handleSelectFilter(look.id)}
                >
                  <strong style={styles.filterChipTitle}>{look.name}</strong>
                  <span style={styles.filterChipLock}>{look.description}</span>
                </button>
              ))}
            </div>
            <p style={styles.cardMakerHelp}>
              지금 스타일: {activeSimpleLook.name}
            </p>
          </div>
        ) : null}

        <details
          className="nameplate-details"
          open={detailsOpen}
          onToggle={(event) => setDetailsOpen(event.currentTarget.open)}
          style={{
            margin: "14px 0",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid var(--p-border-soft, rgba(255,255,255,0.12))",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 900 }}>
            세부 정보
          </summary>
          <p style={{ ...styles.cardMakerHelp, marginTop: 10 }}>
            날짜·체육관·라운드는 최근 훈련에서 자동으로 가져옵니다. 표시만
            바꿀 수 있어요.
          </p>
          <label style={styles.commentToggle}>
            <input
              type="checkbox"
              checked={showCardDate}
              onChange={(event) => setShowCardDate(event.target.checked)}
              style={styles.commentCheckbox}
            />
            <span>날짜 표시 · {cardDateLabel || "기록 없음"}</span>
          </label>
          <label style={styles.commentToggle}>
            <input
              type="checkbox"
              checked={showCardGym}
              onChange={(event) => setShowCardGym(event.target.checked)}
              style={styles.commentCheckbox}
            />
            <span>체육관 표시 · {cardGymLabel || "미설정"}</span>
          </label>
          <label style={styles.commentToggle}>
            <input
              type="checkbox"
              checked={showCardRounds}
              onChange={(event) => setShowCardRounds(event.target.checked)}
              style={styles.commentCheckbox}
            />
            <span>라운드 표시 · {cardTotalRounds}R</span>
          </label>
          <label style={styles.commentToggle}>
            <input
              type="checkbox"
              checked={showComment}
              onChange={(event) => updateShowComment(event.target.checked)}
              style={styles.commentCheckbox}
            />
            <span>훈련 코멘트 표시</span>
          </label>

          {logs.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <p style={styles.cardMakerLabel}>기록 선택</p>
              <div style={styles.logSelectList}>
                {logs.slice(0, 8).map((log) => {
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
                          {log.date}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </details>

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
            ? "사진으로 바꿔 저장"
            : isSavingImage
              ? "이미지 저장 중..."
              : isCardImagePreparing
                ? "사진 준비 중..."
                : cardSaveLabel}
        </button>

        {savedShareReady ? (
          <button
            type="button"
            onClick={handleShareSavedCard}
            style={{
              ...styles.saveImageButton,
              marginTop: 10,
              background: "transparent",
              border: "1px solid rgba(138, 46, 46, 0.55)",
              color: "inherit",
            }}
          >
            공유하기
          </button>
        ) : null}

        {exportPreview && (
          <div style={styles.exportPreviewBox}>
            <strong style={styles.exportPreviewTitle}>저장 미리보기</strong>
            <p style={styles.exportPreviewText}>
              아래 이미지를 길게 누르고 “사진에 저장”을 선택하거나, 공유하기를
              눌러 주세요.
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
                공유하기
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
      </section>
        </>
      )}
    </main>
  );
}
