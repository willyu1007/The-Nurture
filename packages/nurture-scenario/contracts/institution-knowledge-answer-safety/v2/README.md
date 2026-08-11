# Institution Knowledge Answer-Safety Provider Qualification

This `/v2` directory is the sole canonical and runnable qualification layout
for `nurture.institution-knowledge-answer-safety-provider-qualification@2.1.0`.
No `/v1` compatibility path or fallback verifier is supported.

This contract freezes the Nurture-owned decision vocabulary and regression
fixture suite for a structured answer-safety service called through the unified
My-Chat LLM gateway.

The service may be a managed generative model. Evidence pins the gateway,
provider API, requested model/deployment and prompt template by explicit IDs and
versions. Every fixture must have at least two unique invocation records with
canonical input, request and structured-response digests. Moving aliases,
malformed decisions, partial fixture coverage and success during service/pin
failure are rejected.

This behavior/evidence contract does not claim provider model-weight
verification or bitwise response determinism.

Qualification has two explicit levels:

- `adapter_qualified=true` accepts `adapter_recorded` mock/recorded transport
  over all fixtures. It closes the Q3 implementation gate and permits default-
  off E7/E8 work.
- `live_qualified=true` is not issued by this verifier. Future activation
  evidence must come from verified real My-Chat gateway calls and include the
  provider request ID, requested and resolved model/deployment IDs, and call/
  response digests. Hand-authored JSON cannot claim live qualification.

Commands:

```bash
node scripts/institution-knowledge-safety/qualification-core.mjs --write
node scripts/institution-knowledge-safety/qualification-core.mjs --check
node --test scripts/institution-knowledge-safety/qualification-core.test.mjs
node scripts/institution-knowledge-safety/qualification-core.mjs --evidence <candidate-evidence.json>
```

The generated manifest is deterministic. Edit only files under `source/`,
rotate `qualificationContract.version` for semantic changes, and rebuild.
