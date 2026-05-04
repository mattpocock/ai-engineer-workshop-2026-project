import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { QuestionType } from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

vi.mock("~/db", () => ({
  get db() {
    return testDb;
  },
}));

import { computeResult } from "./quizScoringService";

describe("quizScoringService", () => {
  describe("computeResult", () => {
    let quiz: any;
    let question: any;
    let correctOption: any;
    let wrongOption: any;

    beforeEach(() => {
      testDb = createTestDb();
      base = seedBaseData(testDb);

      const mod = testDb
        .insert(schema.modules)
        .values({ courseId: base.course.id, title: "Module 1", position: 1 })
        .returning()
        .get();

      const lesson = testDb
        .insert(schema.lessons)
        .values({ moduleId: mod.id, title: "Lesson 1", position: 1 })
        .returning()
        .get();

      quiz = testDb
        .insert(schema.quizzes)
        .values({ lessonId: lesson.id, title: "Test Quiz", passingScore: 0.7 })
        .returning()
        .get();

      question = testDb
        .insert(schema.quizQuestions)
        .values({
          quizId: quiz.id,
          questionText: "What is 2+2?",
          questionType: QuestionType.MultipleChoice,
          position: 1,
        })
        .returning()
        .get();

      correctOption = testDb
        .insert(schema.quizOptions)
        .values({ questionId: question.id, optionText: "4", isCorrect: true })
        .returning()
        .get();

      wrongOption = testDb
        .insert(schema.quizOptions)
        .values({ questionId: question.id, optionText: "5", isCorrect: false })
        .returning()
        .get();
    });

    it("awards 25 points and creates a pointEvents row when quiz is passed", () => {
      const result = computeResult(base.user.id, quiz.id, {
        [question.id]: correctOption.id,
      });

      expect(result).toBeDefined();
      expect(result!.passed).toBe(true);
      expect(result!.pointsEarned).toBe(25);

      const events = testDb.select().from(schema.pointEvents).all();
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe(schema.PointAction.QuizPass);
      expect(events[0].referenceId).toBe(quiz.id);
      expect(events[0].points).toBe(25);

      const stats = testDb.select().from(schema.userStats).all();
      expect(stats[0].totalPoints).toBe(25);
    });

    it("does not award points a second time when same quiz is passed again", () => {
      computeResult(base.user.id, quiz.id, { [question.id]: correctOption.id });
      const secondResult = computeResult(base.user.id, quiz.id, {
        [question.id]: correctOption.id,
      });

      expect(secondResult!.pointsEarned).toBe(0);

      const events = testDb.select().from(schema.pointEvents).all();
      expect(events).toHaveLength(1);

      const stats = testDb.select().from(schema.userStats).all();
      expect(stats[0].totalPoints).toBe(25);
    });

    it("does not award points and returns pointsEarned: 0 when quiz is failed", () => {
      const result = computeResult(base.user.id, quiz.id, {
        [question.id]: wrongOption.id,
      });

      expect(result).toBeDefined();
      expect(result!.passed).toBe(false);
      expect(result!.pointsEarned).toBe(0);

      const events = testDb.select().from(schema.pointEvents).all();
      expect(events).toHaveLength(0);
    });
  });
});
