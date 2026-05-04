import { backfillGamification } from "~/services/backfillService";

const result = backfillGamification();

console.log("Gamification backfill complete:");
console.log(`  Lessons awarded: ${result.lessonsAwarded}`);
console.log(`  Quizzes awarded: ${result.quizzesAwarded}`);
