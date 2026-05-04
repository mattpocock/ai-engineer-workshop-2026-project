## Parent PRD

`issues/prd.md`

## What to build

A one-time migration script that awards points for all historical activity so that existing students open the app post-launch already seeing their earned points and level rather than starting at zero.

The script iterates all existing `lessonProgress` rows with `status = completed` and all `quizAttempts` rows with `passed = true`, inserting corresponding `pointEvents` rows and recomputing `userStats` for every affected user. It must be idempotent — safe to run multiple times without double-awarding points (deduplication logic in `gamificationService` handles this automatically).

The script is run once at deploy time, before the app is restarted with the new gamification code.

## Acceptance criteria

- [ ] After running the script, every student with prior lesson completions has a non-zero `totalPoints` in `userStats`
- [ ] After running the script, every student with prior quiz passes has their quiz points reflected
- [ ] Running the script a second time does not change any point totals (idempotent)
- [ ] Students whose historical activity would push them above a level threshold have the correct `currentLevel` after the script runs
- [ ] The script completes without errors on the existing dataset

## Blocked by

- Blocked by `issues/001-tracer-bullet-lesson-points-dashboard.md`
- Blocked by `issues/002-quiz-points-toast.md`

## User stories addressed

- User story 11: prior completed lessons are recognised when gamification launches
