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

import { backfillGamification } from "./backfillService";

function seedModule() {
  return testDb
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "M1", position: 1 })
    .returning()
    .get();
}

function seedLesson(moduleId: number, position = 1) {
  return testDb
    .insert(schema.lessons)
    .values({ moduleId, title: "L1", position })
    .returning()
    .get();
}

function seedCompletedLesson(userId: number, lessonId: number) {
  testDb
    .insert(schema.lessonProgress)
    .values({
      userId,
      lessonId,
      status: schema.LessonProgressStatus.Completed,
      completedAt: new Date().toISOString(),
    })
    .run();
}

function seedPassedQuizAttempt(userId: number, quizId: number) {
  testDb
    .insert(schema.quizAttempts)
    .values({ userId, quizId, score: 1.0, passed: true })
    .run();
}

function seedQuiz(lessonId: number) {
  return testDb
    .insert(schema.quizzes)
    .values({ lessonId, title: "Q1", passingScore: 0.7 })
    .returning()
    .get();
}

function getUserStats(userId: number) {
  return testDb
    .select()
    .from(schema.userStats)
    .where(eq(schema.userStats.userId, userId))
    .get();
}

describe("backfillService", () => {
  beforeEach(() => {
    testDb = createTestDb();
    base = seedBaseData(testDb);
  });

  it("awards 10 points for each completed lesson", () => {
    const mod = seedModule();
    const lesson = seedLesson(mod.id);
    seedCompletedLesson(base.user.id, lesson.id);

    const result = backfillGamification();

    expect(result.lessonsAwarded).toBe(1);
    const stats = getUserStats(base.user.id);
    expect(stats!.totalPoints).toBe(10);
  });

  it("awards 25 points for each passed quiz attempt", () => {
    const mod = seedModule();
    const lesson = seedLesson(mod.id);
    const quiz = seedQuiz(lesson.id);
    seedPassedQuizAttempt(base.user.id, quiz.id);

    const result = backfillGamification();

    expect(result.quizzesAwarded).toBe(1);
    const stats = getUserStats(base.user.id);
    expect(stats!.totalPoints).toBe(25);
  });

  it("is idempotent — running twice does not double-award points", () => {
    const mod = seedModule();
    const lesson = seedLesson(mod.id);
    seedCompletedLesson(base.user.id, lesson.id);

    backfillGamification();
    const secondResult = backfillGamification();

    expect(secondResult.lessonsAwarded).toBe(0);
    const stats = getUserStats(base.user.id);
    expect(stats!.totalPoints).toBe(10);
  });

  it("computes correct level after backfill", () => {
    const mod = seedModule();
    // 10 lessons × 10pts = 100pts → Learner (level 2)
    for (let i = 1; i <= 10; i++) {
      const lesson = seedLesson(mod.id, i);
      seedCompletedLesson(base.user.id, lesson.id);
    }

    backfillGamification();

    const stats = getUserStats(base.user.id);
    expect(stats!.totalPoints).toBe(100);
    expect(stats!.currentLevel).toBe(2);
  });
});
