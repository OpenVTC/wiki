---
title: "Source: openvtc"
type: source-summary
tags: [source, primary, openvtc]
date-updated: 2026-04-30
repo: https://github.com/OpenVTC/openvtc
---

# Source: openvtc

**Repo**: [OpenVTC/openvtc](https://github.com/OpenVTC/openvtc)
**Type**: Primary
**Language**: Rust
**Latest version**: v0.1.5

## Summary

Rust CLI and TUI for participating in Verifiable Trust Communities. Implements the First Person Protocol for Know Your Developer. Five crates: CLI, TUI, background service, core library, and test service.

## Key Wiki Pages Generated

- [[openvtc-cli]] — project overview and usage
- [[first-person-network]] — the vision it implements
- [[relationship-credential]] — the VRC workflow it orchestrates

## Recent Activity (Last Month)

- **v0.1.5** (Apr 13): release rollup
- **Security hardening** (Apr 15): BIP32 seed and imported key material now stored in `SecretString` instead of plain `String`, reducing accidental disclosure via logs/dumps
- **Windows support** (Apr 15): PowerShell examples and documented Windows secure-storage behavior
- **CLI fixes**: `valid-until` prompt handling for VRC issuance corrected; spelling fixes in CLI messages, logs, and relationships code
- Documentation: contributor notes consolidated in README
