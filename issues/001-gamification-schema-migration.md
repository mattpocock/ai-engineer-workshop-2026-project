## Parent PRD

`issues/prd.md`

## What to build

Add a `userGamification` table to the database and write a migration that creates it. This is the foundational data layer for the entire gamification system. Every other slice depends on this table existing.

The table stores one row per student with: total points, current level (1–7), current streak, longest streak, and last activity date (UTC date string, nullable). See the Schema section of the parent PRD for the full column list.

No backfill is included in this slice — that is handled separately in `issues/003-backfill-existing-progress.md`.

## Acceptance criteria

- [ ] A new Drizzle migration creates the `userGamification` table with all columns defined in the PRD schema section
- [ ] `userId` has a unique constraint and a foreign key to `users`
- [ ] `totalPoints`, `currentLevel`, `currentStreak`, `longestStreak` default to 0 (or 1 for level)
- [ ] `lastActivityDate` is nullable
- [ ] Migration runs cleanly on a fresh database and on an existing database with user data
- [ ] TypeScript types are generated/updated to reflect the new table

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1 (foundation for lesson points)
- User story 2 (foundation for quiz points)
- User story 3 (foundation for course bonus)
- User story 13 (foundation for first-pass guard)
- User story 14 (foundation for backfill)
