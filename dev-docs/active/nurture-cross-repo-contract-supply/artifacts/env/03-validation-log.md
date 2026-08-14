# Env Contract Validation

- Timestamp (UTC): `2026-08-14T04:20:22Z`
- Root: `/Volumes/DataDisk/Project/The-Nurture`
- Envs: `dev, prod, staging`
- Status: **PASS**

## Errors
- (none)

## Warnings
- (none)

## Summary (redacted)
```json
{
  "per_env": {
    "dev": {
      "secret_ref_keys": [
        "database_url",
        "dev_host_database_url",
        "nurture_internal_service_token"
      ],
      "secrets_ref_file": "/Volumes/DataDisk/Project/The-Nurture/env/secrets/dev.ref.yaml",
      "used_secret_refs": [
        "database_url",
        "dev_host_database_url",
        "family_growth_events_service_token",
        "family_growth_rendition_service_token",
        "family_growth_rendition_service_token_previous",
        "nurture_binding_evidence_key",
        "nurture_harness_integrity_key",
        "nurture_internal_service_token",
        "nurture_protected_content_key"
      ],
      "values_file": "/Volumes/DataDisk/Project/The-Nurture/env/values/dev.yaml",
      "values_keys": [
        "DEV_HOST_PORT",
        "NURTURE_BACKEND_URL",
        "PORT",
        "SERVICE_NAME"
      ]
    },
    "prod": {
      "secret_ref_keys": [
        "database_url",
        "nurture_internal_service_token"
      ],
      "secrets_ref_file": "/Volumes/DataDisk/Project/The-Nurture/env/secrets/prod.ref.yaml",
      "used_secret_refs": [
        "database_url",
        "family_growth_events_service_token",
        "family_growth_rendition_service_token",
        "family_growth_rendition_service_token_previous",
        "nurture_binding_evidence_key",
        "nurture_harness_integrity_key",
        "nurture_internal_service_token",
        "nurture_protected_content_key"
      ],
      "values_file": "/Volumes/DataDisk/Project/The-Nurture/env/values/prod.yaml",
      "values_keys": [
        "PORT",
        "SERVICE_NAME"
      ]
    },
    "staging": {
      "secret_ref_keys": [
        "database_url",
        "nurture_internal_service_token"
      ],
      "secrets_ref_file": "/Volumes/DataDisk/Project/The-Nurture/env/secrets/staging.ref.yaml",
      "used_secret_refs": [
        "database_url",
        "family_growth_events_service_token",
        "family_growth_rendition_service_token",
        "family_growth_rendition_service_token_previous",
        "nurture_binding_evidence_key",
        "nurture_harness_integrity_key",
        "nurture_internal_service_token",
        "nurture_protected_content_key"
      ],
      "values_file": "/Volumes/DataDisk/Project/The-Nurture/env/values/staging.yaml",
      "values_keys": [
        "PORT",
        "SERVICE_NAME"
      ]
    }
  },
  "variables_non_secret": 11,
  "variables_secret": 9,
  "variables_total": 20
}
```

## Notes
- This report never includes secret values.
- If this is used in CI, treat any ERROR as a merge blocker.
