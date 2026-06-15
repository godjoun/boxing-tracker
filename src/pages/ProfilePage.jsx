import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useTraining } from "../store/TrainingContext";

function getRounds(log) {
  const value =
    log?.rounds ||
    log?.round ||
    log?.totalRounds ||
    log?.completedRounds ||
    log?.sets ||
    0;

  return Number(value) || 0;
}

function getTotalMinutes(log) {
  return Number(log?.minutes || log?.duration || 0);
}

function getTierName(totalRounds, totalLogs) {
  if (totalRounds >= 100 || totalLogs >= 50) return "챔피언";
  if (totalRounds >= 60 || totalLogs >= 30) return "파이터";
  if (totalRounds >= 30 || totalLogs >= 15) return "컨텐더";
  if (totalRounds >= 10 || totalLogs >= 5) return "아마추어";
  return "루키";
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
}

function getDisplayComment(log) {
  return log?.publicComment || log?.memo || "";
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedImage = canvas.toDataURL("image/jpeg", 0.78);
        resolve(compressedImage);
      };

      image.onerror = () => {
        reject(new Error("이미지를 불러오지 못했어요."));
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽지 못했어요."));
    };

    reader.readAsDataURL(file);
  });
}

const CARD_FILTERS = [
  {
    id: "red",
    name: "RED CORNER",
    description: "빨간 링 코너 느낌",
  },
  {
    id: "dark",
    name: "DARK GYM",
    description: "어두운 체육관 느낌",
  },
  {
    id: "gold",
    name: "CHAMPION GOLD",
    description: "승리 카드 느낌",
  },
  {
    id: "blue",
    name: "BLUE CORNER",
    description: "파란 코너 느낌",
  },
  {
    id: "mono",
    name: "CLASSIC MONO",
    description: "흑백 복싱 다큐 느낌",
  },
];

const CARD_STYLES = [
  {
    id: "basic",
    name: "BASIC",
    description: "기존 복싱 카드",
  },
  {
    id: "social",
    name: "SOCIAL",
    description: "사진 중심 공유 카드",
  },
];

function getCardBackground(filterId) {
  if (filterId === "gold") {
    return "radial-gradient(circle at 80% 12%, rgba(255, 198, 41, 0.42), transparent 34%), linear-gradient(145deg, #241800, #050505)";
  }

  if (filterId === "blue") {
    return "radial-gradient(circle at 82% 10%, rgba(54, 124, 255, 0.42), transparent 35%), linear-gradient(145deg, #07152f, #050505)";
  }

  if (filterId === "mono") {
    return "radial-gradient(circle at 82% 10%, rgba(255, 255, 255, 0.18), transparent 35%), linear-gradient(145deg, #202020, #050505)";
  }

  if (filterId === "dark") {
    return "radial-gradient(circle at 82% 10%, rgba(255, 255, 255, 0.1), transparent 35%), linear-gradient(145deg, #151515, #000000)";
  }

  return "radial-gradient(circle at 82% 10%, rgba(255, 51, 51, 0.46), transparent 35%), linear-gradient(145deg, #250909, #050505)";
}

function getImageFilter(filterId, intensity) {
  const strength = intensity / 100;

  if (filterId === "gold") {
    return `contrast(${1 + 0.16 * strength}) saturate(${
      1 - 0.12 * strength
    }) sepia(${0.3 * strength}) brightness(${1 - 0.04 * strength})`;
  }

  if (filterId === "blue") {
    return `contrast(${1 + 0.12 * strength}) saturate(${
      1 - 0.1 * strength
    }) hue-rotate(${178 * strength}deg) brightness(${1 - 0.04 * strength})`;
  }

  if (filterId === "mono") {
    return `grayscale(${strength}) contrast(${1 + 0.2 * strength})`;
  }

  if (filterId === "dark") {
    return `contrast(${1 + 0.24 * strength}) brightness(${
      1 - 0.26 * strength
    }) saturate(${1 - 0.28 * strength})`;
  }

  return `contrast(${1 + 0.15 * strength}) saturate(${
    1 - 0.18 * strength
  }) brightness(${1 - 0.1 * strength}) sepia(${0.12 * strength})`;
}

function getOverlayStyle(filterId, intensity) {
  const strength = intensity / 100;

  if (filterId === "gold") {
    return `linear-gradient(180deg, rgba(255, 180, 35, ${
      0.02 + 0.1 * strength
    }), rgba(0, 0, 0, ${0.42 + 0.24 * strength}))`;
  }

  if (filterId === "blue") {
    return `linear-gradient(180deg, rgba(35, 105, 255, ${
      0.03 + 0.12 * strength
    }), rgba(0, 0, 0, ${0.42 + 0.25 * strength}))`;
  }

  if (filterId === "mono") {
    return `linear-gradient(180deg, rgba(255, 255, 255, ${
      0.01 + 0.04 * strength
    }), rgba(0, 0, 0, ${0.44 + 0.24 * strength}))`;
  }

  if (filterId === "dark") {
    return `linear-gradient(180deg, rgba(0, 0, 0, ${
      0.04 + 0.12 * strength
    }), rgba(0, 0, 0, ${0.5 + 0.25 * strength}))`;
  }

  return `linear-gradient(180deg, rgba(255, 35, 35, ${
    0.03 + 0.14 * strength
  }), rgba(0, 0, 0, ${0.44 + 0.24 * strength}))`;
}

export default function ProfilePage({ scrollTarget }) {
  const {
    logs,
    profile,
    updateNickname,
    updateBio,
    updateProfilePhoto,
    removeProfilePhoto,
  } = useTraining();

  const fileInputRef = useRef(null);
  const cardMediaInputRef = useRef(null);
  const trainingCardRef = useRef(null);
  const cardMakerRef = useRef(null);
  const videoObjectUrlRef = useRef(null);

  const [nickname, setNickname] = useState(profile.nickname || "나");
  const [bio, setBio] = useState(
    profile.bio || "아직 초보지만 링에 계속 올라가는 중"
  );
  const [isSaving, setIsSaving] = useState(false);

  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [cardMedia, setCardMedia] = useState("");
  const [cardMediaType, setCardMediaType] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("red");
  const [filterIntensity, setFilterIntensity] = useState(75);
  const [photoScale, setPhotoScale] = useState(100);
  const [copied, setCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showComment, setShowComment] = useState(true);
  const [customTrainingTitle, setCustomTrainingTitle] = useState("");
  const [cardStyle, setCardStyle] = useState("basic");

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

    const tierName = getTierName(totalRounds, totalLogs);

    const featuredLogs = logs
      .filter((log) => log.publicComment || log.memo)
      .slice(0, 3);

    const achievements = [
      {
        title: "첫 훈련 완료",
        description: "첫 번째 운동 기록을 남겼다.",
        unlocked: totalLogs >= 1,
      },
      {
        title: "10라운드 돌파",
        description: "누적 10라운드를 버텼다.",
        unlocked: totalRounds >= 10,
      },
      {
        title: "30라운드 돌파",
        description: "복싱 체력이 쌓이기 시작했다.",
        unlocked: totalRounds >= 30,
      },
      {
        title: "훈련 10회 기록",
        description: "꾸준함이 기록으로 남았다.",
        unlocked: totalLogs >= 10,
      },
      {
        title: "100라운드 파이터",
        description: "누적 100라운드를 완주했다.",
        unlocked: totalRounds >= 100,
      },
    ];

    return {
      totalLogs,
      totalRounds,
      totalMinutes,
      todayCount: todayLogs.length,
      timerCount: timerLogs.length,
      manualCount: manualLogs.length,
      tierName,
      achievements,
      featuredLogs,
    };
  }, [logs]);

  useEffect(() => {
    setSelectedLogIds((prev) => {
      if (logs.length === 0) return [];

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
  }, [logs]);

  useEffect(() => {
    return () => {
      if (videoObjectUrlRef.current) {
        URL.revokeObjectURL(videoObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollTarget !== "cardMaker") return;

    const timer = setTimeout(() => {
      cardMakerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [scrollTarget]);

  const selectedLogs = useMemo(() => {
    return logs.filter((log) => selectedLogIds.includes(log.id));
  }, [logs, selectedLogIds]);

  const latestLog = logs[0];
  const isLatestLogSelected = latestLog
    ? selectedLogIds.includes(latestLog.id)
    : false;

  const visibleCardLogs = selectedLogs.slice(0, 4);
  const hiddenCardLogCount = Math.max(0, selectedLogs.length - 4);

  const cardTotalRounds = selectedLogs.reduce((sum, log) => {
    return sum + getRounds(log);
  }, 0);

  const cardTotalMinutes = selectedLogs.reduce((sum, log) => {
    return sum + getTotalMinutes(log);
  }, 0);

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

  function clearVideoObjectUrl() {
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  }

  function handleSaveProfile() {
    updateNickname(nickname.trim() || "나");
    updateBio(bio.trim());
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
    }, 900);
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

        const resizedImage = await resizeImage(file);
        setCardMedia(resizedImage);
        setCardMediaType("image");
      } catch {
        alert("카드 사진 업로드에 실패했어. 다른 사진으로 다시 시도해줘.");
      }

      return;
    }

    if (file.type.startsWith("video/")) {
      clearVideoObjectUrl();

      const videoUrl = URL.createObjectURL(file);
      videoObjectUrlRef.current = videoUrl;

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
    setCardMedia("");
    setCardMediaType("");

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

  async function handleSaveCardImage() {
    if (cardMediaType === "video") {
      alert(
        "영상 카드는 다음 단계에서 저장 기능을 붙일게. 지금은 사진 카드만 이미지 저장이 가능해."
      );
      return;
    }

    if (!trainingCardRef.current) {
      alert("저장할 카드가 아직 준비되지 않았어.");
      return;
    }

    try {
      setIsSavingImage(true);

      const dataUrl = await toPng(trainingCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#050505",
      });

      const link = document.createElement("a");
      link.download = `boxing-training-card-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(error);
      alert(
        "이미지 저장에 실패했어. 사진을 다시 업로드하거나 새로고침 후 다시 시도해줘."
      );
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

    const text = `[TRAINING CARD]
${profile.nickname || "나"} · ${profileStats.tierName}

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

  const socialEmptyHeight =
    cardStyle === "social" && !cardMedia ? "480px" : "650px";

  return (
    <main style={styles.page}>
      <section style={styles.profileCard}>
        <div style={styles.cardTop}>
          <div>
            <p style={styles.kicker}>BOXING PROFILE</p>
            <h1 style={styles.title}>나의 파이터 카드</h1>
          </div>

          <div style={styles.tierBadge}>
            <span style={styles.tierLabel}>등급</span>
            <strong style={styles.tierName}>{profileStats.tierName}</strong>
          </div>
        </div>

        <div style={styles.photoSection}>
          <div style={styles.photoCircle}>
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="프로필"
                style={styles.profileImage}
              />
            ) : (
              <div style={styles.photoPlaceholder}>
                <span>사진</span>
                <strong>+</strong>
              </div>
            )}
          </div>

          <div style={styles.photoButtons}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />

            <button
              type="button"
              style={{ ...styles.photoButton, ...styles.profileActionButton }}
              onClick={() => fileInputRef.current?.click()}
            >
              사진 업로드
            </button>

            {profile.photo && (
              <button
                type="button"
                style={{ ...styles.darkButton, ...styles.profileActionButton }}
                onClick={handleRemovePhoto}
              >
                사진 삭제
              </button>
            )}

            <button
              type="button"
              style={{
                ...styles.profileSaveInlineButton,
                ...styles.profileActionButton,
              }}
              onClick={handleSaveProfile}
            >
              {isSaving ? "저장 완료!" : "프로필 저장"}
            </button>
          </div>
        </div>

        <div style={styles.profileNameBox}>
          <span style={styles.profileNameLabel}>FIGHTER NAME</span>
          <strong style={styles.profileName}>{profile.nickname || "나"}</strong>
          <p style={styles.profileBio}>
            {profile.bio || "아직 초보지만 링에 계속 올라가는 중"}
          </p>
        </div>

        <div style={styles.profileEditInsideBox}>
          <p style={styles.kicker}>EDIT PROFILE</p>

          <label style={styles.label}>
            닉네임
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="예: 조운 파이터"
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            한 줄 소개
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="예: 아직 초보지만 매주 링에 올라가는 중"
              style={styles.textarea}
            />
          </label>
        </div>
      </section>

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

      <section ref={cardMakerRef} style={styles.cardMakerSection}>
        <p style={styles.kicker}>TRAINING CARD MAKER</p>
        <h2 style={styles.sectionTitle}>훈련 인증 카드 만들기</h2>

        {latestLog && isLatestLogSelected && (
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
        )}

        {logs.length === 0 ? (
          <div style={styles.emptyFeaturedLog}>
            아직 선택할 운동 기록이 없어. 타이머를 완료하거나 기록 화면에서
            운동을 직접 작성해줘.
          </div>
        ) : (
          <>
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
                        {isSelected ? "✓" : ""}
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

              <div style={styles.cardStyleGrid}>
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
                    onClick={() => setCardStyle(style.id)}
                  >
                    <strong>{style.name}</strong>
                    <span>{style.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.filterSection}>
              <p style={styles.cardMakerLabel}>4. 복싱 필터 선택</p>

              <div style={styles.filterGrid}>
                {CARD_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    style={{
                      ...styles.filterButton,
                      ...(selectedFilter === filter.id
                        ? styles.activeFilterButton
                        : {}),
                    }}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    <strong>{filter.name}</strong>
                    <span>{filter.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.adjustSection}>
              <p style={styles.cardMakerLabel}>5. 사진/영상 조절</p>

              <label style={styles.rangeLabel}>
                <span>필터 강도</span>
                <strong>{filterIntensity}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={filterIntensity}
                onChange={(event) =>
                  setFilterIntensity(Number(event.target.value))
                }
                style={styles.rangeInput}
              />

              <label style={styles.rangeLabel}>
                <span>확대</span>
                <strong>{photoScale}%</strong>
              </label>
              <input
                type="range"
                min="90"
                max="120"
                value={photoScale}
                onChange={(event) => setPhotoScale(Number(event.target.value))}
                style={styles.rangeInput}
              />

              <label style={styles.commentToggle}>
                <input
                  type="checkbox"
                  checked={showComment}
                  onChange={(event) => setShowComment(event.target.checked)}
                  style={styles.commentCheckbox}
                />

                <span>카드에 코멘트 표시하기</span>
              </label>

              <p style={styles.commentToggleHelp}>
                끄면 카드 이미지와 공유 문구에서 코멘트가 빠져.
              </p>

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
                  minHeight: socialEmptyHeight,
                }}
              >
                {cardMediaType === "image" && cardMedia && (
                  <img
                    src={cardMedia}
                    alt="훈련 카드"
                    style={{
                      ...styles.trainingCardImage,
                      filter: getImageFilter(selectedFilter, filterIntensity),
                      transform: `scale(${photoScale / 100})`,
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
                      filter: getImageFilter(selectedFilter, filterIntensity),
                      transform: `scale(${photoScale / 100})`,
                    }}
                  />
                )}

                {!cardMedia && <div style={styles.trainingCardDefaultBg} />}

                <div
                  style={{
                    ...styles.trainingCardOverlay,
                    background: getOverlayStyle(selectedFilter, filterIntensity),
                  }}
                />

                {cardStyle === "basic" ? (
                  <div style={styles.trainingCardTextLayer}>
                    <div style={styles.trainingCardTop}>
                      <span style={styles.trainingCardKicker}>
                        TRAINING CARD
                      </span>
                      <strong>{profileStats.tierName}</strong>
                    </div>

                    <div style={styles.trainingCardBottomContent}>
                      <div style={styles.trainingExerciseBox}>
                        <div style={styles.trainingExerciseHeader}>
                          <span>TRAINING</span>
                          <strong>{selectedLogs.length}개</strong>
                        </div>

                        <div style={styles.trainingExerciseList}>
                          {visibleCardLogs.map((log, index) => {
                            const cardTitle = getCardLogTitle(log, index);
                            const trainingInfo = `${getRounds(log)}R · ${
                              log.minutes || log.duration
                            }min`;

                            return (
                              <div
                                key={log.id}
                                style={styles.trainingExerciseRow}
                              >
                                {cardTitle ? (
                                  <>
                                    <strong>{cardTitle}</strong>
                                    <span>{trainingInfo}</span>
                                  </>
                                ) : (
                                  <span style={styles.trainingExerciseMetaOnly}>
                                    {trainingInfo}
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {hiddenCardLogCount > 0 && (
                            <div style={styles.moreTrainingRow}>
                              + {hiddenCardLogCount} more trainings
                            </div>
                          )}
                        </div>
                      </div>

                      {showComment && (
                        <div style={styles.trainingCardCommentBox}>
                          <span style={styles.trainingCardCommentLabel}>
                            COMMENT
                          </span>

                          <p style={styles.trainingCardCommentText}>
                            {mainComment}
                          </p>
                        </div>
                      )}

                      <div style={styles.trainingCardBottom}>
                        <span>{profile.nickname || "나"}</span>
                        <strong>{selectedLogs.length} TRAININGS</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      ...styles.socialCardTextLayer,
                      minHeight: socialEmptyHeight,
                    }}
                  >
                    <div style={styles.socialCardTop}>
                      <span style={styles.socialCardKicker}>
                        BOXING TRAINING
                      </span>
                      <strong>{profileStats.tierName}</strong>
                    </div>

                    {cardMedia && (
                      <div style={styles.socialCardCenter}>
                        <strong style={styles.socialRoundNumber}>
                          {cardTotalRounds || 0}
                        </strong>
                        <span style={styles.socialRoundLabel}>ROUNDS</span>
                      </div>
                    )}

                    <div style={styles.socialCardBottom}>
                      <div>
                        <p style={styles.socialTitle}>{primaryCardTitle}</p>

                        {showComment && (
                          <p style={styles.socialComment}>{mainComment}</p>
                        )}
                      </div>

                      <div style={styles.socialMetricRow}>
                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>TIME</span>
                          <strong style={styles.socialMetricValue}>
                            {cardTotalMinutes || 0}min
                          </strong>
                        </div>

                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>LOGS</span>
                          <strong style={styles.socialMetricValue}>
                            {selectedLogs.length}
                          </strong>
                        </div>

                        <div style={styles.socialMetricBox}>
                          <span style={styles.socialMetricLabel}>FIGHTER</span>
                          <strong style={styles.socialMetricValue}>
                            {profile.nickname || "나"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              style={{
                ...styles.saveImageButton,
                ...(cardMediaType === "video" ? styles.disabledSaveButton : {}),
              }}
              onClick={handleSaveCardImage}
            >
              {cardMediaType === "video"
                ? "영상 저장은 다음 단계"
                : isSavingImage
                ? "이미지 저장 중..."
                : "카드 이미지 저장하기"}
            </button>

            <button
              type="button"
              style={styles.copyButton}
              onClick={handleCopyTrainingCardText}
            >
              {copied ? "공유 문구 복사 완료!" : "공유 문구 복사하기"}
            </button>

            <p style={styles.shareHint}>
              사진 카드는 저장해서 인스타그램이나 카카오톡에 공유할 수 있어.
              영상 카드는 지금은 미리보기만 가능해.
            </p>
          </>
        )}
      </section>

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

      <section style={styles.sectionCard}>
        <p style={styles.kicker}>FEATURED LOG</p>
        <h2 style={styles.sectionTitle}>대표 성장 로그</h2>

        {profileStats.featuredLogs.length === 0 ? (
          <div style={styles.emptyFeaturedLog}>
            아직 대표로 보여줄 기록이 없어. 기록 화면에서 공개용 자랑 코멘트를
            작성하면 여기에 표시돼.
          </div>
        ) : (
          <div style={styles.featuredLogList}>
            {profileStats.featuredLogs.map((log) => {
              const rounds = getRounds(log);

              return (
                <div key={log.id} style={styles.featuredLogItem}>
                  <div style={styles.featuredLogTop}>
                    <div>
                      <div style={styles.featuredBadgeRow}>
                        <span style={styles.featuredBadge}>
                          {log.sourceLabel ||
                            (log.source === "timer" ? "자동 기록" : "수동 기록")}
                        </span>

                        {log.isEdited && (
                          <span style={styles.featuredEditedBadge}>수정됨</span>
                        )}
                      </div>

                      <h3 style={styles.featuredLogTitle}>{log.type}</h3>

                      <p style={styles.featuredLogMeta}>
                        {log.minutes || log.duration}분 · {rounds}R ·{" "}
                        {log.difficultyLabel || "보통"} · {log.date}
                      </p>
                    </div>

                    <strong style={styles.featuredScore}>+{log.score}점</strong>
                  </div>

                  <p style={styles.featuredComment}>
                    {log.publicComment || log.memo}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section style={styles.sectionCard}>
        <p style={styles.kicker}>ACHIEVEMENTS</p>
        <h2 style={styles.sectionTitle}>업적</h2>

        <div style={styles.achievementList}>
          {profileStats.achievements.map((achievement) => (
            <div
              key={achievement.title}
              style={{
                ...styles.achievementItem,
                ...(achievement.unlocked ? styles.unlocked : styles.locked),
              }}
            >
              <span style={styles.achievementIcon}>
                {achievement.unlocked ? "✓" : "잠김"}
              </span>

              <div>
                <strong>{achievement.title}</strong>
                <p style={styles.achievementDescription}>
                  {achievement.description}
                </p>
              </div>
            </div>
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
    gridTemplateColumns: "1fr 1fr",
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
    background: "#ff3333",
    border: "1px solid #ff3333",
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
    accentColor: "#ff3333",
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
    accentColor: "#ff3333",
  },

  commentToggleHelp: {
    margin: "8px 0 0",
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  trainingCard: {
    marginTop: "16px",
    borderRadius: "30px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.4)",
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

  trainingExerciseBox: {
    width: "min(300px, 82%)",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    backdropFilter: "none",
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },

  trainingExerciseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },

  trainingExerciseList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  trainingExerciseRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-end",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 950,
    lineHeight: 1.2,
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },

  trainingExerciseMetaOnly: {
    display: "block",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 950,
    lineHeight: 1.2,
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },

  moreTrainingRow: {
    marginTop: "6px",
    paddingTop: 0,
    borderTop: "none",
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: "12px",
    fontWeight: 900,
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },

  trainingCardCommentBox: {
    width: "min(300px, 82%)",
    marginTop: "12px",
    padding: 0,
    borderRadius: 0,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    backdropFilter: "none",
    color: "#ffffff",
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
  },

  trainingCardCommentLabel: {
    display: "block",
    marginBottom: "5px",
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.14em",
  },

  trainingCardCommentText: {
    margin: 0,
    color: "#ffffff",
    fontSize: "13px",
    lineHeight: 1.45,
    fontWeight: 800,
  },

  trainingCardBottom: {
    width: "min(300px, 82%)",
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: "rgba(255, 255, 255, 0.86)",
    fontSize: "12px",
    fontWeight: 900,
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.98)",
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

  socialCardCenter: {
    marginTop: "auto",
    marginBottom: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },

  socialRoundNumber: {
    fontSize: "92px",
    lineHeight: 0.9,
    fontWeight: 950,
    letterSpacing: "-0.07em",
  },

  socialRoundLabel: {
    marginTop: "6px",
    paddingLeft: "4px",
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: "15px",
    fontWeight: 950,
    letterSpacing: "0.18em",
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
    background: "rgba(0, 0, 0, 0.26)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(8px)",
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