---
title: "Affinidi WebVH Service"
type: entity
tags: [affinidi, webvh, did-hosting, service, secondary]
date-updated: 2026-04-09
sources: [affinidi-webvh-service]
---

# Affinidi WebVH Service

The Affinidi WebVH Service is production infrastructure for hosting, resolving, and managing [[did-webvh|did:webvh]] identifiers at scale. It's the operational backbone that makes did:webvh practical — handling the hosting, witnessing, and monitoring that individual users shouldn't have to manage themselves.

## Components

The service is a Rust workspace with six crates, each running as a separate service:

| Service | Port | Role |
|---------|------|------|
| **webvh-server** | 8530 | Core DID hosting — create, upload, resolve, delete DIDs via REST with DIDComm auth |
| **webvh-witness** | 8531 | Generate cryptographic witness proofs for DID integrity |
| **webvh-control** | 8532 | Management UI, service registry, reverse proxy, passkey auth, ACL |
| **webvh-watcher** | 8533 | Read-only DID mirror for redundancy (receives pushed updates) |
| **webvh-daemon** | 8534 | All-in-one binary (server + witness + watcher + control) for simple deployments |
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

- **v0.1.0 (Mar 30, 2026)** — First production release with DIDComm auth migration, security audit fixes, passkey enrollment, root DID bootstrap, setup wizards
- **Stats overhaul (Mar 31)** — Unified stats collector, time-series tracking, per-DID resolve counts
- **VTA integration (Apr 1)** — Unified startup with local session caching
- **Cold-start bootstrap (Apr 9)** — `import-secrets` CLI for self-contained environment bootstrap

The focus is on making deployment and bootstrap fully self-contained and well-documented.

See also: [[did-webvh]], [[didwebvh-rs]], [[verifiable-trust-agent]]
