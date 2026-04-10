---
title: "OpenVTC — The Trust Community CLI"
type: entity
tags: [openvtc, cli, tui, user-experience]
date-updated: 2026-04-09
sources: [openvtc]
---

# OpenVTC — The Trust Community CLI

OpenVTC is the user-facing tool for participating in [[verifiable-trust-community|Verifiable Trust Communities]]. It's a Rust CLI and TUI (terminal user interface) that orchestrates identity creation, relationship building, and credential exchange — making the complex machinery of decentralized trust accessible to end users.

## What It Does

OpenVTC implements the [[first-person-network|First Person Protocol]] for the "Know Your Developer" use case. From a user's perspective:

1. **Set up your identity** — generate keys, create your Persona DID ([[did-webvh|did:webvh]]), host it on the domain of your choice
2. **Connect with people** — send and accept relationship requests via [[didcomm|DIDComm]]
3. **Build your trust network** — exchange [[relationship-credential|Relationship Credentials]], receive [[endorsement-credential|endorsements]], get [[witness-credential|witness attestations]]
4. **Participate in communities** — join VTCs, respond to community protocol messages

Behind the scenes, OpenVTC orchestrates the [[verifiable-trust-agent|VTA]] (for key management), DIDComm messaging (for communication), and credential issuance (for trust building).

## Components

The workspace contains five crates:

### openvtc-cli
The original command-line interface with subcommands:
- `setup` — interactive identity creation wizard
- `status` — view your identity and trust graph status
- `contacts` — manage your connections
- `relationships` — manage relationship workflows
- `tasks` — track pending operations
- `vrcs` — manage Verifiable Relationship Credentials
- `export` — backup your settings
- `logs` — view activity history

### openvtc-cli2
A newer TUI (terminal user interface) built with `ratatui`, featuring:
- Page-based navigation with a state-handler/action architecture
- Setup wizard for first-time users
- Instance locking (one process per profile)
- Deferred loading for fast startup

### openvtc-service
A background daemon that polls a [[didcomm|DIDComm mediator]] for incoming messages and processes protocol requests. Currently handles maintainer list queries (`https://kernel.org/maintainers/1.0/list`).

### openvtc-lib
Core library with shared types: config management, BIP-32 key derivation, relationship state machines, credential operations, and OpenPGP card support.

### robotic-maintainers
A test service that automatically accepts relationships and issues VRCs — useful for development and testing.

## Identity Model

OpenVTC uses a two-layer identity model:

- **Persona DID (P-DID)** — your primary, public identity, created as a [[did-webvh|did:webvh]] and hosted on the domain of your choice as a `did.jsonl` file
- **Relationship DIDs (R-DIDs)** — private `did:peer` identifiers, one per relationship, so your Persona DID isn't exposed in every interaction

## Configuration

OpenVTC uses a three-tier configuration system:

| Tier | Storage | Contents |
|------|---------|----------|
| **PublicConfig** | JSON on disk | Non-sensitive settings |
| **SecuredConfig** | OS keyring/keychain | Cryptographic secrets |
| **ProtectedConfig** | Encrypted inside PublicConfig | Sensitive data encrypted with unlock code |

Protection modes:
- **Unlock code** — encrypt with a user-provided passphrase (HKDF-SHA256 + random nonce)
- **Plaintext** — no encryption (development only)
- **Hardware token** — encrypt via OpenPGP card (Nitrokey/YubiKey)

Multiple profiles are supported via the `OPENVTC_CONFIG_PROFILE` environment variable or `-p` flag.

## Recent Development

OpenVTC is at v0.1.x with active early development:

- **v0.1.3** — Fixed a deterministic encryption vulnerability in unlock code encryption (replaced seeded PRNG with HKDF-SHA256 + random nonce, with transparent legacy migration)
- **v0.1.2** — Added `--config` flag and operator documentation for the service
- **v0.1.1** — Documentation alignment and badge fixes
- **Current** — UI improvements, governance (CODEOWNERS), preparing for broader adoption

The focus is on security correctness and developer experience as the tool matures toward production use.

See also: [[verifiable-trust-agent]], [[first-person-network]], [[decentralized-trust-graph]]
