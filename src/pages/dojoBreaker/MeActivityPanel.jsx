import { useTraining } from "../../store/TrainingContext";

/**
 * 나 — 진행 중 교류 (칩 아님 · Community Principle)
 */
export default function MeActivityPanel({
  onOpenHub,
  onOpenGyms,
  onOpenRivals,
  onOpenMeetings,
  onGoRivalProfile,
}) {
  const { profile } = useTraining();
  const homeGym = profile?.homeGymName || "";

  return (
    <div className="me-activity" aria-label="내 활동">
      <header className="me-activity-head">
        <p className="exchange-hub-kicker">MY ACTIVITY</p>
        <h2>내 활동</h2>
        <p>신청·대화·카드를 이어가고, 완료는 프로필 신뢰로 남습니다.</p>
      </header>

      <ul className="me-activity-list">
        <li>
          <button type="button" onClick={onOpenGyms}>
            <strong>내 체육관</strong>
            <span>{homeGym || "아직 등록하지 않았습니다"}</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              if (onGoRivalProfile) onGoRivalProfile();
              else onOpenRivals?.();
            }}
          >
            <strong>라이벌 카드</strong>
            <span>공개 카드 · 스파링 목적</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={onOpenMeetings}>
            <strong>모임 신청·대화</strong>
            <span>참가한 일정 이어가기</span>
          </button>
        </li>
        <li>
          <button type="button" onClick={onOpenHub}>
            <strong>교류 허브</strong>
            <span>다음에 할 교류 고르기</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
