import { eq, and, sum } from "drizzle-orm";
import { db } from "~/db";
import { pointEvents, userStats, users, PointAction } from "~/db/schema";
import { updateStreak } from "~/services/streakService";

const POINT_VALUES: Record<PointAction, number> = {
  [PointAction.LessonComplete]: 10,
  [PointAction.QuizPass]: 25,
  [PointAction.CourseComplete]: 100,
};

const LEVEL_THRESHOLDS = [
  { level: 5, name: "Expert", minPoints: 4000 },
  { level: 4, name: "Advanced", minPoints: 1500 },
  { level: 3, name: "Practitioner", minPoints: 500 },
  { level: 2, name: "Learner", minPoints: 100 },
  { level: 1, name: "Beginner", minPoints: 0 },
] as const;

function computeLevel(totalPoints: number): number {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.minPoints) {
      return threshold.level;
    }
  }
  return 1;
}

export function getLevelName(level: number): string {
  return LEVEL_THRESHOLDS.find((t) => t.level === level)?.name ?? "Beginner";
}

export function getNextLevelPoints(level: number): number | null {
  const next = LEVEL_THRESHOLDS.slice()
    .reverse()
    .find((t) => t.level === level + 1);
  return next?.minPoints ?? null;
}

export function getUserStats(userId: number) {
  return db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .get();
}

export function awardPoints(
  userId: number,
  action: PointAction,
  referenceId: number
): number {
  const points = db.transaction((tx) => {
    const existing = tx
      .select()
      .from(pointEvents)
      .where(
        and(
          eq(pointEvents.userId, userId),
          eq(pointEvents.action, action),
          eq(pointEvents.referenceId, referenceId)
        )
      )
      .get();

    if (existing) return 0;

    const pts = POINT_VALUES[action];

    tx.insert(pointEvents).values({ userId, action, referenceId, points: pts }).run();

    const totalResult = tx
      .select({ total: sum(pointEvents.points) })
      .from(pointEvents)
      .where(eq(pointEvents.userId, userId))
      .get();

    const totalPoints = Number(totalResult?.total ?? 0);
    const currentLevel = computeLevel(totalPoints);

    const stats = tx
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .get();

    if (stats) {
      tx
        .update(userStats)
        .set({ totalPoints, currentLevel })
        .where(eq(userStats.id, stats.id))
        .run();
    } else {
      tx
        .insert(userStats)
        .values({ userId, totalPoints, currentLevel })
        .run();
    }

    return pts;
  });

  if (points > 0) {
    const user = db
      .select({ timezone: users.timezone })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    updateStreak(userId, user?.timezone ?? "UTC", new Date());
  }

  return points;
}
