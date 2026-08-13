# Compatibility and Migration Plan

## Classification

- Backward compatible: yes
- Coordinated rollout required: no
- Secret-manager change required: no

## Plan

Regenerate the public environment artifacts from `env/contract.yaml`. Existing
deployments omit the key and therefore retain the default-off behavior. Any
future activation remains a separate authorized rollout and also requires a
complete owner-port composition.

## Rollback

The code and contract can retain the false-valued gate without activating any
route. No compatibility window or secret cleanup is needed.
