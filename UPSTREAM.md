# Upstream release parent

Showhow owns its product, roadmap, release process, branding and architecture. OpenScreen is
an attributed release parent. Take upstream release tags through reviewed merge PRs while
preserving the Showhow layer and compatibility contracts.

## Tag and remote rule

Keep one permanent `upstream` remote for `https://github.com/getopenscreen/openscreen.git`,
configured to fetch tags only, with automatic tag following disabled. Do not track upstream
branches. Namespace fetched tags under `refs/tags/upstream/` to separate them from Showhow's
release tags. Record the full commit behind each selected tag; a snapshot mentioning a release
is not the tag. Stop for clarification if an approved pin disagrees with the fetched tag.

The following setup belongs to the migration ticket; this documentation ticket adds no remote:

```sh
git remote add --no-tags upstream https://github.com/getopenscreen/openscreen.git
git config --unset-all remote.upstream.fetch
git config --add remote.upstream.fetch 'refs/tags/*:refs/tags/upstream/*'
git fetch --no-tags upstream
```

Verify `remote.upstream.fetch` contains only that tag refspec and `remote.upstream.tagOpt`
is `--no-tags`. Do not force-update a changed tag; retain its earlier pin and ask for review.

Use one reviewed merge PR per upstream release tag: a `v*` tag without `-`, or an explicitly
named release candidate used as a development base. Perform a real `git merge` of the pinned
upstream tag into the isolated ticket branch so subsequent release merges retain a merge base.
Do not merge upstream `main` or continuously synchronise branches. The merge and the Showhow-layer
port land together; `main` must not lose existing Showhow behaviour between them.

For the approved “Move onto upstream v2” milestone, Task 2 (#116) develops from
`v2.1.0-rc.3` (`523a3e4c47cf7566cc5c759ad5275f7edcd3382e`) and cannot merge to `main`
before upstream tags final `v2.1.0`. Rebase the migration onto that final tag before it lands.
No Showhow `v*` release tags are pushed until the milestone is complete. Agents never merge PRs;
follow the repository's Loop review and owner merge gates.

## Per-merge checklist

1. Record the selected upstream tag, full commit, source links and adaptations in the PR.
   Compare with the last imported tag and inspect the complete merge diff and conflict resolutions.
2. Review identity changes explicitly: preserve package identity, `appId` `com.bedarstudios.showhow`,
   `productName` `Showhow`, user-visible branding, preferences and recording locations. Classify
   persistence, IPC, native-helper and packaging identifiers before changing them; preserve legacy reads.
3. Update `docs/architecture/upstream-touchpoints.md` with each edited upstream file and its purpose.
   Task 2 creates that inventory. Keep edits to upstream screens at identity, theme tokens, wiring and
   wrapper slots; keep Showhow-owned logic in its existing directories.
4. Run affected suites and `npm run branding:check`. Prove the Task 2 legacy cases L1–L5, using
   fixtures from Showhow `fc50566a` for the initial v2 migration (retain these regression cases later):
   - L1: open a saved `.showhow` project in the new editor; its bytes remain unchanged on opening.
   - L2: open a `.openscreen` project without overwriting it; the next save defaults to a new `.showhow`.
   - L3: previously recorded bundles appear in the library and open.
   - L4: the recordings folder and preferences survive first launch with the copied old profile.
   - L5: a new recording writes `<video path>.cursor.json` and the editor reads it.
5. Smoke-test a packaged build on macOS arm64: first launch with the copied profile, old bundles and
   projects, new narrated recording and full bundle save, editor opening, and Showhow HUD/editor theming.
   Retain command outputs, screenshots and L1/L2 file hashes. State Windows and Linux native behaviour
   as untested unless target-platform evidence exists. Source checks alone do not prove native behaviour.
6. Obtain fresh independent review of the candidate and its evidence before Ship. Later upstream
   releases need their own scoped ticket and PR; this milestone approves only the v2.1.0 migration.

## Exclusions

Upstream release infrastructure is not inherited: keep out `prerelease.yml`, `promote.yml`,
release branches, milestone migration, Discord announcements and Homebrew/winget/Nix/AUR
publishers. Preserve Showhow's single `build.yml` release workflow and existing secret contract;
see `AGENTS.md` → “Pull requests and releases”. Do not restore upstream package identity or
product branding. Keep attribution and required notices while adapting user-visible text to Showhow.

The approved product stays free, local-first and on Electron. Upstream CLI and MCP remain hidden
and off; ChatGPT sign-in and the redesigned V1 workflows are later work. The migration and native
bundle-transcription port are planned Tasks 2 and 3, not functionality delivered by this policy.
