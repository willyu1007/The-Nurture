import type { CanonicalRef } from "@my-chat/workflow-contracts";
import type { ParentContextPresenterExactAuthorityV1 } from "../../parent-context-presenter-contract.js";

export type ParentContextNoticeConfirmationFactsV1 =
  | Readonly<{
      status: "current";
      notice_version: number;
    }>
  | Readonly<{
      status: "already_satisfied";
      notice_version: number;
      confirmed_at: string;
      output_refs: CanonicalRef[];
    }>
  | Readonly<{
      status: "scope_changed" | "notice_missing" | "notice_changed";
    }>;

/** Transaction-local owner for the sole W2 write: marking one routed notice read. */
export type NurtureParentContextPresenterTransaction = Readonly<{
  loadNoticeConfirmationFacts(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    notice_id: string;
    expected_notice_version: number;
  }): Promise<ParentContextNoticeConfirmationFactsV1>;
  markNoticeRead(input: {
    workspace_id: string;
    authority: ParentContextPresenterExactAuthorityV1;
    notice_id: string;
    expected_notice_version: number;
    confirmed_at: string;
  }): Promise<
    | Readonly<{
        status: "committed";
        notice_ref: CanonicalRef;
        confirmed_at: string;
      }>
    | Readonly<{ status: "scope_changed" | "notice_changed" }>
  >;
}>;
