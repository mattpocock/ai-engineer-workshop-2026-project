## Parent PRD

`issues/prd.md`

## What to build

Write a one-time migration (or seeded script) that populates `userGamification` rows for all existing students based on their historical activity. This ensures students who completed work before the gamification system launched receive credit.

Backfill rules (from the PRD):
- Each completed lesson in `lessonProgress` awards 10 pts
- Each quiz in `quizAttempts` that was passed, counting only the earliest passing attempt per (userId, quizId) pair, awards 25 pts
- Each completed enrollment in `enrollments` (where `completedAt` is not null) awards 100 pts
- Streaks are NOT backfilled — all users start with streak = 0 and `lastActivityDate` = null

The migration must be idempotent: re-running it must not double-award points. Use upsert logic or check for existing rows before inserting.

## Acceptance criteria

- [ ] All users with existing completed lessons have totalPoints reflecting 10 pts per completed lesson
- [ ] All users with existing passed quizzes have totalPoints reflecting 25 pts for each quiz they passed (first pass only)
- [ ] All users with completed enrollments have totalPoints reflecting the 100 pt bonus per completed course
- [ ] `currentLevel` is computed correctly from the backfilled totalPoints for each user
- [ ] `currentStreak` and `longestStreak` are 0 for all users after backfill
- [ ] `lastActivityDate` is null for all users after backfill
- [ ] Running the migration twice produces the same result as running it once

## Blocked by

- `issues/001-gamification-schema-migration.md`
- `issues/002-gamification-service.md`

## User stories addressed

- User story 14 (existing students get credit for past work)
