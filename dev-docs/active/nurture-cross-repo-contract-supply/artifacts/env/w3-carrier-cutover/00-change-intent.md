# W3 staging secret-reference intent

- Add the existing `nurture_protected_content_key` logical secret to the
  staging reference map so the already-defined W3 encrypted-content dependency
  can be mounted by the single Nurture staging deployment path.
- Do not add or persist a secret value.
- Do not change any provider or consumer gate value.
