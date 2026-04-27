# PRD: Gamification System for Cadence

## Problem Statement

Students on the Cadence platform sign up, complete a few lessons, then drop off. There is no visible sense of accumulating progress — completing a lesson produces only a checkbox, and there is no milestone to aim for beyond finishing a course. Students who complete quizzes receive no additional incentive over those who skip them. As one student put it: "I finished 40 lessons and I have nothing to show for it." This lack of visible momentum is contributing to poor retention.

## Solution

Introduce a private, per-student gamification layer that makes progress feel tangible and rewarding. Students will earn points for completing lessons, passing quizzes, and finishing courses. Points unlock named levels (Beginner through Master) that reflect professional growth. A daily streak tracks consistent engagement and reinforces the habit of showing up every day. Progress is surfaced on the student dashboard and acknowledged with a brief notification after each earning event. There are no leaderboards or competitive elements — the system is entirely private to each student.

## User Stories

1. As a student, I want to earn points when I complete a lesson, so that each lesson I finish feels like measurable progress toward a goal.
2. As a student, I want to earn points when I pass a quiz, so that I have a concrete incentive to attempt quizzes rather than skipping them.
3. As a student, I want to earn a bonus when I complete an entire course, so that finishing a course feels like a significant milestone on top of individual lesson completions.
4. As a student, I want to see my total points on my dashboard, so that I can see how much I have accumulated over time.
5. As a student, I want to see my current level on my dashboard, so that I know where I stand and have a named rank to identify with.
6. As a student, I want to see a progress bar showing how many points I need to reach the next level, so that I know how close I am to the next milestone.
7. As a student, I want to see my current streak on my dashboard, so that I can see how many consecutive days I have been active.
8. As a student, I want my streak to increase when I earn any points on a given day, so that consistent daily engagement is rewarded.
9. As a student, I want my streak to reset to zero if I miss a full calendar day without any activity, so that the streak accurately reflects continuous engagement.
10. As a student, I want my longest-ever streak to be recorded separately from my current streak, so that I can see my personal best even after a streak breaks.
11. As a student, I want to see a toast notification immediately after completing a lesson that shows me the points I just earned and my current streak, so that the reward is immediate and reinforcing.
12. As a student, I want to see a toast notification immediately after passing a quiz that shows me the points I just earned and my current streak, so that quiz success feels rewarding.
13. As a student, I want my quiz points to be awarded only on the first time I pass a quiz, so that the system rewards genuine learning rather than farming points through repetition.
14. As a student, I want my existing completed lessons and passed quizzes to be credited when the system launches, so that I am not penalized for work I already did before this feature existed.
15. As a student, I want my gamification data to be entirely private to me, so that I am not compared to or judged against other students.
16. As a student, I want to see my level name (e.g., "Practitioner") rather than just a number, so that the milestone feels meaningful and professional.
17. As a student, I want the progress bar to show the exact points needed to reach the next level, so that I can plan how many more lessons or quizzes I need to complete.
18. As a student who completes a course and earns a bonus, I want to see the bonus points reflected immediately in my total, so that the reward is visible right away.

## Implementation Decisions

### Modules

**Gamification Service (`gamificationService`)**
A new, deep service module encapsulating all gamification business logic. It is the single place responsible for awarding points, updating streaks, computing levels, and reading gamification state. No other module should read or write gamification data directly.

Responsibilities:
- Award points for a given event type (lesson complete, quiz first-pass, course complete), idempotently guarded against double-awarding
- Compute the current level from a total points value (pure function, no I/O)
- Update streak: given a userId and the current UTC date, extend or reset the streak, and update longestStreak if current exceeds it
- Read a user's full gamification summary (points, level, streak, longest streak, next level threshold)
- Backfill a user's points from existing lesson progress and quiz attempt records

**Gamification Schema (new database table)**

A new `userGamification` table with the following columns:
- `id` — primary key
- `userId` — foreign key to users, unique (one row per student)
- `totalPoints` — integer, default 0
- `currentLevel` — integer 1–7, default 1
- `currentStreak` — integer, default 0
- `longestStreak` — integer, default 0
- `lastActivityDate` — date string (YYYY-MM-DD UTC), nullable

A database migration will create this table and backfill existing data: lesson completions award 10 pts each, first-pass quiz passes award 25 pts each, course completions award 100 pts each. Streaks are not backfilled and start at 0 for all users.

**Level Configuration**

A static data structure (not a database table) mapping levels to names and point thresholds:

| Level | Name | Min Points |
|---|---|---|
| 1 | Beginner | 0 |
| 2 | Apprentice | 100 |
| 3 | Practitioner | 300 |
| 4 | Proficient | 700 |
| 5 | Advanced | 1,500 |
| 6 | Expert | 3,000 |
| 7 | Master | 6,000 |

**Integration with Existing Services**

The following existing code paths must be extended to call `gamificationService` after their primary action:

- `markLessonComplete` in progressService → award 10 pts, update streak
- Quiz submission handler → if this is the user's first passing attempt for this quiz, award 25 pts, update streak
- `markEnrollmentComplete` → award 100 pt bonus, update streak

These calls should happen within the same transaction as the primary action where possible, to avoid points being awarded without the underlying record being committed.

**Dashboard UI**

A new "Your Progress" card on the student dashboard displaying:
- Current streak (with a visual indicator)
- Total points
- Current level name
- Progress bar from current level to next, showing points earned toward next threshold

**Toast Notification**

A transient notification displayed after a points-earning event on lesson and quiz pages. Format: `"+{N} points · {streak}-day streak"`. Triggered by data returned from the route action (not a client-side timer).

### Streak Logic

- Activity date is always computed in UTC
- A streak extends when the activity date equals `lastActivityDate + 1 day`
- A streak resets to 1 when the activity date is more than 1 day after `lastActivityDate`
- A streak remains unchanged when the activity date equals `lastActivityDate` (already active today)
- On first ever activity, streak is set to 1 and `lastActivityDate` is set to today

### Points Idempotency

- Quiz points: before awarding, query `quizAttempts` for any prior passing attempt by the same user for the same quiz. Award only if none exists (excluding the current attempt).
- Lesson points: the `markLessonComplete` path already guards against re-completion; award points once when status transitions to `completed`.
- Course bonus: award when `markEnrollmentComplete` is called; if `enrollments.completedAt` is already set, do not re-award.

## Testing Decisions

**What makes a good test:** Tests should verify the observable behavior of a module through its public interface — inputs in, outputs and side effects out. Tests should not assert on internal implementation details (e.g., which SQL query was used), only on the resulting state or return values. Use the existing service test pattern in the codebase (Vitest, real SQLite in-memory or test database).

**Modules to test:**

- `gamificationService` — highest priority; all business logic lives here. Test cases should cover:
  - Awarding points for each event type and verifying totalPoints and currentLevel update correctly
  - Level boundary conditions (e.g., exactly 100 pts = Apprentice, 99 pts = Beginner)
  - Streak extension (activity on consecutive days)
  - Streak reset (gap of 2+ days)
  - Streak same-day idempotency (two events same day don't double the streak)
  - First-ever activity sets streak to 1
  - Quiz points awarded only on first pass, not on subsequent passes
  - `calculateLevel` pure function across all threshold boundaries
  - Backfill function produces correct totals for a user with existing records

- Level configuration — the `calculateLevel` pure function should be unit tested exhaustively across all boundary values.

**Prior art:** Existing service tests (progressService, courseService) use Vitest with a real SQLite test database seeded per test. Follow the same pattern.

## Out of Scope

- Video watch events do not earn points
- No streak freeze or grace period mechanic
- No per-user timezone support — all dates computed in UTC
- No leaderboards, rankings, or any comparison between students
- No dedicated gamification profile page (data surfaces on existing dashboard only)
- No badges or achievements beyond levels
- No instructor-facing gamification analytics
- No push notifications or email alerts for level-ups or streak milestones
- No point decay or expiry

## Further Notes

- The backfill migration must be idempotent — re-running it should not double-award points. Use an upsert or check for existing rows before inserting.
- Streak data cannot be reliably reconstructed from historical records (we don't have per-day activity logs at a granular enough level), so all users launch with streak = 0. This is a known and accepted limitation.
- If the gamification service call fails after a lesson is marked complete, the lesson completion should still persist — gamification is additive and should not block core functionality. Consider whether to fail silently or surface an error, but do not roll back the lesson completion.
- The system is private by design per the client's explicit request. Do not add any sharing or export functionality without a separate product decision.
