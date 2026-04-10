---
title: "Verifiable Trust Agent (VTA)"
type: entity
tags: [vta, vti, key-management, signing-oracle, infrastructure]
date-updated: 2026-04-09
sources: [verifiable-trust-infrastructure]
---

# Verifiable Trust Agent (VTA)

The Verifiable Trust Agent is the central service of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]]. It's an always-on key management and signing service that handles the hardest part of decentralized identity: keeping cryptographic keys secure while making them usable.

## What It Does

The VTA is a **signing oracle** — applications send it data to sign, and it returns signatures. The private keys never leave the VTA's security boundary. This means applications that need to issue [[verifiable-credentials|credentials]], update [[decentralized-identifiers|DIDs]], or send authenticated [[didcomm|DIDComm messages]] don't need to manage keys themselves.

Key capabilities:
- **Key generation and derivation** — all keys derive from a single BIP-39 seed via [[bip32-key-derivation|BIP-32]], supporting Ed25519, X25519, and P-256
- **Signing oracle** — sign payloads on behalf of applications without exposing keys
- **DID management** — create and manage [[did-webvh|did:webvh]] and did:key identifiers
- **Session management** — JWT-based authentication with DIDComm challenge-response
- **Access control** — role-based ACL (Super Admin → Admin → Initiator → Application → Reader → Monitor)
- **Backup and restore** — encrypted backups using Argon2id
- **Audit logging** — every operation is logged for compliance

## Architecture

The VTA is built with Axum (Rust async web framework) and exposes two parallel API paths:

1. **REST API** — HTTP endpoints authenticated with EdDSA JWTs
2. **DIDComm API** — encrypted DIDComm v2 messages via a mediator

Both paths converge on a shared operations layer. Storage uses fjall, an embedded LSM key-value store.

### Application Contexts

A key architectural concept is **Application Contexts** — logical namespaces that group keys and DIDs. Each context (e.g., "vta", "mediator", "my-app") gets its own BIP-32 derivation sub-tree, isolating keys between applications while deriving from the same master seed.

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
- An 8-layer defense-in-depth security model protects key material
- An enclave proxy handles external routing

### Seed Storage Backends
The master seed can be stored in:
- OS keyring (default for development)
- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault
- KMS (for enclave mode)
- Config file (not recommended for production)

## SDK Integration

Third-party services integrate with the VTA via the `vta-sdk` crate:

```rust
// Simplified integration pattern
use vta_sdk::integration;

let vta = integration::startup(&config).await?;
let signature = vta.sign(payload).await?;
```

The SDK handles authentication, token refresh, secret caching, and offline fallback. This is the recommended way for services in the ecosystem (like the [[affinidi-webvh-service]]) to interact with the VTA.

## Recent Development

The VTA has seen rapid development in early 2026:

- **v0.2.0 (Mar 2026)** — TEE/Nitro Enclave support, signing oracle, DIDComm migration, backup/restore, P-256 keys, Prometheus metrics
- **v0.3.0 (Mar-Apr 2026)** — Imported secrets, lightweight DIDComm auth, SDK integration module, Reader role, automatic token refresh, security hardening
- **Current** — Preparing for public release on crates.io

The direction is toward making the VTA easily consumable by third-party services and hardened for production TEE deployments.

See also: [[verifiable-trust-infrastructure]], [[bip32-key-derivation]], [[openvtc-cli]]
