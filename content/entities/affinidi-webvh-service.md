---
title: "Affinidi WebVH Service"
type: entity
tags: [affinidi, webvh, did-hosting, service, secondary]
date-updated: 2026-05-08
repo: https://github.com/affinidi/affinidi-webvh-service
---

# Affinidi WebVH Service

*Repo: [github.com/affinidi/affinidi-webvh-service](https://github.com/affinidi/affinidi-webvh-service)*

The Affinidi WebVH Service is production infrastructure for hosting, resolving, and managing [[did-webvh|did:webvh]] identifiers at scale. It's the operational backbone that makes did:webvh practical — handling the hosting, witnessing, and monitoring that individual users shouldn't have to manage themselves.

## Components

The service is a Rust workspace. As of v0.6.0, six service crates plus a UI crate and a shared library:

| Service | Port | Role |
|---------|------|------|
| **webvh-server** | 8530 | Core DID hosting — create, upload, resolve, delete DIDs via REST with DIDComm auth |
| **webvh-witness** | 8531 | Generate cryptographic witness proofs for DID integrity |
| **webvh-control** | 8532 | Management UI, service registry, reverse proxy, passkey auth, ACL |
| **webvh-watcher** | 8533 | Read-only DID mirror for redundancy (receives pushed updates) |
| **webvh-daemon** | 8534 | All-in-one binary (server + witness + watcher + control) for simple deployments |
| **webvh-ui** | — | Web UI assets (added in v0.6.0) |
| **webvh-common** | — | Shared library: clients, DID operations, auth, storage, config |

## How It Works

1. A user creates a did:webvh via the [[verifiable-trust-agent|VTA]]
2. The VTA uploads the DID document and history log to a webvh-server
3. The server serves the `did.jsonl` at the DID's well-known URL
4. Witnesses attest to the integrity of DID updates via DIDComm protocol
5. Watchers mirror the DID for redundancy
6. The control plane manages service registration and access control

## VTA Integration

The WebVH service integrates deeply with the [[verifiable-trust-agent|VTA]]:
- Each service component authenticates to a VTA context during bootstrap
- DIDComm challenge-response authentication replaces bearer tokens between services
- The service uses the VTA's signing oracle for DID operations

The cold-start bootstrap flow (`import-secrets` CLI) can bring up an entire environment from scratch: VTA → mediator → webvh-server.

## Recent Development

The focus has shifted from "make deployment self-contained" (v0.1.x – v0.5.0) to "make every cross-service trust path explicit and tamper-resistant" (v0.6.0).

### Post-v0.6.0 (in flight) — DID ownership management

- DID ownership management (REST + DIDComm + UI) on a feature branch

### v0.6.0 — 2026-05-05 — web-based ACL invites, VTA template, offline bootstrap

- New `webvh-ui` crate joins the workspace
- All three refresh handlers (control, server, witness) require a JWS-signed DIDComm envelope and bind the signer to the session DID
- Offline-bootstrap latent bug fixed: previously `BTreeMap::iter().next()` picked the wrong `DidKeyMaterial` entry by alphabetical iteration; now matches by `did_document.id`
- Refresh-token rotation TOCTOU closed end-to-end via a new `KeyspaceOps::take_raw_atomic` primitive (Redis `GETDEL` / DynamoDB `DeleteItem ALL_OLD` / fjall mutex / per-keyspace mutex on Firestore + Cosmos DB)
- Registry / proxy trust chain hardened in `webvh-control`: `RegistryConfig` gains an optional `url_allowlist`; reqwest `Policy::none()` blocks third-party redirects; the proxy strips RFC 7230 §6.1 hop-by-hop headers and `Set-Cookie` from upstream responses
- Watcher `/api/sync/did` body limited to 4 MiB; `validate_did_jsonl` requires `state.id` to start with `did:webvh:`
- DIDComm authentication closes an auth-bypass on every REST `/api/auth/` endpoint (`unpack_signed` rejects envelopes whose `from` field disagrees with the JWS-verified signer)
- Witness `sign_proof` is now Admin-only with audit-log emission on every signed proof

### v0.5.0 — 2026-04-13 — DIDComm control-plane integration

- DIDComm control-plane integration
- Daemon parity with the split deployment
- Architecture simplified to consume the published `vta-sdk` crate

### Cold-start bootstrap, stats overhaul, VTA integration — 2026-03-31 to 2026-04-09

- Stats overhaul (unified collector, time-series tracking, per-DID resolve counts)
- VTA integration with unified startup and local session caching
- `import-secrets` CLI for self-contained environment bootstrap

### v0.1.0 — 2026-03-30 — first production release

- DIDComm auth migration
- Security audit fixes
- Passkey enrollment
- Root DID bootstrap
- Setup wizards

See also: [[did-webvh]], [[didwebvh-rs]], [[verifiable-trust-agent]]
