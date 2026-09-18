---
title: "Verifiable Trust Agent (VTA)"
type: entity
tags: [vta, vti, key-management, signing-oracle, infrastructure, primary, mobile, tsp, mdoc, post-quantum, audit, dogwood, eucalyptus]
date-updated: 2026-09-18
---

# Verifiable Trust Agent (VTA)

*Part of [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Agent is the central service of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]]. It's an always-on key management and signing service that handles the hardest part of decentralized identity: keeping cryptographic keys secure while making them usable.

## What It Does

The VTA is a **signing oracle** — applications send it data to sign, and it returns signatures. The private keys never leave the VTA's security boundary. This means applications that need to issue [[verifiable-credentials|credentials]], update [[decentralized-identifiers|DIDs]], or send authenticated [[didcomm|DIDComm messages]] don't need to manage keys themselves.

Key capabilities:
- **Key generation and derivation** — keys derive from a single BIP-39 seed via [[bip32-key-derivation|BIP-32]] (Ed25519, X25519, P-256, and since September 2026 **ML-DSA-44 / ML-DSA-65 post-quantum keys**, each record carrying the algorithm it was minted with); the VTA can also hold **non-extractable internal keys** (no derivation path, never exported, excluded from backup), **imported** Ed25519 keys for deterministic did:keys, and any key can be marked `exportable: false` so it can only ever be *used*
- **Signing oracle** — sign payloads on behalf of applications without exposing keys, behind a three-gate authorization model (caller context scope → resource-bound `signable_keys` policy → unscoped keys super-admin-only), narrowable per actor with `allowedKeys`; opaque payloads are **domain-separated** so a signature obtained for one purpose cannot verify as something else, and every use leaves an audit row
- **DID management** — create and manage [[did-webvh|did:webvh]], did:key and did:peer identifiers from templates (did-templates 2.0 and 3.0, the latter declaring which algorithms each key slot uses), including human-readable **agent names** (`example.com/@alice`) claimed in `alsoKnownAs`; deleting a DID cascades, refuses or revokes across everything that referenced it
- **Four holder stores** — the **secrets vault**; the **credential vault** (receive, store, verify and present W3C Data Integrity, BBS, SD-JWT and ISO mdoc credentials over DIDComm/TSP credential-exchange and OID4VP); versioned, namespaced **application state** (`vta/app-state/*`, August 2026); and the **persona store** (`persona/*`, September 2026 — the holder's own attributes, the profiles projected over them, disclosure history, behind a one-way boundary a context cannot read across). Plus per-context **agent memory** with separate read/write grants
- **Session management** — DID-keyed sessions; JWT-based REST auth with DIDComm/TSP challenge-response; every authenticated client carries an identity, signs what it sends, and verifies the signed reply
- **Access control** — role-based ACL (Super Admin → Admin → Initiator → Application → Reader → Monitor) with context scope, per-entry **capabilities that narrow within a role** (enforced since September 2026), a `persona-holder` capability, and least-privilege approvers ("may approve" ≠ "may act")
- **Approvals** — one runtime-manageable approvals model (`pnm approvals`) driven by Rego policy rules: step-up, task-execution consent pushed to approver devices (signed, and verified on-device), and an offline break-glass
- **Backup and restore** — encrypted backups using Argon2id (15-character minimum password), written owner-only; a DIDComm/TSP-only VTA backs up over chunked Trust Tasks
- **Audit logging** — a **hash-chained, verifiable** log with its own audit key; actors and DID-shaped targets are kept under a keyed hash so an erasure can null the plaintext while the chain still verifies; failed audit writes are reported, never swallowed
- **Rate limiting** — three per-IP limiters (`auth`, `did-log`, `backup-blob`), tunable at runtime, with attributable 429s

## Architecture

The VTA is built with Axum (Rust async web framework). Every operation is a **Trust Task** — a versioned JSON document with a canonical `trusttasks.org/spec/*` URI — and the same document can arrive over three transports:

1. **[[trust-spanning-protocol|TSP]]** — preferred since mid-2026, now at **Rev 3** (September 2026): a VTA forms and persists §7.2.2 relationships with its peers, re-forms them after a silent drop, and routes cross-mediator sends *nested* so its own mediator never learns the recipient; a VTA can run TSP-only
2. **[[didcomm|DIDComm v2]]** — encrypted messages via a mediator (the interop fallback)
3. **REST** — HTTP endpoints authenticated with EdDSA JWTs; the Trust-Task document rides the HTTPS binding too, and every superseded REST route is sign-posted with its successor task and a usage metric that gates its eventual removal

All inbound paths converge on one **dispatch spine** that enforces what each Trust-Task spec declares for itself — `recipient`, `proof`, audience binding, `issuedAt`, a replay guard whose record lives exactly as long as the acceptance window, and idempotency-key deduplication so a retried request whose reply was lost cannot mint a second DID. All *outbound* Trust Tasks go through one transport seam that picks TSP > DIDComm > REST from what the peer advertises and the sender can actually do. Every response is signed. Storage uses fjall, an embedded LSM key-value store, with AES-GCM at-rest encryption (TEE-derived keys in enclave mode; the `[hardened]` mode for non-TEE deployments since August 2026). Since July 2026 the service is a thin "spine" over twelve subsystem crates (`vta-keys`, `vta-vault`, `vta-policy`, `vta-webvh`, `vta-tee`, `vta-backup`, `vta-persona`, …) — see [[verifiable-trust-infrastructure#Components]]. The whole surface is declared an implementation of the normative ToIP [VTI specification](https://trustoverip.github.io/dtgwg-vti-spec/).

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
- An 8-layer defense-in-depth security model protects key material; TEE anti-rollback via an external CAS counter; a KMS re-initialisation needs explicit `allow_kms_reinit` authorization whatever the failure class (September 2026)
- An enclave proxy handles external routing (it now resolves `nitro-cli` by absolute path with a scrubbed environment)
- An operator connecting `pnm` to a TEE VTA anchors the bootstrap **by DID and a pinned PCR0**, never by a guessed URL

A plain non-TEE container image (with `[hardened]` at-rest encryption) also exists since August 2026, and the personal-use path is a managed VTA on the **VTA Farm** — see [[vti-setup]], [[vtafarm]].

### Seed Storage Backends
The master seed can be stored in:
- OS keyring (default for development)
- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault — seed reads are now **cached**, so KMS decrypt traffic scales with time rather than with request volume (a production VTA at ~22 req/s had been billing ~58M KMS requests a month)
- KMS (for enclave mode)
- Config file (not recommended for production)

## SDK Integration

Third-party services integrate with the VTA via the `vta-sdk` crate (0.25 at `Cypress`, 0.32 at `VTI-Dogwood`, 0.42 at `VTI-Eucalyptus-RC-0`, 0.43 at HEAD — consumed by [[openvtc]], [[affinidi-webvh-service|did-hosting-service]], the [[affinidi-tdk|TDK]] mediator, [[verifiable-git-infrastructure|VGI]], [[vtafarm]], and the [[vta-browser-plugin]]'s generated type bindings):

```rust
// Simplified integration pattern
use vta_sdk::integration;

let vta = integration::startup(&config).await?;
let signature = vta.sign(payload).await?;
```

The SDK handles authentication, token refresh, secret caching, and offline fallback. Since Dogwood a client is constructed *with* its identity (`VtaClient::authenticated(url, identity, token)`), signs every Trust Task it sends, verifies the signed reply, holds one idempotency key across the attempts of an operation (`VtaClient::idempotent`), vets a DID-advertised endpoint before sending a token to it, and re-forms a dropped TSP relationship on a reply timeout. Wire types are generated from the published Trust-Task specs and are `#[non_exhaustive]`, so adding a field is no longer a semver break. This is the recommended way for services in the ecosystem (like the [[affinidi-webvh-service]]) to interact with the VTA.

## Recent Development

Per-release detail lives on the workspace entity — see [[verifiable-trust-infrastructure#Recent Development]] for the full activity log. VTA-relevant highlights, reverse chronological:

### Dogwood and the Eucalyptus RC — August–September 2026

The VTA went through two milestone tags in a month ([[coordinated-releases]]). **`VTI-Dogwood`** (2026-08-30; `vta-service` 0.23.3 / `vta-sdk` 0.32.2; re-cut as **`VTI-Dogwood-R1`** on 09-01 at 0.23.4 / 0.32.3 with five "say the right thing" fixes) was deliberately silent — no GitHub Release — because its content is invisible to a user and essential to anyone building on the VTA: the wire became *honest*. **`VTI-Eucalyptus-RC-0`** (2026-09-17; 0.33.0 / 0.42.1; HEAD 0.34.0 / 0.43.0 the next day) is the loud one — post-quantum keys, TSP Rev 3, a hash-chained audit log, and the VTA becoming the holder's whole agent.

- **Dogwood: the wire is honest.** The dispatch spine enforces what each spec declares — `recipient`, `proof`, audience, `issuedAt` (#1146), framework-0.5.0 freshness and replay bounds (#1117, #1126/#1127) — and error messages stop being a probing oracle (#1130). Retries are safe: keyed Trust Tasks dedup on an `idempotencyKey` held across attempts (#1011/#1012; `retry-and-idempotency.md`). Every client has an identity and signs (#1147), and **any DID that names a key may sign** — the `did:key`-only restriction that had locked provisioned did:webvh integrations out of all 210 proof-requiring tasks is gone (#1193). Task coverage measured at 102 of 109 specs (#1151); three response-shape defects found by validating real responses (#1114). A third store, **application state** (#1051); `vta/services` as a task family superseding twenty REST routes (#1017); canonical capability discovery (#1042); DID deletion cascade with dry-run (#1198/#1199).
- **Signed responses, verified replies.** Both services sign success responses (#1335) and `VtaClient` verifies every reply (#1341); the phone verifies the consent prompt, not just the step-up one (#1324).
- **Post-quantum.** `KeyType::{MlDsa44, MlDsa65}` (#1502) derived from the BIP-32 chain (#1505); key records carry their algorithm (#1532); templates declare per-slot algorithms and a third key slot (#1530, #1554); did-templates 3.0 accepted alongside 2.0 (#1538); `pnm keys create` for a PQ key (#1535). Hybrid (multi-proof) credential issuance and verification landed on the VTC side (#1548–#1557).
- **TSP Rev 3.** Flag-day adoption (#1512); Trust Tasks in the TSP binding envelope (#1478); relationships persisted (#1531), formed before sends and pings, answered (#1525) and re-formed after silent drops on client and server (#1544, #1549); **one outbound path** for every Trust Task chosen from the peer's advertisement (#1474, #1483); cross-mediator sends nested for metadata privacy (#1559); the transport seam selects by the sender's *live* capability, fixing the post-Dogwood VTC-setup regression (#1560).
- **Security sprint (09-10 → 09-12).** Hash-chained audit log with its own non-derived key and a verifier (#1419–#1421), failed audit writes reported and the signing oracle audited (#1443); **domain-separated opaque signing** (#1417); `exportable` keys and `keys/export-secret` replacing `seeds/export-mnemonic` (#1401, #1404, #1407); DID-advertised endpoints vetted and tokens bound to origin (#1436); did:webvh resolution refused to non-public hosts (#1448); `/auth/challenge` no longer discloses enrolment (#1405); backups written 0600 (#1438); CI actions SHA-pinned (#1440).
- **Authorization surface.** ACL capabilities enforced and settable (#1279/#1280); `persona-holder` (#1286) and `whoami` reporting capabilities (#1298); `MemoryRead`/`MemoryWrite` (#1234) with `pnm memory` (#1222); runtime-tunable, attributable rate limits with `did.jsonl` on its own bucket (#1510, #1519); cached seed reads (#1290).
- **The holder's whole agent.** `vta-persona` — attributes, profiles, bindings, disclosure history, `release: stepUp` on disclosure, a deployment-declared claim-type registry (#1255 → #1342); the VTA as a **data-room** member — it mints the credentials that make a room joinable, seals records, joins, keeps up, opens what it holds, and calls a room's host on its principal's behalf (#1326, #1329, #1332, #1250); `vta-mcp` gains a local operation guard, per-call logging and a proper doc (#1101, `docs/02-vta/vta-mcp.md`).
- **TEE / ops.** `allow_kms_reinit` fail-closed (#1249); pnm anchors TEE bootstrap by DID + pinned PCR0 (#1454); `nitro-cli` by absolute path (#1441); chunked Trust-Task backup for DIDComm/TSP-only VTAs (#1522); `vta-mobile-core` on uniffi 0.32 and Rev 3 sealing.

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

The direction has shifted three times: from "make the VTA usable," to "make the VTA's runtime surface mutable in production without downtime or rebuilds," to (mid-2026) broadening *who* the VTA serves — phones as cryptographic approvers, AI agents as first-class clients, enterprises with owner/user separation of duty — and now (September 2026) to broadening *what it holds for its human*: identity attributes, memory, application state and shared data rooms, behind a signed, spec-conformant, post-quantum-ready wire over TSP Rev 3.

See also: [[verifiable-trust-infrastructure]], [[bip32-key-derivation]], [[openvtc]]
