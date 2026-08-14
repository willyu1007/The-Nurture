/**
 * W8 canonical-owner writes for the teacher communication exchanges. Both
 * writes re-read current authority inside the command transaction: the send
 * lands one teacher-authored text message on the exact family thread (and
 * bumps its activity head); the cursor write advances only the acting
 * teacher's own participant cursor, never backwards and never another
 * participant's.
 */

export type NurtureThreadTextMessageApplied =
  | { status: "applied"; message_id: string; committed_at: string }
  | { status: "not_authorized" }
  | { status: "thread_unavailable" };

export type NurtureThreadReadCursorApplied =
  | { status: "advanced" }
  | { status: "already_satisfied" }
  | { status: "cursor_regression" }
  | { status: "message_foreign" }
  | { status: "not_authorized" };

export type NurtureTeacherCommunicationTransaction = {
  applyThreadTextMessage(input: {
    workspace_id: string;
    participant_id: string;
    thread_id: string;
    body_envelope: unknown;
    sent_at: string;
  }): Promise<NurtureThreadTextMessageApplied>;

  /**
   * `message_ref` is the owner-issued opaque ref; the transaction resolves it
   * by candidate matching over the exact thread's messages via `issue_ref`,
   * so a foreign ref is indistinguishable from a missing one.
   */
  applyThreadReadCursor(input: {
    workspace_id: string;
    participant_id: string;
    thread_id: string;
    message_ref: string;
    issue_ref: (messageId: string) => string;
    at: string;
  }): Promise<NurtureThreadReadCursorApplied>;
};
