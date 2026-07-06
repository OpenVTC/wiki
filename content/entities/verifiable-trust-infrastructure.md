---
title: "Verifiable Trust Infrastructure (VTI)"
type: entity
tags: [vti, infrastructure, workspace, primary]
date-updated: 2026-07-06
repo: https://github.com/OpenVTC/verifiable-trust-infrastructure
---

# Verifiable Trust Infrastructure (VTI)

*Repo: [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Infrastructure is a Rust workspace containing the core services that power [[verifiable-trust-community|Verifiable Trust Communities]]. It's the infrastructure layer of the OpenVTC ecosystem — the plumbing that makes decentralized trust work.

## Components

The workspace has grown to fifteen crates as the VTC service matured, the mobile + WebAuthn surfaces were added, and (June 2026) the secrets, AI-agent, and VTC-client surfaces were split into their own crates:

| Crate | Purpose |
|-------|---------|
| **[[verifiable-trust-agent\|vta-service]]** | The main VTA server — key management, signing, auth |
| **vta-sdk** | Data model and client library for VTA integration |
| **vta-enclave** | AWS Nitro Enclave wrapper for VTA |
| **vta-mobile-core** | UniFFI engine behind the Authenticator + PNM mobile apps (DIDComm, Trust Tasks, AAL step-up). Android AAR / iOS xcframework, not crates.io. |
| **vta-mcp** | MCP stdio server bridging VTA capabilities (signing oracle, secrets vault, device check-in, discovery) to MCP hosts like Claude Desktop *(new, June 2026)* |
| **vti-webauthn** | DID-VM-resolved WebAuthn verifier |
| **vtc-service** | [[verifiable-trust-community\|VTC]] daemon — community lifecycle, policies, credentials, public website, admin UX |
| **vtc-client** | Thin client SDK for a VTC — the VTC counterpart to vta-sdk *(new, June 2026)* |
| **vti-common** | Shared auth, ACL, storage, config, error handling; includes `context_path` (hierarchical context paths + ancestry-aware ACL) |
| **vti-secrets** | Pluggable secret-store backends (plaintext, HashiCorp Vault, KMS/TEE, Kubernetes Secrets), lifted out of vta-service for external reuse *(new, June 2026)* |
| **vta-cli-common** | Shared CLI command implementations |
| **cnm-cli** | Community Network Manager (multi-community client) |
| **pnm-cli** | Personal Network Manager (single-VTA client) |
| **didcomm-test** | DIDComm connectivity test harness |
| **vti-fuzz** | cargo-fuzz workspace — Nitro-attestation and verify-path targets *(new, June 2026)* |

The `vti-didcomm-js` crate (JavaScript DIDComm primitives + spec test vectors) was extracted into its own repository in the May–June cycle. Since June 2026 the workspace crates are published to crates.io through CI via **trusted publishing** (GitHub OIDC).

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
- `affinidi-tdk` — DID resolution, messaging, data integrity proofs
- `didwebvh-rs` — did:webvh operations
- `dtg-credentials` — trust graph credential types
- `fjall` — embedded key-value storage
- `axum` — async HTTP framework
- `ed25519-dalek` — Ed25519 cryptography

## Tech Stack

- **Language**: Rust (edition 2024, requires 1.85+)
- **Async runtime**: Tokio
- **HTTP**: Axum 0.8
- **Storage**: fjall (embedded LSM)
- **Crypto**: ed25519-dalek, x25519-dalek, p256
- **Auth**: EdDSA JWTs, DIDComm challenge-response

## Recent Development

This page is the canonical activity log for the VTI workspace. The [[verifiable-trust-agent|VTA entity]] keeps a focused, VTA-relevant subset. Implementation continues to evolve quickly; treat low-level details as in flux.

The June–July cycle (289 commits, PRs #313–#624 since 2026-06-07) matches the record May–June push and pivots the workspace twice: first a systematic **P0–P3 security and architecture campaign** capped by the **`Banyan` milestone tag** (2026-06-22 — tree-named milestones, following `openvtc-aspen`, now appear to be the release convention), then a sharp turn to **[[trust-spanning-protocol|TSP]] enablement** with transport preference officially flipped to **TSP > DIDComm > REST**. Two new product thrusts emerged alongside: **personal AI agents** (the VTA as the trust anchor under agent runtimes, with a new `vta-mcp` MCP server) and **enterprise fleet management** (owner/user separation of duty).

### TSP enablement — late June–July 2026 — transport preference flips to TSP > DIDComm > REST

The headline of the cycle. A 2026-06-22 decision record (`docs/05-design-notes/messaging-routing-and-tsp.md`) initially **deferred** TSP because the Affinidi mediator lacked TSP routing and `affinidi-tsp` was inert scaffolding — then both blockers cleared upstream within three days, and an SDD (`docs/05-design-notes/tsp-enablement.md`, #579) reversed the decision and flipped transport preference guidance to **TSP > DIDComm > REST**, effective immediately. Spec basis: ToIP TSP Specification Rev 2 (Nov 2025 Experimental Implementer's Draft).

Key locked decisions: DIDs are TSP VIDs reusing existing Ed25519/X25519 keys (no new key material); one dual-protocol mediator serves both TSP and DIDComm; capability discovery is DID-document-driven, matched by service `type` not `#id` fragment (ids renamed to `#didcomm` / `#tsp` / `#rest`); a `tsp` cargo feature mirrors `didcomm`, off by default initially.

Implementation landed as a stacked PR train (2026-06-25 → 07-03): `tsp` feature across sdk/service/enclave/vtc (#580); `TSPTransport` service patchers with TSP-first canonical ordering (#581) and advertisement in DID templates (#584); a peer-matching engine for capability discovery + protocol selection (#583); TSP as a first-class managed service — `ServiceState::Tsp` with enable/update/disable/rollback over REST, DIDComm, and CLI (#585–#589) and declarative setup (#598); a TSP inbound listener over the shared mediator websocket (#595, #601 — no second socket, no mediator flapping); vault unsealing of `tsp-message` sealed envelopes (#594); a TSP round-trip health probe (`pnm health` TSP ping, #610–#618); and an operator guide (`docs/02-vta/tsp.md`). Strictly additive today — feature-gated and opt-in — but the stated intent is default-on after field exercise.

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
