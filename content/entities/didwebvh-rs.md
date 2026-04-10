---
title: "didwebvh-rs — did:webvh Rust Implementation"
type: entity
tags: [didwebvh, did, library, dif, secondary]
date-updated: 2026-04-09
sources: [didwebvh-rs]
---

# didwebvh-rs

A Rust library providing the reference implementation of the [[did-webvh|did:webvh]] DID method, conforming to the v1.0 specification from the Decentralized Identity Foundation (DIF). Currently at version 0.4.1.

## What It Provides

The full DID lifecycle for did:webvh:
- **Creation** — generate new DIDs with SCIDs and initial history entries
- **Resolution** — fetch and validate DID documents with full history verification
- **Update** — append new entries to the verifiable history log
- **Key rotation** — rotate keys with pre-rotation support
- **Deactivation** — properly deactivate a DID
- **Domain migration** — move a DID to a new domain while preserving identity
- **Witness management** — add, remove, and validate witness proofs
- **did:web export** — generate did:web-compatible documents

## Architecture

Key design features:
- **Pluggable signing** — a `Signer` trait lets callers provide their own signing backend (HSM, KMS, cloud) so private keys never enter the library
- **WASM-friendly** — resolution-only builds work in WebAssembly environments
- **Feature flags** — TLS backend selection (`rustls`, `native-tls`), optional `ssi` crate integration, CLI flows
- **Embeddable CLI** — interactive terminal flows for third-party applications to integrate did:webvh operations

## Role in the Ecosystem

This is a foundational building block. The [[affinidi-tdk|Affinidi TDK]] uses it for DID resolution, the [[affinidi-webvh-service]] builds hosting infrastructure on top of it, and the [[verifiable-trust-agent|VTA]] uses it for DID management. Any component that creates, resolves, or verifies a did:webvh identifier depends on this library.

## Recent Development

Recent work (last month) has focused on production readiness:
- Embeddable interactive CLI flows for third-party apps
- In-memory log verification (`resolve_log()`)
- HTTP response size limits for resolution safety
- `Signer` trait replacing direct `Secret` usage
- Convenience APIs (`update_document()`, `rotate_keys()`, `deactivate()`)
- Cache serialization (`save_state`/`load_state`)
- Wiremock-based tests replacing live network tests
- Criterion benchmarks

See also: [[did-webvh]], [[affinidi-webvh-service]], [[affinidi-tdk]]
