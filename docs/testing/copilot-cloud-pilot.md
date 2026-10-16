# Copilot cloud pilot — Retired

Retired by owner decision on 15 October 2026. The
[central Loop retirement decision](https://github.com/bedarstudios/loop/blob/e4eb5dd5556b687a32e1197a777e203e152b6513/docs/retirements/overnight-copilot.md)
supersedes the pilot rollout, dispatch, review and fix instructions below.
[Showhow #108](https://github.com/bedarstudios/showhow/issues/108) removes the
dedicated controller, policy, skill and CI consumers. Generic manual Copilot
setup and product CI remain available.

The lead's 16 October 2026 readback records `overnight-pilot.yml` as
`disabled_manually`. Source removal and live shutdown are separate outcomes;
review, source merge and final readbacks remain pending at this Build.
[Ledger #86](https://github.com/bedarstudios/showhow/issues/86) remains open,
with its historical merged run preserved. Its closure waits for a separately
owner-authorised #108 merge and the coordinator's dated retirement note.

## Historical pilot record

The original record follows unchanged, including dated observations, commands
and links. These are historical evidence, not instructions to enable or run the
retired service. Preserve the existing pilot PRs, logs and ledger comments.

# Copilot cloud pilot

## Scope and authority

Showhow is the first pilot. One approved Linux-verifiable issue, one active run,
one corrective dispatch and at most two external review cycles. Human merge.
The controller must preserve exclusive cloud ownership using `overnight` before
`ready-to-implement`, then reject a racing local claim. OS prerequisite:
https://github.com/bedarstudios/OS/issues/14.

Required profile: targeted issue test, `npm run lint`, `npm run branding:check`,
`npx tsc --noEmit`, `npm run test`, `npm run test:browser`, `npx vite build`.
Run these in hosted Linux and retain current-commit results. The setup workflow
must reach main before a real Copilot task. Linux results prove no native capture
or macOS permissions behavior.

## Observed readiness, 2026-09-25

- GitHub API lists `copilot-swe-agent` as assignable in this repository.
- Signed-in account billing UI: Copilot Pro; 96/1,500 included credits used;
  additional usage not enabled. Actions and all AI-credit SKU budgets are $0
  with Stop usage Yes. No billing settings changed. Recheck before dispatch;
  these observations are a dated snapshot, not a permanent guarantee.
- Baseline main: c8b4b67c2a5bfe3e3d007f131262f2bbab36761b.
- Cloud setup, implementation, independent review, corrective pass and scheduled
  dispatch: not yet observed. No successful pilot is claimed.

## Nightly rollout

After the manual pilot passes, enable one daily 03:00 Europe/London selection of
explicitly approved, labelled eligible issues. Continue the same run/PR through
review; never restart a reviewed or blocked ticket merely because another night
arrived. Preserve paid-overage stops and human merge authority.

The disabled controller adds periodic reconciliation only. Daily admission is
not scheduled or enabled by this change.

## Controller implementation and verification

The controller is `.github/scripts/overnight-cli.mjs`, backed by admission,
GitHub adapter, review evaluator, durable dispatch and reconciliation modules.
Policy is `.bedar/overnight.json`; it starts disabled with no approvals. Run
records are bot-authored comments on #86, serialized by the workflow concurrency
group. Reservation and metered-action intent are written before assignment,
review requests or corrective comments. Ambiguous delivery is never retried
blindly. Blocked/reviewed records retain ownership until human resolution/merge.

The trusted controller runs only from main and never installs project packages
or executes candidate code. `BEDAR_LOOP_PAT` is used only in that job for the
provider and user Project reads; ordinary state writes use `GITHUB_TOKEN`.
Candidate tests have a separate read-only job, no persisted checkout credential,
and no controller secret. Board sync remains the sole Project writer.

The approved profile must include `scopeDigest` (SHA256 of the exact issue body),
`approver`, `source`, `profile: linux-portable`, `allowedFiles`, `targetTest`,
`evidenceFile` and `dependencyCommits` (full merged commit SHAs, or an explicitly
empty array when the standalone scope has no code dependency). Record verified
OS deployment and a bounded billing-verification expiry before enabling starts.

Commands:
- `node --test .github/scripts/overnight.node-test.mjs .github/scripts/overnight-review.node-test.mjs .github/scripts/overnight-reconcile.node-test.mjs .github/scripts/overnight-evidence.node-test.mjs .github/scripts/overnight-github.node-test.mjs`
- After npm ci: `node --test .github/scripts/overnight-evidence-integration.node-test.mjs`
- Local controller invocation defaults to dry-run. Mutating modes require a
  trusted main-branch Actions environment. Manual workflow input `start` requires
  an exact approved issue number. Scheduled ticks currently reconcile only.

The worker commits a minimal interface stub plus genuinely failing behavioral
assertion, then implements its fix and records the red SHA in the approved JSON
evidence path. Cloud evidence CI reruns the identical test at red and final head.
It requires failed assertion results, not import/setup errors. Existing CI still
runs all required suites against the PR's candidate content. Review acceptance
requires the dedicated Copilot reviewer on the current head, no current unresolved
threads, and an affirmative no-comments summary; ambiguous summaries block.

Observed 2026-09-25:
- OS ownership PR: https://github.com/bedarstudios/OS/pull/15 — merged and deployed.
  All sixteen scenarios passed against the installed poller, with byte parity to
  merged main verified: https://github.com/bedarstudios/OS/pull/15#issuecomment-5836493148.
- Environment PR: https://github.com/bedarstudios/showhow/pull/84 — hosted setup
  https://github.com/bedarstudios/showhow/actions/runs/36078284326 and CI
  https://github.com/bedarstudios/showhow/actions/runs/36078284275 passed on
  7d1d87fe654b2558b73b6f5cd65b15c65c312fa0.
- Controller checks passed locally (57 native tests), including API-shaped response fixtures and a
  real Vitest red/green replay in an isolated temporary git repository. These are
  infrastructure checks, not a successful product pilot.
- Live GitHub responses expose both bots as `Copilot`; immutable Bot IDs separate
  implementer 198982749 from reviewer 175728472. Dismissed reviews, draft resets
  and changed CI bases invalidate prior success; regression tests cover these.
- Live read-only snapshot correctly reports #83 has no closing implementation PR
  and no Project membership. A mere mention from PR #84 is not an implementation.
- Existing Board Sync run 36079618610 failed with `Bad credentials` for its
  existing secret. Credential refresh and successful board sync are prerequisites
  for dispatch; no substitute broad local credential was copied into Actions.

Environment PR #84 and phase-parking PR #81 are merged. Owner approval of #83's
exact scope is recorded at https://github.com/bedarstudios/showhow/issues/83#issuecomment-5829286589.
Pending: refresh the existing controller/board token, verify board membership,
test and merge this disabled controller, then activate and observe the manual pilot.
Nightly starts and the first actual overnight result remain unverified.

## Review corrections, 2026-09-25

Correction instructions now require the full targeted/lint/branding/type/unit/
browser/build profile on the final corrected commit. Active ownership requires
an open issue with exactly the implementer bot assigned; human co-assignment,
removal of the bot, and missing assignee data fail closed. Approval removal or
digest replacement is persisted as a blocked run before PR inspection, so the
controller can project needs-human and continue reconciling other records.

The assignee regression initially accepted a human co-assignee; both revoked-
approval regressions initially threw without saving blocked state. All 60 native
controller checks pass after these fixes. Hosted validation remains the authority
for the current PR head; none of these tests proves an actual cloud pilot.

## Human merge after approval revocation

Reconciliation observes a linked Copilot PR's human merge before evaluating its
current approval. Already-blocked runs may observe that merge too, without
resuming review or correction. Missing, open and closed-but-unmerged PRs leave a
blocked record inert. The saved merged state frees capacity for the next ticket.

Seven regression cases cover removed/replaced approvals for reviewed/blocked
runs and the three unmerged cases. Four merged cases failed before the fix;
they now pass and exercise successful reservation of another ticket through the
real capacity check. All 67 native controller tests pass locally.

Local code review before commit, working diff based on
78a2db311984058eed89fb88509c7d8deac6e55c:
- Standards: no blocking findings; narrow state-ordering change, existing identity
  checks and read-only PR lookup preserved, no new metered action or merge path.
- Requirements: no blocking findings; completion survives approval revocation,
  historical blocked records recover only after observed merge, and incomplete
  work does not regain authorization. Reservation capacity is exercised directly.

## Live supervised pilot — 2026-09-26

Copilot implemented #83 in PR #89 and performed one corrective session. Final head
`c094e713c89dede50ab64f8aca6b0b7b48f4a684`, tested base
`299cab478258a878eed75bc59257be9e5923b89b`:

- [All CI checks passed](https://github.com/bedarstudios/showhow/actions/runs/36207931532).
- [Trusted behavioral RED/GREEN replay passed](https://github.com/bedarstudios/showhow/actions/runs/36207931532/job/108308310879), with an identical test file at both revisions.
- [Independent Copilot reviewer recommended approval with no findings](https://github.com/bedarstudios/showhow/pull/89#pullrequestreview-5323991275), on that same head.
- Live read-only collection with the updated summary parser returned `scopeMatches: true` and `current-head-verified`.

This was supervised, not a proven unattended overnight run. The supervisor recovered
an asynchronous assignment response without redispatch, removed GitHub's automatic
requester co-assignment, and promoted the initial completed draft. Product code and
its corrective evidence were written by Copilot, not locally. The first attempt had
changed test expectations after its RED commit; the evidence gate caught that and
the single allowed correction repaired it. A local review agent initially had an
authentication failure; a subsequent independent review succeeded.

Compatibility fixes now read assignment/timeline publication with bounded GET-only
polls and pin GitHub's automatic tracking-assignment event IDs. A subsequent human
assignment still stops reconciliation. Initial Copilot drafts can receive cloud checks and review in place;
a recorded draft reset prevents that eligibility. The controller never changes
draft state. The owner marks the PR ready when starting human review. Explicit clean `ccr-overview-v2`
review summaries are recognized alongside the older summary format. These adapter
changes have local regression/review evidence; the next actual scheduled admission
must verify them against GitHub.

## Daily admission after configuration merge

The daily cron is `0 3 * * *`, timezone `Europe/London`; GitHub may delay scheduled
jobs. The existing ten-minute cron only reconciles existing work. No manual nightly
mode or implicit approval is added.

Queue an issue in Project #2 with `overnight` and `ready-to-implement`, no assignees
and no existing local/cloud claim. It must also have an explicit approval entry in
`.bedar/overnight.json`, pinning the approved issue-body digest, allowed paths,
Linux check profile and dependencies. Labels alone never authorize new scope.
The controller admits at most one issue; a blocked run occupies that slot and
projects `needs-human`. Reviewed work waits for the owner to merge it. No automatic
merge is enabled.

The current allowlist contains only #83, so after its merge the queue has no new
eligible work until another ticket is explicitly approved. The pilot proof must
also be present in the ledger as reviewed or merged before nightly admission.

Paid overage stays disabled. The current billing verification expires at
2026-09-28 22:22:53 UTC; subsequent metered admission/review/correction fails closed
until the owner/account settings are checked again and the policy is renewed.
A configured cron is not evidence that a scheduled run occurred. Record the first
actual scheduled workflow and admitted issue before claiming unattended operation.


### PR #91 draft-state race correction

Greptile correctly identified a read/write race in automatic draft promotion:
a human reset after the timeline read could be overwritten by the ready mutation.
Automatic promotion has been removed, including its GraphQL mutation exception and
Actions PR-write permission. GitHub supports requesting Copilot review on drafts,
so a completed initial Copilot draft with no recorded draft-reset event can proceed
through the same CI, evidence and independent review gates without changing its
GitHub draft state. A later observed reset invalidates draft review eligibility;
reviewed ledger state is rechecked on reconciliation. No new ticket or extra metered
review was dispatched to test this infrastructure fix.

The deterministic race regression failed because the ready mutation overwrote
`draft: true`, then passed after removing all draft-state writes. Draft review still
requires confirmed provider completion, current CI/evidence and the separate
reviewer identity. This preserves unattended cloud validation while leaving draft
status and human review/merge decisions with the owner.
