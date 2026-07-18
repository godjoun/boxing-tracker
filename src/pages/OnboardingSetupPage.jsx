import { useEffect, useState } from "react";
import { checkNicknameAvailability } from "../api/nicknameApi";
import { useTraining } from "../store/TrainingContext";
import {
  EXPERIENCE_LEVELS,
  formatWeightClassOption,
  WEIGHT_CLASSES,
} from "../utils/sparringPartners";
import { suggestWeightClass } from "../data/proBoxingWeightClasses";

export default function OnboardingSetupPage() {
  const { profile, userId, completeOnboarding } = useTraining();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSpecs, setShowSpecs] = useState(false);
  const [weightClassTouched, setWeightClassTouched] = useState(false);
  const [form, setForm] = useState({
    nickname: profile.nickname === "나" ? "" : profile.nickname || "",
    heightCm: profile.heightCm || "",
    weightKg: profile.weightKg || "",
    reachCm: profile.reachCm || "",
    weightClass: profile.weightClass || "",
    experience: profile.experience || "초보 (6개월 미만)",
    area: profile.area || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [verifiedNickname, setVerifiedNickname] = useState("");
  const [nicknameNotice, setNicknameNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (weightClassTouched || !form.weightKg) return;

    setForm((current) => ({
      ...current,
      weightClass: suggestWeightClass(current.weightKg),
    }));
  }, [form.weightKg, weightClassTouched]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));

    if (field === "nickname") {
      setVerifiedNickname("");
      setNicknameNotice("");
    }
  }

  function handleWelcomeNext() {
    setShowWelcome(false);
  }

  async function handleNicknameCheck() {
    setError("");
    setNicknameNotice("");
    setCheckingNickname(true);

    try {
      const result = await checkNicknameAvailability(form.nickname, userId);

      if (result.available) {
        setVerifiedNickname(result.nickname);
        setNicknameNotice(result.message);
        return;
      }

      setVerifiedNickname("");
      setNicknameNotice(result.message);
    } catch (checkError) {
      setVerifiedNickname("");
      setNicknameNotice(
        checkError.message || "이름 확인 중 문제가 발생했습니다.",
      );
    } finally {
      setCheckingNickname(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedNickname = form.nickname.trim();

    if (!trimmedNickname) {
      setError("파이터 이름을 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      if (verifiedNickname !== trimmedNickname) {
        const result = await checkNicknameAvailability(trimmedNickname, userId);

        if (!result.available) {
          setVerifiedNickname("");
          setNicknameNotice(result.message);
          setError("다른 파이터 이름을 입력해 주세요.");
          return;
        }

        setVerifiedNickname(result.nickname);
        setNicknameNotice(result.message);
      }

      await completeOnboarding(form);
    } catch (submitError) {
      setError(submitError.message || "입력값을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const nicknameIsVerified =
    verifiedNickname === form.nickname.trim() && verifiedNickname.length > 0;

  if (showWelcome) {
    return (
      <div className="onboarding-page onboarding-page--street">
        <section className="onboarding-street" aria-label="환영">
          <div className="onboarding-street-bg" aria-hidden="true">
            <span className="onboarding-street-noise" />
            <span className="onboarding-street-slash" />
            <span className="onboarding-street-grid" />
          </div>

          <header className="onboarding-street-top">
            <p className="onboarding-street-brand">ROUND ON</p>
            <p className="onboarding-street-stamp">EST. CAREER</p>
          </header>

          <div className="onboarding-street-body">
            <p className="onboarding-street-eyebrow">YOUR ROUND. YOUR STORY.</p>
            <h1 className="onboarding-street-title">
              I RULE
              <br />
              THE ROUND.
            </h1>
            <p className="onboarding-street-ko">
              쫓지 않는다.
              <br />
              라운드로 증명한다.
            </p>
            <p className="onboarding-street-copy">
              이름만 올리면 바로 훈련을 시작할 수 있어요.
            </p>
          </div>

          <footer className="onboarding-street-footer">
            <p className="onboarding-street-meta">
              LIFE GOES ON. SO DOES THE FIGHT.
            </p>
            <button
              type="button"
              className="onboarding-street-cta"
              onClick={handleWelcomeNext}
            >
              내 이름 올리기
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="onboarding-page onboarding-page--setup">
      <div className="onboarding-card">
        <header className="onboarding-hero">
          <p className="home-brand-name">ROUND ON</p>
          <h1 className="onboarding-welcome-title">주인공 이름 정하기</h1>
          <span className="onboarding-hero-note">
            링네임만 있으면 시작할 수 있어요. 키·체중은 나중에 명패에서 채워도
            됩니다.
          </span>
        </header>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="onboarding-field">
            <span>파이터 이름 (링네임) *</span>
            <div className="onboarding-nickname-row">
              <input
                type="text"
                value={form.nickname}
                onChange={(event) => updateField("nickname", event.target.value)}
                placeholder="링네임"
                disabled={submitting || checkingNickname}
                maxLength={12}
              />
              <button
                type="button"
                className="onboarding-check-button"
                onClick={handleNicknameCheck}
                disabled={submitting || checkingNickname || !form.nickname.trim()}
              >
                {checkingNickname ? "확인 중" : "중복확인"}
              </button>
            </div>
            {nicknameNotice ? (
              <p
                className={`onboarding-inline-note${
                  nicknameIsVerified ? " success" : " error"
                }`}
              >
                {nicknameNotice}
              </p>
            ) : (
              <p className="onboarding-inline-note">
                제출 시 이름을 자동으로 확인합니다.
              </p>
            )}
          </div>

          <label className="onboarding-field">
            <span>경력</span>
            <select
              value={form.experience}
              onChange={(event) =>
                updateField("experience", event.target.value)
              }
              disabled={submitting}
            >
              {EXPERIENCE_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="onboarding-specs-toggle"
            onClick={() => setShowSpecs((current) => !current)}
          >
            {showSpecs ? "스펙 입력 접기" : "키·체중 입력 (선택)"}
          </button>

          {showSpecs ? (
            <div className="onboarding-specs-panel">
              <p className="onboarding-inline-note">
                비워 두어도 됩니다. 명패·스파링에서 나중에 수정할 수 있어요.
              </p>

              <div className="onboarding-row">
                <label className="onboarding-field">
                  <span>키 (cm)</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="120"
                    max="230"
                    value={form.heightCm}
                    onChange={(event) =>
                      updateField("heightCm", event.target.value)
                    }
                    placeholder="선택"
                    disabled={submitting}
                  />
                </label>

                <label className="onboarding-field">
                  <span>몸무게 (kg)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="35"
                    max="200"
                    step="0.1"
                    value={form.weightKg}
                    onChange={(event) =>
                      updateField("weightKg", event.target.value)
                    }
                    placeholder="선택"
                    disabled={submitting}
                  />
                </label>
              </div>

              <label className="onboarding-field">
                <span>팔 길이 · 리치 (cm)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="100"
                  max="250"
                  value={form.reachCm}
                  onChange={(event) => updateField("reachCm", event.target.value)}
                  placeholder="선택"
                  disabled={submitting}
                />
              </label>

              <label className="onboarding-field">
                <span>체급</span>
                <select
                  value={form.weightClass}
                  onChange={(event) => {
                    setWeightClassTouched(true);
                    updateField("weightClass", event.target.value);
                  }}
                  disabled={submitting}
                >
                  <option value="">나중에 정하기</option>
                  {WEIGHT_CLASSES.map((item) => (
                    <option key={item} value={item}>
                      {formatWeightClassOption(item)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="onboarding-field">
                <span>활동 지역</span>
                <input
                  type="text"
                  value={form.area}
                  onChange={(event) => updateField("area", event.target.value)}
                  placeholder="예: 강남, 홍대"
                  disabled={submitting}
                />
              </label>
            </div>
          ) : null}

          {error ? (
            <p className="login-message login-message-error">{error}</p>
          ) : null}

          <button
            type="submit"
            className="home-brand-primary onboarding-submit"
            disabled={submitting}
          >
            {submitting ? "저장 중..." : "라운드 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
