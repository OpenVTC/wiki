---
title: "Wiki Index"
type: index
date-updated: 2026-04-09
---

# Wiki Index

## Overview

- [[overview]] — The OpenVTC ecosystem: what it is, how the pieces fit, where it's heading

## Concepts

### Identity & DIDs
- [[decentralized-identifiers]] — What DIDs are, DID methods used (webvh, key, peer), resolution
- [[did-webvh]] — did:webvh method: verifiable history, SCIDs, pre-rotation, witnesses, portability
- [[did-types]] — The DID taxonomy: C-DID, M-DID, R-DID, P-DID, W-DID and their roles
- [[bip32-key-derivation]] — How all keys derive from one seed phrase via BIP-32/BIP-39

### Trust & Credentials
- [[decentralized-trust-graph]] — The DTG model: nodes (VMCs), directed edges (VRCs), trust traversal
- [[verifiable-credentials]] — W3C VCs: what they are, signing, verification, selective disclosure
- [[dtg-credentials-overview]] — The family of DTG credential types and how they fit together
- [[credential-categories]] — The four functional categories: Edge, Invitation, Annotation, VDS

### Individual Credential Types
- [[membership-credential]] — Community membership and personhood attestation (VMC)
- [[personhood-credential]] — PHC: a governance-layer property of VMCs, not a structural subtype
- [[relationship-credential]] — Directed trust attestation (VRC); two VRCs = one complete edge
- [[invitation-credential]] — Bootstrap new participants into communities (VIC)
- [[persona-credential]] — Selective persona disclosure and the "Banksy Maneuver" (VPC)
- [[endorsement-credential]] — Skill and competency endorsements (VEC)
- [[witness-credential]] — Third-party attestations with verification methods (VWC)

### Protocols
- [[witnessed-vrc-exchange]] — Five-phase Witnessed Session-Based VRC Exchange protocol
- [[didcomm]] — DIDComm v2: end-to-end encrypted DID-based messaging, mediators
- [[trust-spanning-protocol]] — TSP: leaner messaging alternative with HPKE-Auth + CESR

### Governance & Community
- [[trust-registries]] — Authoritative governance: roles, policies, PHC determination
- [[verifiable-trust-community]] — VTCs: structured trust communities with policies
- [[verifiable-trust-network]] — VTNs: federations of VTCs under shared governance
- [[first-person-network]] — The First Person vision: self-asserted identity, peer trust

## Entities (Projects)

### Primary
- [[verifiable-trust-infrastructure]] — VTI workspace: 9 crates, the infrastructure stack
- [[verifiable-trust-agent]] — VTA: key management, signing oracle, TEE support
- [[openvtc-cli]] — OpenVTC CLI/TUI: user-facing trust community tool
- [[dtg-credentials-repo]] — dtg-credentials library: DTG credential implementation

### Secondary (Building Blocks)
- [[affinidi-tdk]] — Affinidi TDK: DID resolution, messaging, crypto primitives
- [[affinidi-webvh-service]] — WebVH Service: did:webvh hosting infrastructure
- [[didwebvh-rs]] — didwebvh-rs: reference did:webvh Rust implementation

## Source Summaries

- [[sources/verifiable-trust-infrastructure]] — VTI repo summary and recent activity
- [[sources/openvtc]] — OpenVTC repo summary and recent activity
- [[sources/dtg-credentials]] — DTG credentials repo summary and recent activity
- [[sources/dtgwg-cred-tf]] — DTG spec: authoritative credential specification (v0.3)
- [[sources/affinidi-tdk-rs]] — Affinidi TDK repo summary and recent activity
- [[sources/affinidi-webvh-service]] — WebVH service repo summary and recent activity
- [[sources/didwebvh-rs]] — didwebvh-rs repo summary and recent activity
