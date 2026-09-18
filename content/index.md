---
title: "Wiki Index"
type: index
date-updated: 2026-09-18
---

# Wiki Index

## Overview

- [[overview]] — The OpenVTC ecosystem: what it is, how the pieces fit, where it's heading

## Concepts

### Identity & DIDs
- [[decentralized-identifiers]] — What DIDs are, DID methods used (webvh, key, peer, webs), resolution — now public-hosts-only by default
- [[did-webvh]] — did:webvh method: verifiable history, SCIDs, pre-rotation, witnesses, portability
- [[correlation-scope]] — WD02's replacement for DID types: the holder declares each identifier `pairwise`, `directed` or `public`
- [[did-types]] — The retired DID taxonomy (C/M/R/P-DID, dropped in WD02) and what each maps to now
- [[bip32-key-derivation]] — How all keys derive from one seed phrase via BIP-32/BIP-39 — Ed25519 and ML-DSA alike
- [[post-quantum-cryptography]] — ML-DSA keys, hybrid multi-proof credentials and TSP Rev 3's PQ suite: what is on by default, what is behind a flag, and what was built but unreachable

### Trust & Credentials
- [[decentralized-trust-graph]] — The DTG model: entities as nodes (people, communities, rooms), bidirectional credential pairs as edges, per-verifier edge verifiability
- [[verifiable-credentials]] — W3C VCs: what they are, signing, verification, selective disclosure, the formats the vault holds
- [[dtg-credentials-overview]] — The family of DTG credential types at WD02 and where main is taking them
- [[credential-categories]] — Edge (VRC, VMC, VDC) and Annotation credentials, with VIC and VAC outside the categories
- [[zero-knowledge-proofs]] — Why DTG defaults to ZKP presentation; pairwise vs community-anchored constructions; the new chain and shared-subject predicates
- [[trust-task-context-binding]] — `taskContext`: binding a credential to the exchange that produced it, without making it proof of the outcome

### Individual Credential Types
- [[membership-credential]] — VMC: a community grant plus the member's acknowledgement — the second half is consent; two halves = one complete edge
- [[personhood-credential]] — PHC: a governance-layer property of a membership grant, not a structural subtype
- [[relationship-credential]] — Peer-to-peer trust attestation (VRC); two VRCs = one complete edge; pairwise identifiers recommended
- [[delegation-credential]] — VDC (new in WD02): a third edge type — grant plus acceptance — that moves the permission question without answering it
- [[authority-credential]] — VAC (new in WD02): what a holder may do, attenuable down a digest chain; the credential an agent presents to a data room
- [[invitation-credential]] — Bootstrap new participants into communities and rooms (VIC)
- [[persona-credential]] — Selective persona disclosure and the "Banksy Maneuver" (VPC)
- [[endorsement-credential]] — VEC: peer endorsement of skills or roles — a statement, never a permission; on main a `dtg:endorses` statement profile
- [[witness-credential]] — Third-party attestations bound to a specific edge and exchange (VWC); `digestMultibase`; becoming a `dtg:witnessed` profile on main
- [[statement-credential]] — VSC (spec main only): one type, predicate profiles, fail-closed verification

### Protocols
- [[witnessed-vrc-exchange]] — Five-phase Witnessed Session-Based VRC Exchange protocol
- [[peer-identity-vetting]] — Vetted admission: existing members check an applicant in person or on video and sign statements the community counts, without publishing who vouched for whom (OpenVTC Vetting V0)
- [[didcomm]] — DIDComm v2: end-to-end encrypted DID-based messaging, mediators, the no-keylist mediation contract, egress guards
- [[trust-spanning-protocol]] — TSP Rev 3: the ecosystem's transport (HPKE-Base + CESR, relationships first), the five-implementation conformance suite, DIDComm as the separate interop carrier

### Governance & Community
- [[trust-registries]] — Authoritative governance: roles, policies, PHC determination
- [[verifiable-trust-community]] — VTCs: structured trust communities with policies, `public` identifiers, vetters, hosted rooms
- [[verifiable-trust-network]] — VTNs: federations of VTCs under shared governance; one anchor set among many
- [[first-person-network]] — The First Person vision: self-asserted identity, peer trust — and VGI as Know Your Developer in CI
- [[vta-topology]] — The spec's VTA vocabulary (personal / community, local / cloud, VTA networks, PNM, PNV, VTSP) mapped to the software, including the open-source VTA Farm
- [[data-rooms]] — Credential-governed, MLS-encrypted shared spaces with their own DIDs: shared memory for agents, hosted by a VTC or a tiny `room-host`, portable because there is no member list

### Releases
- [[coordinated-releases]] — The tree-named coordinated releases (Aspen → Banyan → Cypress → **Dogwood** 2026-08-30, silent → Dogwood-R1 → Eucalyptus RC-0 2026-09-17): what they are, why Dogwood was silent, which versions go together

## Entities

Each entity page covers both the project's structure (components, role, dependencies) and its recent development activity.

### Primary
- [[verifiable-trust-infrastructure]] — VTI workspace: 31 crates (VTA, VTC, SDKs, mobile core, MCP, persona store, data rooms, `room-host`), the infrastructure stack
- [[verifiable-trust-agent]] — VTA: key management, signing oracle, credential vault (DI/BBS/SD-JWT/mdoc), persona and app-state stores, room key custody, approvals, TEE support
- [[openvtc]] — OpenVTC TUI: user-facing multi-community client (0.3.1 on Eucalyptus RC-0 — recoverable installs, My Identity pane, vetting V0, TSP Rev 3)
- [[dtg-credentials]] — dtg-credentials library: DTG credential implementation (0.9.1 tracks spec WD02; VAC/VDC chains, `digestMultibase`)

### Specifications
- [[dtg-credential-spec]] — ToIP DTG Core Credentials specification — Working Draft 02 (2026-09-07), main heading for 0.4.0 with Statement Credentials

### Secondary (Building Blocks)
- [[affinidi-tdk]] — Affinidi TDK: DID resolution (webvh, webs, scid), messaging (TSP Rev 3 + DIDComm v2/v1), reliable delivery, multi-mediator relay, `net-guard`
- [[affinidi-webvh-service]] — did-hosting-service: did:webvh / did:web / did:webs hosting, three transports, Trust-Task auth on every binding
- [[didwebvh-rs]] — didwebvh-rs: reference did:webvh Rust implementation (0.7.0: public-hosts-only resolution by default)
- [[vti-setup]] — vti-setup: persona-organized guides for the full VTI stack, explore stream pinned to Dogwood with every download verified; deploy stream → the VTA Farm repos
- [[verifiable-git-infrastructure]] — VGI: `did-git-sign` + the `verify-trust` GitHub Action — commit trust for DIDs via a `Signed-by-DID:` trailer, verified against a VTC Trust Registry (0.4.12)
- [[vta-browser-plugin]] — VTA Wallet browser plugin: passkeys ↔ VTA DIDs, web login, consent approver, management console, persona map, data-rooms pane (pnm-core 0.9.1)
- [[rp-sdk-js]] — `@openvtc/rp-sdk`: server-side verification of wallet logins for relying parties
- [[vti-didcomm-js]] — browser-side DIDComm v2 subset used by the wallet, with an egress policy (`net-guard`) and TSP Rev 3 framing (0.10.1)

### VTA Farm (hosted VTAs on Kubernetes)
- [[vtafarm]] — VTA Farm portal: passkey sign-in, create and manage a hosted Personal VTA or Full Stack, admin console (v0.4.0)
- [[vtafarm-api]] — VTA Farm backend: per-user namespaces, Vault-sealed seeds, `vta setup` / `import-did` as Kubernetes Jobs, platform stack, sharing, custom domains (v0.4.0)
- [[vtafarm-k8s]] — OpenTofu stacks for a Farm on Hetzner: k3s + Rancher → RKE2 → cert-manager / Longhorn / two Vaults → the apps; thirteen runbooks
