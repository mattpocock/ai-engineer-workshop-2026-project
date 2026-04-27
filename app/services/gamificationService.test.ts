import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";

let testDb: ReturnType<typeof createTestDb>;
let base: ReturnType<typeof seedBaseData>;

beforeEach(() => {
  testDb = createTestDb();
  base = seedBaseData(testDb);
});

describe("userGamification schema", () => {
  it("can insert and retrieve a row", () => {
    const row = testDb
      .insert(schema.userGamification)
      .values({ userId: base.user.id })
      .returning()
      .get();

    expect(row.userId).toBe(base.user.id);
    expect(row.id).toBeDefined();
  });

  it("applies correct default values", () => {
    const row = testDb
      .insert(schema.userGamification)
      .values({ userId: base.user.id })
      .returning()
      .get();

    expect(row.totalPoints).toBe(0);
    expect(row.currentLevel).toBe(1);
    expect(row.currentStreak).toBe(0);
    expect(row.longestStreak).toBe(0);
    expect(row.lastActivityDate).toBeNull();
  });

  it("rejects a second row for the same user", () => {
    testDb
      .insert(schema.userGamification)
      .values({ userId: base.user.id })
      .run();

    expect(() =>
      testDb
        .insert(schema.userGamification)
        .values({ userId: base.user.id })
        .run()
    ).toThrow();
  });

  it("rejects a row referencing a nonexistent user", () => {
    expect(() =>
      testDb
        .insert(schema.userGamification)
        .values({ userId: 99999 })
        .run()
    ).toThrow();
  });
});
