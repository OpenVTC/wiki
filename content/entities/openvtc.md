---
title: "OpenVTC — The Trust Community CLI"
type: entity
tags: [openvtc, cli, tui, user-experience, primary]
date-updated: 2026-05-08
repo: https://github.com/OpenVTC/openvtc
---

# OpenVTC — The Trust Community CLI

*Repo: [github.com/OpenVTC/openvtc](https://github.com/OpenVTC/openvtc)*

OpenVTC is the user-facing tool for participating in [[verifiable-trust-community|Verifiable Trust Communities]]. It's a Rust CLI and TUI (terminal user interface) that orchestrates identity creation, relationship building, and credential exchange — making the complex machinery of decentralized trust accessible to end users.

## What It Does

OpenVTC implements the [[first-person-network|First Person Protocol]] for the "Know Your Developer" use case. From a user's perspective:

1. **Set up your identity** — generate keys, create your Persona DID ([[did-webvh|did:webvh]]), host it on the domain of your choice
2. **Connect with people** — send and accept relationship requests via [[didcomm|DIDComm]]
3. **Build your trust network** — exchange [[relationship-credential|Relationship Credentials]], receive [[endorsement-credential|endorsements]], get [[witness-credential|witness attestations]]
4. **Participate in communities** — join VTCs, respond to community protocol messages

Behind the scenes, OpenVTC orchestrates the [[verifiable-trust-agent|VTA]] (for key management), DIDComm messaging (for communication), and credential issuance (for trust building).

## Components

After the v0.2.0 workspace consolidation, the active crates are:

### openvtc
The user-facing TUI binary (formerly `openvtc-cli2`). The unsuffixed name is intentional, matching the convention used by uv, ruff, deno, and cargo. Eight main-menu panels:

- **Inbox** — real-time task processing (auto-handles trust-pongs, relationship finalization, rejections; queues interactive tasks; detail views for inbound/outbound requests, VRCs, pings, informational messages)
- **Relationships** — list/detail/new-request views, inline alias editing, R-DID privacy toggle, trust-ping with RTT latency
- **Credentials** — Received/Issued tabs, raw VRC JSON in detail view, clipboard copy, VRC request and removal
- **Settings** — inline editing, config export/import, passphrase protection management, hardware token detection, factory reset
- **VTA Service** — VTA URL, DID, credential DID, key count, backend type
- **Logs** — scrollable timestamped activity log with copy
- **Help/Status** — DID clipboard copy hotkeys with visual feedback
- **Quit**

The `openvtc-cli` legacy prompt-driven binary was deleted in v0.2.0 — all ongoing work lives in `openvtc`.

### openvtc-core
Shared library (formerly `openvtc-lib`, `publish = false`): config management, BIP-32 key derivation, relationship state machines, credential operations, and OpenPGP card support. After v0.2.0, no longer depends on `ratatui` or `dialoguer` — TUI deps don't bleed into `openvtc-service` or `robotic-maintainers`.

### openvtc-service
Background daemon that polls a [[didcomm|DIDComm mediator]] for incoming messages and processes protocol requests. Currently handles maintainer list queries (`https://kernel.org/maintainers/1.0/list`).

### did-git-sign
SSH/Git signing helper that uses the VTA as a signing oracle. Auto-configured during the setup wizard. Refuses to sign unless the parent process name starts with `git` or `ssh-keygen`, and writes every signing attempt — accepted or denied — to `~/.config/did-git-sign/audit.log`.

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

The focus has shifted from security correctness alone (the v0.1.x pass) to feature completeness on top of a hardened security base (v0.2.0).

### v0.2.0 — 2026-05-05 — major release (workspace consolidation + full TUI)

Headline functional changes:

- Workspace consolidation: the active CLI binary `openvtc-cli2` renamed to `openvtc` (matching the uv / ruff / deno / cargo convention); the supporting library `openvtc-lib` renamed to `openvtc-core`; the legacy prompt-driven `openvtc-cli` deleted
- Full TUI main menu — eight panels: Inbox, Relationships, Credentials, Settings, VTA Service, Logs, Help/Status, Quit. Real-time inbox task processing, inline alias editing, R-DID privacy toggle, trust-ping with RTT latency, raw VRC JSON in detail view, scrollable activity log
- DIDComm service integration replacing ~370 lines of manual messaging with `affinidi-messaging-didcomm-service` 0.2 (Router-based dispatch, automatic reconnection, message pickup, multi-DID listener support, periodic 60s keepalive)
- R-DID generation for both BIP32 and VTA backends, with dynamic R-DID listeners auto-added so message delivery works to relationship-specific DIDs
- VRC issuance from inbox with DataIntegrityProof signing; VRC rejection with message back to requester; friendly name in relationship requests, auto-set as contact alias on accept
- `ratatui` and `dialoguer` dependencies removed from `openvtc-core` so daemon and automation crates no longer pull in TUI deps transitively

Security pass folded into the same release branch:

- Per-entry random Argon2 salt with transparent v1→v2 migration for `derive_passphrase_key`. The previous deterministic salt = SHA-256(info) meant two operators with the same passphrase produced byte-identical KEKs; the new `passphrase_encrypt_v2` writes a magic-prefixed `[OPV2 | salt(16) | nonce(12) | ct+tag]` blob with a fresh random salt; decrypt auto-detects v1/v2. Argon2id parameters bumped to the OWASP "high-value KEK" floor (m=128 MiB, t=4, p=1)
- `did-git-sign` signing-policy hardening: the proxy refuses to sign unless the parent process name starts with `git` or `ssh-keygen`, and writes every signing attempt (accepted or denied) to `~/.config/did-git-sign/audit.log` (mode 0600)
- DIDComm replay window + 1024-entry seen-message LRU in `process_inbound_message`: drop messages outside ±48h / +5m skew, drop expired, dedupe by ID
- Tagged-variant downgrade defence on `SecuredConfigFormat`: switched the on-disk variant tag from `#[serde(untagged)]` to `#[serde(tag = "format")]` so every blob carries an explicit discriminator
- W3C DID Core 1.0 syntax parser replacing the previous `did:` prefix check; rejects bidi-override / zero-width chars in DID fields
- Inbox display-name sanitisation strips bidi/control/ANSI; bounded DIDComm event channel (256-entry capacity); `did.jsonl` write path is now the resolved profile dir
- Three community PRs folded in: profile-name validation hardening (#57); cross-platform config paths via `dirs::config_dir()` on Windows (#51, closes #47); `SecuredConfig` serde-format hardening (#34)

Test & CI changes:

- New in-process mediator harness wrapping the upstream `affinidi-messaging-test-mediator` 0.2 fixture; drops ~400 lines of in-tree fixture code and four dev-deps
- End-to-end integration tests drive a real Alice → Mediator → Bob DIDComm round-trip, a `RelationshipRequestBody` round-trip, and a two-leg VRC request/reject — all in ~350 ms once the mediator is up
- 38 new unit tests: setup-flow navigation (25 table-driven), BIP32 derivation (7 known-answer vectors), AES-GCM tampering (6)
- CI adds `cargo-deny` (advisories + licenses + bans + sources) and `cargo-llvm-cov` coverage; MSRV bumped 1.91 → 1.94

### v0.1.6 (did-git-sign integration) — 2026-04-30

- Auto-configure `did-git-sign` as part of setup wizard
- Uninstall (lib + CLI subcommand)
- Show `did-git-sign` principal + SSH key on help screen
- SSH-aware clipboard with OSC 52 + arboard fallback
- `--credential` paste replaced with online VTA provisioning
- `AdminRotated` provisioning intent

### v0.1.5 — 2026-04-15

- BIP32 seed and imported key material moved from plain `String` to `SecretString`
- Windows PowerShell examples and Windows secure-storage documentation

### v0.1.4 — earlier April 2026

- VRC `valid-until` prompt handling fix

### v0.1.3 — earlier April 2026

- Fixed a deterministic encryption vulnerability in unlock-code encryption (replaced seeded PRNG with HKDF-SHA256 + random nonce, with transparent legacy migration)

See also: [[verifiable-trust-agent]], [[first-person-network]], [[decentralized-trust-graph]]
