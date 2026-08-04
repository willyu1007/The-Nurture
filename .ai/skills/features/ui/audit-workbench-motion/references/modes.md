# Motion audit modes

Load only the section for the selected mode.

## Review

For a focused diff, component, or PR.

Output:

1. Findings table ordered by severity, with the owner column filled in.
2. Motion-only decision: `block` or `approve`.
3. Short verification list.

Block when motion:

- replaces, delays, or obscures an authorization, error, warning, or cancellation;
- lacks a reduced-motion path, or covers only `animation` while a `transition`
  still moves the element;
- uses `transition: all`;
- adds avoidable delay to a keyboard, streaming, or high-frequency action;
- uses a literal duration or easing where a token exists;
- introduces a motion or gesture dependency without a recorded decision;
- overrides kit chrome from the host to work around a kit behavior.

A `kit`-owned finding does not block a host PR. Record it as upstream work and
judge the host diff on what the host controls.

Do not restate unrelated findings from a general code review.

## Discover

For a surface where motion is missing and the user asks what should animate.

Output:

1. Zero to five ranked opportunities.
2. Two to five rejected candidates, each with the reason it lost.
3. A one-sentence verdict on how much motion this surface actually needs.

Zero is a legitimate result. A surface that is dense, keyboard-first, or already
carries the kit's scene reveal usually needs nothing more, and saying so is worth
more than five weak suggestions.

Every opportunity states:

- purpose — feedback, state change, spatial continuity, or preventing a jump;
- expected frequency, and the evidence for it;
- the affected state, and where the motion originates on screen;
- owner — an opportunity that requires new kit chrome is an upstream proposal,
  not a host opportunity;
- the existing token role it would use, or the gap it would need filled;
- the reduced-motion equivalent;
- verification.

Reject decoration on dense, high-frequency, keyboard-first, streaming, or
sensitive flows. Reject anything whose value is "it would look nice."

## Audit

For a broad screen, flow, or app assessment.

Output:

1. Three to seven ranked findings.
2. A cross-cutting pattern summary — the repeated mistake usually matters more
   than any single instance.
3. Handoff items, split by owner.

Each handoff item contains:

- goal, in one sentence;
- affected locations, with file and line;
- current evidence;
- the target behavior, expressed in token roles;
- reduced-motion and keyboard requirements;
- how to verify it landed.

A handoff item must be executable by someone who did not read this audit: name
the file, the token, and the expected result. Never write "use the easing
discussed above."

If the audit finds motion is broadly fine, say that in the summary rather than
padding to three findings.
