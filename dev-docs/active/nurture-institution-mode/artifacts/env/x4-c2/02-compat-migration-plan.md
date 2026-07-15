# X4-C2 Environment Compatibility Plan

1. Deploy the endpoint in disabled mode when no token is present.
2. Provision the same service secret outside both repositories for the approved
   development composition.
3. Enable the My-Chat capability only after authenticated owner-read tests pass.
4. Keep pilot/GA closed until X5.

Rollback: disable the My-Chat capability and remove the runtime secret reference.
Nurture business facts and My-Chat Ledger records are retained.
