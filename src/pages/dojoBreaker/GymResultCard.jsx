import { getGymPassLines } from "../../utils/gymPricing";

export default function GymResultCard({ gym, index, onInquire }) {
  const passes = getGymPassLines(gym);

  return (
    <article className="gym-result-card">
      <div className="gym-result-rank">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="gym-result-body">
        <div className="gym-result-main">
          <div className="gym-result-top">
            <strong>{gym.name}</strong>
            <span className="gym-result-distance">{gym.distanceLabel}</span>
          </div>
          {gym.address ? <p className="gym-result-address">{gym.address}</p> : null}
          {gym.tags?.length > 0 ? (
            <p className="gym-result-category">{gym.tags.join(" · ")}</p>
          ) : null}
          <button
            type="button"
            className="gym-inquiry-button"
            onClick={() => onInquire?.(gym)}
          >
            문의하기
          </button>
        </div>

        <aside className="gym-result-passes" aria-label="이용권 가격">
          {passes.map((pass) => (
            <div key={pass.key} className="gym-result-pass">
              <span>{pass.label}</span>
              <strong>{pass.value}</strong>
            </div>
          ))}
        </aside>
      </div>
    </article>
  );
}
