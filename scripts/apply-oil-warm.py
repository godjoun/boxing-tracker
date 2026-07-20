from pathlib import Path
import re

new_block = """.app-shell {
  /* ROUND ON: oil black + warm burgundy-tinted surfaces (not cold gray) */
  --p-stage: #0a0909;
  --p-ivory: #f5f1e8;
  --p-ink: #0a0909;
  --p-bone: #f5f1e8;
  --p-fog: #b8a99a;
  --p-card: #1a1214;
  --p-card-deep: #120e10;
  --p-card-lift: #22181a;
  --p-espresso: var(--p-card-deep);
  --p-espresso-mid: var(--p-card);
  --p-espresso-deep: #050405;
  --p-ash: var(--p-fog);
  --p-ash-soft: var(--p-fog);
  --p-ash-mid: var(--p-card-lift);
  --p-ash-card: var(--p-card);
  --p-ash-deep: var(--p-card-deep);
  --p-text: var(--p-bone);
  --p-text-strong: #ffffff;
  --p-text-body: rgba(245, 241, 232, 0.92);
  --p-text-soft: var(--p-fog);
  --p-text-muted: var(--p-fog);
  --p-text-faint: rgba(184, 169, 154, 0.75);
  --p-on-surface: var(--p-bone);
  --p-on-accent: var(--p-bone);
  --p-surface: var(--p-stage);
  --p-bg-page: var(--p-stage);
  --p-bg-nav: rgba(10, 9, 9, 0.96);
  --p-nav-border: rgba(138, 46, 46, 0.22);
  --p-bg-card: var(--p-card);
  --p-bg-panel: var(--p-card-lift);
  --p-bg-deep: var(--p-stage);
  --p-bg-inner: var(--p-card-deep);
  --p-bg-subtle: var(--p-card);
  --p-bg-inset: var(--p-card-deep);
  --p-input-bg: var(--p-card-deep);
  --p-border: rgba(138, 46, 46, 0.22);
  --p-border-soft: rgba(138, 46, 46, 0.14);
  --p-border-strong: rgba(138, 46, 46, 0.34);
  --p-accent: #8a2e2e;
  --p-accent-soft: #a34a4a;
  --p-accent-solid: #742525;
  --p-accent-bg: rgba(138, 46, 46, 0.18);
  --p-accent-border: rgba(138, 46, 46, 0.42);
  --levelup-action-bg: #8a2e2e;
  --levelup-action-hover: #742525;
  --levelup-action-pressed: #5f1e1e;
  --levelup-action-text: #f5f1e8;
  --levelup-action-shadow: 0 10px 28px rgba(70, 18, 18, 0.35);
  --levelup-button-bg: var(--p-card-deep);
  --levelup-button-hover: var(--p-card-lift);
  --levelup-button-pressed: #050405;
  --levelup-button-border: rgba(138, 46, 46, 0.28);
  --levelup-button-text: var(--p-bone);
  --p-brass: #cf8b8b;
  --p-brass-soft: #e0a8a8;
  --p-brass-bg: rgba(138, 46, 46, 0.16);
  --p-brass-border: rgba(138, 46, 46, 0.34);
  --p-leather: var(--p-card-deep);
  --p-ivory-soft: #e8dcd0;
  --p-hero-bg: var(--p-card);
  --p-shadow-hero: none;
  --p-shadow-accent: 0 10px 28px rgba(70, 18, 18, 0.4);
  --p-done-bg: var(--p-card-deep);
  --p-done-title: var(--p-bone);
  --p-done-text: var(--p-fog);
  --p-growth: var(--p-fog);
  --p-growth-soft: rgba(184, 169, 154, 0.85);
  --p-growth-fill: linear-gradient(90deg, #8a2e2e, #a34a4a);
  --p-state-done: var(--p-fog);
  --p-state-done-solid: var(--p-card-lift);
  --p-state-rest: var(--p-fog);
  --p-state-rest-solid: var(--p-card-lift);
  --gold: var(--p-fog);
  --gold-dark: #8a2e2e;
  --gold-soft: var(--p-ivory-soft);
}"""

p = Path("src/App.css")
text = p.read_text()
text2, n = re.subn(
    r"\.app-shell \{\n  /\* ROUND ON:.*?\n\}",
    new_block,
    text,
    count=1,
    flags=re.S,
)
print("token replacements:", n)
if n != 1:
    raise SystemExit("failed to replace token block")

# Hardcoded card surfaces that should follow new card color
text2 = text2.replace("background: #141414;", "background: #1a1214;")
text2 = text2.replace("#1a1614;", "#1a1214;")

p.write_text(text2)

# Career scene + nameplate hardcoded surfaces
for path in [
    Path("src/components/CareerLevelScene.css"),
    Path("src/components/FighterSpecCard.css"),
]:
    t = path.read_text()
    t = t.replace("#141414", "#1a1214")
    t = t.replace("#101010", "#120e10")
    t = t.replace("#0a0a0a", "#0a0909")
    t = t.replace("#9a9a9a", "#b8a99a")
    path.write_text(t)
    print("updated", path)

# Fix leftover gold rgba in App.css that python first pass missed
raw = Path("src/App.css").read_text()
raw = raw.replace("rgba(214, 162, 52,", "rgba(138, 46, 46,")
raw = raw.replace("rgba(212, 162, 52,", "rgba(138, 46, 46,")
Path("src/App.css").write_text(raw)

# Update philosophy
rule = Path(".cursor/rules/round-on-product-philosophy.mdc")
rt = rule.read_text()
rt = rt.replace("차콜 (`#141414`)", "버건디 나이트 (`#1A1214`)")
rt = rt.replace("포그 `#9A9A9A`", "웜 포그 `#B8A99A`")
rt = rt.replace("오일 블랙 무대 + 차콜 카드", "오일 블랙 무대 + 버건디 틴트 카드")
rt = rt.replace("매트 블랙·중성 차콜", "오일 블랙")
rule.write_text(rt)

docs = Path("docs/product-philosophy.md")
dt = docs.read_text()
dt = dt.replace(
    "| 20% | 카드 | 차콜 `#141414` | 정보 면 (본 `#F5F1E8`) |",
    "| 20% | 카드 | 버건디 나이트 `#1A1214` | 정보 면 (본 `#F5F1E8`) |",
)
dt = dt.replace(
    "| 보조 | 타이포 | 포그 `#9A9A9A` | 라벨·보조 글자 |",
    "| 보조 | 타이포 | 웜 포그 `#B8A99A` | 라벨·보조 글자 |",
)
dt = dt.replace(
    "오일 블랙 무대 + 차콜 카드",
    "오일 블랙 무대 + 버건디 틴트 카드",
)
docs.write_text(dt)
print("docs/rule done")
print("card token", "--p-card: #1a1214" in Path("src/App.css").read_text())
PY