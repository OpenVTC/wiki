---
title: "Wiki Index"
type: index
date-updated: 2026-08-19
---

# Wiki Index

## Overview

- [[overview]] — The OpenVTC ecosystem: what it is, how the pieces fit, where it's heading

## Concepts

### Identity & DIDs
- [[decentralized-identifiers]] — What DIDs are, DID methods used (webvh, key, peer), resolution
- [[did-webvh]] — did:webvh method: verifiable history, SCIDs, pre-rotation, witnesses, portability
- [[did-types]] — The DID taxonomy: C-DID, M-DID, R-DID, P-DID and their roles (W-DID dropped in WD01)
- [[bip32-key-derivation]] — How all keys derive from one seed phrase via BIP-32/BIP-39

### Trust & Credentials
- [[decentralized-trust-graph]] — The DTG model: entities as nodes, bidirectional VMC/VRC pairs as edges, trust traversal
- [[verifiable-credentials]] — W3C VCs: what they are, signing, verification, selective disclosure
- [[dtg-credentials-overview]] — The family of DTG credential types and how they fit together
- [[credential-categories]] — The three functional categories: Edge, Invitation, Annotation (VDS moved to a companion spec)
- [[zero-knowledge-proofs]] — Why DTG defaults to ZKP presentation; pairwise vs community-anchored constructions
- [[trust-task-context-binding]] — `taskContext`: binding a credential to the exchange that produced it, without making it proof of the outcome
- [[data-rooms]] — Shared spaces authorized by room-issued credential chains, not a host-held roster; group custody, presentation oracle, audit-without-learning-who

### Individual Credential Types
- [[membership-credential]] — Community membership and personhood attestation (VMC); two VMCs = one complete edge
- [[personhood-credential]] — PHC: a governance-layer property of VMCs, not a structural subtype
- [[relationship-credential]] — Peer-to-peer trust attestation (VRC); two VRCs = one complete edge
- [[invitation-credential]] — Bootstrap new participants into communities (VIC)
- [[persona-credential]] — Selective persona disclosure and the "Banksy Maneuver" (VPC)
- [[endorsement-credential]] — Skill and competency endorsements (VEC)
- [[witness-credential]] — Third-party attestations bound to a specific edge and exchange (VWC); one per direction

### Protocols
- [[witnessed-vrc-exchange]] — Five-phase Witnessed Session-Based VRC Exchange protocol
- [[didcomm]] — DIDComm v2: end-to-end encrypted DID-based messaging, mediators
- [[trust-spanning-protocol]] — TSP: the ecosystem's preferred transport (HPKE-Auth + CESR); VTAs can run TSP-only, DIDComm is the interop bridge

### Governance & Community
- [[trust-registries]] — Authoritative governance: roles, policies, PHC determination
- [[verifiable-trust-community]] — VTCs: structured trust communities with policies
- [[verifiable-trust-network]] — VTNs: federations of VTCs under shared governance
- [[first-person-network]] — The First Person vision: self-asserted identity, peer trust — and VGI as Know Your Developer in CI
- [[vta-topology]] — The spec's VTA vocabulary: personal / community, local / cloud, VTA networks, PNM, PNV, VTSP

### Releases
- [[coordinated-releases]] — The tree-named coordinated releases (Aspen → Banyan → Cypress → **Dogwood**, 2026-09-01): what they are and which versions go together

## Entities

Each entity page covers both the project's structure (components, role, dependencies) and its recent development activity.

### Primary
- [[verifiable-trust-infrastructure]] — VTI workspace: 26 crates (VTA, VTC, SDKs, mobile core, MCP), the infrastructure stack
- [[verifiable-trust-agent]] — VTA: key management, signing oracle, credential vault (DI/BBS/SD-JWT/mdoc), approvals, TEE support
- [[openvtc]] — OpenVTC TUI: user-facing multi-community client (v0.3.0 — agent names, TSP, async join)
- [[dtg-credentials]] — dtg-credentials library: DTG credential implementation (0.2.0 tracks spec WD01)

### Specifications
- [[dtg-credential-spec]] — ToIP DTG Core Credentials specification — v1.0 Working Draft 01 in its new `dtgwg-cred-spec` repo

### Secondary (Building Blocks)
- [[affinidi-tdk]] — Affinidi TDK: DID resolution, messaging (TSP + DIDComm v2/v1), reliable delivery layer, agent names, crypto primitives
- [[affinidi-webvh-service]] — did-hosting-service: did:webvh / did:web hosting, three transports, `/@name` agent-name resolution
- [[didwebvh-rs]] — didwebvh-rs: reference did:webvh Rust implementation
- [[vti-setup]] — vti-setup: persona-organized guides for the full VTI stack, pinned to Cypress; Kubernetes + VTA Farm deploy docs coming
- [[verifiable-git-infrastructure]] — VGI: `did-git-sign` + the `verify-trust` GitHub Action — commit trust for DIDs against a VTC Trust Registry
- [[vta-browser-plugin]] — VTA Wallet browser plugin: passkeys ↔ VTA DIDs, web login, in-browser consent/step-up approver
- [[rp-sdk-js]] — `@openvtc/rp-sdk`: server-side verification of wallet logins for relying parties
- [[vti-didcomm-js]] — browser-side DIDComm v2 subset used by the wallet
