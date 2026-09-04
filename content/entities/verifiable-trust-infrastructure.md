---
title: "Verifiable Trust Infrastructure (VTI)"
type: entity
tags: [vti, infrastructure, workspace, primary, cypress, tsp, trust-tasks]
date-updated: 2026-09-04
repo: https://github.com/OpenVTC/verifiable-trust-infrastructure
---

# Verifiable Trust Infrastructure (VTI)

*Repo: [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Infrastructure is a Rust workspace containing the core services that power [[verifiable-trust-community|Verifiable Trust Communities]]. It's the infrastructure layer of the OpenVTC ecosystem — the plumbing that makes decentralized trust work.

## Components

The workspace has grown to **26 members**: in late July 2026 the monolithic `vta-service` was decomposed into eleven subsystem crates (`docs/05-design-notes/vta-service-decomposition.md` — vta-service/src shrank from ~114k to ~87k lines, −23%), on top of the June additions (secrets, AI-agent, VTC-client, fuzzing). Versions shown are those in the coordinated **`Cypress`** release ([[coordinated-releases]], 2026-08-17); ★ = new since July 2026.

| Crate | Purpose | Cypress |
|-------|---------|---------|
| **[[verifiable-trust-agent\|vta-service]]** | The VTA server "spine" — HTTP routes, Trust-Task dispatch, messaging bridge, orchestration; re-exports the subsystem crates | 0.17.0 |
| **vta-sdk** | Public client SDK / data model — consumed by eight sibling repos (OpenVTC, did-hosting-service, the TDK mediator, VGI, the browser plugin's type bindings …) | 0.25.0 |
| ★ **vta-config** | `AppConfig` TOML shape and sub-configs | 0.3.8 |
| ★ **vta-keyspaces** | Keyspace-name registry (shared storage vocabulary) | 0.1.4 |
| ★ **vta-audit** | `audit!` tracing macro + audit-keyspace persistence | 0.1.6 |
| ★ **vta-keys** | Master-seed storage, BIP-32 derivation, key wrapping, seed-store backends — and, since 0.2.5, non-extractable internal keys | 0.2.5 |
| ★ **vta-vault** | Holder credential vault: store / query / receive / verify / present / status-refresh — Data Integrity, BBS, SD-JWT and (since 0.3.0) ISO mdoc | 0.3.0 |
| ★ **vta-webvh** | WebVH hosting infrastructure: DID-record store, client to a did:webvh host, DID-auth handshake | 0.1.9 |
| ★ **vta-policy** | Regorus (Rego) Policy Decision Point, default policy bundle, consent model, decision evaluators | 0.2.7 |
| ★ **vta-support** | Mid-layer services: trust-context storage, sealed-transfer helper, sealed-bootstrap nonce store | 0.2.7 |
| ★ **vta-tee** | Nitro / SEV-SNP attestation providers, KMS attest/decrypt + storage-key derivation, anchor MAC, first-boot DID autogen | 0.1.8 |
| ★ **vta-backup** | Encrypted full-state export/import, sealed backup-bundle store + TTL sweeper | 0.1.10 |
| ★ **vta-sweepers** | Background TTL sweepers (ACL grant expiry, pending consent, soft-deleted vault purge) | 0.1.3 |
| **vta-enclave** | AWS Nitro Enclave binary (TEE mode) — *not published* | 0.7.7 |
| **vta-mobile-core** | UniFFI engine behind the Authenticator + PNM mobile apps (DIDComm/TSP, Trust Tasks, AAL step-up); Android AAR / iOS xcframework | 0.6.18 |
| **vta-mcp** | MCP stdio server bridging VTA capabilities to MCP hosts like Claude Desktop — *not published* | 0.1.5 |
| **vti-webauthn** | DID-VM-resolved WebAuthn verifier | 0.1.1 |
| **vtc-service** | [[verifiable-trust-community\|VTC]] daemon — community lifecycle, policies, credentials, public website, admin UI — *not published* (`publish = false`) | 0.11.58 |
| **vtc-client** | Thin client SDK for a VTC — the VTC counterpart to vta-sdk | 0.3.7 |
| **vti-common** | Shared auth, ACL, storage, config, error handling; `context_path` (hierarchical contexts) | 0.12.1 |
| **vti-secrets** | Pluggable secret-store backends (plaintext, HashiCorp Vault, KMS/TEE, Kubernetes Secrets) | 0.1.14 |
| **vta-cli-common** | Shared CLI command implementations | 0.11.0 |
| **cnm-cli** | Community Network Manager (multi-community client) | 0.11.22 |
| **pnm-cli** | Personal Network Manager (single-VTA client) | 0.12.6 |
| **didcomm-test** | DIDComm connectivity test harness — *not published* | 0.6.9 |
| **tests/e2e** | In-process end-to-end harness (MockVta / MockVtc) — *not published* | 0.6.0 |

(`vti-fuzz` is a nested cargo-fuzz workspace, not a member.) Layering: L0 vti-common / vta-sdk / vti-secrets → L1 keyspaces / config / audit → L2 support / keys / vault / webvh / policy → L3 tee / backup / sweepers → L4 vta-service.

The `vti-didcomm-js` crate (JavaScript DIDComm primitives + spec test vectors) was extracted into its own repository in May 2026 — see [[vti-didcomm-js]]. **Publishing** moved in August 2026 to **release-plz** (#938): merging a PR is no longer releasing — release-plz keeps one `chore: release` PR open, and merging *that* tags each crate (`<crate>-v<ver>`), generates per-crate CHANGELOGs from conventional commits, runs `cargo-semver-checks`, and publishes via crates.io trusted publishing (GitHub OIDC). 20 of 26 crates publish; the six internal ones are vtc-service, vta-enclave, vta-mcp, vta-mobile-core, didcomm-test, vti-fuzz.

## How It Fits in the Stack

VTI sits in the middle of the ecosystem stack:

```
┌─────────────────────────────┐
│  OpenVTC CLI / TUI          │  ← User-facing tools
├─────────────────────────────┤
│  VTI (VTA + VTC services)   │  ← This layer: key management, signing, coordination
├─────────────────────────────┤
│  Affinidi TDK + WebVH       │  ← DID resolution, messaging, DID hosting
├─────────────────────────────┤
│  didwebvh-rs                │  ← DID method implementation
└─────────────────────────────┘
```

Applications at the top (like [[openvtc|OpenVTC]]) use VTI to manage keys and sign things. VTI in turn uses the [[affinidi-tdk|Affinidi TDK]] for DID resolution and messaging, and the [[affinidi-webvh-service]] for DID hosting.

## Dependencies

Key external dependencies:
- `affinidi-tdk` (0.8.5, enforced-authcrypt line) — DID resolution, messaging, data integrity proofs; `affinidi-messaging-delivery` — the reliable outbox layer both services now run on; `affinidi-tsp`
- `trust-tasks-*` 0.9 — the ToIP Trust Tasks document framework every wire operation is expressed in
- `didwebvh-rs` 0.6 — did:webvh operations
- `dtg-credentials` 0.2 — trust graph credential types (DTG Core Credentials WD01)
- `affinidi-mdoc` — ISO mdoc; `regorus` — Rego policy engine
- `fjall` — embedded key-value storage
- `axum` — async HTTP framework
- `ed25519-dalek` 3 / `curve25519-dalek` 5 — Ed25519/X25519 cryptography (SLIP-0010 derivation now in-tree)

## Tech Stack

- **Language**: Rust (edition 2024, `rust-version` 1.95)
- **Async runtime**: Tokio
- **HTTP**: Axum 0.8
- **Storage**: fjall (embedded LSM)
- **Crypto**: ed25519-dalek 3, x25519-dalek, p256
- **Auth**: EdDSA JWTs, DIDComm challenge-response

## Recent Development

This page is the canonical activity log for the VTI workspace. The [[verifiable-trust-agent|VTA entity]] keeps a focused, VTA-relevant subset. Implementation continues to evolve quickly; treat low-level details as in flux.

The July–August cycle (≈340 commits, PRs #625 → #1008 since 2026-07-06) is the VTI's third consecutive record month, and it ends in the coordinated **`Cypress`** release ([[coordinated-releases]]) — the first tree-named milestone to go through formal release candidates (`VTI-Cypress-RC-0` 08-02, `VTI-Cypress-RC-1` 08-11) and the first cut as a crates.io-published snapshot under the new release-plz process. Thematically the month was about *converging*: every wire operation folded onto the canonical ToIP **Trust Tasks** registry URIs; the three approval mechanisms collapsed into **one approvals model**; the `vta-service` monolith was **decomposed** into eleven subsystem crates; and TSP went from opt-in feature to a *selectable* transport a VTA can run without DIDComm at all. New capabilities arrived too — **ISO mdoc** receive/present, **non-extractable internal keys**, a hardened non-TEE mode, Nitro tenant config over vsock — but the dominant signal is a codebase preparing for a 1.0 shape.

### Data rooms end to end — 2026-09-03/04 (#1237–#1248)

The design note's storage, dispatch, MLS and host layers landed in a two-day burst (10 PRs; #1237 alone is nine stacked commits). A **data room** is a shared space authorized purely by credentials the room itself issues — the storage row carries owner, visibility, epoch and retention, and deliberately **no member list**: the day this service keeps a roster is the day a room can no longer move host without reissuing credentials (#1237). Trust-Task dispatch (`rooms/{create,records/{put,get,list},epoch/mint}`) runs against hand-written wire types pending generated bindings from `dtgwg-trust-tasks-tf#346`; a new `vtc-client::rooms` client surface (`RoomSession`, chain depth capped at 8) and two new did-templates (`room`, `room-host`) round out the open tier.

The group-key half is OpenMLS behind an off-by-default `mls` feature: one leaf per member (their VTA), storage keys derived from the group's exporter under a room-specific label so sealing can't weaken the group's own messaging, and `epoch_authenticator` anchored in the room's witnessed DID log so a host acting as delivery service can't fork the group undetected. Every record's AEAD associated data commits to `roomId|key|version|epoch` — the same binding discipline `vti_common`'s store encryption already applies to keyspace values — so a host holding every byte still cannot relocate one. **`room-host`** is the new binary this unlocks: a delivery-only service with no roster, no policy engine and no credential issuance, serving topology T1 (self-hosted rooms) without standing up a whole VTC.

#1241 moves the group-key and sealing layers out of `vtc-client` into a new **`vti-rooms`** crate, because a VTA must not depend on a VTC client and `rooms/keys/open` needs both layers inside `vta-service`. Chain verification landed behind a `ChainVerifier` seam (**`vti-rooms-dtg`**, `publish = false` pending a [[dtg-credentials]] 0.6 crates.io tag) so the storage crate stays reusable by hosts that resolve DIDs differently — a host configuring no verifier gets `RefusesEverything` on every tier. The pooling defence compares the chain's *root* subject rather than its leaf, so an agent's attenuated chain still refuses a presentation rooted at the wrong member. Private (sealed) rooms remain refused outright: the same-subject proof would need to be zero-knowledge, and which proof is a profile the DTG cred-spec puts explicitly out of scope.

Rounding out the family: lifecycle per the design note's §9 (`Live → Lapsed → Dormant → Reclaimable`, computed rather than stored so the host never decides, #1242); per-record curation — `rooms/records/curate/0.1`, retract/purge/deprecate as tombstones so incremental sync converges rather than resurrecting deleted records (#1245); audit that records `Member` rather than a DID on private rooms, so the trail itself cannot leak the membership a private room exists to hide (#1244); and group custody — `GroupSnapshot`/`IdentitySnapshot` persisting OpenMLS's whole storage-provider map so a key-holder that restarts hasn't lost the group, landed on its own ahead of the delivery handlers and open-oracle that will consume it (#1248). [[dtg-credentials]] itself came off its pinned git rev onto the 0.6 registry release in the same window (#1246). See [[verifiable-trust-agent#Recent Development]] for the VTA-side presentation oracle this unlocks.

### Backup family: the spec debt that was hiding three silent operations — 2026-09-02 (#1239, #1240)

`trust-tasks-rs` 0.17.7 carries `dtgwg-trust-tasks-tf#347`'s six specs, so `vta/backup/*` and `vta/management/reload-services` come off `UNSPECCED_DISPATCHED_URIS` and gain conformance witnesses (#1239) — meant as bookkeeping, and it wasn't. Making the family visible to the audit census exposed three operations succeeding with zero trail: `initiate-export` (mints a fetchable copy of the entire agent), `initiate-import` (opens a writable endpoint into the agent), and `reload-services` (restarts the agent, dropping every open session). `reload-services` already had an `audit!` call — but `audit!` only emits a `tracing` event and never reaches the `AuditSink`, the exact gap #1240 makes explicit in the macro's own doc comment; its sink write now runs before `trigger_restart`, since the restart tears down the runtime the write would otherwise run in. Three more (`complete-export`, `finalize-import`, `abort`) are structurally invisible to the conformance sweep, which drives an empty store and only ever exercises their not-found paths — found by reading the code, not by the sweep. `finalize-import` is the sharp case: on commit it replaces the agent's keys, ACLs, contexts *and* its own audit trail, so its sink write happens after the op returns, outside the state the import just replaced. Side effect: the VTC's unpublished-`vta/*` URI ratchet fell from 13 to 7.

### Cypress — 2026-08-17 — coordinated release, release-plz, RC process

The annotated `Cypress` tag points at a release-plz `chore: release` merge (#997). Snapshot versions are in the Components table above (vta-service **0.17.0**, vta-sdk **0.25.0**, vtc-service 0.11.58, vti-common 0.12.1, pnm 0.12.6, cnm 0.11.22, vta-mobile-core 0.6.18). Versions at the start of the window for comparison: vta-sdk 0.18.17, vta-service 0.10.23, vtc-service 0.10.13. Two RCs preceded it: RC-0 at #893 (keys import canonical on every transport, 08-02) and RC-1 at #935 (changelog sign-posting, 08-11) — `Banyan → Cypress` is simply the next letter in the tree-named sequence, but the RC discipline is new.

**release-plz (#938, 08-12).** Replaces the hand-rolled `publish.yml` / `cut-release.sh` / version-bump guards and the `changelog.d/` fragments introduced only two weeks earlier (#878): one open Release PR, per-crate tags, git-cliff CHANGELOGs, `cargo-semver-checks`-derived bumps, trusted publishing (the workflow had to keep the name `publish.yml` because crates.io pins the filename, #943). #938 first cut the published set 21 → 7; #962 (08-13) reversed most of that because `openvtc-core` dev-depends on `vta-service` for `MockVta` and `vti-common` re-exports `vta_sdk::acl` types — a frozen vta-service stopped compiling against a moving vti-common. Current rule (`RELEASING.md`): 20 of 26 publish. Fourteen `chore: release` merges landed between #938 and HEAD. Also: a plain non-TEE `Dockerfile` + CI (#955), the Nitro image cached with cargo-chef and built in CI (#956), CI diet (#961), a DCO exemption for verified org-member commits so release merges can pass (#944), bounded CI jobs (#1002, #1006).

### Trust-Task canonicalisation — everything folds onto `trusttasks.org/spec/*` — July–August 2026

The largest single stream. The VTC programme (#710; `docs/05-design-notes/vtc-trust-task-registry-migration.md`, COMPLETE 2026-07-27): manifest census (#711), config/audit/acl/policy repointed to canonical (#724–#729), join-requests ceremony → `spec/vtc` (#733, #743, #806), admin passkeys → canonical `auth/passkey` (#809), **admin-login and the legacy `/v1/config` surface retired (#828)**, **config export/import repointed — retiring the last `openvtc/vtc` bindings (#834)**; all 66 entries in the VTC's `trust-tasks/index.json` are now `retired` with `supersededBy`; `decide` replaces approve/reject and accept folds into `members/vmc` (#863). The VTA side: ACL → canonical `acl/*` (#842) with `acl/change-role` split out (#855); config + provisioning → canonical, and the VTA stops rewriting its own DID (#841); audit → `audit/list/0.1` (#848); webvh `dids/get-log` → `dids/get`, `servers/{add,update}` → `servers/register` (#849/#850); credential-exchange bound to published URIs (#837); keys → canonical `keys/*` (#888, #893 = RC-0); did-templates onto the six-task 2.0 family (#864); `sign()` and every twinned RPC method reach TSP via the Trust-Task bridge (#861); a conformance sweep so every published task matches its schema (#866); a reverse registry-parity harness (#860). Wire level: **#1000 (breaking) emits canonical lowerCamelCase on 53 Trust-Task payload structs, accepting snake_case via 126 aliases**; #1001 carries Trust Tasks over the HTTPS binding on REST too; **#1007 marks every superseded REST route (60 route → task pairs) with a successor `Link` and a usage metric, gating deletion on zero usage**. The plan for the last ~67 unpublished task URIs — fold, generalise, author only what is genuinely new — is `docs/05-design-notes/canonical-task-reduction.md` (#840). Direction: REST retirement is now *measured*, not scheduled.

### TSP: selectable, and optionally DIDComm-free — July–August 2026

TSP moved from "feature-gated and opt-in" to a **selectable transport** — `TransportChoice::{Tsp, Didcomm}` plus `Auto`, with the documented `TSP > DIDComm > REST` preference now *implemented* (#797, 07-25), and a TSP leg per surface rather than a whole-client switch (#810). **A VTA can speak TSP without DIDComm** (#937): the connect supervisor runs on `didcomm || tsp`, the cargo features are decoupled, CI builds the tsp-only combination. The setup wizard offers TSP and advertises it at mint (#933/#934, `transport-neutral-mediator.md`); a minted did:webvh can advertise TSP at the VTA's mediator (#959). On the VTC side: Trust Tasks accepted over TSP (#833), self-remove and member-VMC dispatched as Trust Tasks (#838), communities **choose their transports at setup and publish which they offer and whether they answer** (#926/#929, #923 "serve the TSP we advertise, and refuse to pretend otherwise"), the admin UI shows which transport each service is actually reached on (#965), and **the trust registry is reached by DID over TSP or DIDComm** (#963; probe order fixed #981, retriable at boot #966). webvh DID mutations and the domain relay reach TSP (#885, #891); mobile gained a TSP receive session and device push over TSP (#694–#697). What's still open (per #937's "what this does not do"): a fully transport-neutral mediator config, per-protocol mediator registration, and whether TSP-only sessions still need the DIDComm auth leg.

### One approvals model — policy gate, consent, break-glass — July–August 2026

Three mechanisms — `[auth.step_up]` floors, config consent rules, and the Rego Policy Decision Point — collapsed into one. The PDP on regorus landed with opt-in enforcement (#637, 07-12) and became the single step-up authority (#641); **task-execution consent** (DTTE, #645–#653) pushes a human-readable, site-named, dry-run-effects consent request to approver devices; approvers are least-privilege ("may approve" ≠ "may act", #684, #779) and need not hold VTA authority (#907). Then the convergence: **one approval model manageable at runtime (`pnm approvals`, #909)**, the gate enforced on REST routes (#912) and the webvh update route (#913), **step-up floors and config consent rules retired — rules are the only trigger (#914, breaking)**, and an **offline break-glass** `vta approvals/policy {list,remove,disable}` for a rules lockout (#915). Canonical request bodies with witnesses built from them (#925, #928); the step-up approve-request itself is now signed (#870) and minted as 0.2 (#873). Docs: `docs/02-vta/approvals.md`, `task-consent.md`, `approvals-convergence.md` (status: landed). Related: DID-keyed sessions unify REST with intrinsic-sender transports (#627–#629).

### Signing oracle: authorization model, `allowedKeys`, non-extractable keys — July–August 2026

#814 turns the signing oracle's authorization model into a documented *guarantee*: three gates in `operations::keys::sign_payload` (caller context scope; resource-bound `signable_keys` policy binding even super-admin; unscoped keys super-admin-only), one enforcement point for REST/DIDComm/Trust Task. **`allowedKeys` (#865)** adds actor-scoped per-key narrowing on ACL entries. A design review of multi-tenant signing (#817) concludes no authorization refinement can distinguish a compromised multi-domain signer — only splitting credentials or a second factor can. **Non-extractable internal signing keys (#995, vta-keys 0.2.5)**: CSPRNG keys with no derivation path, in their own `INTERNAL_KEYS` keyspace excluded from backup, export refused in code (admin is not a bypass), forbidden as webvh update keys; `pnm keys create --internal`. Also: import an external Ed25519 key for a deterministic did:key (#953); backup password minimum raised to 15 characters (#875).

### ISO mdoc — receive, store, present over OID4VP — 2026-08-16 (#984–#993)

A single-day burst gave the vault a first-class `CredentialFormat` identity for **ISO 18013-5 mdoc** (#984); verify-and-store on receive (#986); issuer resolution against configured **IACA trust anchors** (`[vault] mdoc_iaca_trust_anchors`, #987); acceptance over `vault/credentials/receive` as `credentialBase64` (#989); an mdoc bound to the VTA key that can present it (#990); and **presentation over OID4VP** with an ISO 18013-7 `SessionTranscript`, a P-256 `ecdsa-jcs-2019` consent receipt, and `HolderIdentity::{Subject, DeviceKey}` (#993, breaking). Depends on `affinidi-mdoc` 0.2.7 and the TDK's new `ecdsa-jcs-2019` cryptosuite. The VTA is now a holder for W3C DI, BBS, SD-JWT *and* mdoc — the four credential formats that matter for government / travel / age use cases.

### `vta-service` decomposition — 2026-07-24/25 (#780–#791)

Eleven subsystem crates extracted from the monolith in two days (`vta-config`, `vta-keyspaces`, `vta-audit`, `vta-keys`, `vta-vault`, `vta-webvh`, `vta-policy`, `vta-support`, `vta-tee`, `vta-backup`, `vta-sweepers`; backup extracted with dependency inversion #790; TEE and policy #791) — 27k lines moved, AWS SDK out of the default build graph with vta-tee, semver checks switched off for the subsystem crates because nobody consumes their APIs directly. The decomposition note sets a stopping rule: extract only if it improves compile granularity, testability, or dependency surface.

### Hardened non-TEE + TEE fleet config — July–August 2026

`[hardened]` at-rest encryption for non-TEE deployments with first-boot auto-migration of existing rows (#835) — closing the gap between "runs in Nitro" and "runs on a VM". In the enclave, tenant config is **no longer baked into the EIF**: one image / one PCR0 per fleet, a config envelope delivered over vsock:5800, a TEE-mode floor, the config digest anchored in the NSM attestation, and `POST /attestation/config-report` (#939). The TEE security-model doc was re-grounded against current code (KMS Recipient attestation, seven vsock channels, #832); a dual-unlock design note (#736); NSM ioctl `len` must be u64 (#819); per-crate COPY layering for the Nitro image (#826).

### Mobile, messaging, webvh, VTC — July–August 2026

- **Mobile**: device Trust-Task submission with *no REST* over DIDComm and TSP (#792); mobile as a second device for task-consent (#690); **request proofs verified on-device before prompting** (#871, mobile-core 0.6.17); DID→name display seam (#800); 0.6.18 for the `digestMultibase` consent digest (#911).
- **Messaging**: both services cut over to the TDK's reliable **`affinidi-messaging-delivery`** layer (`MessagingService` + `DidCommTransport` + `VtiOutboxStore`; #675–#691), Guaranteed-send state visible (#899), one ATM per process with a shutdown that actually closes the socket (#844), websocket leak fixes (#846/#847), mediator ACL auto-provisioning (#652), DID-routing mediators via `--mediator-did` (#952), unknown inbound protocols dropped not fatal (#905), `affinidi-tdk` hard-pinned at the enforced-authcrypt line (#908).
- **did:webvh**: agent-name Trust Tasks end-to-end (`pnm did-mgmt agent-names …`, `alsoKnownAs` claim; #718–#723, #758, #777); wedge/recovery fixes — unpublished local head, missing confirmed-publish marker, partial edit serialising nulls (#894–#896), sign with the update keys in force (#972); `--did-log-file` for offline publishing (#932); host reconcile task aligned with the spec published upstream (#976/#977); stop sending URIs did-hosting retired in 0.8.3 (#879); find DIDs a host serves that this VTA has no record of (#976).
- **VTC**: headless two-phase setup with an explicit secrets backend (#625); **signed audit checkpoints so truncating the log stops being invisible** (#798, #808); REST-only auth refresh for mediator-less clients (#796); `submit_join` signs its own document and needs no token (#882); an applicant can poll a join without knowing its request id (#985, breaking — the VTC half of OpenVTC v0.3.0's async join work); "step-up means recent" for admin promotion (#811); a community advertises the registry authoritative for it (#877); `cli` answers a consent gate instead of dying on it (#897).
- **Design notes worth reading**: governance policy as a credential (#859, Option A `GovernancePolicyCredential`, deferred pending sign-off), `sdk-session-hub.md`, `registry-drift-triage.md`, `vtc-audit-checkpoints.md`.

### Dependency moves — July–August 2026

trust-tasks-rs **0.2 → 0.9** (0.4 #911 with the consent digest becoming `digestMultibase`; 0.6 #979; 0.9 #996; error doc 0.3 → 0.5); **dtg-credentials 0.1.3 → 0.2** (#916 — DTG Core Credentials WD01, see [[dtg-credentials]]; VMC/VEC/VIC bytes unchanged); **curve25519-dalek 5 / ed25519-dalek 3 (#887, breaking)** with SLIP-0010 derivation moved in-tree, dropping `ed25519-dalek-bip32` (#890); didwebvh-rs 0.6 (#712); messaging-sdk 0.19.8 / mediator 0.18.18 / delivery 0.1.14 / affinidi-tsp 0.1.14; the long-standing `[patch.crates-io] vta-sdk` self-pin finally dropped (#958). Configurable unauth rate limit (#936); payload validation against published schemas (#657); reactive re-auth on 401/403 (#633).

The June–July cycle (289 commits, PRs #313–#624 since 2026-06-07) matched the record May–June push and pivoted the workspace twice: first a systematic **P0–P3 security and architecture campaign** capped by the **`Banyan` milestone tag** (2026-06-22), then a sharp turn to **[[trust-spanning-protocol|TSP]] enablement** with transport preference officially flipped to **TSP > DIDComm > REST**. Two new product thrusts emerged alongside: **personal AI agents** (the VTA as the trust anchor under agent runtimes, with a new `vta-mcp` MCP server) and **enterprise fleet management** (owner/user separation of duty).

### TSP enablement — late June–July 2026 — transport preference flips to TSP > DIDComm > REST

The headline of the cycle. A 2026-06-22 decision record (`docs/05-design-notes/messaging-routing-and-tsp.md`) initially **deferred** TSP because the Affinidi mediator lacked TSP routing and `affinidi-tsp` was inert scaffolding — then both blockers cleared upstream within three days, and an SDD (`docs/05-design-notes/tsp-enablement.md`, #579) reversed the decision and flipped transport preference guidance to **TSP > DIDComm > REST**, effective immediately. Spec basis: ToIP TSP Specification Rev 2 (Nov 2025 Experimental Implementer's Draft).

Key locked decisions: DIDs are TSP VIDs reusing existing Ed25519/X25519 keys (no new key material); one dual-protocol mediator serves both TSP and DIDComm; capability discovery is DID-document-driven, matched by service `type` not `#id` fragment (ids renamed to `#didcomm` / `#tsp` / `#rest`); a `tsp` cargo feature mirrors `didcomm`, off by default initially.

Implementation landed as a stacked PR train (2026-06-25 → 07-03): `tsp` feature across sdk/service/enclave/vtc (#580); `TSPTransport` service patchers with TSP-first canonical ordering (#581) and advertisement in DID templates (#584); a peer-matching engine for capability discovery + protocol selection (#583); TSP as a first-class managed service — `ServiceState::Tsp` with enable/update/disable/rollback over REST, DIDComm, and CLI (#585–#589) and declarative setup (#598); a TSP inbound listener over the shared mediator websocket (#595, #601 — no second socket, no mediator flapping); vault unsealing of `tsp-message` sealed envelopes (#594); a TSP round-trip health probe (`pnm health` TSP ping, #610–#618); and an operator guide (`docs/02-vta/tsp.md`). Strictly additive at the time — feature-gated and opt-in; by August TSP had become a selectable transport with TSP-only VTAs supported (see above).

### Security hardening + architecture campaign (P0–P3) — 2026-06-10 → 06-16

Roughly 100 commits executing numbered remediation plans (`tasks/vta-architecture-plan.md`, `tasks/vtc-architecture-plan.md`, `tasks/test-harness-plan.md`) — reads like the output of a full security review of both services.

- **P0 critical fixes**: AES-GCM AAD binding of keyspace values to their (keyspace, key) location, defeating ciphertext cut-and-paste by an untrusted Nitro parent instance (breaking on-disk format, magic `VAE1`, #346); **TEE anti-rollback** — local MAC'd integrity manifest + boot verify (#380), external DynamoDB anti-rollback counter with CAS (#383), attestation-gated anchor writer (#386); DIDComm sender authentication rather than trusting plaintext `from` (#350); VMC-subject↔VEC-subject binding + holder proof-of-possession in recognise (#351, #354); SSRF/DoS hardening of foreign status-list fetches (#357); master-seed zeroization (#353); encrypted-at-rest install/audit-key/passkey keyspaces (#364); step-up enforcement on vault release / proxy-login / sign-trust-task (#362); TOCTOU serialization on last-admin admit (#385); fail-closed secret backends (#381); Rego evaluation bounds (#372).
- **P1/P2 structural refactors**: single token-mint path and single DI-proof verifier in both services (#399, #402); central keyspace-name registries; setup engine split into pure prompting over `apply_inputs`; VTC ceremony orchestration unified under `ceremony/` with one facts-assembly path (#453–#462); a route-posture backstop test — every unauthenticated route must be classified (#457).
- **P3 defense-in-depth + features**: per-surface host isolation for VTC websites (#465/#466); client-side PCR pinning for bootstrap connect (#388); **encrypted full-state VTC backup/restore** (#494) with `cnm backup export/import` (#497); non-interactive `vtc setup --from <toml>` (#491); Kubernetes Secret backend (#486); a real device kill-switch — `device/wipe` enforced at auth (#493).
- **Test/fuzz infra**: MockVta/MockVtc in-process harnesses with e2e seams (26 fixtures migrated, #348); a new `fuzz/` workspace member with IO-free parse cores and fuzzable Nitro-attestation parsing (#443, #450, #477); **OpenAPI 3.1 specs for the full VTA and VTC surfaces** (#447/#448).
- **Audit trail**: coverage extended across authorization/invitation/session/backup/admin ops, with payload enrichment and a **tamper-evidence hash chain** (#535–#555).

A coordinated pre-1.0 legacy strip landed on 2026-06-09: legacy `affinidi.com/atm/1.0` auth aliases, pre-spec `passkey-vms/1.0` URIs, `webvh-*`/`did-hosting-*` template aliases, and the deprecated `pnm webvh` CLI alias all removed (#330–#334).

### VTC join ceremony, VIC, and the new `vtc-client` crate — June 2026

- Spec-first Trust-Task join verbs: `join-requests/{accept,manifest,status}` specs + implementations, including the **reciprocal member VMC** — the VTC receives a member-issued credential back (#315–#320, #549), making membership bidirectional in practice.
- **Automatic VTC join via [[invitation-credential|Verifiable Invitation Credential]]** (#522), with role-on-invite, revocation, linkage proof (#526), QR-sized invitations in the admin UI (#527), and invitation-facts logging behind join verdicts (#546). The join-request ceremony became a Trust Task document flow (#541). This is the server side of the VIC join flow that [[openvtc]] shipped in the same window.
- New **`vtc-client`** OSS crate (#567): auth + member listing, admin ops (join approval/rejection, member removal), policy management, submit_join.
- Admin UI: member-relationship connections graph (#530); departed-member purge/re-invite (#532).

### Personal AI agents — AgentSession + `vta-mcp` — June 2026

A clear new product thrust: the VTA as the trust anchor for personal AI agent runtimes (runbook: `docs/02-vta/personal-ai-agents.md`).

- **`AgentSession`** on vta-sdk — a high-level personal-AI-agent runtime helper (#496).
- **`vta-mcp`** (#489) — an MCP stdio server bridging the VTA's capabilities (signing oracle, secrets vault, device check-in, discovery) to any MCP host (Claude Desktop is named explicitly); expanded to the full VTA surface via generic `vta_call` + catalog, `resolve_did`, `issue_vp` (#499).
- Supporting VTA features: an `ai-agent` DID template (#482); **per-context KV store for agent memory** (#574); issue + revoke **scoped Verifiable Credentials** (#573); an ephemeral derive-and-sign trust task (#575–#577); self-contained did:peer agent identities via `vta create-did-peer` / provision-integration (#590, #612).

### Step-up, consent, and mobile-core — June–July 2026

- Step-up policy became runtime-manageable (delegatedAny, per-entry `stepUp.require`, policy CLI, #324–#329; `docs/02-vta/step-up-policy.md`).
- Consent architecture in two tracks: a VTA consent store as first-gate for inbound bridged messaging (#524), per-platform approver registry (#528), wake-route approvers for did-signed decisions (#529).
- `vta-mobile-core` 0.3.1 → 0.6.11: adopted the **push gateway model** (push/register + device/set-wake, #314); DID-based `resolve_vta_endpoints` discovery (#319); iOS TLS + diagnostics fixes. The July burst (#621–#624, v0.6.9–0.6.11) upgraded the mobile approver into a full cryptographic party to authorization decisions: step-up approve-response 0.2, structured `authorizationContext` carried to the approver, and **signed denial**.

### did:webvh maturation — June–July 2026

The VTA now serves its own did:webvh log at canonical `did.jsonl` paths with correct content type (#559, #561 — the `Banyan` tag commit); preloads its self-DID into the resolver cache and keeps it in sync after runtime DID-log mutations (#603, #616 — fixes serverless/private-network self-resolution); authenticates to the hosting server when publishing agent DIDs (#604); and backdates/spaces `versionTime` to avoid same-second collisions (#600, #605 — the fix that drove [[didwebvh-rs]] 0.5.6's caller-settable `versionTime`).

### Enterprise fleet management (proposed) + secrets split — June 2026

- New design note `docs/05-design-notes/enterprise-fleet-management.md` (Proposed): extends the VTA from individual owner-operator to the enterprise case with hard **owner/user separation of duty** and fleet management. First primitives landed: per-context `ContextPolicy` (#566, #570).
- **`vti-secrets`** extracted from vta-service (#503): pluggable secret-store backends (plaintext, HashiCorp Vault, KMS/TEE, Kubernetes Secrets) reusable by external integrations; the VTC migrated onto it in three phases, dropping direct cloud-SDK dependencies from both services (#506–#509).

### Dependency moves — June–July 2026

- `affinidi-tdk` 0.8 (#525); messaging stack bumped to TSP-capable versions (#593) — the upstream mediator's dual-protocol TSP↔DIDComm bridging is what unblocked TSP enablement.
- Crate movement across the window (no single workspace release; continuous per-crate bumps): vta-sdk 0.10.0 → **0.18.17** (the largest jump — huge API surface growth), vta-service 0.9.0 → 0.10.23, vtc-service 0.8.1 → 0.10.13, vti-common 0.9.1 → 0.11.2, pnm-cli/cnm-cli → 0.10.x.
- VTC admin UI: esbuild dropped for Vite 8 (rolldown); Node 22 pinned.

The May–June cycle below was the previous record push (~530 commits since 2026-05-08), dominated by **VTC service maturation**, **credential exchange end-to-end**, and **mobile + WebAuthn** (the new `vta-mobile-core` and `vti-webauthn` crates).

### `vta-mobile-core` v0.3.0 (+ mobile-agent architecture spec) — June 2026

The shared Rust engine for two iOS/Android apps: **Authenticator** (a holder's pocket approver for VTA/RP-pushed AAL step-up "approve-request" prompts, returning a passkey- or DID-signed approve-response over DIDComm v2) and **PNM mobile** (the mobile counterpart of the `pnm` operator CLI, driving the management surface over the same Trust-Task wire as the CLI). Built as UniFFI: Android AAR, iOS xcframework.

- **Architectural rule** (`docs/05-design-notes/mobile-agent-architecture.md`): shared engine, native edges. Everything cryptographic and wire-shaped lives in the Rust core; everything stateful or platform-bound (Secure Enclave / StrongBox custody, sockets, push receipt, UI) stays native.
- `DIDCommSession::receive_next(timeout_secs)` on `vta-sdk` — receives unsolicited inbound messages from the mediator's live stream, the foundation for the mobile approver receiving VTA-pushed `auth/step-up/approve-request/0.1`.
- Set delegated step-up approver at ACL `grant` *and* `update` time (closes the previously test-only-set path).
- v0.2.0 / v0.2.1 / v0.3.0 tags shipped in sequence.

### Hierarchical contexts — May 2026 — slices 1–4

A context ID *is* its `/`-separated path (max depth 8) at the VTA, with ancestry-aware ACL semantics (parent-admin authority covers the subtree). This drops the "convention-only" sub-context model OpenVTC's multi-community design originally assumed and replaces it with a server-enforced one.

- **Slice 1** (`vti-common`) — `context_path` module: `/`-separated path IDs, segment-aware ancestry, ancestry-aware ACL gate.
- **Slice 2** (`vta-service`) — nested context creation + BIP-32 nesting + `--parent` CLI.
- **Slice 3** — subtree delete (cascade/refuse) + folder-admin authority.
- **Slice 4** — ancestry-aware ACL list filter; ACL-gated holder-key resolution (`HolderKeyProvider`) for presentation.

### MockVta + tests/e2e crate — May–June 2026

A one-call listening VTA harness (`vta-service`) for downstream consumers' integration tests. The new `tests/e2e` crate exercises transient-mediator handshakes and DIDComm session sequential-reuse-no-duel; the harness is consumed from `crates.io` rather than the local path, so OpenVTC's T9 work (multi-community integration tests) now has a real target.

### Credential exchange end-to-end (close-the-join-loop) — May–June 2026

- **OID4VP DCQL `vp_token` verification** — both holder side (`present_query`: full holder query → present path, consent-gated) and verifier side (`vp_token` map verification at the VTC join verifier).
- **`credential-exchange/present` DIDComm handler** + single-use challenge — closes the join loop.
- **VTC drives the join decision from a verified presentation**; the credential-query push is routed via the holder's own mediator.
- **W3C Data-Integrity VP verification + did:webvh / did:web resolution** on the verifier side.
- **Live status re-check at present time** (§14.5); status-list credential issuer signature verified at every check.
- **TRQP issuer-trust** wired into the join presentation evidence; issuer-bound did:webvh / did:web DI resolution for credentials.
- VTC delivers the membership credential to the holder on DIDComm admit *and* on admin-approve; re-mints the role VEC on role change with share delivery.
- **Consent policy** — auto-consent trusted verifiers, else defer.
- **Holder offer → request leg** — answer a credential offer with a key-binding proof.

### BBS-2023 selective disclosure end-to-end — May–June 2026

Feature `bbs` across VTA and VTC. Built on the new `affinidi-bbs` crate in the TDK.

- **VTA receives BBS credentials** into the vault over the credential-exchange/issue path.
- **VTA presents BBS credentials** with selective disclosure.
- **VTC join verifier accepts `bbs-2023` presentations** in the same evidence pipeline as standard W3C Data Integrity VPs.

### Trust Tasks 0.2 — June 2026

Dual-accept envelopes: a single Trust Task envelope can be accepted at one of four authentication ladder rungs (device / vault / passkey / step-up). The 0.1 → 0.2 migration is back-compat — both shapes are accepted for one release.

- `trust-tasks-rs` + `trust-tasks-proof` bumped to 0.2.1; trust-tasks 0.2 specs with 0.1 back-compat.
- `passkey-vms` /0.1 dual-accept + 0.1 error taxonomy; `vta-sdk` 0.10.0 release.
- `provision-integration` dual-accept 0.2; retire legacy FPN URI.
- In-band recipient set on every trust-task envelope (0.2 requires it).

### VTC service maturation — May–June 2026

- **Default community website** (no more 503 on a fresh install).
- **Admin UX** (M5.6 + M5.7) in-tree per D1 — admin console scaffold (React + Vite + plugin API); third-party plugin loader scaffold.
- **Ceremony decision pipeline design bundle** under `docs/05-design-notes/`: catalog, pipeline, protocol, rule IR (with `regorus` Rego examples for join / leave / role-change / directory), executive summary, visual guide.
- Phase-3 tail complete: W3C-DI present, deferred approval, sealed issuance, Trust-Task descriptors.
- Documentation reconciled with the post-Phase-5 reality.

### Documentation restructure — May–June 2026

Top-level docs reorganised into `01-concepts/` (overview, architecture, security model), `02-vta/`, `03-vtc/`, `04-reference/`, `05-design-notes/` (mobile agent, hierarchical contexts, ceremonies, credential architecture, trust-task migration runbook, webvh REST auth audit). The flat `docs/design.md` is gone — replaced by a hierarchical book. VTA/VTC split into dedicated chapters.

### Dependency moves — May–June 2026

- **DIDComm 0.15** across the workspace (`affinidi-messaging-didcomm` 0.14 → 0.15); resolves the previous two-`Message`-type split, picks up `affinidi-crypto::jose` for key agreement.
- **`affinidi-crypto` 0.2** (vta-sdk 0.9.11); affinidi-tdk 0.7.x line consumed.
- **vta-sdk** 0.9.0 → 0.10.0.
- **trust-tasks-rs + trust-tasks-proof** 0.2.1.

### v0.6.0 (in flight, P0–P5 merged 2026-05-05 to 2026-05-06) — runtime service management

Multi-PR feature campaign adding a unified `pnm services …` CLI surface for managing runtime services on a live VTA, plus extensions to the webvh and DIDComm provisioning surfaces. P0–P5 merged on `main`; P6 (e2e matrix), webvh `register-did-with-server` / `edit-did`, DIDComm `--create-context`, and the 0.6.0 workspace bump are on a feature branch.

- Unified `pnm services …` CLI: enable, disable, list, list_drain, rollback (REST + DIDComm)
- Snapshot-store / fail-forward semantics (per-kind snapshot store; brick-prevention helpers)
- Operator-as-relayer over DIDComm (provision-integration)
- DIDComm-is-holder-driven clarification + Forbidden mapping fix
- TEE deployment hardening continues

### v0.5.1 (vta-service) — 2026-05-05 — provision-integration hotfix

- `vta bootstrap provision-integration` now produces an actionable error when the target context is missing and `--create-context` wasn't passed (CLI-only behavior change)

### v0.5.0 — 2026-05-04 — `sealed-bootstrap` major release

Every secret-bearing transfer between VTA, integrations, and CLIs now moves as an HPKE-sealed bundle; DID minting is template-driven; the DIDComm protocol surface is mutable on a running VTA without rebuilding it.

- HPKE-sealed bundles for every secret-bearing transfer between VTA, integrations, and CLIs
- Template-driven DID minting
- DIDComm protocol surface can be enabled, disabled, or migrated on a running VTA without rebuilding it
- Six new operator commands: `pnm services {enable,disable} didcomm`; `pnm mediator {migrate, rollback, drain cancel, report}`. All five admin operations available over both REST and DIDComm transport
- Mediator changes go through a drain set (persisted to fjall, restart-resilient, 30-day TTL cap) so in-flight messages from senders with stale DID-doc caches keep landing while the new mediator picks up traffic
- WebVH built-in templates renamed by deployment role: `webvh-hosting-server` → `webvh-daemon` (hosting only), `webvh-service` → `webvh-server` (DIDComm only), new `webvh-control` (hosting + DIDComm)
- Multi-agent publish-readiness review folded in: `VtaError` tightened (lossy auto-conversions removed); `verify_vta_authorization_credential` returns a typestate (forgetting `parse_claim` is a compile error); refresh tokens rotate on every `/auth/refresh` (RFC 6749 §10.4, single-use); `server_internal_super_admin` replaced with a sealed `InternalAuthority` marker
- CVE-2026-42327 mitigated via enclave-proxy openssl 0.10.78 → 0.10.79

### v0.4.1 — 2026-04-15

- TEE deployment hardening
- Documentation rationalization
- Dockerfile cleanup

### v0.4.0 — 2026-04-13 — DIDComm service v0.2

- Production lifecycle management for the DIDComm service
- Message expiry
- Problem-report logging
- Mediator connection unification

### v0.3.x — April 2026

- Client DID documents
- Capabilities discovery
- User-specified keys

### v0.3.0 — March/April 2026

- SDK integration module
- Imported secrets
- Lightweight DIDComm auth
- Reader role
- Automatic token refresh

### v0.2.0 — March 2026

- TEE / Nitro Enclave support
- Signing oracle
- DIDComm migration
- Backup / restore
- P-256 keys
- Prometheus metrics

See also: [[verifiable-trust-agent]], [[verifiable-trust-community]], [[openvtc]]
