import { useState } from "react";
import { useTraining } from "../store/TrainingContext.jsx";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function LogPage() {
  const { logs, feed, addLog, shareToFeed, unshareFromFeed } = useTraining();

  const [form, setForm] = useState({
    date: getToday(),
    type: "스파링",
    duration: "",
    memo: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.duration) {
      alert("훈련 시간을 입력해줘!");
      return;
    }

    addLog({
      date: form.date,
      type: form.type,
      duration: Number(form.duration),
      memo: form.memo,
    });

    setForm({
      date: getToday(),
      type: "스파링",
      duration: "",
      memo: "",
    });
  }

  return (
    <div>
      <section>
        <p style={sectionLabel}>PRIVATE TRAINING LOG</p>
        <h2 style={titleStyle}>🥊 오늘의 훈련 기록</h2>
        <p style={descStyle}>
          이 기록은 기본적으로 나만 보는 개인 기록이야. 원할 때만 공개 피드에 공유할 수 있어.
        </p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={labelStyle}>
            날짜
            <input
              style={inputStyle}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>

          <label style={labelStyle}>
            훈련 종류
            <select
              style={inputStyle}
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="스파링">스파링</option>
              <option value="샌드백">샌드백</option>
              <option value="줄넘기">줄넘기</option>
              <option value="미트">미트</option>
              <option value="러닝">러닝</option>
            </select>
          </label>

          <label style={labelStyle}>
            훈련 시간(분)
            <input
              style={inputStyle}
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="예: 45"
            />
          </label>

          <label style={labelStyle}>
            메모
            <textarea
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              name="memo"
              value={form.memo}
              onChange={handleChange}
              placeholder="오늘 훈련 느낌을 적어줘"
            />
          </label>

          <button type="submit" style={saveButtonStyle}>
            개인 기록 저장하기
          </button>
        </form>
      </section>

      <section style={{ marginTop: "34px" }}>
        <div style={listHeaderStyle}>
          <div>
            <p style={sectionLabel}>MY RECORDS</p>
            <h2 style={titleStyle}>내 개인 훈련 기록</h2>
          </div>
          <span style={countBadgeStyle}>{logs.length}개</span>
        </div>

        {logs.length === 0 ? (
          <div style={emptyStyle}>
            아직 개인 훈련 기록이 없어. 첫 훈련을 기록해보자.
          </div>
        ) : (
          logs.map((log) => {
            const isShared = feed.some((item) => item.id === log.id);

            return (
              <div key={log.id} style={logCardStyle}>
                <div style={cardTopStyle}>
                  <div>
                    <strong style={{ fontSize: "18px" }}>{log.type}</strong>
                    <p style={{ color: "#888", margin: "6px 0 0" }}>
                      {log.date}
                    </p>
                  </div>

                  <div style={timeBadgeStyle}>{log.duration}분</div>
                </div>

                {log.memo && <p style={memoStyle}>{log.memo}</p>}

                {isShared ? (
                  <button
                    onClick={() => unshareFromFeed(log.id)}
                    style={cancelButtonStyle}
                  >
                    공개 취소
                  </button>
                ) : (
                  <button
                    onClick={() => shareToFeed(log)}
                    style={shareButtonStyle}
                  >
                    공개 피드에 공유
                  </button>
                )}
              </div>
            );
          })
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

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginTop: "22px",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#ddd",
  fontWeight: "700",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "#0f0f0f",
  color: "white",
  border: "1px solid #333",
  borderRadius: "14px",
  padding: "13px 14px",
  fontSize: "15px",
  outline: "none",
};

const saveButtonStyle = {
  marginTop: "8px",
  width: "100%",
  backgroundColor: "#ff3b3b",
  color: "white",
  border: "none",
  borderRadius: "16px",
  padding: "15px",
  fontSize: "16px",
  fontWeight: "800",
  cursor: "pointer",
};

const listHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "14px",
};

const countBadgeStyle = {
  backgroundColor: "#222",
  border: "1px solid #333",
  color: "#aaa",
  borderRadius: "999px",
  padding: "7px 12px",
  fontSize: "13px",
  fontWeight: "700",
};

const emptyStyle = {
  backgroundColor: "#111",
  border: "1px dashed #333",
  borderRadius: "16px",
  padding: "22px",
  color: "#aaa",
  textAlign: "center",
};

const logCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #2b2b2b",
  borderRadius: "18px",
  padding: "16px",
  marginBottom: "12px",
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const timeBadgeStyle = {
  backgroundColor: "#251111",
  border: "1px solid #ff3b3b",
  color: "#ff6b6b",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

const memoStyle = {
  backgroundColor: "#1b1b1b",
  borderRadius: "12px",
  padding: "12px",
  color: "#ddd",
  lineHeight: "1.5",
  marginTop: "14px",
};

const shareButtonStyle = {
  marginTop: "12px",
  width: "100%",
  backgroundColor: "#222",
  color: "white",
  border: "1px solid #444",
  borderRadius: "12px",
  padding: "11px",
  fontWeight: "700",
  cursor: "pointer",
};

const cancelButtonStyle = {
  marginTop: "12px",
  width: "100%",
  backgroundColor: "transparent",
  color: "#ff6b6b",
  border: "1px solid #ff6b6b",
  borderRadius: "12px",
  padding: "11px",
  fontWeight: "700",
  cursor: "pointer",
};

export default LogPage;