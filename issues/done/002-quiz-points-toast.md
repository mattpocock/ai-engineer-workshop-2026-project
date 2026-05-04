## Parent PRD

`issues/prd.md`

## What to build

Wire quiz passing into the gamification system and surface point rewards to students in the moment they earn them. A student passes a quiz, earns 25 points, and sees a toast notification ("+ 25 pts") immediately. A student who completes a lesson also sees a toast ("+ 10 pts"). Both toasts fire at the moment of the action, not on page load.

Specifically:
- Wire `quizScoringService` to call `gamificationService.awardPoints()` when a quiz attempt is recorded as passed
- Deduplication: points awarded for the first pass only — retaking and passing again earns nothing
- Update the lesson route and quiz submission flow to return earned points in the action response
- Render a toast notification in the UI when points are earned (lesson completion and quiz pass)

## Acceptance criteria

- [ ] Passing a quiz creates a row in `pointEvents` and updates `userStats.totalPoints`
- [ ] Passing the same quiz a second time does not create a second `pointEvents` row
- [ ] A toast notification appears after completing a lesson showing the points earned
- [ ] A toast notification appears after passing a quiz showing the points earned
- [ ] No toast appears when a quiz is failed (no points awarded)
- [ ] No toast appears when a lesson is revisited and points were already awarded

## Blocked by

- Blocked by `issues/001-tracer-bullet-lesson-points-dashboard.md`

## User stories addressed

- User story 2: earn points for passing a quiz
- User story 9: see a points notification after completing a lesson
- User story 10: see a points notification after passing a quiz
- User story 13: quiz points awarded once per quiz per user
