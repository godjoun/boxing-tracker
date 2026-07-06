import { useMemo, useState } from "react";
import {
  buildComboDrill,
  comboPresetToSession,
  deleteComboPreset,
  formatComboChain,
  formatComboNotation,
  getSavedCombos,
  PUNCH_MOVES,
  saveComboPreset,
} from "../utils/comboCreator";
import "./ComboCreatorPage.css";

export default function ComboCreatorPage({
  onGoBack,
  onStartSession,
}) {
  const [moves, setMoves] = useState([]);
  const [comboName, setComboName] = useState("");
  const [rounds, setRounds] = useState(4);
  const [savedCombos, setSavedCombos] = useState(() => getSavedCombos());

  const chainLabel = useMemo(() => formatComboChain(moves), [moves]);
  const notation = useMemo(() => formatComboNotation(moves), [moves]);

  function addMove(move) {
    setMoves((current) => [...current, move]);
  }

  function undoMove() {
    setMoves((current) => current.slice(0, -1));
  }

  function clearMoves() {
    setMoves([]);
  }

  function handleStart({ savePreset = false } = {}) {
    if (moves.length === 0) return;

    const session = buildComboDrill(
      comboName || notation,
      moves,
      rounds
    );

    if (savePreset) {
      saveComboPreset({
        name: comboName || notation,
        moves,
        rounds,
      });
      setSavedCombos(getSavedCombos());
    }

    onStartSession?.(session);
  }

  function handleStartSaved(preset) {
    onStartSession?.(comboPresetToSession(preset));
  }

  function handleDelete(presetId) {
    deleteComboPreset(presetId);
    setSavedCombos(getSavedCombos());
  }

  return (
    <main className="combo-creator-page">
      <header className="combo-creator-hero">
        <button className="combo-creator-back" type="button" onClick={onGoBack}>
          <span aria-hidden="true">←</span> 홈 커리큘럼
        </button>
        <p className="combo-creator-kicker">COMBO LAB</p>
        <h1>콤보 크리에이터</h1>
        <p className="combo-creator-intro">
          펀치와 디펜스를 조합해 나만의 섀도우 루틴을 만듭니다.
        </p>
      </header>

      <section className="combo-creator-card combo-creator-preview">
        <p className="combo-creator-section-label">PREVIEW</p>
        <strong>{notation || "콤보를 추가하세요"}</strong>
        <span>{chainLabel || "버튼을 눌러 동작을 이어 붙이세요."}</span>
        <div className="combo-creator-preview-actions">
          <button
            type="button"
            className="combo-creator-ghost"
            onClick={undoMove}
            disabled={moves.length === 0}
          >
            되돌리기
          </button>
          <button
            type="button"
            className="combo-creator-ghost"
            onClick={clearMoves}
            disabled={moves.length === 0}
          >
            전체 삭제
          </button>
        </div>
      </section>

      <section className="combo-creator-card">
        <p className="combo-creator-section-label">MOVES</p>
        <div className="combo-creator-grid">
          {PUNCH_MOVES.map((move) => (
            <button
              key={move.id}
              type="button"
              className="combo-creator-move"
              onClick={() => addMove(move)}
            >
              <strong>{move.label}</strong>
              <span>{move.short}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="combo-creator-card">
        <p className="combo-creator-section-label">SETTINGS</p>
        <div className="combo-creator-form">
          <label>
            <span>콤보 이름</span>
            <input
              type="text"
              placeholder={notation || "예: 카운터 1-2"}
              value={comboName}
              onChange={(event) => setComboName(event.target.value)}
            />
          </label>
          <label>
            <span>라운드</span>
            <input
              type="number"
              min={2}
              max={12}
              value={rounds}
              onChange={(event) => setRounds(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="combo-creator-actions">
          <button
            type="button"
            className="combo-creator-primary"
            disabled={moves.length === 0}
            onClick={() => handleStart({ savePreset: false })}
          >
            타이머로 시작
          </button>
          <button
            type="button"
            className="combo-creator-secondary"
            disabled={moves.length === 0}
            onClick={() => handleStart({ savePreset: true })}
          >
            저장 후 시작
          </button>
        </div>
      </section>

      {savedCombos.length > 0 ? (
        <section className="combo-creator-card">
          <p className="combo-creator-section-label">SAVED</p>
          <div className="combo-creator-saved-list">
            {savedCombos.map((preset) => (
              <article className="combo-creator-saved-item" key={preset.id}>
                <div>
                  <strong>{preset.name}</strong>
                  <span>{preset.chain}</span>
                  <em>{preset.rounds}R</em>
                </div>
                <div className="combo-creator-saved-actions">
                  <button
                    type="button"
                    className="combo-creator-primary"
                    onClick={() => handleStartSaved(preset)}
                  >
                    시작
                  </button>
                  <button
                    type="button"
                    className="combo-creator-ghost"
                    onClick={() => handleDelete(preset.id)}
                  >
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
