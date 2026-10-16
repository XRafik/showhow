# Implementation notes

## 16 October 2026 — Showhow #108 overnight retirement

Removed the dedicated overnight controller/test family, policy, skill and
workflow. Removed its two CI jobs and integration-test call; product CI commands
and setup remain intact. Removed the setup-success marker after confirming its
only consumer was the retired skill. Retained manual Copilot setup and guidance.
The pilot document now says Retired and links the merged central Loop decision;
its original historical record is unchanged. PLAN.md changes remove only the
obsolete overnight verification calls and cloud-job reference.

No scope deviations. This is bounded source removal and consumer repair: no new
product behaviour or artificial prose-token RED tests. Executor source evidence
and snapshots are under `/Users/mohamedb/dev/loop-evidence/showhow-108/executor/`.
The lead owns dependency setup, retained-suite proof and fresh independent
review. Live workflow disablement and ledger history are lead-owned receipts;
no cloud dispatch, settings change or ledger closure occurred in Build. Merge
and post-merge ledger closure retain their owner/coordinator gates.

### Operational deviations reported by the lead

Dependency setup used `HUSKY=0 npm ci` under the heavy lock and passed; the
lane's dependencies are a real local directory. Initial runtime preflight failed
because configured Git hooks were missing; the failed receipt is retained in
`lead/runtime-preflight.json`. The lead ran
`env GIT_CONFIG=/Users/mohamedb/dev/loop-evidence/showhow-108/lead/scratch-husky-config npm run prepare`,
generating only ticket-local `.husky/_` files and directing the Git configuration
write to an external scratch file. Shared Git configuration was not changed.
Fresh preflight is retained in `lead/runtime-preflight-after-hooks.json`.

The browser-install attempt returned resource-busy heavy exit 75 before its
command started (`lead/browser-setup.json`); proof remains pending. The lead also
reported a cross-workspace coordinator prompt wrapper refusal: exit 1,
`herdr: refused: target agent is outside the lead workspace`
(`lead/coordinator-progress.json`). This is retained as an operational refusal,
without changing shared resource or provider settings.
All receipt paths in this section are relative to
`/Users/mohamedb/dev/loop-evidence/showhow-108/`. These setup observations belong
to the lead; the executor did not install dependencies or run heavy proof.
