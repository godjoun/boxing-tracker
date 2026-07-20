import { hasSparringInterest } from "../../utils/sparringInterest";

export default function SparringPartnerCard({
  partner,
  userId,
  onChatRequest,
}) {
  const requested = hasSparringInterest(partner.id, userId);

  return (
    <article
      className={`sparring-partner-card${partner.isMine ? " mine" : ""}${
        partner.hasSparringPriority ? " is-veteran" : ""
      }`}
    >
      <div className="sparring-partner-head">
        <div>
          <strong>{partner.nickname}</strong>
          {partner.isMine ? <em>나</em> : null}
          {partner.veteranBadges?.length > 0 ? (
            <div className="sparring-partner-veteran-badges">
              {partner.veteranBadges.map((badge) => (
                <span key={badge}>{badge}</span>
              ))}
            </div>
          ) : null}
        </div>
        <span>{partner.distanceLabel}</span>
      </div>

      <div className="sparring-partner-tags">
        <span>{partner.weightClass}</span>
        <span>{partner.experience}</span>
        <span>{partner.style}</span>
        {partner.area ? <span>{partner.area}</span> : null}
      </div>

      {partner.meetWhen ? (
        <p className="sparring-partner-when">희망 · {partner.meetWhen}</p>
      ) : null}

      {partner.note ? (
        <p className="sparring-partner-note">{partner.note}</p>
      ) : null}

      {!partner.isMine ? (
        <button
          type="button"
          className={`sparring-chat-request${requested ? " is-sent" : ""}`}
          onClick={() => onChatRequest?.(partner)}
        >
          {requested ? "요청 취소" : "대화 요청"}
        </button>
      ) : (
        <p className="sparring-partner-note">내 카드</p>
      )}
    </article>
  );
}
