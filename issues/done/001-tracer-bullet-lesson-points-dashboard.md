## Parent PRD

`issues/prd.md`

## What to build

The thinnest vertical slice through all layers of the gamification system. A student completes a lesson, earns 10 points, and immediately sees their updated points total and level name on the dashboard. This proves the full architecture (schema → service → wiring → UI) works end-to-end before adding further mechanics.

Specifically:
- Add `pointEvents` and `userStats` tables to the schema (points and level columns only — no streak yet)
- Build `gamificationService` with a single `awardPoints(userId, action, referenceId)` entry point that handles deduplication, level computation, and `userStats` update in one transaction
- Wire `progressService` to call `gamificationService.awardPoints()` when a lesson is marked completed
- Add a stats bar to the dashboard showing the student's current level name and total points
- Unit tests for `gamificationService`: point awarding, deduplication (same lesson can't earn points twice), and level advancement

Point values and level thresholds are defined in the PRD implementation decisions section.

## Acceptance criteria

- [ ] Completing a lesson creates a row in `pointEvents` and updates `userStats.totalPoints`
- [ ] Completing the same lesson a second time does not create a second `pointEvents` row
- [ ] `userStats.currentLevel` advances when `totalPoints` crosses a threshold
- [ ] The dashboard displays the student's level name (e.g. "Learner") and total points
- [ ] Unit tests pass for `gamificationService` covering the above behaviours

## Blocked by

None — can start immediately.

## User stories addressed

- User story 1: earn points for completing a lesson
- User story 4: see total points on dashboard
- User story 5: see current level on dashboard
- User story 6: see points required for next level
- User story 12: points awarded once per lesson per user
- User story 15: progress is private to each student
- User story 20: points system is auditable
