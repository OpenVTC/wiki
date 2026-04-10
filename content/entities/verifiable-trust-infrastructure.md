---
title: "Verifiable Trust Infrastructure (VTI)"
type: entity
tags: [vti, infrastructure, workspace]
date-updated: 2026-04-09
sources: [verifiable-trust-infrastructure]
---

# Verifiable Trust Infrastructure (VTI)

The Verifiable Trust Infrastructure is a Rust workspace containing the core services that power [[verifiable-trust-community|Verifiable Trust Communities]]. It's the infrastructure layer of the OpenVTC ecosystem — the plumbing that makes decentralized trust work.

## Components

The workspace contains nine crates:

| Crate | Purpose |
|-------|---------|
| **[[verifiable-trust-agent\|vta-service]]** | The main VTA server — key management, signing, auth |
| **vta-sdk** | Data model and client library for VTA integration |
| **vta-enclave** | AWS Nitro Enclave wrapper for VTA |
| **vtc-service** | [[verifiable-trust-community\|VTC]] coordination service |
| **vti-common** | Shared auth, ACL, storage, config, error handling |
| **vta-cli-common** | Shared CLI command implementations |
| **cnm-cli** | Community Network Manager (multi-community client) |
| **pnm-cli** | Personal Network Manager (single-VTA client) |
| **didcomm-test** | DIDComm connectivity test harness |

## How It Fits in the Stack

VTI sits in the middle of the ecosystem stack:

```
┌─────────────────────────────┐
│  OpenVTC CLI / TUI          │  ← User-facing tools
├─────────────────────────────┤
│  VTI (VTA + VTC services)   │  ← This layer: key management, signing, coordination
├─────────────────────────────┤
│  Affinidi TDK + WebVH       │  ← DID resolution, messaging, DID hosting
├─────────────────────────────┤
│  didwebvh-rs                │  ← DID method implementation
└─────────────────────────────┘
```

Applications at the top (like [[openvtc-cli|OpenVTC]]) use VTI to manage keys and sign things. VTI in turn uses the [[affinidi-tdk|Affinidi TDK]] for DID resolution and messaging, and the [[affinidi-webvh-service]] for DID hosting.

## Dependencies

Key external dependencies:
- `affinidi-tdk` — DID resolution, messaging, data integrity proofs
- `didwebvh-rs` — did:webvh operations
- `dtg-credentials` — trust graph credential types
- `fjall` — embedded key-value storage
- `axum` — async HTTP framework
- `ed25519-dalek` — Ed25519 cryptography

## Tech Stack

- **Language**: Rust (edition 2024, requires 1.85+)
- **Async runtime**: Tokio
- **HTTP**: Axum 0.8
- **Storage**: fjall (embedded LSM)
- **Crypto**: ed25519-dalek, x25519-dalek, p256
- **Auth**: EdDSA JWTs, DIDComm challenge-response

## Recent Development

- **v0.2.0** — Nitro Enclave support, signing oracle, backup/restore
- **v0.3.0** — SDK integration module, imported secrets, lightweight DIDComm auth
- **Current** — crates.io publishability, CI pipeline

See also: [[verifiable-trust-agent]], [[verifiable-trust-community]], [[openvtc-cli]]
