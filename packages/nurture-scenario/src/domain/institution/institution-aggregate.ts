import { grantAdmits, type NurtureGrantAsk } from "./institution-authority-chain.js";
import type { NurtureAggregateMember, NurturePolicyReasonCode } from "./institution-context.js";

/**
 * G4-A increment 4 — 0C-5 §5, full coverage or nothing.
 *
 * An aggregate is any value compressing several members' facts into one
 * number, badge or marker shown to an Admin. None existed in code when 0C-5
 * froze, and none is introduced here: this is the foundation the class cards,
 * support signals and roll-ups of G4-A and G4-B are required to go through.
 *
 * The rule the freeze settled, after rejecting a k-anonymity threshold:
 *
 * | Population | Returned |
 * | --- | --- |
 * | non-empty, every member readable | the value |
 * | non-empty, ANY member not readable | `unavailable` with a reason code |
 * | genuinely empty | `0` |
 *
 * A filtered count — drop the unreadable members, count the rest — is
 * forbidden. It under-reports silently, and it leaks through differential
 * observation: an Admin watching the number move learns that one member
 * transitioned, which a static threshold cannot defend against because the
 * attack surface is the time series, not the cell size.
 */

/**
 * `NurtureAggregateMember` — one member of a counted population, with the
 * grant facts the predicate needs for it — is defined beside the port that
 * produces it, in `institution-context.ts`. One definition rather than a
 * matching pair: two structurally identical types interoperate today and drift
 * independently tomorrow.
 *
 * The population itself comes from SCOPE — who is enrolled in the class —
 * never from the protected facts, so its size is not the secret and membership
 * is not what the rule hides.
 */

/**
 * Deliberately two states and no third. `0` arrives as `available` with value
 * zero, so "there is nothing" and "I cannot tell you" cannot be confused by a
 * consumer reading a bare number — the distinction 0C-5 §5 requires an Admin
 * to be able to make.
 *
 * There is no score, band, rank, trend or magnitude field, and adding one
 * reopens 0C-5 §6.
 */
export type NurtureAggregateResult =
  | { status: "available"; value: number }
  | { status: "unavailable"; reason_code: NurturePolicyReasonCode };

/**
 * Whether one member's grant admits the fact class being aggregated. Shares
 * `grantAdmits` with the chain's fourth level on purpose: 0C-5 §5's "no
 * aggregate bypass" is the requirement that a count never move with a fact
 * denied on direct read, and two implementations of "readable" would be two
 * chances to drift apart.
 */
const memberReadable = (member: NurtureAggregateMember, ask: NurtureGrantAsk): boolean =>
  member.grant_state === "active" && grantAdmits(member.grant_terms, ask);

/**
 * Full coverage or nothing.
 *
 * `countFor` is invoked ONLY after every member has been admitted. That is the
 * structural form of "the predicate runs before aggregation, never after": on
 * a refusal the member facts are never read at all, so no partial figure can
 * exist to leak, and no later edit can accidentally compute one first and
 * discard it afterwards.
 */
export const resolveAggregate = (
  members: NurtureAggregateMember[],
  ask: NurtureGrantAsk,
  countFor: (member: NurtureAggregateMember) => number,
): NurtureAggregateResult => {
  // A genuinely empty population is `0`, and reaches that answer without
  // consulting any grant: there is nothing to be denied.
  if (members.length === 0) return { status: "available", value: 0 };

  const denied = members.find((member) => !memberReadable(member, ask));
  if (denied) {
    // One code for every refusal. Naming which member, how many, or why would
    // reintroduce exactly the differential observation full coverage closes.
    return { status: "unavailable", reason_code: "grant_missing" };
  }

  return {
    status: "available",
    value: members.reduce((total, member) => total + countFor(member), 0),
  };
};
