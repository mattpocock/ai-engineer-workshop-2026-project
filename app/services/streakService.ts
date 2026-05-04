import { eq } from "drizzle-orm";
import { db } from "~/db";
import { userStats } from "~/db/schema";

function toLocalDateString(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function isYesterday(dateStr: string, todayStr: string): boolean {
  const date = new Date(dateStr + "T12:00:00Z");
  const today = new Date(todayStr + "T12:00:00Z");
  const diffDays = Math.round(
    (today.getTime() - date.getTime()) / 86400000
  );
  return diffDays === 1;
}

export function updateStreak(
  userId: number,
  timezone: string,
  now: Date
): void {
  const today = toLocalDateString(now, timezone);

  const stats = db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .get();

  if (!stats) return;

  if (stats.lastActivityDate === today) return;

  let newStreak: number;
  if (
    !stats.lastActivityDate ||
    !isYesterday(stats.lastActivityDate, today)
  ) {
    newStreak = 1;
  } else {
    newStreak = (stats.currentStreak ?? 0) + 1;
  }

  const newLongest = Math.max(stats.longestStreak ?? 0, newStreak);

  db.update(userStats)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
    })
    .where(eq(userStats.userId, userId))
    .run();
}
