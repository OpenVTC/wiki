---
title: "Verifiable Trust Agent (VTA)"
type: entity
tags: [vta, vti, key-management, signing-oracle, infrastructure, primary, mobile, tsp, mdoc]
date-updated: 2026-08-19
---

# Verifiable Trust Agent (VTA)

*Part of [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Agent is the central service of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]]. It's an always-on key management and signing service that handles the hardest part of decentralized identity: keeping cryptographic keys secure while making them usable.

## What It Does

The VTA is a **signing oracle** — applications send it data to sign, and it returns signatures. The private keys never leave the VTA's security boundary. This means applications that need to issue [[verifiable-credentials|credentials]], update [[decentralized-identifiers|DIDs]], or send authenticated [[didcomm|DIDComm messages]] don't need to manage keys themselves.

Key capabilities:
- **Key generation and derivation** — keys derive from a single BIP-39 seed via [[bip32-key-derivation|BIP-32]] (Ed25519, X25519, P-256); since August 2026 the VTA can also hold **non-extractable internal keys** (no derivation path, never exported, excluded from backup) and **imported** Ed25519 keys for deterministic did:keys
- **Signing oracle** — sign payloads on behalf of applications without exposing keys, behind a three-gate authorization model (caller context scope → resource-bound `signable_keys` policy → unscoped keys super-admin-only), narrowable per actor with `allowedKeys`
- **DID management** — create and manage [[did-webvh|did:webvh]], did:key and did:peer identifiers, including human-readable **agent names** (`example.com/@alice`) claimed in `alsoKnownAs`
- **Credential holder (vault)** — receive, store, verify and present credentials in W3C Data Integrity, BBS, SD-JWT and (August 2026) **ISO mdoc** formats, over DIDComm/TSP credential-exchange and OID4VP
- **Session management** — DID-keyed sessions; JWT-based REST auth with DIDComm/TSP challenge-response
- **Access control** — role-based ACL (Super Admin → Admin → Initiator → Application → Reader → Monitor) with context scope and least-privilege approvers ("may approve" ≠ "may act")
- **Approvals** — one runtime-manageable approvals model (`pnm approvals`) driven by Rego policy rules: step-up, task-execution consent pushed to approver devices, and an offline break-glass
- **Backup and restore** — encrypted backups using Argon2id (15-character minimum password)
- **Audit logging** — every operation is logged for compliance

## Architecture

The VTA is built with Axum (Rust async web framework). Every operation is a **Trust Task** — a versioned JSON document with a canonical `trusttasks.org/spec/*` URI — and the same document can arrive over three transports:

1. **[[trust-spanning-protocol|TSP]]** — preferred since mid-2026; a VTA can now run TSP-only
2. **[[didcomm|DIDComm v2]]** — encrypted messages via a mediator (the interop fallback)
3. **REST** — HTTP endpoints authenticated with EdDSA JWTs; the Trust-Task document now rides the HTTPS binding too, and every superseded REST route is sign-posted with its successor task and a usage metric that gates its eventual removal

All paths converge on one operations layer. Storage uses fjall, an embedded LSM key-value store, with AES-GCM at-rest encryption (TEE-derived keys in enclave mode; the `[hardened]` mode for non-TEE deployments since August 2026). Since July 2026 the service is a thin "spine" over eleven subsystem crates (`vta-keys`, `vta-vault`, `vta-policy`, `vta-webvh`, `vta-tee`, `vta-backup`, …) — see [[verifiable-trust-infrastructure#Components]].

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
- Since August 2026 tenant config is **not baked into the enclave image**: one image / one PCR0 per fleet, the config envelope is delivered over vsock at boot and its digest is anchored in the attestation (`POST /attestation/config-report`)
- An 8-layer defense-in-depth security model protects key material; TEE anti-rollback via an external CAS counter
- An enclave proxy handles external routing

A plain non-TEE container image (with `[hardened]` at-rest encryption) also exists since August 2026, and the personal-use path is a managed VTA on the **VTA Farm** — see [[vti-setup]].

### Seed Storage Backends
The master seed can be stored in:
- OS keyring (default for development)
- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault
- KMS (for enclave mode)
- Config file (not recommended for production)

## SDK Integration

Third-party services integrate with the VTA via the `vta-sdk` crate (0.25 at the `Cypress` release — consumed by [[openvtc]], [[affinidi-webvh-service|did-hosting-service]], the [[affinidi-tdk|TDK]] mediator, [[verifiable-git-infrastructure|VGI]], and the [[vta-browser-plugin]]'s generated type bindings):

```rust
// Simplified integration pattern
use vta_sdk::integration;

let vta = integration::startup(&config).await?;
let signature = vta.sign(payload).await?;
```

The SDK handles authentication, token refresh, secret caching, and offline fallback. This is the recommended way for services in the ecosystem (like the [[affinidi-webvh-service]]) to interact with the VTA.

## Recent Development

Per-release detail lives on the workspace entity — see [[verifiable-trust-infrastructure#Recent Development]] for the full activity log. VTA-relevant highlights, reverse chronological:

### Cypress + convergence — July–August 2026

The VTA shipped in the coordinated **`Cypress`** release ([[coordinated-releases]], 2026-08-17) as `vta-service` 0.17.0 / `vta-sdk` 0.25.0 — the first release cut through formal RCs and the new release-plz process. The month's VTA-relevant themes:

- **Every operation is a canonical Trust Task.** ACL, keys, config/provisioning, audit, webvh and credential-exchange surfaces all folded onto published `trusttasks.org/spec/*` URIs; payloads emit canonical lowerCamelCase (#1000, breaking); Trust Tasks ride the HTTPS binding on REST too (#1001); every superseded REST route is sign-posted with its successor and a usage metric (#1007). See [[verifiable-trust-infrastructure#Trust-Task canonicalisation]].
- **TSP is selectable, and DIDComm is optional.** `TransportChoice` with `Auto` = TSP > DIDComm > REST actually implemented (#797); a VTA can speak TSP without DIDComm (#937); TSP offered in the setup wizard and advertised at mint (#933/#934, #959).
- **One approvals model.** Step-up floors and config consent rules retired; Rego rules are the only trigger, manageable at runtime with `pnm approvals`, enforced on REST and webvh routes, with an offline break-glass (#909–#915). Approvers are least-privilege and need not hold VTA authority.
- **Signing oracle guarantees**: three-gate authorization documented and pinned (#814), `allowedKeys` per-actor narrowing (#865), **non-extractable internal signing keys** (#995), deterministic did:key from an imported key (#953).
- **ISO mdoc holder**: receive → verify against IACA trust anchors → store → present over OID4VP with a P-256 `ecdsa-jcs-2019` consent receipt (#984–#993).
- **Hardened non-TEE mode** (#835) and **Nitro tenant config over vsock** (#939).
- **Decomposition** of vta-service into eleven subsystem crates (#780–#791).
- **Messaging** now runs on the TDK's reliable delivery layer (`MessagingService` / outbox, #675–#691); agent names end-to-end (`pnm did-mgmt agent-names`).
- **Mobile**: request proofs verified on-device before prompting (#871); device Trust-Task submission with no REST over DIDComm and TSP (#792); `vta-mobile-core` 0.6.18.

### TSP as preferred transport — late June–July 2026

The VTA's transport preference officially flipped to **[[trust-spanning-protocol|TSP]] > DIDComm > REST**. DIDs double as TSP VIDs reusing the existing Ed25519/X25519 keys — no new key material; capability discovery is DID-document-driven (`TSPTransport` service advertised in DID templates, matched by type); TSP runs as a first-class managed service (`ServiceState::Tsp`, enable/disable/rollback via `pnm services`) over the *same* mediator websocket as DIDComm. Feature-gated and opt-in at the time; by August a selectable transport, with TSP-only VTAs supported.

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
