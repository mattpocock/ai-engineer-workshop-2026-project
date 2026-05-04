import { describe, it, expect, beforeEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import { updateStreak } from "./streakService";

const NOW = new Date("2026-05-04T14:00:00Z"); // 2026-05-04 in UTC / most timezones
const TODAY = "2026-05-04";
const YESTERDAY = "2026-05-03";
const TWO_DAYS_AGO = "2026-05-02";

function seedStats(
  overrides: Partial<typeof schema.userStats.$inferInsert> = {}
) {
  testDb
    .insert(schema.userStats)
    .values({
      userId: base.user.id,
      totalPoints: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      ...overrides,
    })
    .run();
}

function getStats() {
  return testDb
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, base.user.id))
    .get();
}

describe("streakService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("updateStreak", () => {
    it("sets streak to 1 on first activity (no previous lastActivityDate)", () => {
      seedStats({ lastActivityDate: null, currentStreak: 0, longestStreak: 0 });

      updateStreak(base.user.id, "UTC", NOW);

      const stats = getStats();
      expect(stats!.currentStreak).toBe(1);
      expect(stats!.longestStreak).toBe(1);
      expect(stats!.lastActivityDate).toBe(TODAY);
    });

    it("does not change streak when called again on the same day", () => {
      seedStats({
        lastActivityDate: TODAY,
        currentStreak: 1,
        longestStreak: 1,
      });

      updateStreak(base.user.id, "UTC", NOW);

      const stats = getStats();
      expect(stats!.currentStreak).toBe(1);
      expect(stats!.longestStreak).toBe(1);
    });

    it("increments streak on the next calendar day", () => {
      seedStats({
        lastActivityDate: YESTERDAY,
        currentStreak: 1,
        longestStreak: 1,
      });

      updateStreak(base.user.id, "UTC", NOW);

      const stats = getStats();
      expect(stats!.currentStreak).toBe(2);
      expect(stats!.longestStreak).toBe(2);
      expect(stats!.lastActivityDate).toBe(TODAY);
    });

    it("resets streak to 1 after missing a day, preserving longestStreak", () => {
      seedStats({
        lastActivityDate: TWO_DAYS_AGO,
        currentStreak: 5,
        longestStreak: 5,
      });

      updateStreak(base.user.id, "UTC", NOW);

      const stats = getStats();
      expect(stats!.currentStreak).toBe(1);
      expect(stats!.longestStreak).toBe(5); // preserved
      expect(stats!.lastActivityDate).toBe(TODAY);
    });

    it("updates longestStreak when currentStreak exceeds it", () => {
      seedStats({
        lastActivityDate: YESTERDAY,
        currentStreak: 3,
        longestStreak: 3,
      });

      updateStreak(base.user.id, "UTC", NOW);

      const stats = getStats();
      expect(stats!.currentStreak).toBe(4);
      expect(stats!.longestStreak).toBe(4);
    });

    it("uses the user's local timezone for day boundaries", () => {
      // 2am UTC on 2026-05-04 = 10pm on 2026-05-03 in America/New_York (UTC-4 in EDT)
      const lateNightNY = new Date("2026-05-04T02:00:00Z");
      const localDateInNY = "2026-05-03";
      const previousDayInNY = "2026-05-02";

      seedStats({
        lastActivityDate: previousDayInNY,
        currentStreak: 1,
        longestStreak: 1,
      });

      updateStreak(base.user.id, "America/New_York", lateNightNY);

      const stats = getStats();
      // In New York it's still May 3rd, so streak increments from 1 → 2
      expect(stats!.currentStreak).toBe(2);
      expect(stats!.lastActivityDate).toBe(localDateInNY);
    });
  });
});
