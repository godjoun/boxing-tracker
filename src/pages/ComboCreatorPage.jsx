import { useMemo, useState } from "react";
import {
  buildComboDrill,
  comboPresetToSession,
  deleteComboPreset,
  formatComboNotation,
  getSavedCombos,
  MOVE_GROUPS,
  parseComboInput,
  saveComboPreset,
} from "../utils/comboCreator";
import {
  getFighterLibrary,
  getFavoriteFighterIds,
  toggleFavoriteFighter,
} from "../utils/fighterCombos";
import "./ComboCreatorPage.css";

const SOURCE_TABS = [
  { id: "direct", label: "직접" },
  { id: "fighters", label: "선수" },
  { id: "saved", label: "내 콤보" },
];

export default function ComboCreatorPage({
  onGoBack,
  onStartSession,
}) {
  const [moves, setMoves] = useState([]);
  const [comboInput, setComboInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [comboName, setComboName] = useState("");
  const [rounds, setRounds] = useState(4);
  const [saveOnStart, setSaveOnStart] = useState(false);
  const [source, setSource] = useState("direct");
  const [moveGroupId, setMoveGroupId] = useState(MOVE_GROUPS[0]?.id || "basic");
  const [savedCombos, setSavedCombos] = useState(() => getSavedCombos());
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteFighterIds());
  const [selectedFighterId, setSelectedFighterId] = useState(null);

  const fighters = useMemo(() => getFighterLibrary(), []);
  const sortedFighters = useMemo(() => {
    return [...fighters].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id) ? 0 : 1;
      const bFav = favoriteIds.includes(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }, [fighters, favoriteIds]);

  const selectedFighter =
    sortedFighters.find((fighter) => fighter.id === selectedFighterId) || null;

  const activeGroup =
    MOVE_GROUPS.find((group) => group.id === moveGroupId) || MOVE_GROUPS[0];

  const notation = useMemo(() => formatComboNotation(moves), [moves]);
  const displayName = comboName.trim() || notation || "콤보";

  function addMove(move) {
    setMoves((current) => [...current, move]);
  }

  function removeMoveAt(index) {
    setMoves((current) => current.filter((_, i) => i !== index));
  }

  function undoMove() {
    setMoves((current) => current.slice(0, -1));
  }

  function clearMoves() {
    setMoves([]);
    setInputError("");
  }

  function handleApplyComboInput() {
    const { moves: parsedMoves, errors } = parseComboInput(comboInput);

    if (parsedMoves.length === 0) {
      setInputError(
        errors.length > 0
          ? `인식하지 못한 입력: ${errors.join(", ")}`
          : "예: J-C-S"
      );
      return;
    }

    setMoves((current) => [...current, ...parsedMoves]);
    setComboInput("");
    setInputError(
      errors.length > 0 ? `일부만 추가됨 · ${errors.join(", ")}` : ""
    );
  }

  function handleComboInputKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleApplyComboInput();
    }
  }

  function handleStart() {
    if (moves.length === 0) return;

    if (saveOnStart) {
      saveComboPreset({
        name: displayName,
        moves,
        rounds,
      });
      setSavedCombos(getSavedCombos());
    }

    onStartSession?.(buildComboDrill(displayName, moves, rounds));
  }

  function handleLoadSaved(preset) {
    setMoves(Array.isArray(preset.moves) ? preset.moves : []);
    setComboName(preset.name || "");
    setRounds(preset.rounds || 4);
    setSaveOnStart(false);
    setSource("direct");
  }

  function handleStartSaved(preset) {
    onStartSession?.(comboPresetToSession(preset));
  }

  function handleDelete(presetId) {
    deleteComboPreset(presetId);
    setSavedCombos(getSavedCombos());
  }

  function handleLoadFighterCombo(fighter, combo) {
    setMoves(combo.moves);
    setComboName(`${fighter.nameEn} · ${combo.title}`);
    setSaveOnStart(false);
    setSource("direct");
  }

  function handleStartFighterCombo(fighter, combo) {
    onStartSession?.(
      buildComboDrill(`${fighter.nameEn} · ${combo.title}`, combo.moves, rounds)
    );
  }

  function handleToggleFavorite(event, fighterId) {
    event.stopPropagation();
    setFavoriteIds(toggleFavoriteFighter(fighterId));
  }

  return (
    <main className="combo-creator-page">
      <header className="combo-creator-hero">
        <button className="combo-creator-back" type="button" onClick={onGoBack}>
          ← 뒤로
        </button>
        <h1>콤보</h1>
      </header>

      <section className="combo-timeline" aria-label="현재 콤보">
        <div className="combo-timeline-top">
          <span className="combo-timeline-code">
            {notation || "비어 있음"}
          </span>
          <div className="combo-timeline-tools">
            <button
              type="button"
              className="combo-text-btn"
              onClick={undoMove}
              disabled={moves.length === 0}
            >
              ↩
            </button>
            <button
              type="button"
              className="combo-text-btn"
              onClick={clearMoves}
              disabled={moves.length === 0}
            >
              비우기
            </button>
          </div>
        </div>

        {moves.length > 0 ? (
          <div className="combo-chip-row">
            {moves.map((move, index) => (
              <button
                type="button"
                className="combo-chip"
                key={`${move.id}-${index}`}
                onClick={() => removeMoveAt(index)}
                title="탭해서 삭제"
              >
                <em>{move.short}</em>
                <b>{move.label}</b>
              </button>
            ))}
          </div>
        ) : (
          <p className="combo-timeline-empty">
            아래에서 동작을 추가하거나 선수 콤보를 불러오세요
          </p>
        )}
      </section>

      <nav className="combo-source-tabs" aria-label="소스">
        {SOURCE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`combo-source-tab${source === tab.id ? " is-active" : ""}`}
            onClick={() => {
              setSource(tab.id);
              if (tab.id !== "fighters") setSelectedFighterId(null);
            }}
          >
            {tab.label}
            {tab.id === "saved" && savedCombos.length > 0 ? (
              <em>{savedCombos.length}</em>
            ) : null}
          </button>
        ))}
      </nav>

      <section className="combo-workspace" aria-live="polite">
        {source === "direct" ? (
          <>
            <div className="combo-input-row">
              <input
                type="text"
                value={comboInput}
                placeholder="직접 입력 · J-J-C-LBd-OHH"
                aria-label="콤보 직접 입력"
                onChange={(event) => {
                  setComboInput(event.target.value);
                  if (inputError) setInputError("");
                }}
                onKeyDown={handleComboInputKeyDown}
              />
              <button
                type="button"
                className="combo-creator-secondary"
                onClick={handleApplyComboInput}
                disabled={!comboInput.trim()}
              >
                추가
              </button>
            </div>

            {inputError ? (
              <p className="combo-creator-input-error">{inputError}</p>
            ) : null}

            <div className="combo-group-filters" role="tablist" aria-label="무브 그룹">
              {MOVE_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  role="tab"
                  className={`combo-group-filter${
                    moveGroupId === group.id ? " is-active" : ""
                  }`}
                  aria-selected={moveGroupId === group.id}
                  onClick={() => setMoveGroupId(group.id)}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <div className="combo-creator-grid">
              {activeGroup.moves.map((move) => (
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
          </>
        ) : null}

        {source === "fighters" ? (
          selectedFighter ? (
            <div className="combo-fighter-detail">
              <button
                type="button"
                className="combo-text-btn combo-fighter-back"
                onClick={() => setSelectedFighterId(null)}
              >
                ← 선수 목록
              </button>

              <div className="combo-fighter-hero">
                <div>
                  <strong>{selectedFighter.name}</strong>
                  <span>{selectedFighter.style}</span>
                </div>
                <button
                  type="button"
                  className={`combo-fav-btn${
                    favoriteIds.includes(selectedFighter.id) ? " is-on" : ""
                  }`}
                  onClick={(event) =>
                    handleToggleFavorite(event, selectedFighter.id)
                  }
                  aria-label="즐겨찾기"
                >
                  {favoriteIds.includes(selectedFighter.id) ? "★" : "☆"}
                </button>
              </div>

              <div className="combo-fighter-combos">
                {selectedFighter.combos.map((combo) => (
                  <article className="combo-fighter-combo" key={combo.id}>
                    <div>
                      <strong>{combo.title}</strong>
                      <span>{combo.chain}</span>
                      <em>{combo.note}</em>
                    </div>
                    <div className="combo-creator-saved-actions">
                      <button
                        type="button"
                        className="combo-creator-secondary"
                        onClick={() =>
                          handleLoadFighterCombo(selectedFighter, combo)
                        }
                      >
                        불러오기
                      </button>
                      <button
                        type="button"
                        className="combo-creator-primary"
                        onClick={() =>
                          handleStartFighterCombo(selectedFighter, combo)
                        }
                      >
                        시작
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="combo-fighter-list">
              <p className="combo-fighter-hint">
                ★로 즐겨찾기 · 불러오면 위 타임라인에 채워집니다
              </p>
              {sortedFighters.map((fighter) => (
                <article className="combo-fighter-card" key={fighter.id}>
                  <button
                    type="button"
                    className="combo-fighter-card-main"
                    onClick={() => setSelectedFighterId(fighter.id)}
                  >
                    <strong>{fighter.name}</strong>
                    <span>{fighter.style}</span>
                    <em>{fighter.combos.length}개 콤보</em>
                  </button>
                  <button
                    type="button"
                    className={`combo-fav-btn${
                      favoriteIds.includes(fighter.id) ? " is-on" : ""
                    }`}
                    onClick={(event) => handleToggleFavorite(event, fighter.id)}
                    aria-label={`${fighter.name} 즐겨찾기`}
                  >
                    {favoriteIds.includes(fighter.id) ? "★" : "☆"}
                  </button>
                </article>
              ))}
            </div>
          )
        ) : null}

        {source === "saved" ? (
          savedCombos.length > 0 ? (
            <div className="combo-creator-saved-list">
              {savedCombos.map((preset) => (
                <article className="combo-creator-saved-item" key={preset.id}>
                  <button
                    type="button"
                    className="combo-saved-main"
                    onClick={() => handleLoadSaved(preset)}
                  >
                    <strong>{preset.name}</strong>
                    <span>{preset.chain}</span>
                    <em>{preset.rounds}R · 불러오기</em>
                  </button>
                  <div className="combo-creator-saved-actions">
                    <button
                      type="button"
                      className="combo-creator-secondary"
                      onClick={() => handleStartSaved(preset)}
                    >
                      시작
                    </button>
                    <button
                      type="button"
                      className="combo-text-btn"
                      onClick={() => handleDelete(preset.id)}
                    >
                      삭제
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="combo-saved-empty">
              <p>저장한 콤보가 없습니다.</p>
              <p>하단에서 「저장」을 켠 뒤 시작하면 여기에 쌓입니다.</p>
            </div>
          )
        ) : null}
      </section>

      <div className="combo-dock">
        {saveOnStart ? (
          <input
            className="combo-dock-name"
            type="text"
            placeholder={notation || "콤보 이름 (선택)"}
            value={comboName}
            onChange={(event) => setComboName(event.target.value)}
            aria-label="콤보 이름"
          />
        ) : null}

        <div className="combo-dock-row">
          <div className="combo-dock-rounds" role="group" aria-label="라운드">
            {[3, 4, 6].map((value) => (
              <button
                key={value}
                type="button"
                className={`combo-round-chip${rounds === value ? " is-active" : ""}`}
                onClick={() => setRounds(value)}
              >
                {value}R
              </button>
            ))}
          </div>

          <label className="combo-dock-save">
            <input
              type="checkbox"
              checked={saveOnStart}
              onChange={(event) => setSaveOnStart(event.target.checked)}
            />
            <span>저장</span>
          </label>

          <button
            type="button"
            className="combo-creator-primary combo-dock-start"
            disabled={moves.length === 0}
            onClick={handleStart}
          >
            {saveOnStart ? "저장·시작" : "시작"}
          </button>
        </div>
      </div>
    </main>
  );
}
