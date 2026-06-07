---
title: "Affinidi Trust Development Kit (TDK)"
type: entity
tags: [affinidi, tdk, library, messaging, did-resolution, bbs, openid4vc, secondary]
date-updated: 2026-06-07
repo: https://github.com/affinidi/affinidi-tdk-rs
---

# Affinidi Trust Development Kit (TDK)

*Repo: [github.com/affinidi/affinidi-tdk-rs](https://github.com/affinidi/affinidi-tdk-rs)*

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

The May–June cycle (~50 commits) is dominated by three themes: a new **`affinidi-bbs` crate** plus end-to-end W3C `vc-di-bbs` selective disclosure, **JOSE centralisation** (a new `affinidi-crypto::jose` module that DIDComm 0.15 is rewired onto), and OpenID4VC family expansion (DCQL, OpenID4VCI key binding).

### `affinidi-bbs` v0.1.0 → v0.3.0 — May–June 2026 — BBS signatures, blind BBS, per-verifier pseudonym

New crate. Pure-Rust BBS signatures per `draft-irtf-cfrg-bbs-signatures` over BLS12-381, two ciphersuites (SHA-256 XMD and SHAKE-256 XOF), keygen / sign / verify / proof-gen / proof-verify with unlinkable presentations. Targets eIDAS 2.0 ARF ZKP requirements (ZKP_01, _02, _03, _06).

- **Blind BBS** (Commit / BlindSign / BlindVerify) for blind-issuance flows.
- **Per-verifier pseudonym layer** — nym commit / sign / verify + bound proof; pairs with the W3C `vc-di-bbs` per-verifier pseudonym document layer.
- **Audit-readiness hardening** — BBS proof verifier hardened against malformed input.

### `affinidi-data-integrity` v0.7.x — vc-di-bbs document layer

- Document-level `bbs-2023` sign / derive / verify; standards-interoperable W3C selective disclosure.
- BLS12-381 G2 did:key support for BBS+ issuer keys.
- **RDFC-1.0 hash N-Degree Quads** fix (`_:` path delimiter) — full 63/63 W3C rdf-canon conformance.
- Republished on `affinidi-crypto` 0.2.
- Legacy `bbs_2023` encoding deprecated in favour of `bbs_2023_transform`.

### `affinidi-crypto` — JOSE centralisation + DIDComm rewire

The #327 5-part PR series: an additive `affinidi_crypto::jose` module exposing JOSE primitives + a trait seam (PR 5b), JOSE key agreement + ECDH derivation (PR 5c), didcomm rewired onto `affinidi-crypto::jose` with the bespoke crypto deleted (PR 5d). Ships with an ADR + KAT harness (PR 5a).

- VC key-agreement negotiation + P-384 / P-521 curves.
- `affinidi-crypto` 0.1.x → 0.2.

### OpenID4VC family — DCQL + key-binding proof

- **`affinidi-openid4vp` 1.0** — Digital Credentials Query Language (DCQL) type model in `affinidi-openid4vp`; DCQL **matcher** evaluates a query against held credentials.
- **`affinidi-openid4vci`** — OpenID4VCI key-binding proof layer + Ed25519 JWT signer / verifier.

### DIDComm 0.15 — across the stack

The whole workspace moved to `affinidi-messaging-didcomm` 0.15, breaking the previous two-`Message`-type split. `affinidi-tdk` 0.7.3 / 0.7.4 pick up `didcomm ^0.15`; the affinidi mediator 0.15.12 → 0.15.15 and test-mediator 0.2.4 follow. `affinidi-tdk-common` republished at 0.6.3.

### Messaging — routing + reliability

- Routing-2.0 forward handler classifies a service URI as local when `(host, port)` matches the mediator's bind or any operator-declared alias (load-balancer / reverse-proxy deployments).
- Redeliver in-flight live-stream messages on duplicate-WebSocket replacement; fail in-flight WebSocket requests on disconnect.
- Mediator-setup no longer clobbers unified secret backend; `file://` URL handling fixed.

### `affinidi-did-web` — new crate

Minimal in-workspace `did:web` resolver replacing the upstream `did-web` crate; drops a vulnerable transitive `reqwest 0.11` / `rustls 0.21` chain inherited from upstream.

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
