## Parent PRD

`issues/prd.md`

## What to build

Display a transient toast notification on the lesson page after a student completes a lesson or passes a quiz. The toast should show the points just earned and the student's current streak, e.g. `"+10 points · 3-day streak"`.

The toast is triggered by data in the route action response — not a client-side polling mechanism. The action responses from `issues/004-lesson-completion-awards-points.md` and `issues/005-quiz-firstpass-awards-points.md` already return `{ pointsAwarded, currentStreak }`. The UI layer reads this and renders the toast.

The toast should be transient (auto-dismiss after a few seconds). No toast is shown if `pointsAwarded` is 0 (e.g., quiz retake that was already passed).

## Acceptance criteria

- [ ] Completing a lesson shows a toast with the correct points and streak, e.g. "+10 points · 3-day streak"
- [ ] Passing a quiz for the first time shows a toast with "+25 points · N-day streak"
- [ ] Retaking a quiz that was already passed does not show a points toast
- [ ] The toast auto-dismisses after a short duration
- [ ] The toast does not block navigation to the next lesson
- [ ] If points data is absent from the action response (gamification failed silently), no toast is shown

## Blocked by

- `issues/004-lesson-completion-awards-points.md`
- `issues/005-quiz-firstpass-awards-points.md`

## User stories addressed

- User story 11 (toast after lesson complete)
- User story 12 (toast after quiz pass)
