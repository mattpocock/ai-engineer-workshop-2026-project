## Parent PRD

`issues/prd.md`

## What to build

Wire the gamification service into the quiz submission flow so that passing a quiz for the first time awards 25 points and updates the student's streak. The first-pass guard must check whether the student has any prior passing `quizAttempt` for this quiz before awarding. The route action should return points earned and current streak in its response so the UI can display a toast.

Gamification failure must not block quiz submission — if the points call fails, the attempt is still recorded and scored.

## Acceptance criteria

- [ ] Passing a quiz for the first time increments the student's `totalPoints` by 25
- [ ] Passing a quiz for the first time updates the student's streak
- [ ] Retaking and passing a quiz that was already passed does not award points again
- [ ] Failing a quiz does not award any points
- [ ] The route action response includes `{ pointsAwarded: 25, currentStreak: N }` when points are awarded, and `{ pointsAwarded: 0 }` when not (retake or fail)
- [ ] If `awardPoints` throws, the quiz attempt is still recorded

## Blocked by

- `issues/002-gamification-service.md`

## User stories addressed

- User story 2 (earn points for passing a quiz)
- User story 12 (toast after quiz pass)
- User story 13 (first pass only)
