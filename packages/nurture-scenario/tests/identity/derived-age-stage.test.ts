import { describe, expect, it } from "vitest";
import { parseNurtureDerivedAgeStage } from "../../src/domain/identity/derived-age-stage.js";

const now = new Date("2026-07-28T13:00:00.000Z");

describe("parseNurtureDerivedAgeStage", () => {
  it("accepts the approved expiring derived result", () => {
    expect(
      parseNurtureDerivedAgeStage(
        {
          age_band_key: "toddler",
          stage_key: "nurture_24_36_months",
          as_of_date: "2026-07-28",
          source_version: 4,
          expires_at: "2026-07-29T13:00:00.000Z",
        },
        now,
      ),
    ).toMatchObject({
      ageBandKey: "toddler",
      stageKey: "nurture_24_36_months",
      asOfDate: "2026-07-28",
      sourceVersion: 4,
    });
  });

  it.each(["birth_date", "exact_age"])(
    "rejects the forbidden %s side channel",
    (field) => {
      expect(() =>
        parseNurtureDerivedAgeStage(
          {
            age_band_key: "toddler",
            stage_key: "nurture_24_36_months",
            as_of_date: "2026-07-28",
            source_version: 4,
            expires_at: "2026-07-29T13:00:00.000Z",
            [field]: field === "birth_date" ? "2024-01-01" : 2,
          },
          now,
        ),
      ).toThrow(/invalid field set/);
    },
  );

  it("rejects an expired result", () => {
    expect(() =>
      parseNurtureDerivedAgeStage(
        {
          age_band_key: "toddler",
          stage_key: "nurture_24_36_months",
          as_of_date: "2026-07-27",
          source_version: 4,
          expires_at: "2026-07-28T12:59:59.000Z",
        },
        now,
      ),
    ).toThrow(/current canonical UTC ISO timestamp/);
  });

  it("rejects a non-canonical expiry timestamp", () => {
    expect(() =>
      parseNurtureDerivedAgeStage(
        {
          age_band_key: "toddler",
          stage_key: "nurture_24_36_months",
          as_of_date: "2026-07-28",
          source_version: 4,
          expires_at: "2026-07-29",
        },
        now,
      ),
    ).toThrow(/canonical UTC ISO timestamp/);
  });

  it("rejects a future as-of date", () => {
    expect(() =>
      parseNurtureDerivedAgeStage(
        {
          age_band_key: "toddler",
          stage_key: "nurture_24_36_months",
          as_of_date: "2026-07-29",
          source_version: 4,
          expires_at: "2026-07-29T13:00:00.000Z",
        },
        now,
      ),
    ).toThrow(/cannot be in the future/);
  });
});
