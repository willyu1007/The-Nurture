import { describe, expect, it } from "vitest";
import {
  computeDriftHead,
  issueBoardOpaqueRef,
} from "../../src/harness/board-projection.js";
import { issueTargetOptionRef } from "../../src/harness/keyed-refs.js";
import {
  GUARDIAN_ENROLLMENT_ACTIVITY_ORDER,
  QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY,
  queryGuardianEnrollmentActivity,
  type GuardianBoardDependencies,
  type GuardianBoardReadPort,
} from "../../src/harness/guardian-board-queries.js";
import {
  BOARD_CONTRACT,
  BOARD_INTEGRITY_KEY,
  createGuardianReadPort,
  driftHeads,
  guardianActivity,
  guardianAuthority,
} from "./board-fixtures.js";

const scope = { workspace_id: "ws-1", participant_id: "guardian-1" };
const now = () => new Date("2026-08-02T00:00:00.000Z");

const deps = (reads: GuardianBoardReadPort): GuardianBoardDependencies => ({
  contract: BOARD_CONTRACT,
  integrity_key: BOARD_INTEGRITY_KEY,
  reads,
  now,
});

const targetRef = (enrollmentId = "enrollment-1") =>
  issueTargetOptionRef(BOARD_INTEGRITY_KEY, { ...scope, enrollment_id: enrollmentId });

describe("G3-A query_guardian_enrollment_activity", () => {
  it("routes only through an owner-issued Enrollment option ref", async () => {
    const port = createGuardianReadPort({
      activityPages: [{ rows: [guardianActivity()], has_more: false }],
    });
    const ok = await queryGuardianEnrollmentActivity(deps(port), {
      ...scope,
      enrollment_target_ref: targetRef(),
    });
    expect(ok.status).toBe("ok");
    if (ok.status !== "ok") return;
    expect(ok.output.enrollmentRef).toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "enrollment", "enrollment-1"),
    );
    expect(ok.output.binding.order).toBe(GUARDIAN_ENROLLMENT_ACTIVITY_ORDER);
    expect(ok.output.binding.capability).toEqual({
      ...QUERY_GUARDIAN_ENROLLMENT_ACTIVITY_CAPABILITY,
    });
    expect(ok.output.items[0]?.releaseRef).toBe(
      issueBoardOpaqueRef(BOARD_INTEGRITY_KEY, scope, "publication_release", "release-1"),
    );
    expect(JSON.stringify(ok.output)).not.toContain("enrollment-1");
  });

  it("rejects a raw Enrollment identifier, another actor's ref and an unknown target", async () => {
    const port = createGuardianReadPort();
    for (const badRef of [
      "enrollment-1",
      issueTargetOptionRef(BOARD_INTEGRITY_KEY, {
        workspace_id: "ws-1",
        participant_id: "guardian-2",
        enrollment_id: "enrollment-1",
      }),
      targetRef("enrollment-9"),
    ]) {
      await expect(
        queryGuardianEnrollmentActivity(deps(port), {
          ...scope,
          enrollment_target_ref: badRef,
        }),
      ).resolves.toEqual({ status: "denied", reason_code: "target_unavailable" });
    }
    expect(port.activityRequests).toEqual([]);
  });

  it("drops facts the current Grant hides without shortening the page", async () => {
    const port = createGuardianReadPort({
      activityPages: [
        {
          rows: [
            guardianActivity({ activity_id: "a-1" }),
            guardianActivity({
              activity_id: "a-2",
              authority: guardianAuthority({ grant_visible: false }),
            }),
            guardianActivity({ activity_id: "a-3" }),
          ],
          has_more: true,
        },
        { rows: [guardianActivity({ activity_id: "a-4" })], has_more: false },
      ],
    });
    const result = await queryGuardianEnrollmentActivity(deps(port), {
      ...scope,
      enrollment_target_ref: targetRef(),
      page_size: 3,
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.output.items).toHaveLength(3);
    expect(port.activityRequests).toHaveLength(2);
    expect(result.output.pageInfo.hasMore).toBe(false);
  });

  it("continues an unchanged page set and refuses a cursor after drift", async () => {
    const first = await queryGuardianEnrollmentActivity(
      deps(
        createGuardianReadPort({
          activityPages: [
            { rows: [guardianActivity({ activity_id: "a-1" })], has_more: true },
          ],
        }),
      ),
      { ...scope, enrollment_target_ref: targetRef(), page_size: 1 },
    );
    expect(first.status).toBe("ok");
    if (first.status !== "ok") return;
    const cursor = first.output.pageInfo.nextCursor;
    expect(cursor).toBeDefined();

    const continued = await queryGuardianEnrollmentActivity(
      deps(
        createGuardianReadPort({
          activityPages: [
            { rows: [guardianActivity({ activity_id: "a-2" })], has_more: false },
          ],
        }),
      ),
      {
        ...scope,
        enrollment_target_ref: targetRef(),
        page_size: 1,
        cursor: cursor ?? "",
      },
    );
    expect(continued.status).toBe("ok");
    if (continued.status !== "ok") return;
    expect(continued.output.binding.snapshot.snapshotRef).toBe(
      first.output.binding.snapshot.snapshotRef,
    );

    for (const drifted of [
      { drift_heads: driftHeads({ grant_head: "grant-2" }) },
      { drift_heads: driftHeads({ redaction_head: "redaction-2" }) },
      { drift_heads: driftHeads({ correction_head: "correction-2" }) },
      { drift_heads: driftHeads({ authority_head: "authority-2" }) },
      { drift_heads: driftHeads({ source_head: "source-2" }) },
      { snapshot_version: 8 },
    ]) {
      await expect(
        queryGuardianEnrollmentActivity(
          deps(createGuardianReadPort({ scope: drifted })),
          {
            ...scope,
            enrollment_target_ref: targetRef(),
            page_size: 1,
            cursor: cursor ?? "",
          },
        ),
      ).resolves.toEqual({ status: "refresh_required" });
    }
    expect(computeDriftHead(driftHeads())).not.toBe(
      computeDriftHead(driftHeads({ source_head: "source-2" })),
    );
  });

  it("rejects an out-of-range page size before touching the source", async () => {
    const port = createGuardianReadPort();
    await expect(
      queryGuardianEnrollmentActivity(deps(port), {
        ...scope,
        enrollment_target_ref: targetRef(),
        page_size: 21,
      }),
    ).resolves.toEqual({ status: "denied", reason_code: "invalid_query_input" });
    expect(port.activityRequests).toEqual([]);
  });
});
