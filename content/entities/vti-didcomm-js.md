---
title: "vti-didcomm-js — browser-side DIDComm v2"
type: entity
tags: [didcomm, javascript, browser, library, tsp, security, secondary]
date-updated: 2026-09-18
repo: https://github.com/OpenVTC/vti-didcomm-js
---

# vti-didcomm-js — `@openvtc/vti-didcomm-js`

*Repo: [github.com/OpenVTC/vti-didcomm-js](https://github.com/OpenVTC/vti-didcomm-js)*

A focused, dependency-light, ESM-only implementation of **exactly the subset of [[didcomm|DIDComm v2]] that the VTI's browser flows need** — so the [[vta-browser-plugin|VTA Wallet]] can talk to a [[verifiable-trust-agent|VTA]] through a mediator without a Rust/WASM toolchain. It is byte-compatible on the wire with `affinidi-messaging-didcomm` (the crate the VTA and the [[affinidi-tdk|TDK]] mediator use; the CI round-trip helper now pins 0.15, matching both). Runs in browsers and Node 20+; crypto from WebCrypto + @noble; 150+ tests including RFC 7518 vectors. Since September 2026 it is also where the wallet's **network egress policy** lives: because a browser extension has no DNS API and cannot inspect a redirect, "which hosts may this client ever dial?" has to be decided by literal before the fetch, and this library is the one place every mediator, VTA and did:webvh URL passes through.

It was built inside the [[verifiable-trust-infrastructure|VTI]] workspace (design note `docs/05-design-notes/didcomm-js-implementation.md`) and **extracted into its own repository on 2026-05-21**; its primary consumer is `@openvtc/pnm-core`, which swapped onto it the same day, replacing a WASM scaffold. (The `pnm-relay` once named as a second consumer no longer exists — it was consolidated into pnm-core in August.)

## The Subset

- **Authcrypt** (ECDH-1PU + A256KW + A256CBC-HS512, sender-bound) and **anoncrypt** (ECDH-ES) over X25519 or P-256; `routing/2.0/forward`
- DID resolution: did:key (Ed25519 / X25519 / P-256 / secp256k1), did:peer numalgo 2, [[did-webvh|did:webvh]] (via `didwebvh-ts` 2.8, full hash-chain + Data Integrity verification — but since 0.9.0 the library fetches the log *itself* through the guard, so no host is contacted unvetted), pluggable dispatcher with a bounded LRU cache (500 entries; did:key / did:peer never cached, since they are free to mint and resolve offline)
- VTA REST `/auth/` challenge-response + refresh; mediator transport (ATM challenge auth, WebSocket with subprotocol bearer, message-pickup 3.0 live delivery, `sendAndWait`); [[trust-spanning-protocol|TSP]] frame multiplexing on the same socket — key-blind, acked after the consumer finishes, recognising both short (`-E`) and Rev 3 long (`--E`) framing (`./tsp-frame`)
- **`./net-guard`** (0.8.0): `assertSafeEndpoint`, `guardedFetch`, `BlockedEndpointError` (`code: "E_BLOCKED_ENDPOINT"`, typed `reason`) and a `netPolicy { allowInsecure, allowPrivate, allowHosts }` threaded through mediator resolution, auth, `MediatorSession`, VTA REST auth and did:webvh resolution; `./net-guard/node` adds a `dns.lookup` replacement for server-side consumers
- *Not* implemented: multi-recipient JWE, XChaCha20, JWS-only, BBS+, other peer numalgos

## Versions at the coordinated releases

| Cypress | VTI-Dogwood | VTI-Dogwood-R1 | main (2026-09-18) |
|---------|-------------|----------------|-------------------|
| 0.6.2 | 0.7.0 | 0.7.0 (same commit) | 0.10.1 |

The browser plugin pins two floors as *correctness constraints*: `^0.6.2` (hand-off-then-ack) and, since #254, `^0.10.0` (long-framed TSP replies).

## Recent Development

- **0.7.0 → 0.10.1 (2026-08-28 → 09-18; PRs #10–#25)** — from a stable floor to an actively hardened one.
  - **0.7.0 (08-29, #11 — in `VTI-Dogwood`).** *Why:* the 0.6.0 TSP demux routed a `-E` frame to `onTspFrame` and returned before the code that acks, but the mediator stores TSP through the same delete-to-ack path as DIDComm — so **every TSP message a client ever received stayed queued and was redelivered on every reconnect, indefinitely**, masked by request/reply discarding the stragglers. Inbound TSP frames are now handed off, awaited, then acked (R1.6 for TSP), with a throwing consumer withholding the ack. Dogwood-RC-1 (#10) and Dogwood (#12) were dependency refreshes only; Dogwood and Dogwood-R1 are the same commit here.
  - **0.8.0 (09-11, #13).** The **egress guard**. A mediator's REST, auth and WebSocket URLs come out of *its* DID document, and a VTA's base URL is written from one at onboarding — none of them chosen by the wallet — so a document naming `https://127.0.0.1` or `169.254.169.254` was a request from inside the user's network with the wallet's credentials attached. Every such endpoint is now vetted (no userinfo; no loopback / private / link-local / CGNAT / local-only names, including IPv4-mapped and 6to4 spellings), no auth request follows a redirect, response bodies no longer leak into error messages, and `allowInsecure` and `allowPrivate` become independent flags (local dev now needs both). Also realigned the Rust round-trip helper to `affinidi-messaging-didcomm` 0.15, which had been red in CI since the 0.5.0 `cc_tag` fix.
  - **0.9.0 / 0.9.1 (09-12, #14/#15; the `sec-4045` review).** `did:webvh` resolution checks the host *before* fetching the log — `unpackInbound` resolves an inbound frame's `skid` before the frame is authenticated, so anyone who can route a frame through the mediator could otherwise make a client GET any host — and takes over the fetch from `didwebvh-ts`, whose plaintext downgrade fired on any identifier merely *containing* `localhost`. 0.9.1 bounds the resolver cache, which an attacker-supplied `skid` could previously grow without limit. Same day: CI actions SHA-pinned with a read-only token (#16), Dependabot with a 7-day cooldown, TypeScript 7.0.2, @noble/curves 2.4, didwebvh-ts 2.8 (#18–#22), and a regression-gate suite that drives the full SEC-4045 bypass vector set through the real `fetch` and socket paths (#23).
  - **0.10.0 (09-15, #24).** TSP spec Rev 3 widened the `-E` count to cover the ciphertext, so any message past ~12 KB is long-framed and its text starts `--E`; the `startsWith("-E")` classifier sent those to the DIDComm unpacker, which threw *before* the ack — a poison frame redelivered forever while the TSP consumer never heard. `isTspFrameText` / `isTspFrameBytes` now match both; the mediator's `affinidi_tsp::is_tsp` and the wallet's `vti-tsp-js` were fixed in step.
  - **0.10.1 (09-18, #25, SEC #15).** The net-guard refuses bare single-label hosts (`intranet`, `metadata`, decimal/hex IP spellings) — a blind-SSRF gap the wallet's own did:webvh guard had already closed but the library had not.
- **0.5.0 → 0.6.2 (06-01 → 07-16)** — spec-correct ECDH-1PU `cc_tag` length prefix (breaking authcrypt wire change, pairs with `affinidi-messaging-didcomm` ≥ 0.14); TSP frame multiplexing (0.6.0); REST auth realigned to canonical `trusttasks.org/spec/auth/*` types (0.6.1, D8-F2); hand inbound off *before* acking (0.6.2, D8-F3 / R1.6) — the plugin's first correctness floor.
- **0.1.0 → 0.4.2 (2026-05-21 → 05-31)** — initial release; did:peer + P-256; `onMessage`; ack with `sha256(JWE)` and skip mediator frames; WebSocket close-code diagnostics.
- **Direction**: the guard's remaining browser gap — a public name that resolves to a private address — can only be closed by `allowHosts` with a pinned list the wallet does not yet hold. `VTI-Eucalyptus-RC-0` (2026-09-17) is not yet tagged here.

See also: [[vta-browser-plugin]], [[didcomm]], [[trust-spanning-protocol]], [[affinidi-tdk]], [[verifiable-trust-infrastructure]]
