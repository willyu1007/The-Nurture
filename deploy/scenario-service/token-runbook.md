# NURTURE_INTERNAL_SERVICE_TOKEN Runbook

`NURTURE_INTERNAL_SERVICE_TOKEN` authenticates My-Chat requests to Nurture private owner endpoints. The token is an opaque bearer secret, never an identifier, authorization grant, database value, log field, source value, image layer value, or configuration-file value.

## Issue and Inject

Generate a cryptographically random token with at least 32 bytes of entropy, encode the value for transport, and record only the secret-manager reference plus issue metadata. A suitable generator is `openssl rand -base64 48`; place the generated value directly into the secret manager, not a shell history, ticket, chat message, or repository file.

Create a versioned secret-manager entry for the Nurture provider and a separately referenced copy for the My-Chat consumer. Grant read access only to the Nurture scenario-service workload identity and the My-Chat internal-client workload identity. Inject the resolved value at process start through each platform's secret-reference mechanism. Do not expose the value through environment dumps, diagnostic endpoints, CI output, Docker build arguments, or deployment manifests committed to Git.

Before activation, verify that both workloads reference the same secret version and that the Nurture provider reports private routes as configured without logging the token. A missing provider token must keep private routes disabled; an unknown consumer bearer must receive the normal authentication denial only after provider configuration succeeds.

## Zero-Downtime Rotation

The current Nurture authenticator accepts one `NURTURE_INTERNAL_SERVICE_TOKEN` value. Dual-token acceptance therefore requires a temporary provider release that accepts both the current and next secret versions, followed by the consumer cutover. Do not rotate a single shared value in place.

1. Generate the next token and create a new secret-manager version. Preserve the current version until rotation completion.
2. Deploy a Nurture provider revision with dual-token validation: current token plus next token. Keep every provider gate unchanged.
3. Verify both bearer values authenticate against a non-mutating private-route health fixture and confirm normal request telemetry for the current consumer token.
4. Update the My-Chat consumer secret reference to the next version and roll the consumer workload. Verify successful authenticated requests with the next token.
5. Observe for the agreed rotation window, covering consumer replicas, queued work, and rollback capacity. The current token remains accepted during the window.
6. Deploy a Nurture provider revision that accepts only the next token. Verify that the old bearer is denied and the next bearer succeeds.
7. Revoke the old secret-manager version and record the issuer, affected workloads, timestamps, validation evidence, and revocation result.

If the provider implementation lacks temporary dual-token validation, schedule a maintenance window or land that capability before rotation. A simultaneous provider-and-consumer replacement is not zero downtime.

## Revocation Drill

Run the drill against non-production credentials first, then an authorized production window. Record a run identifier, participants, start time, expected secret version, and rollback owner before changing credentials.

1. Issue a disposable replacement token and deploy provider dual-token acceptance.
2. Move a designated My-Chat canary to the replacement token; verify successful private-route requests.
3. Revoke the original token at the provider; verify original-bearer denial and replacement-bearer success.
4. Restore the original authorization set only when the exercise requires rollback; otherwise complete the rotation sequence and revoke the original secret version.
5. Confirm no secret material appears in provider, consumer, platform, or CI logs. Record only secret references and request outcomes.

## Emergency Gate-Off Drill

For suspected misuse, a provider defect, or an unsafe capability, the fastest containment path is a gate-off deployment, not token rotation. Set the affected `NURTURE_*_ENABLED` value to `false`, deploy or apply the platform configuration, and verify the route returns the disabled response. The operator must complete the gate-off within one minute from incident declaration.

Keep `NURTURE_INTERNAL_SERVICE_TOKEN` unchanged during the first minute unless bearer compromise is confirmed. A token rotation does not disable an already authorized capability as quickly as a gate-off. After containment, rotate the token when evidence supports credential exposure, preserve incident evidence without secret values, and require explicit activation authorization before any gate returns to `true`.
