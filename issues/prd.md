# PRD: Gamification System

## Problem Statement

Students sign up for Cadence courses, complete a few lessons, and then drop off. There is no visible sense of accumulating progress beyond a per-lesson completion checkbox. Students who invest significant effort — completing 40+ lessons — have nothing tangible to show for it. Quizzes exist but there is no incentive to take them. The platform lacks the motivational feedback loops that drive long-term retention.

## Solution

Introduce a private, per-student gamification system with three interlocking mechanics:

1. **Points** — students earn points for completing lessons, passing quizzes, and finishing courses. Points accumulate visibly over time and never decrease.
2. **Levels** — five named tiers (Beginner → Expert) that students progress through as points accumulate, providing milestone targets.
3. **Streaks** — a daily consistency counter that increments whenever a student completes a lesson or passes a quiz on a given calendar day. Streaks reset to zero if a day is missed.

All progress is private to each student. There are no leaderboards or competitive elements.

## User Stories

1. As a student, I want to earn points when I complete a lesson, so that my effort accumulates into something visible.
2. As a student, I want to earn points when I pass a quiz, so that I have a concrete incentive to attempt quizzes.
3. As a student, I want to earn a bonus when I finish an entire course, so that completing a course feels like a meaningful achievement.
4. As a student, I want to see my total points on my dashboard, so that I can track my accumulated effort at a glance.
5. As a student, I want to see my current level on my dashboard, so that I have a named milestone to aim for.
6. As a student, I want to see the points required for the next level, so that I know how far away my next milestone is.
7. As a student, I want to see my current streak on my dashboard, so that I am motivated to return each day.
8. As a student, I want my streak to reflect my local calendar day, so that completing a lesson late at night does not unfairly break my streak.
9. As a student, I want to see a notification when I earn points after completing a lesson, so that the reward is immediate and reinforcing.
10. As a student, I want to see a notification when I earn points after passing a quiz, so that the quiz outcome feels rewarding beyond just a grade.
11. As a student, I want my points and level to already reflect the lessons I completed before gamification launched, so that my prior effort is recognised.
12. As a student, I want my points to only be awarded once per lesson regardless of how many times I revisit it, so that the system feels fair.
13. As a student, I want my quiz points to only be awarded once per quiz regardless of how many attempts I make, so that I cannot game the system by retrying.
14. As a student, I want my streak to reset to zero if I miss a day, so that the streak genuinely reflects daily consistency.
15. As a student, I want my progress to be entirely private, so that I am not compared to or judged by other students.
16. As a student, I want to see my level name (e.g. "Practitioner") not just a number, so that the milestone feels meaningful.
17. As a student, I want the gamification system to not interfere with the existing lesson and quiz experience, so that the learning flow remains uninterrupted.
18. As a student, I want my longest streak to be recorded, so that I can reflect on my best period of consistency.
19. As an instructor, I want the gamification system to require no configuration on my part, so that I can focus on course content.
20. As a product owner, I want the points system to be auditable, so that I can diagnose any discrepancies in student stats.

## Implementation Decisions

### Schema Changes

- Add `pointEvents` table: records every point-earning event with userId, action type (lesson_complete / quiz_pass / course_complete), referenceId (lessonId / quizId / courseId), points awarded, and timestamp. This is the source of truth.
- Add `userStats` table: one row per user, storing totalPoints, currentLevel, currentStreak, longestStreak, lastActivityDate. This is a read cache derived from `pointEvents`.
- Add `timezone` column to the `users` table (string, e.g. `"America/New_York"`). Used for streak day boundary calculations.

### Point Values

| Action | Points |
|---|---|
| Lesson completion | 10 |
| Quiz pass | 25 |
| Course completion | 100 |

### Level Thresholds

| Level | Name | Minimum Points |
|---|---|---|
| 1 | Beginner | 0 |
| 2 | Learner | 100 |
| 3 | Practitioner | 500 |
| 4 | Advanced | 1,500 |
| 5 | Expert | 4,000 |

### Modules

**`gamificationService`** — the single entry point for all point-awarding logic. Exposes `awardPoints(userId, action, referenceId)`. Internally: checks `pointEvents` for prior award (deduplication), inserts the new event, recomputes and updates `userStats` (points, level, streak), all within a single SQLite transaction. No caller needs to know about any of this.

**`streakService`** — encapsulates streak calculation logic. Exposes `updateStreak(userId, timezone, now)` and `getCurrentStreak(userId)`. Determines whether today (in the user's timezone) already has activity, whether yesterday had activity (to extend the streak), or whether the streak should reset. Deliberately has no side effects beyond the `userStats` row it writes.

**`progressService` (modified)** — calls `gamificationService.awardPoints()` when a lesson is marked completed.

**`quizScoringService` (modified)** — calls `gamificationService.awardPoints()` when a quiz attempt is recorded as passed.

**Dashboard route (modified)** — reads `userStats` for the current user and renders a stats summary bar: level name, total points, points to next level, current streak.

**Lesson route (modified)** — after a lesson completion or quiz pass action, includes earned points in the response and triggers a toast notification in the UI.

**`scripts/backfill-gamification`** — a one-time script run at deploy time. Iterates all existing `lessonProgress` rows with status `completed` and all `quizAttempts` rows with `passed = true`, inserts corresponding `pointEvents` (respecting deduplication), and computes initial `userStats` for all affected users. Safe to re-run (idempotent via deduplication logic).

### Architectural Decisions

- Stats updates are **synchronous** within the same SQLite transaction as the triggering action. No background jobs or queues.
- `pointEvents` is append-only. Points are never deducted.
- `userStats` can always be fully recomputed from `pointEvents` — it is a cache, not a record of truth.
- Streak day boundaries are computed in the user's local timezone using the `timezone` field. UTC is not used for streak logic.
- Deduplication is enforced by checking `pointEvents` for an existing row matching (userId, action, referenceId) before inserting.

## Testing Decisions

**What makes a good test here:** tests should assert on observable outcomes (was a `pointEvents` row created? did `userStats.totalPoints` increase? did the streak increment?) rather than testing internal steps. Each test should set up minimal DB state, call the service method, and assert on the resulting state.

**`gamificationService` tests:**
- Awarding points creates a `pointEvents` row and updates `userStats`
- Calling `awardPoints` twice with the same (userId, action, referenceId) only creates one `pointEvents` row (deduplication)
- `totalPoints` correctly reflects the sum of all events
- Level advances when points cross a threshold
- Level does not regress

**`streakService` tests:**
- Streak increments when activity occurs on a new calendar day (in the user's timezone)
- Streak does not double-increment if activity occurs twice on the same calendar day
- Streak resets to 1 when activity occurs after a gap of more than one day
- Timezone boundary: activity at 11pm in a UTC-5 timezone is counted as that local calendar day, not the next UTC day
- `longestStreak` is updated when `currentStreak` exceeds it

## Out of Scope

- Leaderboards or any competitive/comparative features
- Streak freeze or grace period mechanics
- Instructor-configurable point values or level thresholds
- Badges or achievement unlocks
- Points for video watch percentage
- Push or email notifications for level-ups or streak milestones
- A dedicated gamification profile page
- Public or shareable progress summaries

## Further Notes

- The 3x retention stat Sarah cited (students who do one lesson per day for a week are 3x more likely to finish) is the primary justification for prioritising streaks. The streak mechanic should be prominently visible on the dashboard.
- Point values are intentionally weighted to make quiz passing (25pts) significantly more rewarding than a lesson completion (10pts), directly responding to Sarah's concern that quizzes have no incentive.
- The backfill script is critical for first-impression quality. Students who open the app post-launch and already see points and a level will respond very differently than students who see zeros.
- All gamification data is scoped per-user. No cross-user queries are needed for any v1 feature.
