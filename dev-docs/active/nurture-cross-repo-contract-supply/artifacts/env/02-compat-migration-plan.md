# W3/W4 owner-presenter environment compatibility plan

This is an additive, non-breaking change. Existing deployments continue to
resolve the gate as false. A later, separately authorized rollout must supply
the exact string `true` together with complete owner ports and service auth;
this contract publication does not perform that rollout.

The W4 key follows the same additive compatibility rule. Its absence and the
literal `false` both keep the presenter unavailable. A later rollout must
separately supply complete owner ports and approval; no configuration permits
Institution Mobile commands through this read-only presenter.

The W6 key follows the same additive compatibility rule. Its absence and the
literal `false` both keep the presenter unavailable. A later rollout must
separately supply complete caregiver owner ports and approval; no
configuration admits a write path through this read-only presenter.
