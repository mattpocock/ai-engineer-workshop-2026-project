import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import {
  awardPoints,
  getUserStats,
  getLevelName,
  getNextLevelPoints,
} from "./gamificationService";

describe("gamificationService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  describe("awardPoints", () => {
    it("creates a pointEvents row and sets userStats.totalPoints", () => {
      const pointsAwarded = awardPoints(
        base.user.id,
        schema.PointAction.LessonComplete,
        1
      );

      expect(pointsAwarded).toBe(10);

      const allEvents = testDb.select().from(schema.pointEvents).all();
      expect(allEvents).toHaveLength(1);
      expect(allEvents[0].userId).toBe(base.user.id);
      expect(allEvents[0].action).toBe(schema.PointAction.LessonComplete);
      expect(allEvents[0].referenceId).toBe(1);
      expect(allEvents[0].points).toBe(10);

      const stats = getUserStats(base.user.id);
      expect(stats).toBeDefined();
      expect(stats!.totalPoints).toBe(10);
      expect(stats!.currentLevel).toBe(1);
    });

    it("does not create a second pointEvents row when called twice with same args (deduplication)", () => {
      awardPoints(base.user.id, schema.PointAction.LessonComplete, 1);
      const secondResult = awardPoints(
        base.user.id,
        schema.PointAction.LessonComplete,
        1
      );

      expect(secondResult).toBe(0);

      const allEvents = testDb.select().from(schema.pointEvents).all();
      expect(allEvents).toHaveLength(1);

      const stats = getUserStats(base.user.id);
      expect(stats!.totalPoints).toBe(10);
    });

    it("different referenceIds for same action create separate events", () => {
      awardPoints(base.user.id, schema.PointAction.LessonComplete, 1);
      awardPoints(base.user.id, schema.PointAction.LessonComplete, 2);

      const allEvents = testDb.select().from(schema.pointEvents).all();
      expect(allEvents).toHaveLength(2);

      const stats = getUserStats(base.user.id);
      expect(stats!.totalPoints).toBe(20);
    });

    it("totalPoints correctly reflects the sum of all events", () => {
      awardPoints(base.user.id, schema.PointAction.LessonComplete, 1); // 10
      awardPoints(base.user.id, schema.PointAction.QuizPass, 100); // 25
      awardPoints(base.user.id, schema.PointAction.CourseComplete, 1); // 100

      const stats = getUserStats(base.user.id);
      expect(stats!.totalPoints).toBe(135);
    });

    it("advances currentLevel when totalPoints crosses a threshold", () => {
      // Need 100pts to reach Learner (level 2). Each lesson = 10pts, so 10 lessons.
      for (let i = 1; i <= 10; i++) {
        awardPoints(base.user.id, schema.PointAction.LessonComplete, i);
      }

      const stats = getUserStats(base.user.id);
      expect(stats!.totalPoints).toBe(100);
      expect(stats!.currentLevel).toBe(2);
    });

    it("level does not regress (stays at highest reached)", () => {
      // Get to level 2
      for (let i = 1; i <= 10; i++) {
        awardPoints(base.user.id, schema.PointAction.LessonComplete, i);
      }

      const statsBefore = getUserStats(base.user.id);
      expect(statsBefore!.currentLevel).toBe(2);

      // Award one more lesson (still level 2, not enough for level 3)
      awardPoints(base.user.id, schema.PointAction.LessonComplete, 11);

      const statsAfter = getUserStats(base.user.id);
      expect(statsAfter!.currentLevel).toBe(2);
      expect(statsAfter!.totalPoints).toBe(110);
    });
  });

  describe("getLevelName", () => {
    it("returns correct names for all levels", () => {
      expect(getLevelName(1)).toBe("Beginner");
      expect(getLevelName(2)).toBe("Learner");
      expect(getLevelName(3)).toBe("Practitioner");
      expect(getLevelName(4)).toBe("Advanced");
      expect(getLevelName(5)).toBe("Expert");
    });
  });

  describe("getNextLevelPoints", () => {
    it("returns the points required for the next level", () => {
      expect(getNextLevelPoints(1)).toBe(100);
      expect(getNextLevelPoints(2)).toBe(500);
      expect(getNextLevelPoints(3)).toBe(1500);
      expect(getNextLevelPoints(4)).toBe(4000);
    });

    it("returns null when already at max level", () => {
      expect(getNextLevelPoints(5)).toBeNull();
    });
  });
});
