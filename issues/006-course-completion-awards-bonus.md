## Parent PRD

`issues/prd.md`

## What to build

Wire the gamification service into the course completion flow so that marking an enrollment complete awards a 100-point bonus and updates the student's streak. The handler for `markEnrollmentComplete` should call `gamificationService.awardPoints` after the enrollment is marked complete. Guard against re-awarding if `enrollments.completedAt` is already set.

Gamification failure must not block course completion.

## Acceptance criteria

- [ ] Completing a course increments the student's `totalPoints` by 100
- [ ] Completing a course updates the student's streak
- [ ] Calling the completion endpoint a second time (enrollment already has `completedAt`) does not award the bonus again
- [ ] If `awardPoints` throws, the enrollment is still marked complete
- [ ] `currentLevel` is recalculated and updated after the bonus is applied

## Blocked by

- `issues/002-gamification-service.md`

## User stories addressed

- User story 3 (earn bonus for completing a course)
- User story 18 (bonus points visible immediately)
