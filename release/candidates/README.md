# Service Candidate records

This directory contains immutable, body-free T-008 Service Candidate manifests.
A Candidate binds exact source, executable bytes, schema/migrations, scenario and
public contracts, fixtures, configuration/gate posture, beta profile and owner pins.

Candidate creation does not authorize database apply, deployment, capability
activation, internal testing or traffic. Qualification and deployment evidence
must reference a frozen Candidate from separate append-only records.

The first Candidate is generated only after the deterministic tooling is committed:

```bash
pnpm build:scenario-service
node scripts/service-candidate/freeze-service-candidate.mjs \
  --source-revision <full-green-commit> \
  --frozen-on <YYYY-MM-DD> \
  --write
node scripts/service-candidate/verify-service-candidate.mjs
```

The committed manifest is append-only. Candidate-defining drift requires a new
version/ref and a new manifest; never regenerate an existing file in place.
