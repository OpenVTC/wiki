---
title: "Source: affinidi-tdk-rs"
type: source-summary
tags: [source, secondary, affinidi, tdk]
date-updated: 2026-04-30
repo: https://github.com/affinidi/affinidi-tdk-rs
---

# Source: affinidi-tdk-rs

**Repo**: [affinidi/affinidi-tdk-rs](https://github.com/affinidi/affinidi-tdk-rs)
**Type**: Secondary

## Summary

Comprehensive Rust toolkit providing identity, messaging, and credential primitives. DID resolution (250k+/sec cached), DIDComm v2.1 messaging with mediator, TSP implementation, SD-JWT, W3C Data Integrity proofs, and cryptographic primitives. The foundational library for the ecosystem.

## Key Wiki Page

- [[affinidi-tdk]]

## Recent Activity

- **Post-quantum cryptography + data-integrity API refactor** (v0.5.4, Apr 18): major workspace-wide bump; new affinidi-did-web crate; MSRV bumped to 1.94
- **VTA integration for centralized key management** (DIDComm 0.13.0, Apr 9): the mediator/DIDComm service can now delegate signing to the VTA
- **DIDComm service usability + outbound messaging** (0.1.5 / 0.2.0, Apr 13): improved API ergonomics, new outbound-messaging path
- **didwebvh-rs bump to 0.5** (Apr 18) + bumps to clear crates.io collisions
- **affinidi-crypto v0.1.5** (Apr 20): did:key raw-bytes helpers
- Misc: WebSocket reconnect-loop fix, dropped yanked transitive deps, CI publish-pipeline rework
- Implementation evolving quickly; treat low-level APIs as in flux
