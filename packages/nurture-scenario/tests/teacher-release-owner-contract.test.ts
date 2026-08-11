import { describe, expect, it } from "vitest";
import {
  computeTeacherReleaseOwnerContractDigest,
  TEACHER_RELEASE_OWNER_CONFIRM_PATH,
  TEACHER_RELEASE_OWNER_INTERFACE,
  TEACHER_RELEASE_OWNER_PREPARE_PATH,
  TEACHER_RELEASE_OWNER_QUERY_PATH,
  TEACHER_RELEASE_OWNER_TARGETS_PATH,
} from "../src/teacher-release-owner-contract.js";

describe("teacher release owner contract", () => {
  it("pins the canonical descriptor and four v3 private operations", () => {
    expect(computeTeacherReleaseOwnerContractDigest()).toBe(
      TEACHER_RELEASE_OWNER_INTERFACE.digest,
    );
    expect([
      TEACHER_RELEASE_OWNER_QUERY_PATH,
      TEACHER_RELEASE_OWNER_TARGETS_PATH,
      TEACHER_RELEASE_OWNER_PREPARE_PATH,
      TEACHER_RELEASE_OWNER_CONFIRM_PATH,
    ]).toEqual([
      "/internal/nurture/teacher-release-owner/v3/query",
      "/internal/nurture/teacher-release-owner/v3/targets",
      "/internal/nurture/teacher-release-owner/v3/prepare",
      "/internal/nurture/teacher-release-owner/v3/confirm",
    ]);
  });
});
