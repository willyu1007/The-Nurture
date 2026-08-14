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
node scripts/service-candidate/verify-freeze-evidence.mjs
```

The committed manifest is append-only. Candidate-defining drift requires a new
version/ref and a new manifest; never regenerate an existing file in place.

Frozen records:

- `nurture.service-candidate@1.0.0` /
  `sha256:c739f9291dbed99b8c96dd27be57e88429dfaeb9f2a8946395b9f58ba244debb`
  from source `e6aba3792c3aec9b1b282ca665125fb416fae6f8`.
- Freeze evidence `nurture.service-candidate.freeze-evidence@1.0.0` /
  `sha256:2756e407ab1534afa3df107f50d2b8694c2638d7b86d292dbfd1cb09f48bdaf6`.
