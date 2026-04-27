## Parent PRD

`issues/prd.md`

## What to build

Wire the gamification service into the existing lesson completion flow so that marking a lesson complete awards 10 points and updates the student's streak. The route action that handles `intent: mark-complete` should call `gamificationService.awardPoints` after `markLessonComplete` succeeds, and return the points earned and current streak in the action response so the UI can display a toast.

Gamification failure must not block lesson completion — if the points call fails, the lesson is still marked complete and the error is logged but not surfaced to the user.

## Acceptance criteria

- [ ] Completing a lesson increments the student's `totalPoints` by 10 in `userGamification`
- [ ] Completing a lesson updates the student's streak correctly (extend, hold, or reset per UTC date)
- [ ] The route action response includes `{ pointsAwarded: 10, currentStreak: N }` on success
- [ ] If `awardPoints` throws, the lesson completion still succeeds and no error is shown to the user
- [ ] Completing the same lesson twice does not award points a second time

## Blocked by

- `issues/002-gamification-service.md`

## User stories addressed

- User story 1 (earn points for completing a lesson)
- User story 11 (toast after lesson complete)
