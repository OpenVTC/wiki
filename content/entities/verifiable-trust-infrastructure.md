---
title: "Verifiable Trust Infrastructure (VTI)"
type: entity
tags: [vti, infrastructure, workspace, primary]
date-updated: 2026-05-08
repo: https://github.com/OpenVTC/verifiable-trust-infrastructure
---

# Verifiable Trust Infrastructure (VTI)

The Verifiable Trust Infrastructure is a Rust workspace containing the core services that power [[verifiable-trust-community|Verifiable Trust Communities]]. It's the infrastructure layer of the OpenVTC ecosystem — the plumbing that makes decentralized trust work.

## Components

The workspace contains nine crates:

| Crate | Purpose |
|-------|---------|
| **[[verifiable-trust-agent\|vta-service]]** | The main VTA server — key management, signing, auth |
| **vta-sdk** | Data model and client library for VTA integration |
| **vta-enclave** | AWS Nitro Enclave wrapper for VTA |
| **vtc-service** | [[verifiable-trust-community\|VTC]] coordination service |
| **vti-common** | Shared auth, ACL, storage, config, error handling |
| **vta-cli-common** | Shared CLI command implementations |
| **cnm-cli** | Community Network Manager (multi-community client) |
| **pnm-cli** | Personal Network Manager (single-VTA client) |
| **didcomm-test** | DIDComm connectivity test harness |

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
