## Parent PRD

`issues/prd.md`

## What to build

Add a "Your Progress" card to the student dashboard that displays the student's current gamification state: streak, total points, current level name, and a progress bar showing how many points remain until the next level.

The dashboard route loader should call `gamificationService.getUserGamification(userId)` and pass the result to the page. If the student has no `userGamification` row yet (new student, no activity), display zeroed defaults gracefully.

The card is private — it is only visible to the logged-in student on their own dashboard.

## Acceptance criteria

- [ ] Dashboard displays the student's current streak (number of consecutive active days)
- [ ] Dashboard displays the student's total points
- [ ] Dashboard displays the student's current level name (e.g., "Practitioner")
- [ ] Dashboard displays a progress bar from current level to next level, with points remaining shown
- [ ] A student with no gamification activity sees the card with zeroed/default values (not an error)
- [ ] A student at the maximum level (Master, 6000+ pts) sees the progress bar in a completed state with no "next level" shown
- [ ] The card is not visible to instructors or admins viewing the dashboard

## Blocked by

- `issues/002-gamification-service.md`

## User stories addressed

- User story 4 (see total points on dashboard)
- User story 5 (see current level on dashboard)
- User story 6 (see progress bar to next level)
- User story 7 (see current streak on dashboard)
- User story 15 (data is private to the student)
- User story 16 (level name displayed)
- User story 17 (points needed to next level shown)
