import { useEffect, useState } from "react";
import FeatureLockScreen from "../components/FeatureLockScreen";
import { getUnlockLevel, isSparringUnlocked } from "../utils/featureUnlocks";
import ExchangeBoardPanel from "./dojoBreaker/ExchangeBoardPanel";
import NearbyGymsPanel from "./dojoBreaker/NearbyGymsPanel";
import SparringPartnerPanel from "./dojoBreaker/SparringPartnerPanel";

/**
 * 이름 = 하는 일
 * - 교류 = 주말 오픈 · 원정 스파링 일정
 * - 체육관 문의·대여 = 찾기 · 체험 · 대여
 * - 라이벌 찾기 = 1:1 스파링 상대
 */
const CATEGORIES = [
  {
    id: "exchange",
    label: "교류",
    hint: "주말 오픈 · 원정 스파링",
    howTo: "오픈 스파링 일정을 보거나 올려요.",
  },
  {
    id: "gyms",
    label: "체육관 문의·대여",
    hint: "찾기 · 체험 · 대여",
    howTo: "지역 검색 · 문의 · 관 운영자면 등록 신청",
  },
  {
    id: "sparring",
    label: "라이벌 찾기",
    hint: "1:1 스파링 상대 · 대화 요청",
    howTo: "지역·희망 시간 맞추고 찾는 중을 켜요.",
  },
];

function resolveView(view) {
  if (view === "gyms" || view === "sparring" || view === "exchange") {
    return view;
  }
  if (view === "sparring-lock") {
    return "sparring";
  }
  return "exchange";
}

export default function GymFinderPage({
  initialView = "hub",
  fighterLevel = 1,
  onGoBack,
  onStartTraining,
}) {
  const [view, setView] = useState(() => resolveView(initialView));
  const sparringLocked = !isSparringUnlocked(fighterLevel);
  const sparringLevel = getUnlockLevel("sparring");
  const active = CATEGORIES.find((item) => item.id === view) || CATEGORIES[0];

  useEffect(() => {
    setView(resolveView(initialView));
  }, [initialView]);

  return (
    <main className="gym-page gym-page-flap">
      <header className="dojo-flap-header">
        {onGoBack ? (
          <button className="category-back" type="button" onClick={onGoBack}>
            ← 뒤로
          </button>
        ) : null}
        <div className="dojo-flap-heading">
          <p className="gym-unified-kicker">DOJO</p>
          <h1>도장</h1>
          <p>{active.hint}</p>
        </div>

        <nav className="dojo-flap-tabs" aria-label="도장 카테고리">
          {CATEGORIES.map((item) => {
            const isSparring = item.id === "sparring";
            const locked = isSparring && sparringLocked;
            return (
              <button
                key={item.id}
                type="button"
                className={`dojo-flap-tab${
                  view === item.id ? " is-active" : ""
                }${locked ? " is-locked" : ""}`}
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => setView(item.id)}
              >
                {item.label}
                {locked ? <em>LV.{sparringLevel}</em> : null}
              </button>
            );
          })}
        </nav>

        <p className="dojo-howto">{active.howTo}</p>
      </header>

      <section className="dojo-flap-body" aria-label={active.label}>
        {view === "exchange" ? <ExchangeBoardPanel embedded /> : null}

        {view === "gyms" ? <NearbyGymsPanel embedded /> : null}

        {view === "sparring" && sparringLocked ? (
          <FeatureLockScreen
            featureId="sparring"
            currentLevel={fighterLevel}
            onBack={() => setView("exchange")}
            onStartTraining={onStartTraining}
            embedded
          />
        ) : null}

        {view === "sparring" && !sparringLocked ? (
          <SparringPartnerPanel embedded />
        ) : null}
      </section>
    </main>
  );
}
