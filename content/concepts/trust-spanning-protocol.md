---
title: "Trust Spanning Protocol (TSP)"
type: concept
tags: [tsp, messaging, trust-over-ip, encryption, transport]
date-updated: 2026-09-04
sources: [affinidi-tdk, verifiable-trust-infrastructure, affinidi-webvh-service, openvtc, vta-browser-plugin, vti-setup]
---

# Trust Spanning Protocol (TSP)

The Trust Spanning Protocol is a messaging protocol specified by the Trust Over IP Foundation (TSP Specification Rev 2, November 2025 Experimental Implementer's Draft). It's a leaner alternative to [[didcomm|DIDComm]] — and as of late June 2026, it is the ecosystem's **preferred transport**: official guidance across the [[verifiable-trust-infrastructure|VTI]] flipped to **TSP > DIDComm > REST**.

## Key Characteristics

- **HPKE encryption** — Hybrid Public Key Encryption (RFC 9180); Rev 2 used authenticated HPKE-Auth, Rev 3 (September 2026, below) defaults every receiver to HPKE-Base instead
- **CESR binary encoding** — Composable Event Streaming Representation, a compact binary format
- **Simpler than DIDComm** — fewer layers, less complexity, designed for high-performance scenarios
- **Direct, Routed, and Nested message modes** — including relay through mediators and cross-mediator federation

## How the Ecosystem Adopted It

TSP's promotion happened in a coordinated burst across three repos in June–July 2026:

- **[[affinidi-tdk|Affinidi TDK]]** did the heavy lifting (~60 commits): the `affinidi-tsp` crate graduated from experimental to **supported**, was declared fully interoperable with the ToIP reference `tsp_sdk` (verified by a round-trip interop harness), and the mediator became dual-protocol — it sniffs DIDComm vs TSP frames on the *same* endpoint and websocket, bridges between the two, and federates TSP across mediators. Clients select TSP automatically when a peer supports it, with DIDComm fallback.
- **[[verifiable-trust-infrastructure|VTI]]** initially *deferred* TSP (2026-06-22 decision record) because the mediator couldn't route it — then reversed that decision three days later when the TDK work landed, and shipped TSP as a first-class managed service on the VTA (enable/disable/rollback via `pnm services`, DID templates advertising a `TSPTransport` service, a TSP health probe).
- **[[affinidi-webvh-service|did-hosting-service]]** added TSP as a third transport binding alongside HTTPS and DIDComm — possible in one PR because every wire operation there is a transport-agnostic **Trust Task** document ("everything is a trust task").

Design decisions worth knowing: DIDs double as TSP VIDs **reusing existing Ed25519/X25519 keys** (no new key material); capability discovery is DID-document-driven — peers advertise a service of type `TSPTransport`, and senders prefer it over `DIDCommMessaging` when present; TSP rides the same per-DID mediator websocket as DIDComm, so no second socket.

## Relationship to DIDComm

TSP and DIDComm serve similar purposes (secure, DID-based messaging) but make different trade-offs. DIDComm is more established with broader tooling; TSP is leaner and tracks the ToIP standards direction. The current posture is **TSP-preferred, DIDComm as the interop layer** — and by August 2026 that is implemented, not aspirational: the VTA exposes TSP as a *selectable* transport (`Auto` = TSP > DIDComm > REST), can run **TSP-only with no DIDComm at all**, offers TSP in its setup wizard and advertises it on minted DIDs; communities choose and publish their transports at setup, and the trust registry is reachable by DID over TSP; did-hosting-service decoupled TSP from DIDComm with a three-way transport selection and pushes outbound sync over TSP; [[openvtc]] runs the join ceremony over TSP when the community offers it (choosing TSP only when its own mediator can carry it); and the browser wallet ships a pure-TypeScript `vti-tsp-js`. The [[vti-setup]] Cypress walkthroughs default every component to TSP + DIDComm. What remains DIDComm-only: the did:webvh witness, and interop with the wider Aries/Credo world (for which the mediator now also speaks DIDComm v1).

## Rev 3: The September 2026 Protocol Revision

The upstream reference implementation (`openwallet-foundation-labs/tsp`) landed a ~74-commit "Rev 3" revision that breaks wire compatibility with Rev 2. Rev 3 messages carry version `0.1.0` (Rev 2 emitted `0.0.1`), so a receiver can tell the two apart instead of failing later at decode.

- **New CESR wire format** — envelope, payload, and signature encoding were rewritten to conform to spec section 9: one frame type for every message (the old dual envelope/signed-only wrapper is gone), a fixed field order that removes prior ambiguity around placeholder fields, and canonical CESR padding enforced unconditionally rather than behind a "strict" flag.
- **All-confidential or all-non-confidential, never mixed** — the envelope's separate non-confidential-data field is removed. Rev 2 let a message carry cleartext fields alongside an encrypted payload; in practice the only real user of that was a demo chat app sending `{name, timestamp}` in the open next to an encrypted body. The editors ruled a message is now either fully sealed or fully signed-only (spec 3.2); the mixed pattern, where genuinely needed, is expressed by nesting a signed-only outer message around a sealed inner one.
- **Rev 3 cipher suites** — the crypto registry conforms to spec section 8: HPKE-Base (RFC 9180, base mode only — HPKE-Auth is dropped) and the libsodium anonymous sealed box (kept only for existing implementations, marked for possible future removal). HPKE-Base is now the default for every receiver, replacing the sealed box as the implicit default. Post-quantum support is **X25519MLKEM768**, a hybrid classical/post-quantum KEM selected automatically by the recipient's key type — there's no separate PQ mode or code point, just HPKE-Base with a different KEM.
- **Thread IDs redefined as embedded self-referencing digests** (spec 7.2.1) — a relationship-forming message's thread ID is now a digest computed over its own envelope and payload fields (with its own digest slot zeroed during the calculation), rather than an out-of-band hash of the encrypted payload. Receivers recompute and verify it, rejecting mismatches.
- **Routed relationship forming** — previously, forming a new relationship over a routed path (through an intermediary) wasn't possible; only established relationships could be routed. Rev 3 lets an invite carry the reply path the inviting endpoint wants used, so the relationship itself can be established across an intermediary rather than requiring a direct link first. This matters for community and [[vta-topology|VTA]] deployments where two parties only ever reach each other through a mediator: they can now form a relationship without a prior direct channel.
- **`did:peer` numalgo 4** — nested and parallel VIDs move off numalgo 2 (which embeds keys directly, ~155 characters classically and up to 4.4 KB with post-quantum keys) to numalgo 4, which splits the VID into a long form (the full DID document, used only when a VID is first introduced) and a short form (a fixed 57-character hash of it, used as the VID's ongoing identity). This keeps routine traffic compact while still letting an unfamiliar peer verify a VID the first time it's seen.

Other Rev 3 hardening worth noting: application messages are now gated on an established relationship (anti-spoofing — a message from a sender the receiver has no relationship with is dropped rather than processed); every received message routes through a single implementation path instead of two drifting copies; and key state is bounded on receive rather than trusted indefinitely stale.

See also: [[didcomm]], [[affinidi-tdk]], [[verifiable-trust-infrastructure]], [[vta-topology]]
