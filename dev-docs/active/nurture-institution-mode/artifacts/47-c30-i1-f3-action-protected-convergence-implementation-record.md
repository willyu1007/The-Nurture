# C30-I1-F3 Action and Protected Convergence Implementation Record

## Result

- Date: 2026-08-06
- Result: `I1_F3_COMPLETE / ACTION_PROTECTED_DECLARATIONS_ACCEPTED`
- Exact Base source: `f59f5069ded40ce1302e44d710e4a5904652edcf`
- Parent: F2 `c317795465cbd982d5690f91fffced52296ea269`

F3 reuses the exact accepted I1-D `ScenarioDomainActionContractV1` and I1-E
`ScenarioProtectedInteractionContractV1` rather than copying either contract into
the manifest layer.

## Implemented boundary

- action/protected arrays are empty before their capability and non-empty with it;
- every action binds the manifest scenario, one unique action key and handler,
  the trusted `prepare_domain_action` operation, declared ingress, an offering
  product surface, input/command metadata and one accepted Base-neutral driver;
- every offered action resolves exactly one domain-action row;
- every protected declaration binds the manifest scenario and one exact action,
  and retains only `prepare_domain_action|read_protected_detail`;
- the reused static Schemas reject a third driver, body, authority, generic
  commit/erase operation or unknown field;
- vNext action keys cannot alias legacy `action_availability.scenario_actions`
  (`WF-MAN-123`);
- the complete fixture carries all four exact capabilities and source identities.

## Verification

| Check | Result |
| --- | --- |
| F1-F3 focused matrix | PASS 57/57 |
| Runtime / Scenario tests | PASS 34/34 and 10/10 |
| Cumulative Node conformance | PASS 433/433 |
| Typecheck, 66 Schemas, docs/boundary/semantic checks | PASS |
| I1-E recursive generic-fixture no-copy check | PASS |

## Boundary and rollback

F3 adds no dispatch, handler implementation, protected carrier route/store/KMS,
database, consumer or activation. Revert `f59f506…` before F2/F1 after reverting
F4 metadata/tooling.
