## Parent PRD

`issues/prd.md`

## What to build

Award a 100-point bonus when a student completes an entire course. This fires when `enrollments.completedAt` is set, which already happens in the existing progress tracking flow. Points are awarded once per course per student.

Specifically:
- Identify where in the codebase `enrollments.completedAt` is written and call `gamificationService.awardPoints()` at that point with action `course_complete` and the `courseId` as the reference
- Deduplication via `pointEvents` prevents the bonus being awarded more than once per course per student
- No new UI required — the dashboard stats bar already reflects updated `totalPoints` and `currentLevel`

## Acceptance criteria

- [ ] Finishing the final lesson of a course creates a `pointEvents` row for `course_complete` and adds 100pts to `userStats.totalPoints`
- [ ] Completing a course a second time (if re-enrollment is possible) does not award points again
- [ ] A course completion can trigger a level advancement if it pushes the student over a threshold

## Blocked by

- Blocked by `issues/001-tracer-bullet-lesson-points-dashboard.md`

## User stories addressed

- User story 3: earn a bonus for completing a full course
- User story 13: course completion points awarded once per course per user
