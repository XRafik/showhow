# Authentic Showhow compatibility fixtures

The `fc50566a/` files were produced by the lead from the actual `fc50566a` production build in a private scratch runtime. `legacy.showhow` was saved through the production UI Save Project command; `legacy.openscreen` through the public save handler. `bundle/` was created through production `store-recorded-session` using the committed synthetic `tests/fixtures/sample.webm`. These are synthetic inputs; no personal profile or recording was copied.

The executor copied `legacy-fixtures-v3-preserved/` byte-for-byte. `hashes.json` pins every copied file. Source receipts: `/Users/mohamedb/dev/loop-evidence/showhow-116/lead-20261016T193110Z/fixture-result-3.json` and `legacy-fixture-v3-hashes.json`. Failed earlier fixture attempts remain in that external evidence directory.

Original serialized absolute media paths point at the retained isolated `fixture-runtime-3`. They are intentionally unchanged. Tests copy the project bytes into their own scratch root and exercise the loader/migration without writing the original. Native portable-media proof must record its separately derived relocation map and hashes; never rewrite these originals to hide relocation.

`profile/` contains only synthetic recordings/session files, without caches. Preferences were stored by the actual old UI with `trayLayout: vertical`: `renderer-storage.json` records the values; their persisted Chromium files are under `sessionData/Local Storage`. The harness isolated sessionData separately, so copied-profile native acceptance must copy BOTH profile and sessionData, then observe the preference through the production UI. The unit preference assertion is source proof only.

There is no native recording or cursor sidecar among these old fixtures. L5 source tests use a deterministic OS cursor adapter and new candidate recording completion. Actual native L5 and packaged compatibility remain lead Prove work.
