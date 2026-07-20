import { useEffect, useRef, useState } from "react";
import { checkNicknameAvailability } from "../api/nicknameApi";
import { useTraining } from "../store/TrainingContext";
import {
  EXPERIENCE_LEVELS,
  formatWeightClassOption,
  WEIGHT_CLASSES,
} from "../utils/sparringPartners";
import { suggestWeightClass } from "../data/proBoxingWeightClasses";
import { BRAND_NAME } from "../utils/brand";

const EXPERIENCE_CHIP_LABELS = {
  "초보 (6개월 미만)": "초보",
  "1년차": "1년차",
  "2~3년": "2~3년",
  "4년 이상": "4년+",
  아마추어: "아마",
};

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
  const nicknameInputRef = useRef(null);
  const nicknameCheckSeq = useRef(0);

  useEffect(() => {
    if (weightClassTouched || !form.weightKg) return;

    setForm((current) => ({
      ...current,
      weightClass: suggestWeightClass(current.weightKg),
    }));
  }, [form.weightKg, weightClassTouched]);

  useEffect(() => {
    if (showWelcome) return;
    const timer = window.setTimeout(() => {
      nicknameInputRef.current?.focus();
    }, 280);
    return () => window.clearTimeout(timer);
  }, [showWelcome]);

  useEffect(() => {
    if (showWelcome) return;

    const trimmed = form.nickname.trim();
    setVerifiedNickname("");
    setNicknameNotice("");

    if (trimmed.length < 2) {
      setCheckingNickname(false);
      return undefined;
    }

    const seq = ++nicknameCheckSeq.current;
    setCheckingNickname(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkNicknameAvailability(trimmed, userId);
        if (seq !== nicknameCheckSeq.current) return;

        if (result.available) {
          setVerifiedNickname(result.nickname);
          setNicknameNotice(result.message);
        } else {
          setVerifiedNickname("");
          setNicknameNotice(result.message);
        }
      } catch (checkError) {
        if (seq !== nicknameCheckSeq.current) return;
        setVerifiedNickname("");
        setNicknameNotice(
          checkError.message || "이름 확인 중 문제가 발생했습니다.",
        );
      } finally {
        if (seq === nicknameCheckSeq.current) {
          setCheckingNickname(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form.nickname, showWelcome, userId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleWelcomeNext() {
    setShowWelcome(false);
  }

  function handleBackToWelcome() {
    setError("");
    setShowWelcome(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedNickname = form.nickname.trim();

    if (!trimmedNickname) {
      setError("링네임을 입력해 주세요.");
      return;
    }

    if (trimmedNickname.length < 2) {
      setError("링네임은 2자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);

    try {
      if (verifiedNickname !== trimmedNickname) {
        const result = await checkNicknameAvailability(trimmedNickname, userId);

        if (!result.available) {
          setVerifiedNickname("");
          setNicknameNotice(result.message);
          setError("다른 링네임을 입력해 주세요.");
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
  const nicknameHint =
    form.nickname.trim().length === 0
      ? "2~12자. 입력하면 자동으로 확인합니다."
      : form.nickname.trim().length < 2
        ? "한 글자 더 입력해 주세요."
        : checkingNickname
          ? "확인 중…"
          : nicknameNotice;

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
            <p className="onboarding-step-label" aria-label="1단계, 전체 2단계">
              1 / 2
            </p>
            <div
              className="onboarding-progress"
              aria-hidden="true"
            >
              <span className="is-active" />
              <span />
            </div>
          </header>

          <div className="onboarding-street-body">
            <img
              className="onboarding-street-mark"
              src="/logo-mark.png"
              alt=""
              width={120}
              height={120}
            />
            <h1 className="onboarding-street-title onboarding-street-title--brand">
              {BRAND_NAME}
            </h1>
            <p className="onboarding-street-slogan">Are you ready?</p>
            <p className="onboarding-street-value">
              오늘의 라운드를 남기고, 주인공으로 선다.
            </p>
          </div>

          <footer className="onboarding-street-footer">
            <button
              type="button"
              className="onboarding-street-cta"
              onClick={handleWelcomeNext}
            >
              시작하기
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="onboarding-page onboarding-page--street onboarding-page--setup">
      <section className="onboarding-street onboarding-street--setup" aria-label="이름 설정">
        <div className="onboarding-street-bg" aria-hidden="true">
          <span className="onboarding-street-noise" />
          <span className="onboarding-street-slash" />
          <span className="onboarding-street-grid" />
        </div>

        <header className="onboarding-setup-top">
          <button
            type="button"
            className="onboarding-back"
            onClick={handleBackToWelcome}
            aria-label="이전으로"
          >
            ←
          </button>
          <div className="onboarding-setup-top-center">
            <p className="onboarding-step-label" aria-label="2단계, 전체 2단계">
              2 / 2
            </p>
            <div className="onboarding-progress" aria-hidden="true">
              <span className="is-done" />
              <span className="is-active" />
            </div>
          </div>
          <span className="onboarding-back-spacer" aria-hidden="true" />
        </header>

        <div className="onboarding-setup-shell">
          <header className="onboarding-setup-hero">
            <p className="onboarding-setup-kicker">{BRAND_NAME}</p>
            <h1 className="onboarding-setup-title">링네임을 정해 주세요</h1>
            <p className="onboarding-setup-copy">
              이름만 있으면 바로 시작할 수 있어요. 나머지는 선택입니다.
            </p>
          </header>

          <form className="onboarding-form" onSubmit={handleSubmit}>
            <div className="onboarding-field">
              <span>링네임</span>
              <input
                ref={nicknameInputRef}
                type="text"
                value={form.nickname}
                onChange={(event) => updateField("nickname", event.target.value)}
                placeholder="예: 새벽벨"
                disabled={submitting}
                maxLength={12}
                autoComplete="nickname"
                enterKeyHint="done"
                aria-invalid={Boolean(
                  form.nickname.trim().length >= 2 &&
                    !checkingNickname &&
                    !nicknameIsVerified &&
                    nicknameNotice,
                )}
              />
              <p
                className={`onboarding-inline-note${
                  nicknameIsVerified
                    ? " success"
                    : form.nickname.trim().length >= 2 &&
                        !checkingNickname &&
                        nicknameNotice &&
                        !nicknameIsVerified
                      ? " error"
                      : ""
                }`}
              >
                {nicknameHint}
              </p>
            </div>

            <div className="onboarding-field">
              <span>경력</span>
              <div className="onboarding-chip-row" role="group" aria-label="경력">
                {EXPERIENCE_LEVELS.map((item) => {
                  const selected = form.experience === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`onboarding-chip${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      disabled={submitting}
                      onClick={() => updateField("experience", item)}
                    >
                      {EXPERIENCE_CHIP_LABELS[item] || item}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="onboarding-specs-toggle"
              onClick={() => setShowSpecs((current) => !current)}
            >
              {showSpecs ? "스펙 접기" : "키 · 체중 나중에 해도 됩니다 (선택)"}
            </button>

            {showSpecs ? (
              <div className="onboarding-specs-panel">
                <p className="onboarding-inline-note">
                  명패·스파링에서 언제든 수정할 수 있어요.
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
                    onChange={(event) =>
                      updateField("reachCm", event.target.value)
                    }
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
                    onChange={(event) =>
                      updateField("area", event.target.value)
                    }
                    placeholder="예: 강남, 홍대"
                    disabled={submitting}
                  />
                </label>
              </div>
            ) : null}

            {error ? (
              <p className="onboarding-form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="onboarding-street-cta onboarding-submit"
              disabled={
                submitting ||
                checkingNickname ||
                form.nickname.trim().length < 2 ||
                (form.nickname.trim().length >= 2 &&
                  !nicknameIsVerified &&
                  Boolean(nicknameNotice))
              }
            >
              {submitting ? "저장 중..." : "라운드 시작하기"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
