# PUNCH ERA — shared handoff

Updated: 2026-11-07 (Asia/Seoul)

## Start here

Read AGENTS.md, then this document, at the start of every ChatGPT or Codex task.
Use the latest explicit user instructions for the task scope. Keep the existing engineering and record-integrity rules in AGENTS.md.

**Status: shared documentation prepared; official Mac source synchronization is still blocked.**
This branch contains documentation changes on a verified GitHub snapshot. It does not establish that GitHub contains the latest local or deployed application source.
Do not describe this documentation PR as a completed source recovery or an application release.

## Project identities and source of truth

| Item | Value / interpretation |
| --- | --- |
| Official local folder (user-designated) | /Users/sinjoun/Desktop/PUNCH-ERA |
| GitHub repository | godjoun/boxing-tracker |
| Production URL | https://boxing-tracker.vercel.app/ |
| Shared documentation branch | docs/punch-era-handoff-20261107 |
| Verified GitHub main snapshot | 3520dc84919fddaf57ae965320348dab27cf6d1f |
| Last reported release commit | 9c4a76252e8f1889742a192eef058dd5074a9e82 — not found in this GitHub repository during inspection |
| Verified production deployment | dpl_GNC9fgVjtCEPTPWi1DXYbkAxRWVe |
| Production immutable deployment hostname | boxing-tracker-oppjwicoa-godjouns-projects.vercel.app |

The official local folder is the source that must be inspected next. Its current HEAD, working changes, remote and relationship to production are not yet verified.
Do not assume main is the latest production source. Do not replace the official local working tree with main.
The available executor is Linux at /workspace; the official Mac folder does not exist in that executor. A cloud clone is not an inspection of the user's Mac.

The production title is PUNCH ERA. The inspected GitHub main still uses MANTLE, a working name in existing rules and code.
Use PUNCH ERA to refer to this project. This handoff does not authorize a code, storage-key, package, route or asset rename.

## Product direction

**Solo boxing training → completion → accumulated records.**

Help a person training boxing alone understand what to do, complete a small drill or routine with minimal phone interaction, and see their completed work accumulate in records and a profile.

- The user chooses when to start. Saving a training configuration must allow them to leave without starting exercise.
- Saving a configuration is not evidence that a workout was completed and must not create a completed-workout record by itself.
- After saving MY COMBO, the intended choices are “지금 연습하기” and “나중에 하기”.
- “나중에 하기” returns to the saved list; a saved item can be opened for practice later.
- If training is already in progress, practice entry should return to that session rather than silently replace it. Verify all entry paths before claiming this holds everywhere.
- Completion records must avoid duplicate counting. Partial workouts must not be presented as full planned completion.
- Training volume and timer-generated records do not verify physical performance or boxing skill.

The current task is sharing source and working context. Keep main merging and production redeployment outside this task.
Do not expand this task into a large redesign, course library, AI coaching, community or monetization implementation.

## Implementation and evidence

### Last deployment report — supplied by the user, not revalidated tests

- Light-mode home: background, cards, text and buttons adjusted.
- MY COMBO: “기타 · 직접 입력”, blank-input prevention and persistence after saving/reloading.
- Save confirmation: “지금 연습하기” and “나중에 하기”.
- Existing in-progress training: return to the current session.
- Reported release commit: 9c4a76252e8f1889742a192eef058dd5074a9e82.
- Reported deployment: dpl_GNC9fgVjtCEPTPWi1DXYbkAxRWVe.
- Reported validation: 577 tests, lint and build passed.
- Actual iPhone Safari use still requires separate verification.

These are release-report claims. Do not promote them to newly executed or independently verified results.

### Independently checked

- The Vercel alias boxing-tracker.vercel.app was rechecked on 2026-11-07 and still resolves to dpl_GNC9fgVjtCEPTPWi1DXYbkAxRWVe.
- The deployment was observed READY, target production, created by CLI on 2026-10-30 at 00:03 KST.
- Its inspected metadata does not identify a Git commit. The deployment ID is confirmed; its exact source SHA remains unverified.
- Earlier public HTTP inspection on 2026-11-07 returned HTTPS 200 and title PUNCH ERA.
- The served public JavaScript contained “기타 · 직접 입력”, “지금 연습하기”, “나중에 하기” and the conditional “진행 중인 훈련으로” action. The later action routes to the saved list in that bundle.
- Public bundle inspected: /assets/index-9l9UJqPc.js.
- Bundle SHA-256: 42967b006ce9f657148f3be75b591b47f4f2356b5cd81fd1b41cf69b8fa386a0.
- Bundle inspection establishes code inclusion, not successful interaction, reload persistence, appearance or actual iPhone behavior.
- GitHub main was rechecked at 3520dc84919fddaf57ae965320348dab27cf6d1f (2026-09-07). Its HTML title is MANTLE.
- A GitHub commit lookup for 9c4a76252e8f1889742a192eef058dd5074a9e82 returned “No commit found for SHA”. This does not establish whether the commit exists in the official local repository.
- Main's inspected TimerPage already implements completion saving, duplicate-save guards and partial-round saving. These are source observations, not fresh runtime tests.
- Main's timer restoration uses sessionStorage and elapsed-time correction. Full browser termination, new tabs and real iPhone behavior remain unverified.
- Main's general active-session protection has a curriculumSessionId exception. Do not claim every launch path preserves the current session.
- Main's inspected curriculum/combination save flow differs from the deployed MY COMBO flow. Absence in main is not proof the production feature is missing.

### Source references

- Product/engineering rules: [AGENTS.md](../AGENTS.md).
- Verified baseline: https://github.com/godjoun/boxing-tracker/commit/3520dc84919fddaf57ae965320348dab27cf6d1f
- Automatic completion saving: src/pages/TimerPage.jsx around line 627 at that baseline.
- Partial workout handling: src/pages/TimerPage.jsx around lines 703–710.
- Session restoration: src/utils/timerSession.js.
- Launch-config exception: src/hooks/useBackgroundTimerSession.js around lines 106–112.
- Current main save-and-start path: src/pages/CurriculumPage.jsx around line 350.

Line numbers above refer to the pinned baseline, not an assumed current official local checkout.

## Validation status

| Check | Result and limit |
| --- | --- |
| GitHub main and Vercel alias | Read-only API inspection completed |
| Public production HTML / bundle | Earlier read-only inspection completed; no full interaction test |
| Official local Git status, remote, branch, changes | NOT RUN — Mac folder unavailable in this executor |
| Local existence/ancestry of reported commit | NOT RUN |
| Official local source vs GitHub diff | NOT RUN |
| Latest application-source push | NOT DONE |
| 577 tests / lint / build | Historical report only; not rerun on official local source |
| Actual iPhone Safari | NOT VERIFIED |
| This documentation change | Verify only HANDOFF.md and appended AGENTS.md guidance differ from the pinned baseline; original AGENTS.md text must remain intact |

No new test count is inferred from the previous report or from tests on a different checkout.
Record any future check with the exact tested commit and whether the working tree was dirty.

## Resume on the official Mac

Use Codex on the Mac with /Users/sinjoun/Desktop/PUNCH-ERA open.

1. Read that checkout's existing AGENTS.md before changing anything. Read this handoff from the shared branch/PR without checking the documentation branch out over local work.
2. Inspect local Git status, current branch and HEAD, tracked/staged/untracked changes, and remote destinations. Redact URL credentials and tokens from displayed remote URLs. Check that the intended remote is godjoun/boxing-tracker.
3. Check whether 9c4a76252e8f1889742a192eef058dd5074a9e82 exists locally and how it relates to current HEAD. If missing, report it and identify the actual candidate source rather than manufacturing that commit.
4. Fetch the intended GitHub remote, then compare the candidate local history and working changes with remote main. Preserve all existing changes, commits and local-only files. Do not reset, clean, force-push, discard or automatically stash them.
5. Create a separate source-sharing branch from the verified local candidate. Review files individually before staging. Do not use an unreviewed bulk add.
6. Review the entire outgoing diff/history for environment files, credentials, private keys and generated artifacts. Include only reviewed source and documentation. Do not print detected secret values. A Git bundle or archive is not automatically safe: history can contain secrets.
7. Incorporate this handoff and append-only startup guidance into the official source, preserving that checkout's existing AGENTS.md. Do not replace a newer local AGENTS.md with the older GitHub copy.
8. On the candidate source, run the repository's required npm test, npm run lint and npm run build checks. Record pass/fail, test count, exact source commit and any remaining dirty changes. Record real iPhone checks separately.
9. Push the reviewed source-sharing branch without force and open a draft PR against main. Review the complete main-to-branch diff. Do not merge main or redeploy production.
10. Update this document with the actual source-sharing branch/PR, verified source commit, differences from the reported release, fresh check results and remaining issues. Report those exact references to the user.

Safe local read-only checks, after reading local instructions:

~~~sh
cd /Users/sinjoun/Desktop/PUNCH-ERA
git status --short --branch
git branch --show-current
git rev-parse HEAD
git cat-file -e '9c4a76252e8f1889742a192eef058dd5074a9e82^{commit}'
~~~

The last command succeeds only if that local repository contains the reported commit; capture a failure honestly.
Do not paste credentials, environment-file contents or unredacted remote URLs into ChatGPT or a PR.

## Next product work after source synchronization

1. Confirm configuration saving can end at the list without starting training.
2. Verify later practice entry and protection of an already active session across every entry path.
3. Verify completion saving, duplicate prevention, partial-workout handling and record/profile totals.
4. Verify light/dark readability and custom-input persistence on actual iPhone Safari.
5. Fix reproduced issues with the smallest change and update this handoff with exact validation evidence.

Do not reimplement functionality merely because it is absent from the stale main snapshot.
