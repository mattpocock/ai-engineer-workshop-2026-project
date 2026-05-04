## Parent PRD

`issues/prd.md`

## What to build

Add daily streak tracking to the gamification system. A student's streak increments each calendar day they complete a lesson or pass a quiz. If they miss a day the streak resets to zero. Streak day boundaries are calculated in the student's local timezone. The dashboard shows their current streak alongside points and level.

Specifically:
- Add `timezone` column to the `users` table
- Add `currentStreak`, `longestStreak`, and `lastActivityDate` columns to `userStats`
- Build `streakService` with `updateStreak(userId, timezone, now)` — determines whether to increment, hold, or reset based on `lastActivityDate` relative to today in the user's timezone
- Call `streakService` from within `gamificationService.awardPoints()` so every point-earning action also updates the streak
- Add a timezone picker to the settings page so students can set their local timezone
- Update the dashboard stats bar to show current streak
- Unit tests for `streakService`: increment on new day, no double-increment same day, reset after missed day, timezone boundary correctness

## Acceptance criteria

- [ ] Completing a lesson or passing a quiz on a new calendar day increments `currentStreak`
- [ ] Two point-earning actions on the same calendar day do not double-increment the streak
- [ ] Missing a calendar day resets `currentStreak` to 1 (the current day's activity)
- [ ] `longestStreak` is updated whenever `currentStreak` exceeds it
- [ ] Streak day boundaries respect the user's `timezone` setting, not UTC
- [ ] The settings page has a timezone picker that saves to `users.timezone`
- [ ] The dashboard displays the student's current streak
- [ ] Unit tests pass for `streakService` covering all of the above behaviours including timezone edge cases

## Blocked by

- Blocked by `issues/001-tracer-bullet-lesson-points-dashboard.md`

## User stories addressed

- User story 7: see current streak on dashboard
- User story 8: streak reflects local calendar day
- User story 14: streak resets to zero on a missed day
- User story 17: gamification does not interfere with learning flow
- User story 18: longest streak is recorded
