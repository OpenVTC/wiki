---
title: "Verifiable Trust Agent (VTA)"
type: entity
tags: [vta, vti, key-management, signing-oracle, infrastructure, primary, mobile]
date-updated: 2026-07-06
---

# Verifiable Trust Agent (VTA)

*Part of [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Agent is the central service of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]]. It's an always-on key management and signing service that handles the hardest part of decentralized identity: keeping cryptographic keys secure while making them usable.

## What It Does

The VTA is a **signing oracle** — applications send it data to sign, and it returns signatures. The private keys never leave the VTA's security boundary. This means applications that need to issue [[verifiable-credentials|credentials]], update [[decentralized-identifiers|DIDs]], or send authenticated [[didcomm|DIDComm messages]] don't need to manage keys themselves.

Key capabilities:
- **Key generation and derivation** — all keys derive from a single BIP-39 seed via [[bip32-key-derivation|BIP-32]], supporting Ed25519, X25519, and P-256
- **Signing oracle** — sign payloads on behalf of applications without exposing keys
- **DID management** — create and manage [[did-webvh|did:webvh]] and did:key identifiers
- **Session management** — JWT-based authentication with DIDComm challenge-response
- **Access control** — role-based ACL (Super Admin → Admin → Initiator → Application → Reader → Monitor)
- **Backup and restore** — encrypted backups using Argon2id
- **Audit logging** — every operation is logged for compliance

## Architecture

The VTA is built with Axum (Rust async web framework) and exposes two parallel API paths:

1. **REST API** — HTTP endpoints authenticated with EdDSA JWTs
2. **DIDComm API** — encrypted DIDComm v2 messages via a mediator

Both paths converge on a shared operations layer. Storage uses fjall, an embedded LSM key-value store.

### Application Contexts — now hierarchical

A key architectural concept is **Application Contexts** — logical namespaces that group keys and DIDs. Each context (e.g., "vta", "mediator", "my-app") gets its own BIP-32 derivation sub-tree, isolating keys between applications while deriving from the same master seed.

As of May 2026 contexts are **hierarchical**: a context ID *is* its `/`-separated path (max depth 8, e.g. `myorg/finance/payments`), with ancestry-aware ACL — parent-admin authority covers the entire subtree, so a top-level admin can authorise sub-context creation without per-context grants. Subtree delete supports cascade / refuse modes. See [[verifiable-trust-infrastructure#hierarchical-contexts-may-2026-slices-1-4|hierarchical contexts on the workspace entity]] for the slice-by-slice history.

### The VTA Seal

After initial bootstrap (via an interactive setup wizard), the VTA "seals" itself — offline CLI commands are disabled, and all management must go through authenticated REST or DIDComm APIs. This prevents unauthorized local access.

## Deployment Models

### Local Development
```bash
cargo run --package vta-service --features setup -- setup  # Interactive setup
cargo run --package vta-service                             # Start the server
```

### Hardware Enclave (AWS Nitro)
The VTA can run inside an AWS Nitro Enclave — a hardware-isolated virtual machine where not even the host operating system can access the VTA's memory. In this mode:

- Keys are unsealed via AWS KMS, pinned to the enclave's attestation (PCR0 + PCR8)
- Communication happens over vsock (virtual socket) rather than network
- An 8-layer defense-in-depth security model protects key material
- An enclave proxy handles external routing

### Seed Storage Backends
The master seed can be stored in:
- OS keyring (default for development)
- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault
- KMS (for enclave mode)
- Config file (not recommended for production)

## SDK Integration

Third-party services integrate with the VTA via the `vta-sdk` crate:

```rust
// Simplified integration pattern
use vta_sdk::integration;

let vta = integration::startup(&config).await?;
let signature = vta.sign(payload).await?;
```

The SDK handles authentication, token refresh, secret caching, and offline fallback. This is the recommended way for services in the ecosystem (like the [[affinidi-webvh-service]]) to interact with the VTA.

## Recent Development

Per-release detail lives on the workspace entity — see [[verifiable-trust-infrastructure#Recent Development]] for the full activity log. VTA-relevant highlights, reverse chronological:

### TSP as preferred transport — late June–July 2026

The VTA's transport preference officially flipped to **[[trust-spanning-protocol|TSP]] > DIDComm > REST**. DIDs double as TSP VIDs reusing the existing Ed25519/X25519 keys — no new key material; capability discovery is DID-document-driven (`TSPTransport` service advertised in DID templates, matched by type); TSP runs as a first-class managed service (`ServiceState::Tsp`, enable/disable/rollback via `pnm services`) over the *same* mediator websocket as DIDComm. Feature-gated and opt-in today; intended default-on after field exercise.

### Personal AI agents — June 2026

The VTA is being positioned as the trust/identity/secrets substrate under AI agent runtimes: `AgentSession` on vta-sdk, the new **`vta-mcp`** MCP server exposing the VTA's signing oracle / secrets vault / discovery to MCP hosts (Claude Desktop named explicitly), an `ai-agent` DID template, a per-context KV store for agent memory, scoped VC issue/revoke, and an ephemeral derive-and-sign trust task.

### Security campaign (P0–P3) — June 2026

The VTA-relevant core of the workspace-wide hardening push: AES-GCM AAD binding of stored values to their keyspace location (defeats ciphertext cut-and-paste by an untrusted Nitro parent); TEE **anti-rollback** (MAC'd integrity manifest + external CAS counter + attestation-gated anchor writer); DIDComm sender authentication; master-seed zeroization; step-up enforcement on vault release / proxy-login / sign-trust-task; fail-closed secret backends; an OpenAPI 3.1 spec for the full VTA surface; audit-trail tamper-evidence hash chain. Secrets backends were extracted into the reusable **`vti-secrets`** crate (Vault, KMS/TEE, Kubernetes Secrets).

### Mobile approver becomes a cryptographic party — July 2026

`vta-mobile-core` reached 0.6.11: push-gateway wake model, step-up **approve-response 0.2** with structured `authorizationContext`, and **signed denial** — the phone now cryptographically signs both outcomes of an authorization decision, not just approvals.

### did:webvh self-hosting — June–July 2026

The VTA serves its own did:webvh log at canonical `did.jsonl` paths, preloads its self-DID into the resolver cache (and re-syncs after runtime DID-log mutations), and backdates/spaces `versionTime` to avoid same-second log-entry collisions.

### Mobile agent (`vta-mobile-core` v0.3.0) — June 2026

The VTA family now includes a UniFFI engine for mobile holders. Two iOS/Android apps share one Rust core:

- **Authenticator** — pocket approver. Receives VTA/RP-pushed `auth/step-up/approve-request/0.1` over DIDComm v2, renders the reason, returns a passkey- or DID-signed approve-response.
- **PNM mobile** — mobile counterpart of the `pnm` CLI: drives the management surface (ACL, contexts, services, DID lifecycle) over the same Trust-Task wire as the CLI.

`DIDCommSession::receive_next(timeout_secs)` on `vta-sdk` adds the unsolicited-inbound primitive the mobile approver needs.

### Credential exchange end-to-end — May–June 2026

The VTA now sits inside the credential-exchange loop as both holder and presenter, not just a signing oracle:

- **BBS (`bbs-2023`) selective disclosure** — VTA receives BBS credentials into the vault and presents them with selective disclosure (feature `bbs`); built on the new `affinidi-bbs` crate in the TDK.
- **DCQL / OpenID4VP 1.0** — full holder query → present path inside the VTA, consent-gated, with ACL-gated holder-key resolution (`HolderKeyProvider`).
- **Live status re-check at present time** (§14.5); status-list credential issuer signature verified on every check.
- **DIDComm credential-exchange handlers** — query, present, issue paths, including deferred approval, sealed issuance, and Trust-Task descriptors.
- **Holder offer → request leg** — answer a credential offer with a key-binding proof (OpenID4VCI key-binding via Ed25519 JWT).

### Hierarchical contexts (slices 1–4) — May 2026

A context ID *is* its `/`-separated path (max depth 8) with ancestry-aware ACL — parent-admin covers the subtree. See [Application Contexts](#application-contexts-now-hierarchical) above.

### Trust Tasks 0.2 + dual-accept — June 2026

A single Trust Task envelope can be accepted at one of four ladder rungs: **device / vault / passkey / step-up**. Released alongside `vta-sdk` 0.10.0. The `provision-integration` flow gained 0.2 dual-accept; the legacy FPN URI is retired.

### v0.6.0 (in flight) — runtime service management

- Unified `pnm services …` CLI for enable / disable / list / rollback on a live VTA
- Snapshot-store / fail-forward semantics
- P0–P5 merged on `main`; P6 (e2e matrix) in PR

### v0.5.0 — 2026-05-04 — `sealed-bootstrap`

- Every secret-bearing transfer to/from the VTA moves as an HPKE-sealed bundle
- Template-driven DID minting
- DIDComm protocol surface can be enabled, disabled, or migrated on a running VTA without rebuilding it
- Refresh tokens single-use (RFC 6749 §10.4)
- `verify_vta_authorization_credential` returns a typestate
- `server_internal_super_admin` replaced with a sealed `InternalAuthority` marker

### v0.4.x — April 2026

- Production-grade DIDComm service v0.2 (lifecycle management, message expiry, problem-report logging)
- TEE deployment hardening
- Client DID documents and capabilities discovery

### v0.3.x — March/April 2026

- SDK integration module
- Imported secrets
- Lightweight DIDComm auth
- Reader role
- Automatic token refresh

### v0.2.0 — March 2026

- TEE / Nitro Enclave support
- Signing oracle
- Backup / restore
- P-256 keys
- Prometheus metrics

The direction has shifted twice: first from "make the VTA usable" to "make the VTA's runtime surface mutable in production without downtime or rebuilds," and now (mid-2026) to broadening *who* the VTA serves — phones as cryptographic approvers, AI agents as first-class clients, enterprises with owner/user separation of duty — over a transport stack converging on TSP.

See also: [[verifiable-trust-infrastructure]], [[bip32-key-derivation]], [[openvtc]]
