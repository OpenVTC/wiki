---
title: "Affinidi Trust Development Kit (TDK)"
type: entity
tags: [affinidi, tdk, library, messaging, did-resolution, secondary]
date-updated: 2026-05-08
repo: https://github.com/affinidi/affinidi-tdk-rs
---

# Affinidi Trust Development Kit (TDK)

The Affinidi TDK is a comprehensive Rust toolkit providing identity, messaging, and credential primitives for the OpenVTC ecosystem. It's the foundational library that higher-level projects depend on for DID resolution, secure communication, and cryptographic operations.

## Key Components

### DID Resolution (`affinidi-did-resolver`)
High-performance [[decentralized-identifiers|DID]] resolution with local and network caching:
- 250k+ resolutions per second from cache
- Pluggable DID method support (did:webvh, did:key, did:peer, did:scid)
- Integrates with [[didwebvh-rs]] for webvh verification

### Messaging (`affinidi-messaging`)
Secure messaging built on [[didcomm|DIDComm v2.1]]:
- SDK, mediator/relay service, and terminal chat client
- Authcrypt and anoncrypt encryption modes
- Message forwarding and routing
- Production features: circuit breakers, rate limiting, graceful shutdown

### Trust Spanning Protocol (`affinidi-tsp`)
Implementation of the Trust over IP [[trust-spanning-protocol|TSP]] specification:
- HPKE-Auth encryption
- CESR binary encoding
- A leaner alternative to DIDComm for certain use cases

### Cryptographic Primitives
- Ed25519, P-256, secp256k1 key support
- W3C Data Integrity proofs (EdDSA JCS 2022, EdDSA RDFC 2022)
- Multibase/multicodec encoding
- RDF canonicalization

### Credentials (`affinidi-sd-jwt`)
Selective Disclosure JWT (SD-JWT) per RFC 9901 — issue, present, and verify credentials with selective claim disclosure.

### Meeting Place (`affinidi-meeting-place`)
Discovery and connection service using DIDs.

## Role in the Ecosystem

The TDK is the Swiss Army knife that everything else depends on:
- The [[verifiable-trust-agent|VTA]] uses it for DID resolution and DIDComm
- The [[affinidi-webvh-service]] uses it for DID operations and messaging
- [[openvtc|OpenVTC]] uses it for messaging and credential operations
- [[dtg-credentials|dtg-credentials]] uses its data integrity proofs for signing

## Recent Development

The TDK is a multi-crate workspace; entries below name the affected crate. Direction is toward production readiness with stronger security guarantees and better modularity. Implementation is evolving quickly; treat low-level APIs as in flux.

### mediator 0.15.2 — 2026-05-07

- Foolproof `api_prefix` normalisation

### mediator 0.15.1 + test-mediator 0.2.2 — 2026-05-05

- Routing fix
- `mediator-common` feature gating
- ACL / admin surface

### `affinidi-messaging-test-mediator` initial publication — 2026-05-04

- Promoted from in-tree fixture to published crate with third-party ergonomics
- Self-loopback routing fix
- Types relocation
- `local_dids` setter and `affinidi-messaging-mediator` boot wrapper for integration tests
- Downstream `openvtc` workspace immediately migrated to consume this, dropping ~400 lines of fixture code

### mediator 0.14.0 — 2026-05-04 — pluggable storage + unified secret backend + setup wizard

- Pluggable storage backends
- Unified secret backend
- New dedicated **`mediator-setup`** wizard package at `crates/messaging/affinidi-messaging-mediator/tools/mediator-setup`
- Wizard iterated in subsequent 0.14.1 / 0.15.x point releases: sealed-handoff webvh-server prompt restructure; `pnm --create-context` emission; Open/Closed network mode selection; fjall data-dir confirmation; security hygiene (zeroize sealed-handoff secrets on drop, shell-quote operator fields, restrict sensitive writes to 0o600, `deny_unknown_fields`)

### `affinidi-tdk-common` v0.6.0 — 2026-05-01

- Hardening + API tightening release
- Workspace-wide bump to consume it across crates

### `affinidi-tdk-rs` v0.5.4 — 2026-04-18 — post-quantum cryptography + data-integrity API refactor

- PQC support across the workspace
- Data-integrity API refactor
- New `affinidi-did-web` crate
- MSRV bumped to 1.94

### `affinidi-messaging` 0.1.5 / 0.2.0 — 2026-04-13 — DIDComm service usability + outbound messaging

- Improved API ergonomics for the DIDComm service
- New outbound-messaging path

### DIDComm 0.13.0 — 2026-04-09 — VTA integration for centralized key management

- Mediator / DIDComm service can delegate signing to the VTA

See also: [[didwebvh-rs]], [[verifiable-trust-agent]], [[didcomm]]
