---
title: "Verifiable Trust Infrastructure (VTI)"
type: entity
tags: [vti, infrastructure, workspace, primary]
date-updated: 2026-06-07
repo: https://github.com/OpenVTC/verifiable-trust-infrastructure
---

# Verifiable Trust Infrastructure (VTI)

*Repo: [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Infrastructure is a Rust workspace containing the core services that power [[verifiable-trust-community|Verifiable Trust Communities]]. It's the infrastructure layer of the OpenVTC ecosystem — the plumbing that makes decentralized trust work.

## Components

The workspace has grown to eleven crates as the VTC service matured and the mobile + WebAuthn surfaces were added:

| Crate | Purpose |
|-------|---------|
| **[[verifiable-trust-agent\|vta-service]]** | The main VTA server — key management, signing, auth |
| **vta-sdk** | Data model and client library for VTA integration |
| **vta-enclave** | AWS Nitro Enclave wrapper for VTA |
| **vta-mobile-core** | UniFFI engine behind the Authenticator + PNM mobile apps (DIDComm, Trust Tasks, AAL step-up). Android AAR / iOS xcframework, not crates.io. |
| **vti-webauthn** | DID-VM-resolved WebAuthn verifier |
| **vtc-service** | [[verifiable-trust-community\|VTC]] daemon — community lifecycle, policies, credentials, public website, admin UX |
| **vti-common** | Shared auth, ACL, storage, config, error handling; now includes `context_path` (hierarchical context paths + ancestry-aware ACL) |
| **vta-cli-common** | Shared CLI command implementations |
| **cnm-cli** | Community Network Manager (multi-community client) |
| **pnm-cli** | Personal Network Manager (single-VTA client) |
| **didcomm-test** | DIDComm connectivity test harness |

The `vti-didcomm-js` crate (JavaScript DIDComm primitives + spec test vectors) was extracted into its own repository in this cycle.

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

The May–June cycle is the largest single push in the workspace's history (~530 commits since 2026-05-08). Three themes dominate: **VTC service maturation** (admin UI scaffold, plugin loader, default community website, ceremonies, TRQP issuer-trust at join, status-list verification), **credential exchange end-to-end** (DCQL / OpenID4VP `vp_token` verification on both sides, BBS-2023 selective disclosure, live status re-check at present time, consent-gated presentation), and **mobile + WebAuthn** (new `vta-mobile-core` and `vti-webauthn` crates).

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
