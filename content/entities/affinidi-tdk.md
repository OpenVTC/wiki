---
title: "Affinidi Trust Development Kit (TDK)"
type: entity
tags: [affinidi, tdk, library, messaging, did-resolution, secondary]
date-updated: 2026-04-09
sources: [affinidi-tdk-rs]
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
- [[openvtc-cli|OpenVTC]] uses it for messaging and credential operations
- [[dtg-credentials-repo|dtg-credentials]] uses its data integrity proofs for signing

## Recent Development

Active development with ~32 commits in the last month:
- Major workspace restructuring into domain-driven layout (`crates/messaging/`, `crates/identity/`)
- Full TSP implementation with CESR encoding
- Mediator production hardening (circuit breaker, rate limiting, graceful shutdown)
- Security fixes (constant-time tag comparison, authcrypt key mismatch resolution)
- Abstract `Signer` trait for KMS/HSM support
- WebSocket proxy support and ping frame handling

The direction is toward production readiness with stronger security guarantees and better modularity.

See also: [[didwebvh-rs]], [[verifiable-trust-agent]], [[didcomm]]
