---
title: "vti-didcomm-js — browser-side DIDComm v2"
type: entity
tags: [didcomm, javascript, browser, library, secondary]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/vti-didcomm-js
---

# vti-didcomm-js — `@openvtc/vti-didcomm-js`

*Repo: [github.com/OpenVTC/vti-didcomm-js](https://github.com/OpenVTC/vti-didcomm-js)*

A focused, dependency-light, ESM-only implementation of **exactly the subset of [[didcomm|DIDComm v2]] that the VTI's browser flows need** — so the [[vta-browser-plugin|VTA Wallet]] can talk to a [[verifiable-trust-agent|VTA]] through a mediator without a Rust/WASM toolchain. It is byte-compatible on the wire with `affinidi-messaging-didcomm` (the crate the VTA and the [[affinidi-tdk|TDK]] mediator use), verified by a Rust round-trip helper in CI. Runs in browsers and Node 20+; crypto from WebCrypto + @noble; 150+ tests including RFC 7518 vectors.

It was built inside the [[verifiable-trust-infrastructure|VTI]] workspace (design note `docs/05-design-notes/didcomm-js-implementation.md`) and **extracted into its own repository on 2026-05-21**; its primary consumer is `@openvtc/pnm-core`, which swapped onto it the same day, replacing a WASM scaffold. The `pnm-relay` is the other named consumer.

## The Subset

- **Authcrypt** (ECDH-1PU + A256KW + A256CBC-HS512, sender-bound) and **anoncrypt** (ECDH-ES) over X25519 or P-256; `routing/2.0/forward`
- DID resolution: did:key (Ed25519 / X25519 / P-256 / secp256k1), did:peer numalgo 2, [[did-webvh|did:webvh]] (via `didwebvh-ts`, full hash-chain + Data Integrity verification), pluggable dispatcher
- VTA REST `/auth/` challenge-response + refresh; mediator transport (ATM challenge auth, WebSocket with subprotocol bearer, message-pickup 3.0 live delivery, `sendAndWait`); TSP frame multiplexing on the same socket (0.6.0)
- *Not* implemented: multi-recipient JWE, XChaCha20, JWS-only, BBS+, other peer numalgos

## Recent Development

- **0.1.0 → 0.4.2 (2026-05-21 → 05-31)** — initial release; did:peer + P-256; `onMessage`; ack delivered messages with a TTL resolution cache; ack with `sha256(JWE)` and skip mediator frames (fixing an infinite ack/status loop); WebSocket close-code diagnostics.
- **0.5.0 (06-01)** — spec-correct ECDH-1PU `cc_tag` length prefix — a breaking authcrypt wire change with dual-KEK fallback, pairing with `affinidi-messaging-didcomm` ≥ 0.14.
- **0.6.0 (07-05)** — TSP frame multiplexing over the mediator socket (`onTspFrame`). **0.6.1 (07-16)** — REST auth realigned to canonical `trusttasks.org/spec/auth/*` types (D8-F2). **0.6.2 (07-16)** — hand inbound off *before* acking: at-least-once with dedup (D8-F3 / R1.6) — the change the browser plugin pins as its correctness floor. Docs/CLAUDE.md refresh 07-19.
- **Direction**: stable; serves as the pinned crypto floor for the plugin.

See also: [[vta-browser-plugin]], [[didcomm]], [[affinidi-tdk]], [[verifiable-trust-infrastructure]]
