import { useRef, useState } from "react";
import { useTraining } from "../store/TrainingContext";
import {
  downloadBackupJson,
  formatBackupSummary,
} from "../utils/dataBackup";

export default function DataBackupPage({ onGoBack }) {
  const { logs, buildBackupPayload, restoreBackupFromText } = useTraining();
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function handleExport() {
    setError("");
    setStatus("");

    const payload = buildBackupPayload();
    downloadBackupJson(payload);

    const summary = formatBackupSummary(payload);
    setStatus(
      `백업 파일을 저장했습니다. 기록 ${summary.logCount}건 · ${summary.nickname}`
    );
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setStatus("");

    try {
      const text = await file.text();
      const preview = JSON.parse(text);
      const summary = formatBackupSummary(preview);
      const hasExisting = logs.length > 0;

      const mode = hasExisting
        ? window.prompt(
            `가져올 기록 ${summary.logCount}건\n\nreplace = 기존 데이터 교체\nmerge = 기존과 합치기\n\n입력:`,
            "merge"
          )
        : "replace";

      if (!mode) return;

      const normalizedMode = mode.trim().toLowerCase();

      if (normalizedMode !== "replace" && normalizedMode !== "merge") {
        throw new Error('replace 또는 merge만 입력할 수 있습니다.');
      }

      if (normalizedMode === "replace" && hasExisting) {
        const confirmed = window.confirm(
          "기존 훈련 기록을 모두 지우고 백업 파일로 교체합니다. 계속할까요?"
        );

        if (!confirmed) return;
      }

      const result = restoreBackupFromText(text, {
        merge: normalizedMode === "merge",
      });

      setStatus(
        result.merged
          ? `기록을 합쳤습니다. 현재 ${result.logCount}건`
          : `기록을 복원했습니다. ${result.logCount}건`
      );
    } catch (importError) {
      setError(importError.message || "백업 파일을 가져오지 못했습니다.");
    }
  }

  return (
    <main className="backup-page">
      <header className="report-hero">
        <button className="category-back" type="button" onClick={onGoBack}>
          <span>←</span> 더보기
        </button>
        <div className="report-hero-copy">
          <p>DATA BACKUP</p>
          <h1>데이터 백업</h1>
          <span>기록을 JSON 파일로 저장하거나 다른 기기에서 복원하세요.</span>
        </div>
      </header>

      <section className="backup-panel">
        <p className="home-section-label">EXPORT</p>
        <h2>백업 내보내기</h2>
        <p className="backup-text">
          훈련 기록, 프로필, 성장 데이터를 JSON 파일로 저장합니다. 클라우드
          동기화 전까지 이 파일이 안전망입니다.
        </p>
        <button type="button" className="backup-primary-button" onClick={handleExport}>
          JSON 백업 저장
        </button>
        <p className="backup-meta">현재 기록 {logs.length}건</p>
      </section>

      <section className="backup-panel">
        <p className="home-section-label">IMPORT</p>
        <h2>백업 가져오기</h2>
        <p className="backup-text">
          저장해 둔 JSON 파일을 선택하세요. 기존 기록이 있으면 합치기(merge) 또는
          교체(replace)를 선택할 수 있습니다.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="backup-secondary-button"
          onClick={() => fileInputRef.current?.click()}
        >
          JSON 파일 선택
        </button>
      </section>

      {status && <p className="backup-status success">{status}</p>}
      {error && <p className="backup-status error">{error}</p>}

      <section className="backup-panel subtle">
        <p className="home-section-label">TIP</p>
        <ul className="backup-tip-list">
          <li>폰을 바꾸기 전에 백업 파일을 저장해 두세요.</li>
          <li>merge는 같은 id 기록은 덮어쓰고, 새 기록만 추가합니다.</li>
          <li>replace는 현재 기기 데이터를 백업 내용으로 완전히 교체합니다.</li>
        </ul>
      </section>
    </main>
  );
}
