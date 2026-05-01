---
title: "Source: verifiable-trust-infrastructure"
type: source-summary
tags: [source, primary, vti]
date-updated: 2026-04-30
repo: https://github.com/OpenVTC/verifiable-trust-infrastructure
---

# Source: verifiable-trust-infrastructure

**Repo**: [OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)
**Type**: Primary
**Language**: Rust
**Latest version**: v0.4.1

## Summary

Rust workspace implementing the core Verifiable Trust Infrastructure — the [[verifiable-trust-agent|VTA]] (key management and signing oracle), VTC service (community coordination), CLI tools, and AWS Nitro Enclave support. Nine crates covering the full infrastructure stack.

## Key Wiki Pages Generated

- [[verifiable-trust-infrastructure]] — project overview
- [[verifiable-trust-agent]] — the VTA in detail
- [[bip32-key-derivation]] — key derivation model used by VTA
- [[verifiable-trust-community]] — VTC concepts

## Recent Activity (Last Month)

- **v0.4.1** (Apr 14): release rollup
- **v0.4.0 — DIDComm service v0.2** (Apr 13): production lifecycle management for the DIDComm service — message expiry, problem-report logging, hardened mediator connection unification
- **v0.3.x** (Apr 11–12): client DID documents, capabilities discovery, user-specified keys; DIDComm bridge fixes; TEE feature/webvh dependency fix
- TEE deployment hardening: prereq-check fixes, Dockerfile cleanup, documentation rationalization
- Implementation work continues to evolve quickly; treat low-level details as in flux
