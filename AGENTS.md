# PUNCH ERA AI Working Rules

This repository is the current PUNCH ERA boxing app.

The approved public brand name is `PUNCH ERA`. Do not rename the package, routes, storage keys, analytics events, database identifiers, legacy provenance values, or repository paths as part of the public rebrand.

## Product north star

PUNCH ERA is not primarily a timer app. The long-term product is a boxer profile that accumulates a person's real boxing history over time.

Core loop:

Training -> Record -> Profile accumulation -> Boxer history / identity

Long-term position:

PUNCH ERA = boxing history / boxer profile.

The product should help a person's actual boxing activity become visible over time without claiming more than the system truly knows.

## Current product direction

The current beachhead user is not a generic home-workout user. It is a person who already learns or practices boxing, wants to stay consistent, and wants to keep training outside the gym when the gym is unavailable.

Typical situations include weekends, holidays, gym closing days, late hours, and travel. Home training is one representative situation, not the final market definition.

PUNCH ERA does not replace the gym. It helps the user continue outside the gym what they learned and practiced in the gym.

Current experience direction:

1. The user cannot train at the gym today and opens PUNCH ERA.
2. The user quickly understands what training is possible now.
3. The user follows suitable guidance, a drill, or the timer with minimal interruption.
4. The session finishes reliably and is saved automatically.
5. The completed session accumulates with the user's other boxing activity.
6. The user's boxing history becomes visible in the profile over time.

Useful product-message directions are:

> Boxing continues outside the gym.

> Wherever it happened, the boxing work a person actually completed should remain in their history.

These are product-message directions, not replacements for the official slogan and not permission to overstate what the system verifies.

Do not reduce the product concept to only `timer + log`. The training guidance, session experience, accumulated record, and profile should feel like one connected loop.

## Brand direction

### Current slogan

The current official slogan is:

> ARE YOU READY?

Treat this as a brand / emotional line, not as the sole explanation of what the product does. A first-time user should still be able to understand the product directly.

### User is the hero

The user is already a boxer and is the protagonist. The product is the guide and tool.

Do not make the brand the hero with claims such as how revolutionary, elite, or impressive PUNCH ERA is. The product should help the user act, train, and leave evidence of what they actually did.

A useful principle:

> The brand does not brag for the boxer. The record should speak for the boxer.

### Brand worldview

Current branding hypotheses to reinforce through the product and communication:

- Boxing can continue outside the gym.
- A solo round still matters when the user genuinely completes it.
- The boxing a person has actually done is worth remembering and accumulating.
- Training should not disappear just because nobody else saw it.

These are brand directions, not excuses to fabricate or overstate records.

### Desired association

Over time, the brand should build a strong association around:

> boxing + memory / trace / record / history

The public app name is `PUNCH ERA`. Any future naming exploration must preserve this association without locking the product into a narrow `boxing timer` category.

### Clarity before cleverness

A user should quickly understand:

1. What this product offers.
2. How their boxing experience becomes better by using it.
3. What action they should take next.

Do not rely on an abstract slogan, cinematic copy, or insider boxing language to explain the product. Emotional language can create atmosphere, but direct product explanation must remain clear.

A useful test is whether a first-time user can quickly answer:

- What is this?
- What does it help me do?
- What do I do next?

### One main story

Avoid presenting the product as a pile of unrelated features.

Lessons, drills, timer behavior, records, profile, nameplates, and existing progress expressions should support one story:

> I train -> the session is completed -> what I did remains -> my boxing history becomes visible over time.

### Total brand experience

Branding is not limited to a logo, app icon, slogan, or landing page. Product behavior, onboarding, copy, empty states, completion screens, profile presentation, notifications, support language, and marketing should reinforce the same values.

When reviewing a user-facing change, ask:

- Does this feel like the same brand as the rest of the product?
- Does it reinforce the user's role as the boxer rather than making the app the star?
- Does it make real training easier or make real completed training more meaningful?
- Does it communicate clearly instead of forcing the user to decode our intent?
- Does it support the association of boxing with accumulated memory / record / history?

### Authenticity over manufactured status

Do not create fake prestige or unearned identity.

Avoid claims such as:

- champion
- elite boxer
- top boxer
- verified boxer
- highly skilled
- superior to other users

unless a future system genuinely supports the exact claim.

Existing levels, tiers, titles, achievements, or progression UI may be used as motivational / product progress expressions if already approved, but they must not be presented as verified boxing skill or competitive rank based only on training volume.

## Current MVP priorities

Prioritize:

1. Fast and understandable training start when the user cannot train at the gym.
2. Useful boxing lessons and drills that can be completed outside the gym.
3. Reliable round / work / rest timer behavior.
4. Drill information that is readable without repeatedly interrupting training.
5. Minimal interaction during training.
6. Reliable automatic completion.
7. Automatic record saving without duplicate manual entry.
8. Accurate accumulation of records over time.
9. A clear connection between completed training and the user's profile / history.

The existing 4-week course, technique training, free boxing, running, timer, records, and profile remain the current MVP surface. Gym onboarding or partnerships, inquiries, DM, exchange, rivals, and community are not required for the current product validation.

Initial validation should answer:

1. Does the user want to train on a day when they cannot go to the gym?
2. Do they otherwise skip because they do not know what to do?
3. Do they start a real session through PUNCH ERA?
4. Do they complete the session?
5. Do they return to review the completed record?
6. Do they train again a few days later?

Do not use “Does the user want a home-workout app?” as the core validation question.

UI may remain visually rough during the MVP if it is readable, understandable, reliable, and consistent enough not to damage trust.

## Product decision rule

Before proposing or implementing work, ask:

> Does this make one real boxing session easier to understand or complete, record it more accurately, or make the completed session more meaningful in the user's boxer history?

If not, defer it unless explicitly approved by the owner.

## Do not expand scope automatically

Do not independently add or redesign:

- major home-screen redesigns
- AI coaching
- community / chat features
- public rankings
- boxer skill scores based on training volume
- large new badge systems
- gym verification systems
- event verification systems
- new monetization systems
- major visual redesigns just for aesthetics
- an unapproved expansion of the PUNCH ERA rebrand or a rename of internal identifiers

Do not confuse brand work with adding more features. A stronger brand should usually make the existing product story clearer and more consistent.

## Record integrity principles

PUNCH ERA should record facts without exaggerating what it knows.

- Do not infer unknown timestamps or provenance.
- Do not label a record VERIFIED unless the system truly verifies the claimed fact.
- `mantle_session` is a legacy compatibility identifier and must not be renamed. It means only that the record was generated through a PUNCH ERA timer session. It does not prove that the user physically performed the boxing session.
- Unknown or ambiguous provenance should be treated conservatively.
- Preserve backward compatibility with existing user records unless an explicit migration has been approved.

PUNCH ERA does not declare that a user is skilled, elite, strong, or superior based on training volume. Records should speak for themselves.

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
- change the approved public brand name without owner approval
- make a new product-direction decision

When product or brand intent is ambiguous, stop and request approval rather than inventing scope.
