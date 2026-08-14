# MANTLE AI Working Rules

This repository is the MANTLE boxing app.

## Product north star

MANTLE is not primarily a timer app. The long-term product is a boxer profile that accumulates a person's real boxing history over time.

Core loop:

Training -> Record -> Profile accumulation -> Boxer identity / nameplate expression

Long-term position:

MANTLE = boxing history / boxer profile.

## Current MVP focus

The current beachhead user is a person training boxing alone at home.

MANTLE v1 should make one home-boxing session easy to start, reliable to complete, and automatically recorded afterward.

Prioritize:

1. Fast and understandable training start.
2. Reliable round / work / rest timer behavior.
3. Easy-to-follow drills for solo home boxing.
4. Minimal interaction during training.
5. Reliable automatic completion.
6. Automatic record saving without requiring duplicate manual entry.
7. Accurate accumulation of records over time.

## Product decision rule

Before proposing or implementing work, ask:

> Does this make one real boxing session easier to complete, record more accurately, or add more meaningful evidence to the user's boxer profile?

If not, defer it unless explicitly approved by the owner.

## Do not expand scope automatically

Do not independently add or redesign:

- large home-screen redesigns
- AI coaching
- community / chat features
- rankings
- boxer skill scores
- large badge systems
- gym verification systems
- event verification systems
- new monetization systems
- major visual redesigns just for aesthetics

UI may remain visually rough during the MVP if it is readable, understandable, and reliable.

## Record integrity principles

MANTLE should record facts without exaggerating what it knows.

- Do not infer unknown timestamps or provenance.
- Do not label a record VERIFIED unless the system truly verifies the claimed fact.
- `mantle_session` means only that the record was generated through a MANTLE timer session. It does not prove that the user physically performed the boxing session.
- Unknown or ambiguous provenance should be treated conservatively.
- Preserve backward compatibility with existing user records unless an explicit migration has been approved.

MANTLE does not declare that a user is skilled, elite, strong, or superior based on training volume. Records should speak for themselves.

## Engineering rules for AI work

- Make the smallest change that solves the approved issue.
- Preserve working behavior unless the issue specifically requires changing it.
- Do not reset or delete localStorage / production data to solve compatibility problems.
- Do not modify production secrets.
- Do not deploy to production or merge to `main` automatically.
- Work on a dedicated branch and submit changes for review.
- Run the project's checks before reporting completion.

Required checks when applicable:

```bash
npm test
npm run lint
npm run build
```

If a check fails, report the failure rather than hiding or bypassing it.

## Approval boundary

The repository owner is the final approver.

AI may analyze, implement approved tasks on a branch, run tests, and prepare a pull request.

AI must not autonomously:

- merge to `main`
- deploy production changes
- spend money
- change production data
- contact users
- publish marketing content
- make a new product-direction decision

When product intent is ambiguous, stop and request approval rather than inventing scope.
