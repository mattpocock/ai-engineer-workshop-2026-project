import { eq } from "drizzle-orm";
import { db } from "~/db";
import { lessonProgress, quizAttempts, LessonProgressStatus, PointAction } from "~/db/schema";
import { awardPoints } from "~/services/gamificationService";

export function backfillGamification(): {
  lessonsAwarded: number;
  quizzesAwarded: number;
} {
  const completedLessons = db
    .select({ userId: lessonProgress.userId, lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(eq(lessonProgress.status, LessonProgressStatus.Completed))
    .all();

  let lessonsAwarded = 0;
  for (const { userId, lessonId } of completedLessons) {
    if (awardPoints(userId, PointAction.LessonComplete, lessonId) > 0) {
      lessonsAwarded++;
    }
  }

  const passedAttempts = db
    .select({ userId: quizAttempts.userId, quizId: quizAttempts.quizId })
    .from(quizAttempts)
    .where(eq(quizAttempts.passed, true))
    .all();

  let quizzesAwarded = 0;
  for (const { userId, quizId } of passedAttempts) {
    if (awardPoints(userId, PointAction.QuizPass, quizId) > 0) {
      quizzesAwarded++;
    }
  }

  return { lessonsAwarded, quizzesAwarded };
}
