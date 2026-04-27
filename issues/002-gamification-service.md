## Parent PRD

`issues/prd.md`

## What to build

Implement the `gamificationService` module — the single source of truth for all gamification logic. No other module should read or write gamification data directly. This slice is pure business logic and database access; it has no UI.

The service must expose:
- `awardPoints(userId, eventType, referenceId)` — awards points for a lesson completion, quiz first-pass, or course completion; updates streak; updates level; idempotent per event
- `getUserGamification(userId)` — returns total points, level name, current streak, longest streak, points to next level
- `calculateLevel(totalPoints)` — pure function mapping points to a level object (name + number + thresholds)
- `updateStreak(userId, utcDateString)` — extends, resets, or holds streak per the rules in the PRD

All streak and level logic must follow the rules in the Implementation Decisions section of the parent PRD exactly.

Full Vitest test coverage is required for this slice, following the existing service test pattern (real SQLite test database, seeded per test). Test cases must cover all boundary conditions listed in the Testing Decisions section of the parent PRD.

## Acceptance criteria

- [ ] `awardPoints` correctly adds 10 pts for lesson complete, 25 for quiz first-pass, 100 for course complete
- [ ] `awardPoints` does not double-award if called twice for the same event
- [ ] `calculateLevel` returns the correct level for every threshold boundary (0, 99, 100, 299, 300, … 6000)
- [ ] `updateStreak` increments streak on consecutive days, resets on a gap, holds on same day
- [ ] `updateStreak` updates `longestStreak` when current streak exceeds it
- [ ] First ever activity sets streak to 1
- [ ] `getUserGamification` returns correct level name and points-to-next-level
- [ ] All test cases pass

## Blocked by

- `issues/001-gamification-schema-migration.md`

## User stories addressed

- User story 1 (lesson points logic)
- User story 2 (quiz points logic)
- User story 3 (course bonus logic)
- User story 7 (streak read)
- User story 8 (streak extend)
- User story 9 (streak reset)
- User story 10 (longest streak)
- User story 13 (first-pass guard)
