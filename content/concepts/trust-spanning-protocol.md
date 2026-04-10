---
title: "Trust Spanning Protocol (TSP)"
type: concept
tags: [tsp, messaging, trust-over-ip, encryption]
date-updated: 2026-04-09
sources: [affinidi-tdk-rs]
---

# Trust Spanning Protocol (TSP)

The Trust Spanning Protocol is a messaging protocol specified by the Trust over IP Foundation, implemented in the [[affinidi-tdk|Affinidi TDK]]. It's a leaner alternative to [[didcomm|DIDComm]] for certain use cases.

## Key Characteristics

- **HPKE-Auth encryption** — Hybrid Public Key Encryption with authentication, providing strong forward secrecy
- **CESR binary encoding** — Composable Event Streaming Representation, a compact binary format
- **Simpler than DIDComm** — fewer layers, less complexity, designed for high-performance scenarios

## Relationship to DIDComm

TSP and DIDComm serve similar purposes (secure, DID-based messaging) but make different trade-offs. DIDComm is more established with broader tooling support; TSP is newer, leaner, and potentially faster. The ecosystem currently uses DIDComm for most operations but the TDK's TSP implementation suggests it may complement or partially replace DIDComm in future iterations.

See also: [[didcomm]], [[affinidi-tdk]]
