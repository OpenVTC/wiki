---
title: "OpenVTC — The Trust Community CLI"
type: entity
tags: [openvtc, cli, tui, user-experience, primary, multi-community, agent-names, tsp, cypress]
date-updated: 2026-09-04
repo: https://github.com/OpenVTC/openvtc
---

# OpenVTC — The Trust Community CLI

*Repo: [github.com/OpenVTC/openvtc](https://github.com/OpenVTC/openvtc)*

OpenVTC is the user-facing tool for participating in [[verifiable-trust-community|Verifiable Trust Communities]]. It's a Rust CLI and TUI (terminal user interface) that orchestrates identity creation, relationship building, and credential exchange — making the complex machinery of decentralized trust accessible to end users.

## What It Does

OpenVTC implements the [[first-person-network|First Person Protocol]] for the "Know Your Developer" use case. From a user's perspective:

1. **Set up your account** — bind the TUI to your [[verifiable-trust-agent|VTA]] (a managed one on the VTA Farm or your own — see [[vti-setup]]); since June 2026 setup mints *no* persona — personas are created from the dashboard when you first need one
2. **Create personas** — mint Persona DIDs ([[did-webvh|did:webvh]]), optionally with a human-readable **agent name** (`example.com/@alice`, shown wherever a DID would be)
3. **Connect with people** — send and accept relationship requests over [[trust-spanning-protocol|TSP]] or [[didcomm|DIDComm]]
4. **Build your trust network** — exchange [[relationship-credential|Relationship Credentials]], receive [[endorsement-credential|endorsements]], get [[witness-credential|witness attestations]]
5. **Participate in communities** — join VTCs by DID *or* agent name (presenting a [[invitation-credential|Verifiable Invitation Credential]] where required, or sending an open request for admin approval), and belong to **multiple communities at once**, each under its own persona; see which capabilities each community has enabled
6. **Sign your commits** — set up [[verifiable-git-infrastructure|did-git-sign]] so git commits are signed by a VTA-held key that a community's Trust Registry authorises

Behind the scenes, OpenVTC orchestrates the VTA (for key management and the credential vault), TSP/DIDComm messaging on the TDK's reliable delivery layer (for communication), and Trust-Task documents (for every protocol exchange).

## Components

The workspace is two crates (version **0.3.1** at the `Cypress` tag; v0.3.0 was the last tagged release):

### openvtc
The user-facing TUI binary (formerly `openvtc-cli2`). The unsuffixed name is intentional, matching the convention used by uv, ruff, deno, and cargo. Main-menu panels:

- **Inbox** — real-time task processing (auto-handles trust-pongs, relationship finalization, rejections; queues interactive tasks; detail views for inbound/outbound requests, VRCs, pings, informational messages)
- **Communities** — overview of memberships with favourites, a **Ctrl+K** switcher, join (`j` — by community DID or agent name, optional VIC paste), per-community **Capabilities** panel (`c`), leave/archive
- **Relationships** — list/detail/new-request views, inline alias editing, R-DID privacy toggle, trust-ping with RTT latency
- **Credentials** — Received/Issued tabs, raw VRC JSON in detail view, clipboard copy, VRC request and removal
- **VTA** — transports the VTA advertises (TSP / DIDComm / REST), persona **agent names** management (`g`), VIC list, key count, backend type
- **Settings** — inline editing, config export/import, passphrase protection management, hardware token detection, factory reset
- **Logs** — scrollable, transport-attributed, 200-entry durable activity log with copy
- **Help/Status**, **Quit**

It also has a non-TUI subcommand, **`openvtc health [--vtc <did>] [--json]`** (0.3.1), which probes the VTA, mediator, DID hosting, and optionally a community, with graded results.

### openvtc-core
Shared library (`publish = false`): config (v2 `Account` / `PersonaRecord` / `CommunityRecord` / `IdentityRegistry`), BIP-32 key derivation, relationship state machines, `messaging.rs` (a pure protocol state machine), `didcomm.rs` (the transport, built on `affinidi-messaging-delivery`, with stored-mail pickup), `tsp.rs`, `agent_name.rs`, `capabilities.rs`, `presentation.rs` (DCQL → consent summary → `vp_token`), `join.rs`, `health.rs`, and OpenPGP card support. MSRV 1.95, edition 2024.

### Crates that have left the workspace
- **`did-git-sign`** — the git/SSH signing helper that uses the VTA as a signing oracle was developed and dogfooded here (auto-configured by the setup wizard since v0.1.6; per-repo persona selection since T8) and then **extracted to its own repo, [[verifiable-git-infrastructure|Verifiable Git Infrastructure (VGI)]], in July 2026** (#159). OpenVTC now consumes the published crate (0.4.5 at Cypress) only for `init::install/uninstall` and signing config, and pins VGI's `verify-trust` GitHub Action for its own CI. A standing obligation recorded in `Cargo.toml`: VGI's `vta-sdk` line must track OpenVTC's, or two `vta-sdk` copies land in the binary.
- **`openvtc-service`** (background DIDComm daemon) and **`robotic-maintainers`** (auto-accept test service) were removed in v0.2.1 (#63); the daemon's role is covered by the TUI's own messaging runtime, and the test-fixture role moved to the in-tree mediator harness. **`openvtc-cli`** (legacy prompt-driven binary) was deleted in v0.2.0.

## Identity Model

OpenVTC uses a two-layer identity model:

- **Persona / Membership DIDs** — your public identities, one per community membership, created as [[did-webvh|did:webvh]] hosted on the domain of your choice (via the VTA's configured DID host) and optionally claimed by an **agent name** in `alsoKnownAs`
- **Relationship DIDs (R-DIDs)** — private `did:peer` identifiers, one per relationship, so your persona DID isn't exposed in every interaction

A name is only ever *displayed* if it forward-resolves and round-trips back to the labelled DID (user alias → verified agent name → truncated DID); the DID, never the name, is what gets persisted.

## Configuration

OpenVTC uses a three-tier configuration system:

| Tier | Storage | Contents |
|------|---------|----------|
| **PublicConfig** | JSON on disk | Non-sensitive settings |
| **SecuredConfig** | OS keyring/keychain | Cryptographic secrets |
| **ProtectedConfig** | Encrypted inside PublicConfig | Sensitive data encrypted with unlock code |

Protection modes:
- **Unlock code** — encrypt with a user-provided passphrase (HKDF-SHA256 + random nonce)
- **Plaintext** — no encryption (development only)
- **Hardware token** — encrypt via OpenPGP card (Nitrokey/YubiKey)

Multiple profiles are supported via the `OPENVTC_CONFIG_PROFILE` environment variable or `-p` flag.

## Recent Development

The focus has moved from security correctness (v0.1.x), through feature completeness (v0.2.0), through the multi-community pivot (`Banyan`, June 2026), to **making the multi-community client reliable and humane**: the July–August cycle (83 commits, PRs #152–#237) shipped **v0.3.0** — the join ceremony's asynchronous half — plus **agent names**, TSP as a live transport, a per-community Capabilities panel, the reliable delivery layer underneath, and the extraction of did-git-sign into VGI; it ends in the coordinated **`Cypress`** release ([[coordinated-releases]]).

### Relationship model rework + responsiveness (r14) — 2026-08-17/31 (#229–#274)

Post-Cypress cycle (44 commits, PRs #229–#274), two threads running in parallel: a breaking rework of what a relationship and its credentials expose, and a sweep ("r14") that pulls every blocking network call off the TUI's single state-handler thread.

**Relationship privacy, made the default and made to matter.** A [[relationship-credential|Relationship Credential (VRC)]] issued under the persona DID was worse than the handshake it followed — the durable copy either side may publish to a [[decentralized-trust-graph|Trust Graph]] correlates every relationship a persona holds for as long as anyone keeps it, while the handshake DIDs are seen once, by the mediator. Two commits fix it in sequence:

- **Pairwise R-DID is now the default** for a new relationship request or accept (#254), flipping the inbox's unshifted `a` to the private outcome (Shift+A still works for muscle memory; the persona-DID accept moves to `p`). The commit is explicit about what the default doesn't buy: the three handshake messages (request/accept/finalise) still route persona-to-persona, because the mediator has to route them before a pairwise channel exists, and full pairwise operation is tracked as upstream protocol work (verifiable-trust-infrastructure#1054), not something this client can close alone.
- **The VRC itself now issues under the relationship DID, not the persona** (#255) — breaking on the wire, with no compatibility window since nothing was published yet. `vet_vrc_issued`'s gate 2 now requires the issuer to match the DID the sender actually uses *in that relationship*, tighter than the persona-DID check it replaces. This only became possible once the VTC side stopped pinning a published VRC's issuer to the authenticated session DID (verifiable-trust-infrastructure#1061).

Related credential-hygiene fixes in the same window: an ingested [[invitation-credential|invitation]] must now carry the DTG common structure (`@context` + `type`) or is refused at ingest, breaking since nothing previously checked it (#256); OpenVTC can now assert personhood to a community over Trust Tasks, with a spoken "match code" derived from the challenge id so a human in the room can confirm the ceremony (#257); the reciprocal [[membership-credential|membership credential]] and the VRC each gained their own stable `id` — both had shipped with none, so every reciprocal VMC was silently rejected by a community keying on it (#260, #265); a join now closes when the reciprocal VMC is sent, instead of sitting `Approved` indefinitely (#266); and a membership grant is now acknowledged by digest, with the credential we sent kept on the record instead of dropped (#272).

**Account rebuild (D8/D18).** Setup used to write a fresh set of personas into whatever Trust Context it was pointed at without checking what was already there, silently doubling an account on a mistyped or reused context id (#247). The fix adds a probe, then a full rebuild path: reconstruct an account — personas, keys, and verified memberships — from what the [[verifiable-trust-agent|VTA]] holds (#248), turn a verified plan into an account (#249), and offer recovery from the setup wizard when an occupied context is detected (#250). The key move: a membership isn't looked up and then checked against a credential, it's read *out of* the credential, since the community's signed VMC names both issuer and subject — which is what makes rebuild resistant to a hostile VTA inventing memberships. #251 fixed the rebuild against a live VTA (VMCs weren't being stored at the vault at all, and the vault's deliberately non-enumerable query contract was being misread as "zero credentials").

**Responsiveness (the "r14" sweep).** OpenVTC runs one state-handler loop that also services inbound DIDComm, listener lifecycle, and every keystroke, so any network action awaited inline on that thread freezes the whole TUI, not just its own overlay — worth calling out for a terminal client, where a frozen screen looks indistinguishable from a crash. The sweep first made the loop's `Action` match exhaustive so the main and degraded loops can't silently drift apart again (#236, closing a gap where agent-name verbs and the whole settings surface were dead keys in the second loop), then moved one blocking class after another off it: the VIC list and startup listeners, so Enter is no longer ignored while listeners come up (#230, #233), agent-name verbs — the worst offender at up to two minutes per mutation (#237), VIC vault mutations (#239), capability documents (#242), community-leave and VMC issuance (#243), and the last two, VRC requests and persona minting (#244). #245 then lifted the whole ~900-line match out of `main_loop` into a tested module — the seam that would have caught #236's own exhaustiveness fix shipping broken under `--no-default-features`.

Smaller fixes in the same run: the mediator DID field in Settings is now read-only and stops reporting a save that never happened (#274); a cross-mediator join now builds its TSP hop list starting at our own mediator instead of the peer's, fixing federated joins (#273); OpenVTC now recognises its own device binding by the DID it authenticates as, rather than a first-launch-only id, fixing a false "also open on this machine" warning (#261); dependency floors moved to vta-sdk 0.32, trust-tasks 0.17, and a TDK auth fix (tdk-common 0.6.8 / did-auth 0.3.11).

### v0.3.0 — 2026-08-15 — the join ceremony's asynchronous half; `Cypress` — 2026-08-17

The first tagged release since v0.2.0 (21 May) — 0.2.1 was written up but never tagged, so it ships here too. The theme: a community's reply must reach the applicant *whether or not* it happened to be connected when the reply was sent, and a join left unresolved is reconciled by *asking* rather than waiting. Four fixes, all to the same class of bug (a join sits `Pending` while the community's outbox reports `Sent`, and relaunching the app "fixes" it):

- **Connect the applicant persona before submitting** (#217) — auto-admitted joins returned VMC + VEC in under a second while the persona's socket came up ~29 s later, so both credentials were stored at the mediator and never pushed.
- **Collect stored mail on connect** (#218) — a mediator live-streams only to a recipient connected at that instant, and redelivers a stored inbox only when a new socket *displaces* an old one; `Messaging::pickup_stored` now drains message-pickup 3.0 on every connect (ack *after* handoff, 200 per connect), and the messaging runtime starts **before** the State-A branch so a first-run join has a live socket.
- **Ask a community about a join it has not answered** (#219) — `join-requests/status/0.1` had only its receiving half implemented; a minute tick now polls each `Pending` join with an immediate poll at launch, per-record backoff 1 → 2 → 4 → 8 min capped at 15, ≤4 polls per tick; the community's own `requestId` is adopted from `refer`/`request_more` verdicts (`CommunityRecord::request_id_confirmed`); the poll takes the transport the submit took.
- **0.3.1** (08-16, untagged but at `Cypress`): a first-run join could never be answered (#221); `openvtc health` with live progress (#222); poll a join **without** knowing its request id (#226, with VTC #985); prefill the community from a pasted VIC and drop a phantom setup step (#227); an explicit paste row and **13 unreachable setup pages (~3,800 lines) removed** (#228); say so when a mint comes back without TSP (#223); never drop an inbound message already acked (#224).

**Cypress**: `VTI-Cypress-RC-0` (07-31, #203), `VTI-Cypress-RC-1` (08-11, #210), `Cypress` (08-17, #229 — trust-tasks 0.9 / vta-sdk 0.25 / did-git-sign 0.4.5, workspace 0.3.1). Post-Cypress (#230–#237): VIC list and startup listeners moved off the event loop, State-A fixes (agent names, identity removal, settings before a community exists, #235), exhaustive action matches so loop divergence cannot recur (#236), agent-name verbs off the state-handler loop (#237, first "R14" perf batch), the TDK auth-refresh fix (#232). Caveat: the CHANGELOG does not cover #152–#203 (agent names, VGI, capabilities, delivery, TSP) — commit history is ground truth for those.

### Agent names — 2026-07-22/23 (#163–#182)

OpenVTC is the *display* side of the ecosystem's agent-names story (the [[affinidi-tdk|TDK]] resolves, [[affinidi-webvh-service|did-hosting-service]] serves `/@name`). `openvtc_core::agent_name` delegates to the TDK `agent-names` crate; a name is shown only if it forward-resolves **and round-trips back to the labelled DID** (spoof guard), cached in `ProtectedConfig` (24 h TTL, 5-min negative TTL) with an off-loop refresh sweep. Precedence on every DID surface: user alias → verified agent name → truncated DID (#165, #174–#182, #179). Input: the join VTC-DID entry and relationship requests accept `example.com/@name` (#166) — the DID is persisted, never the name. Personas' names are managed from the VTA panel via six `did-management/agent-name` Trust Tasks with a confirm-before-remove (#167, #169). Three rules were added to the repo's CLAUDE.md.

### Capabilities, TSP, delivery layer, VGI — July 2026

- **Per-community Capabilities panel** (#157/#158): `governance/capability/list` over DIDComm; enabled/available/delegated rows, manifest detail, enable/disable documents signed `eddsa-jcs-2022` by the persona; wire code from the published `trust-tasks-capability-client`.
- **TSP as a live transport**: the VTA panel stops misreporting a TSP VTA (#187); trust tasks over a TSP leg of the session with bounded discovery and DIDComm degrade (#196); the **join ceremony over TSP** when the community offers it (#201; `openvtc_core::tsp`); reopen TSP after bootstrap rather than falling back to REST (#207); record the submit transport and refuse a community that advertises none (#210); choose TSP only when *our own* mediator can carry it (#211); `add_tsp_service: true` on mint (#213).
- **Messaging rebuilt on the delivery layer** (#191–#195): the DIDComm transport moved into `openvtc-core`, `ListenerSpec` replaces the framework type, production messaging runs on `affinidi-messaging-delivery` (one `DidCommTransport` per identity, `Delivery::Guaranteed` outbox, `dispatch_inbound` replaces the Router; `affinidi-messaging-didcomm-service` dropped), and a supervisor rebuilds a listener whose ATM died.
- **DCQL consent** (#197): `openvtc_core::presentation` — held credentials → `evaluate_query` (DCQL) → `DisclosureRequest` → `present` (`vp_token`). Re-scoped the old D4 open item: the verified path is `credential-exchange/query|present`, not the submit-slot VP.
- **VGI / did-git-sign** (#152–#160): `did-git-sign verify-trust` (sshsig parsing, DID-document key match, TRQP authorization against the VTC Trust Registry, fail-closed), PGP exemption keyring + composite GitHub Action, org-fallback grants + committed web-flow platform keyring — then the whole thing **extracted to [[verifiable-git-infrastructure]]** and consumed as a published crate (#159), with the Action pinned (#160).
- Also: the `spec/vtc` Trust-Task registry authority followed (#171–#173, #190); untrusted strings cut on character boundaries, not byte offsets — a remote panic found by fuzzing (#202); completed task trackers archived (#162), cross-service networking discipline recorded (#161).

### June 2026 — multi-community executed (T1–T9 complete) + VIC join flow — `Banyan` milestone

The entire multi-community plan landed in a single month (80 commits, PRs #69–#149; ~21,600 insertions). The window ends with a lightweight milestone tag, **`Banyan`** (2026-06-22, at PR #148) — note the shift from `vX.Y.Z` tags to codenames. At the time the workspace version was still 0.2.1 and the changelog hadn't caught up (it did in v0.3.0); commit history, the DRAFT v5 spec, and the tag were ground truth.

**T1–T9 all complete.** Beyond the T1 foundation (config v2 + supervised multi-session manager, one recoverable DIDComm task per community session, #110/#111), the slices landed in order: `context_path` hierarchy mirroring `vti-common` validation (T2, #112); State-A bootstrap split from the monolithic ~19-step wizard — account bootstrap mints **no** persona DID (T3, #113); communities overview with favourite toggle and a **Ctrl+K community switcher** (T4, #114); join flow with identity choice — reuse a persona or mint a fresh `did:webvh` — and live session registration without restart (T5, #115/#116); pending-resolution lifecycle with the 7-day timeout → Expired (T6, #117); leave / archive / inactive-only delete with read-only styling (T7, #118); `did-git-sign` per-repo persona selection (T8, #119); and end-to-end integration tests against a real mediator and VTI's `MockVta` (T9, #120–#122).

**The join path got real — Verifiable Invitation Credentials + verdict-model admission.** The spec's "stub VP" placeholder (deferred decision D4) was replaced within the same window by a concrete credential mechanism:

- Join over DIDComm: submit_join to the VTC (#69), submit-receipt reconciliation (#71), credential delivery flipping Pending → Active (#72), minted-persona rollback on failed join (#74, #123), **one DIDComm listener per persona** (#79) — the messaging backbone of multi-community.
- **[[invitation-credential|VIC]] presentation at join** (#127), VIC storage in the VTA credential vault (#130), **subject-linkage proof** to join under a fresh DID (#131), full VIC lifecycle management from the VTA panel (import/archive/soft-delete/restore/purge, #136).
- **Verdict-model join** (#136): a `VerdictResponse` drives admission — allow → Active, deny → Rejected, refer/request_more → Pending — plus DIDComm problem-report handling, fixing joins that previously sat stuck Pending for 7 days on rejection.
- Join UX/robustness burst (#137–#145): community-matched VIC selection, Trust Task document framing, W3C-compliant join VP, identity-first join with per-persona VIC badges.
- **Multi-membership + reciprocity**: multiple memberships per community under distinct personas (#146); issuing a **reciprocal member VMC** back to the community (#147) and auto-answering a VTC `members/request-vmc` (#148 — the `Banyan` commit). Membership is now bidirectional in practice, matching the spec's bi-directional edge model.

**Supporting streams in the same window:**

- **R-series architectural hardening** (R17–R27, #89–#109): protocol state machine hoisted into `openvtc-core` (new 1,800-line `messaging.rs`), `Arc<Mutex>` flattened out of the domain model, typed credential registry replacing string-matched VC kinds, typed VTA/Auth errors, a TUI architecture design doc.
- **TUI responsiveness** (#92–#97): background-dispatch pattern for network actions, coalesced/offloaded `Config::save`, Argon2 KDF off the async runtime, cancellable mid-flight join/setup.
- **Security & privacy fixes** (#82–#88): `VRCIssued` now gated on relationship, issuer binding, and proof verification; private-config contents no longer logged; DIDs truncated in handler logs; private key redacted from `did-git-sign` debug output; fuzzing groundwork (#125/#126) with feature-gated `Arbitrary` derives on parse-surface types.
- Final fix of the window (#149, 06-27): repair R-DID `key_info` ids that caused a mediator auth loop.
- Dependency escalation tracking VTI's cadence: vta-sdk 0.10 → 0.17 → 0.18.1 plus affinidi-tdk 0.8 in ten days — OpenVTC is functioning as the reference client for the VTI stack.

**Still open at the time:** VP requirement discovery (D4 — re-scoped in July by #197 to the `credential-exchange/query|present` path), persona key rotation (still open), per-community capabilities (shipped July, #157).

### Post-v0.2.1 — multi-community design + T1 implementation

Design and implementation of OpenVTC's multi-community pivot are landing in slices on top of v0.2.1.

- **Multi-community design spec** (PR #65, 2026-06-03) — `docs/design/multi-community-support.md` DRAFT v4 + presentation deck. Decisions D1–D17 settle persona-per-community choice (user picks per join, lazy persona creation), VTA-as-system-of-record (the local config holds only references and UX prefs; the VTA stores personas/keys/credentials), breaking-reset migration (v1 configs are *not* migrated; the CLI detects, informs, deletes, and runs setup from scratch), per-community read-only / archive / delete lifecycle, supervised concurrent sessions (one supervised task per community session, failure-isolated), 7-day client-side pending-join timeout, `did-git-sign` per-repo persona selection. `tasks/plan.md` + `tasks/todo.md` give the dependency-ordered T1–T9 breakdown across four phases.
- **T1 active-identity API sketch** (PR #66, 2026-06-04) — pins `IdentityContext` / `IdentityRegistry` (in `openvtc-core`) and the persona-keyed multi-session manager built as a thin layer over `affinidi-messaging-didcomm-service` 0.3.3 (whose listeners are already independent, auto-restarting tasks with dynamic add/remove). N=1 single-community on the new architecture is T1's exit criterion.
- **VTA hierarchical contexts + MockVta folded in** (PR #68, 2026-06-04) — VTI shipped server-enforced hierarchical context paths and a `MockVta` test harness; the multi-community spec dropped its "convention now, migrate later" sub-context fallback in favour of the canonical server-enforced model (D2/D9 updated). Spec → DRAFT v5.
- **T1 implementation slice** (PR #67, 2026-06-07) — additive config v2 in `openvtc-core`: `Account { vta_did, vta_url, top_context_id, personas, communities }`, `PersonaRecord` (self-contained `did:webvh`, VTA-managed `KeyRefs`), `CommunityRecord` (persona_ref, status, favourite, archived, member_since, per-community relationships and VRCs), `CommunityStatus { Pending, Active, Left, Rejected, Removed, Expired }` with `is_active`/`is_read_only`/`is_inactive`/`needs_attention`, stable-UUID `PersonaId` (rotation-safe). Persona-keyed `IdentityRegistry` resolves communities → personas; a **reused persona yields one shared DIDComm session serving multiple communities** (matches the DIDComm `DuplicateDid` constraint and the chosen isolation model). Still additive — not yet wired into the live `Config` / load / save path; the consumer refactor, `IdentityContext`, and breaking-reset land in subsequent slices.

### v0.2.1 — 2026-06-03 — nine CLI security/hardening fixes + crate retirement

- Nine CLI security and hardening fixes (PR #61)
- Minor dependency updates (PR #60); `arboard::Clipboard` import fix; `vta-sdk` bump to 0.7 (PR #62)
- **`openvtc-service` and `robotic-maintainers` crates removed** (PR #63). The DIDComm daemon role is covered by the TUI's own DIDComm session integration; the auto-VRC-issuance fixture is no longer needed alongside the in-tree mediator harness. Workspace members, README, CONTRIBUTING, and SECURITY updated. Historical CHANGELOG entries preserved. Closes #21 (the secure-storage-backend work for `openvtc-service` is obsolete).
- Workspace bumps: `vta-sdk` 0.7 → 0.9; `criterion` 0.7 → 0.8 (PR #64).

### v0.2.0 — 2026-05-05 — major release (workspace consolidation + full TUI)

Headline functional changes:

- Workspace consolidation: the active CLI binary `openvtc-cli2` renamed to `openvtc` (matching the uv / ruff / deno / cargo convention); the supporting library `openvtc-lib` renamed to `openvtc-core`; the legacy prompt-driven `openvtc-cli` deleted
- Full TUI main menu — eight panels: Inbox, Relationships, Credentials, Settings, VTA Service, Logs, Help/Status, Quit. Real-time inbox task processing, inline alias editing, R-DID privacy toggle, trust-ping with RTT latency, raw VRC JSON in detail view, scrollable activity log
- DIDComm service integration replacing ~370 lines of manual messaging with `affinidi-messaging-didcomm-service` 0.2 (Router-based dispatch, automatic reconnection, message pickup, multi-DID listener support, periodic 60s keepalive)
- R-DID generation for both BIP32 and VTA backends, with dynamic R-DID listeners auto-added so message delivery works to relationship-specific DIDs
- VRC issuance from inbox with DataIntegrityProof signing; VRC rejection with message back to requester; friendly name in relationship requests, auto-set as contact alias on accept
- `ratatui` and `dialoguer` dependencies removed from `openvtc-core` so daemon and automation crates no longer pull in TUI deps transitively

Security pass folded into the same release branch:

- Per-entry random Argon2 salt with transparent v1→v2 migration for `derive_passphrase_key`. The previous deterministic salt = SHA-256(info) meant two operators with the same passphrase produced byte-identical KEKs; the new `passphrase_encrypt_v2` writes a magic-prefixed `[OPV2 | salt(16) | nonce(12) | ct+tag]` blob with a fresh random salt; decrypt auto-detects v1/v2. Argon2id parameters bumped to the OWASP "high-value KEK" floor (m=128 MiB, t=4, p=1)
- `did-git-sign` signing-policy hardening: the proxy refuses to sign unless the parent process name starts with `git` or `ssh-keygen`, and writes every signing attempt (accepted or denied) to `~/.config/did-git-sign/audit.log` (mode 0600)
- DIDComm replay window + 1024-entry seen-message LRU in `process_inbound_message`: drop messages outside ±48h / +5m skew, drop expired, dedupe by ID
- Tagged-variant downgrade defence on `SecuredConfigFormat`: switched the on-disk variant tag from `#[serde(untagged)]` to `#[serde(tag = "format")]` so every blob carries an explicit discriminator
- W3C DID Core 1.0 syntax parser replacing the previous `did:` prefix check; rejects bidi-override / zero-width chars in DID fields
- Inbox display-name sanitisation strips bidi/control/ANSI; bounded DIDComm event channel (256-entry capacity); `did.jsonl` write path is now the resolved profile dir
- Three community PRs folded in: profile-name validation hardening (#57); cross-platform config paths via `dirs::config_dir()` on Windows (#51, closes #47); `SecuredConfig` serde-format hardening (#34)

Test & CI changes:

- New in-process mediator harness wrapping the upstream `affinidi-messaging-test-mediator` 0.2 fixture; drops ~400 lines of in-tree fixture code and four dev-deps
- End-to-end integration tests drive a real Alice → Mediator → Bob DIDComm round-trip, a `RelationshipRequestBody` round-trip, and a two-leg VRC request/reject — all in ~350 ms once the mediator is up
- 38 new unit tests: setup-flow navigation (25 table-driven), BIP32 derivation (7 known-answer vectors), AES-GCM tampering (6)
- CI adds `cargo-deny` (advisories + licenses + bans + sources) and `cargo-llvm-cov` coverage; MSRV bumped 1.91 → 1.94

### v0.1.6 (did-git-sign integration) — 2026-04-30

- Auto-configure `did-git-sign` as part of setup wizard
- Uninstall (lib + CLI subcommand)
- Show `did-git-sign` principal + SSH key on help screen
- SSH-aware clipboard with OSC 52 + arboard fallback
- `--credential` paste replaced with online VTA provisioning
- `AdminRotated` provisioning intent

### v0.1.5 — 2026-04-15

- BIP32 seed and imported key material moved from plain `String` to `SecretString`
- Windows PowerShell examples and Windows secure-storage documentation

### v0.1.4 — earlier April 2026

- VRC `valid-until` prompt handling fix

### v0.1.3 — earlier April 2026

- Fixed a deterministic encryption vulnerability in unlock-code encryption (replaced seeded PRNG with HKDF-SHA256 + random nonce, with transparent legacy migration)

See also: [[verifiable-trust-agent]], [[first-person-network]], [[decentralized-trust-graph]]
