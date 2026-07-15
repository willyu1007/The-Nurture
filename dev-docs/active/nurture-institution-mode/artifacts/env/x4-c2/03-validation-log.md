# Env Contract Validation

- Timestamp (UTC): `2026-07-15T02:56:21Z`
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
        "nurture_internal_service_token"
      ],
      "values_file": "/Volumes/DataDisk/Project/The-Nurture/env/values/dev.yaml",
      "values_keys": [
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
        "nurture_internal_service_token"
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
        "nurture_internal_service_token"
      ],
      "values_file": "/Volumes/DataDisk/Project/The-Nurture/env/values/staging.yaml",
      "values_keys": [
        "PORT",
        "SERVICE_NAME"
      ]
    }
  },
  "variables_non_secret": 3,
  "variables_secret": 3,
  "variables_total": 6
}
```

## Notes
- This report never includes secret values.
- If this is used in CI, treat any ERROR as a merge blocker.
