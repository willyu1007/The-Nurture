# Environment Contract Change Intent

## Summary

- Change type: add
- Target environments: all
- Affected component: `apps/scenario-service`

## Context and rationale

W2 mounts the parent-context presenter routes behind a typed, default-false
feature gate. The repository environment contract must expose the same gate so
absent configuration remains an explicit fail-closed state.

## Risk assessment

- Breaking change: no
- Rollout coordination: no; the default is `false`
- Human input required: none for this contract-only addition
