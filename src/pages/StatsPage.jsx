import { useTraining } from "../store/TrainingContext.jsx";

function StatsPage() {
  const { logs } = useTraining();

  const totalCount = logs.length;

  const totalMinutes = logs.reduce((sum, log) => {
    return sum + Number(log.duration);
  }, 0);

  const trainingCount = {};

  logs.forEach((log) => {
    trainingCount[log.type] = (trainingCount[log.type] || 0) + 1;
  });

  let mostTraining = "아직 없음";
  let maxCount = 0;

  Object.entries(trainingCount).forEach(([type, count]) => {
    if (count > maxCount) {
      mostTraining = type;
      maxCount = count;
    }
  });

  const latestLog = logs[0];

  return (
    <div>
      <section>
        <p style={sectionLabel}>GROWTH</p>
        <h2 style={titleStyle}>📊 나의 성장 통계</h2>
        <p style={descStyle}>
          지금까지 쌓인 운동 기록을 숫자로 확인해보자.
        </p>

        <div style={statsGridStyle}>
          <StatCard label="총 운동 횟수" value={`${totalCount}회`} />
          <StatCard label="총 운동 시간" value={`${totalMinutes}분`} />
          <StatCard label="가장 많이 한 운동" value={mostTraining} />
          <StatCard
            label="최근 운동"
            value={latestLog ? latestLog.type : "없음"}
          />
        </div>
      </section>

      <section style={{ marginTop: "34px" }}>
        <p style={sectionLabel}>HISTORY</p>
        <h2 style={titleStyle}>최근 운동 기록</h2>

        {logs.length === 0 ? (
          <div style={emptyStyle}>
            아직 통계를 낼 기록이 없어. 먼저 운동을 기록해보자.
          </div>
        ) : (
          <div style={{ marginTop: "16px" }}>
            {logs.map((log) => (
              <div key={log.id} style={historyCardStyle}>
                <div>
                  <strong style={{ fontSize: "17px" }}>{log.type}</strong>
                  <p style={{ color: "#888", margin: "6px 0 0" }}>
                    {log.date}
                  </p>
                </div>

                <div style={minuteBadgeStyle}>{log.duration}분</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={statCardStyle}>
      <p style={statLabelStyle}>{label}</p>
      <h3 style={statValueStyle}>{value}</h3>
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

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "22px",
};

const statCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #2b2b2b",
  borderRadius: "18px",
  padding: "16px",
};

const statLabelStyle = {
  color: "#aaa",
  fontSize: "13px",
  margin: "0 0 10px",
};

const statValueStyle = {
  margin: "0",
  fontSize: "22px",
  color: "white",
};

const emptyStyle = {
  backgroundColor: "#111",
  border: "1px dashed #333",
  borderRadius: "16px",
  padding: "22px",
  color: "#aaa",
  textAlign: "center",
  marginTop: "16px",
};

const historyCardStyle = {
  backgroundColor: "#111",
  border: "1px solid #2b2b2b",
  borderRadius: "16px",
  padding: "14px",
  marginBottom: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
};

const minuteBadgeStyle = {
  backgroundColor: "#251111",
  border: "1px solid #ff3b3b",
  color: "#ff6b6b",
  borderRadius: "999px",
  padding: "7px 10px",
  fontSize: "13px",
  fontWeight: "800",
  whiteSpace: "nowrap",
};

export default StatsPage;