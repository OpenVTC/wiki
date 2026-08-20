---
title: "Trust Spanning Protocol (TSP)"
type: concept
tags: [tsp, messaging, trust-over-ip, encryption, transport]
date-updated: 2026-08-19
sources: [affinidi-tdk, verifiable-trust-infrastructure, affinidi-webvh-service, openvtc, vta-browser-plugin, vti-setup]
---

# Trust Spanning Protocol (TSP)

The Trust Spanning Protocol is a messaging protocol specified by the Trust Over IP Foundation (TSP Specification Rev 2, November 2025 Experimental Implementer's Draft). It's a leaner alternative to [[didcomm|DIDComm]] — and as of late June 2026, it is the ecosystem's **preferred transport**: official guidance across the [[verifiable-trust-infrastructure|VTI]] flipped to **TSP > DIDComm > REST**.

## Key Characteristics

- **HPKE-Auth encryption** — Hybrid Public Key Encryption (RFC 9180) with authentication
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

See also: [[didcomm]], [[affinidi-tdk]], [[verifiable-trust-infrastructure]]
