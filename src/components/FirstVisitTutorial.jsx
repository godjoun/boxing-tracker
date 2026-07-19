import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { completeTutorial } from "../utils/tutorial";
import {
  getTutorialTargetSelector,
  TUTORIAL_STEPS,
} from "../utils/tutorialSteps";
import "./FirstVisitTutorial.css";

const SPOTLIGHT_PADDING = 10;

function measureTarget(targetId, scrollIntoView = false) {
  const selector = getTutorialTargetSelector(targetId);

  if (!selector) {
    return null;
  }

  const element = document.querySelector(selector);

  if (!element) {
    return null;
  }

  if (scrollIntoView) {
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const rect = element.getBoundingClientRect();

  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function mergeRects(primaryRect, secondaryRect) {
  if (!primaryRect) {
    return secondaryRect;
  }

  if (!secondaryRect) {
    return primaryRect;
  }

  const top = Math.min(primaryRect.top, secondaryRect.top);
  const left = Math.min(primaryRect.left, secondaryRect.left);
  const right = Math.max(
    primaryRect.left + primaryRect.width,
    secondaryRect.left + secondaryRect.width,
  );
  const bottom = Math.max(
    primaryRect.top + primaryRect.height,
    secondaryRect.top + secondaryRect.height,
  );

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

function getTooltipStyle(rect, placement) {
  if (!rect) {
    return null;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = Math.min(340, viewportWidth - 32);
  const centerX = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(16, centerX - tooltipWidth / 2),
    viewportWidth - tooltipWidth - 16,
  );
  const estimatedHeight = 280;
  const preferTop = placement === "top";
  const spaceAbove = rect.top - 16;
  const spaceBelow = viewportHeight - (rect.top + rect.height) - 16;
  const showAbove =
    preferTop && spaceAbove >= estimatedHeight
      ? true
      : !preferTop && spaceBelow >= estimatedHeight
        ? false
        : spaceAbove >= spaceBelow;

  if (showAbove) {
    return {
      left,
      top: Math.max(16, rect.top - 12),
      width: tooltipWidth,
      transform: "translateY(-100%)",
      arrowLeft: centerX - left,
      arrowPlacement: "bottom",
    };
  }

  return {
    left,
    top: rect.top + rect.height + 12,
    width: tooltipWidth,
    transform: "none",
    arrowLeft: centerX - left,
    arrowPlacement: "top",
  };
}

export default function FirstVisitTutorial({
  nickname = "나",
  onStartTimer,
  onOpenCurriculum,
  onEnsurePage,
  onClose,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null);
  const step = TUTORIAL_STEPS[stepIndex];
  const isSpotlight = step.mode === "spotlight";
  const isFinish = Boolean(step.isFinish);

  const tooltipStyle = useMemo(
    () => getTooltipStyle(spotlightRect, step.placement || "top"),
    [spotlightRect, step.placement],
  );

  function updateSpotlightRects() {
    if (!isSpotlight) {
      setSpotlightRect(null);
      return;
    }

    const primaryRect = measureTarget(step.target, step.id === "home-start");
    const secondaryRect = step.secondaryTarget
      ? measureTarget(step.secondaryTarget)
      : null;

    setSpotlightRect(mergeRects(primaryRect, secondaryRect));
  }

  useEffect(() => {
    if (step.ensurePage) {
      onEnsurePage?.(step.ensurePage);
    }
  }, [step.ensurePage, stepIndex, onEnsurePage]);

  useLayoutEffect(() => {
    updateSpotlightRects();

    const handleLayoutChange = () => {
      updateSpotlightRects();
    };

    const timerId = window.setTimeout(handleLayoutChange, 120);

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [stepIndex, step.target, step.secondaryTarget, isSpotlight]);

  function finish() {
    completeTutorial();
    onClose?.();
  }

  function handleSkip() {
    finish();
  }

  function handleNext() {
    if (isFinish) {
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function handleStartTimer() {
    finish();
    onStartTimer?.();
  }

  function handleOpenCurriculum() {
    finish();
    onOpenCurriculum?.();
  }

  function renderCardContent({ centered = false } = {}) {
    return (
      <>
        <header className="first-visit-tutorial-head">
          <p>{step.kicker}</p>
          <button
            type="button"
            className="first-visit-tutorial-skip"
            onClick={handleSkip}
          >
            건너뛰기
          </button>
        </header>

        <div
          className={`first-visit-tutorial-body${
            centered ? " is-centered" : ""
          }`}
        >
          {step.icon ? (
            <span className="first-visit-tutorial-icon" aria-hidden="true">
              {step.icon}
            </span>
          ) : null}
          <h1>
            {step.id === "welcome" ? (
              <>
                <em>{nickname}</em>님, 환영합니다
              </>
            ) : (
              step.title
            )}
          </h1>
          <p>{step.body}</p>
          {step.hint ? (
            <p className="first-visit-tutorial-hint">{step.hint}</p>
          ) : null}
        </div>

        <div className="first-visit-tutorial-dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={index === stepIndex ? "is-active" : ""}
            />
          ))}
        </div>

        <footer className="first-visit-tutorial-actions">
          {isFinish ? (
            <>
              <button
                type="button"
                className="first-visit-tutorial-primary"
                onClick={handleStartTimer}
              >
                바로 타이머 시작
              </button>
              <button
                type="button"
                className="first-visit-tutorial-secondary"
                onClick={handleOpenCurriculum}
              >
                홈 커리큘럼 보기
              </button>
            </>
          ) : (
            <button
              type="button"
              className="first-visit-tutorial-primary"
              onClick={handleNext}
            >
              다음
            </button>
          )}
        </footer>
      </>
    );
  }

  return (
    <div className="first-visit-tutorial" role="dialog" aria-modal="true">
      {isSpotlight ? (
        <>
          {!spotlightRect ? (
            <div className="first-visit-tutorial-fallback-backdrop" aria-hidden="true" />
          ) : null}

          {spotlightRect ? (
            <div
              className="first-visit-tutorial-spotlight"
              style={{
                top: `${spotlightRect.top}px`,
                left: `${spotlightRect.left}px`,
                width: `${spotlightRect.width}px`,
                height: `${spotlightRect.height}px`,
              }}
              aria-hidden="true"
            />
          ) : null}

          <div
            className={`first-visit-tutorial-bubble${
              tooltipStyle?.arrowPlacement === "top" ? " arrow-top" : ""
            }${!tooltipStyle ? " is-centered" : ""}`}
            style={
              tooltipStyle
                ? {
                    left: `${tooltipStyle.left}px`,
                    top: `${tooltipStyle.top}px`,
                    width: `${tooltipStyle.width}px`,
                    transform: tooltipStyle.transform,
                    "--bubble-arrow-left": `${tooltipStyle.arrowLeft}px`,
                  }
                : undefined
            }
          >
            {renderCardContent()}
          </div>
        </>
      ) : (
        <>
          <div className="first-visit-tutorial-backdrop" aria-hidden="true" />
          <div className="first-visit-tutorial-card">
            {renderCardContent({ centered: true })}
          </div>
        </>
      )}
    </div>
  );
}
