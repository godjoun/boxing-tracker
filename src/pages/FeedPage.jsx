import { useTraining } from "../store/TrainingContext.jsx";

function FeedPage() {
  const { feed, deleteFeed } = useTraining();

  return (
    <div>
      <section>
        <p style={sectionLabel}>COMMUNITY</p>
        <h2 style={titleStyle}>🌍 공유 피드</h2>
        <p style={descStyle}>
          내가 공유한 훈련 기록을 피드 형태로 확인하는 공간이야.
        </p>
      </section>

      <section style={{ marginTop: "24px" }}>
        {feed.length === 0 ? (
          <div style={emptyStyle}>
            아직 공유된 기록이 없어. 훈련 기록에서 피드에 공유해보자.
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.feedId} style={feedCardStyle}>
              <div style={feedTopStyle}>
                <div>
                  <strong style={{ fontSize: "17px" }}>🥊 익명의 복서</strong>
                  <p style={{ color: "#888", margin: "6px 0 0" }}>
                    {item.date}
                  </p>
                </div>

                <span style={typeBadgeStyle}>{item.type}</span>
              </div>

              <div style={trainingBoxStyle}>
                <p style={{ margin: 0, color: "#aaa", fontSize: "14px" }}>
                  훈련 시간
                </p>
                <h3 style={{ margin: "6px 0 0", fontSize: "24px" }}>
                  {item.duration}분
                </h3>
              </div>

              {item.memo && <p style={memoStyle}>{item.memo}</p>}

              <div style={feedBottomStyle}>
                <span style={{ color: "#777", fontSize: "13px" }}>
                  공유됨
                </span>

                <button
                  onClick={() => {
                    if (confirm("이 공유 기록을 피드에서 삭제할까요?")) {
                      deleteFeed(item.feedId);
                    }
                  }}
                  style={deleteButtonStyle}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const sectionLabel = {
  color: "#ff3b3b",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "1px",
  margin: "0 0 8px",
};

const titleStyle = {
  margin: "0",
  fontSize: "24px",
};

const descStyle = {
  color: "#aaa",
  lineHeight: "1.5",
  marginTop: "10px",
};

const emptyStyle = {
  backgroundColor: "#111",
  border: "1px dashed #333",
  borderRadius: "16px",
  padding: "22px",
  color: "#aaa",
  textAlign: "center",
};

const feedCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #2b2b2b",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "14px",
};

const feedTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const typeBadgeStyle = {
  backgroundColor: "#251111",
  border: "1px solid #ff3b3b",
  color: "#ff6b6b",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

const trainingBoxStyle = {
  marginTop: "16px",
  backgroundColor: "#1b1b1b",
  borderRadius: "14px",
  padding: "14px",
};

const memoStyle = {
  backgroundColor: "#1b1b1b",
  borderRadius: "12px",
  padding: "12px",
  color: "#ddd",
  lineHeight: "1.5",
  marginTop: "12px",
};

const feedBottomStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "14px",
};

const deleteButtonStyle = {
  backgroundColor: "transparent",
  color: "#ff6b6b",
  border: "1px solid #ff6b6b",
  borderRadius: "999px",
  padding: "7px 12px",
  fontWeight: "700",
  cursor: "pointer",
};

export default FeedPage;