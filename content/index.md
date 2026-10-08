---
title: "Wiki Index"
type: index
date-updated: 2026-10-07
---

# Wiki Index

## Overview

- [[overview]] — The OpenVTC ecosystem: what it is, how the pieces fit, where it's heading

## Concepts

### Identity & DIDs
- [[decentralized-identifiers]] — What DIDs are, DID methods used (webvh, key, peer, webs), resolution — public-hosts-only by default
- [[did-webvh]] — did:webvh method: verifiable history, SCIDs, pre-rotation, witnesses, portability
- [[correlation-scope]] — WD02's replacement for DID types: the holder declares each identifier `pairwise`, `directed` or `public` — named `issuerScope` in the credential since late September
- [[did-types]] — The retired DID taxonomy (C/M/R/P-DID, dropped in WD02) and what each maps to now
- [[bip32-key-derivation]] — How all keys derive from one seed phrase via BIP-32/BIP-39 — Ed25519 and ML-DSA alike
- [[post-quantum-cryptography]] — ML-DSA keys, hybrid multi-proof credentials and TSP Rev 3's PQ suite: what is on by default, what is behind a flag

### Trust & Credentials
- [[decentralized-trust-graph]] — The DTG model: entities as nodes (people, communities, rooms), bidirectional credential pairs as edges, per-verifier edge verifiability
- [[verifiable-credentials]] — W3C VCs: what they are, signing, verification, selective disclosure, the formats the vault holds
- [[dtg-credentials-overview]] — The family of DTG credential types at the v1 context: edges, delegation, authority, statements, and the ToIP registry they now live in
- [[credential-categories]] — What happened to the credential categories: Edge Credentials remain a class, the informative categories were dropped
- [[zero-knowledge-proofs]] — Why DTG defaults to ZKP presentation; pairwise vs community-anchored constructions; the Predicate Credential System behind hidden vetting
- [[trust-task-context-binding]] — `taskContext` and `taskDigestMultibase`: binding a credential to the exchange that produced it, without making it proof of the outcome

### Individual Credential Types
- [[membership-credential]] — VMC: a community grant plus the member's acknowledgement; two halves = one complete edge; renewable since Eucalyptus
- [[personhood-credential]] — PHC: a governance-layer property of a membership grant, not a structural subtype; a community's own `vetted/1` statements as evidence
- [[relationship-credential]] — Peer-to-peer trust attestation (VRC); two VRCs = one complete edge; pairwise identifiers recommended
- [[delegation-credential]] — VDC: a third edge type — grant plus acceptance — that moves the permission question without answering it; no longer a bearer credential
- [[authority-credential]] — VAC: what a holder may do, attenuable down a digest chain; community roles (vetter, maintainer, custom) are VACs since DTG Credentials v1
- [[invitation-credential]] — Bootstrap new participants into communities and rooms (VIC)
- [[persona-credential]] — Selective persona disclosure and the "Banksy Maneuver" (VPC)
- [[endorsement-credential]] — VEC: peer endorsement of skills or roles — a statement, never a permission; now the `endorses/1` statement profile
- [[witness-credential]] — Third-party attestations bound to a specific edge and exchange (VWC); now the `witnessed/1` statement profile with `taskDigestMultibase`
- [[statement-credential]] — VSC: one type, registry predicate profiles (`endorses/1`, `witnessed/1`, `vetted/1`, `presented/1`), fail-closed acceptance — implemented across the stack

### Protocols
- [[trust-tasks]] — The signed, transport-agnostic JSON document every operation in the stack is expressed as; the ToIP registry, its bindings, and how Eucalyptus made it the only door
- [[witnessed-vrc-exchange]] — Five-phase Witnessed Session-Based VRC Exchange protocol
- [[peer-identity-vetting]] — Vetted admission: existing members check an applicant in person or on video and sign `vetted/1` statements the community counts — from the TUI, the Keyring phone or the console — plus **hidden vetting**, a zero-knowledge k-of-n proof over unnamed vetters
- [[didcomm]] — DIDComm v2: end-to-end encrypted DID-based messaging, mediators, the no-keylist mediation contract, egress guards, sender-bound proofs
- [[trust-spanning-protocol]] — TSP Rev 3: the ecosystem's default transport (HPKE-Base + CESR, relationships first), the conformance suite across Rust, TypeScript, Go and Dart, DIDComm as the separate interop carrier

### Governance & Community
- [[trust-registries]] — Authoritative governance: roles, policies, PHC determination, commit-signing rights; the registry's own writes now authenticated and audited
- [[verifiable-trust-community]] — VTCs: structured trust communities with policies, role-based administration, a second approver for consequential actions, vetters, git namespaces, hosted rooms
- [[verifiable-trust-network]] — VTNs: federations of VTCs under shared governance; one anchor set among many
- [[community-git-namespaces]] — A VTC governing a GitHub or Forgejo namespace: the rights model (admin / create / own / maintain / commit.sign), the vgi-bridge, PR-open gates, required approvals, VTA-held commit signing
- [[first-person-network]] — The First Person vision: self-asserted identity, peer trust — and Know Your Developer walked end to end
- [[kernel-web-of-trust]] — The Linux kernel's PGP web of trust, Linux ID, and the Prague week of 2026-10-06/08: what was presented at the Linux Plumbers Conference and what shipped for the maintainer pilot
- [[vta-topology]] — The spec's VTA vocabulary (personal / community, local / cloud, VTA networks, PNM, PNV, VTSP) mapped to the software, including the Farm and the Keyring phone
- [[data-rooms]] — Credential-governed, MLS-encrypted shared spaces with their own DIDs: shared memory for agents, hosted by a VTC or a tiny `room-host`, portable because there is no member list

### Releases
- [[coordinated-releases]] — The tree-named coordinated releases (Aspen → Banyan → Cypress → Dogwood → **Eucalyptus** 2026-10-07, 18 repos, the largest by far): what they are, what each marked, which versions go together, the breaking changes to plan for

## Entities

Each entity page covers both the project's structure (components, role, dependencies) and its recent development activity.

### Primary
- [[verifiable-trust-infrastructure]] — VTI workspace: 32 crates (23 published) (VTA, VTC, SDKs, PNM and CNM CLIs, mobile core, MCP, persona store, data rooms, vetting PCS), the infrastructure stack — vta-service 0.56.0 / vta-sdk 0.64.2 at Eucalyptus
- [[verifiable-trust-agent]] — VTA: key management, signing oracle (now for git commits too), credential vault (DI/BBS/SD-JWT/mdoc), persona faces, room key custody, approvals, hash-chained audit, TEE support
- [[openvtc]] — OpenVTC TUI: user-facing multi-community client (0.5.0 at Eucalyptus — applicant and vetter vetting journeys, hidden vetting, faces and worlds, Repos panel, commit signing via the VTA)
- [[dtg-credentials]] — dtg-credentials library: DTG credential implementation (0.13.0 at Eucalyptus; v1 context, `issuerScope`, Statement Credentials, VAC/VDC chains)

### Specifications
- [[dtg-credential-spec]] — ToIP DTG Credentials Core Specification — Working Draft 02 tagged 2026-09-07; main at Working Draft 0.6.0 with the v1 context, `issuerScope` and the registry IRIs

### Secondary (Building Blocks)
- [[affinidi-tdk]] — Affinidi TDK: DID resolution (webvh, webs, scid), messaging (TSP Rev 3 default + DIDComm v2/v1), reliable delivery, an operable mediator administered only by Trust Tasks (mediator 0.37.0)
- [[affinidi-webvh-service]] — did-hosting-service: did:webvh / did:web / did:webs hosting, three transports, Trust-Task-only management after the REST control plane was deleted
- [[didwebvh-rs]] — didwebvh-rs: reference did:webvh Rust implementation (0.8.0, data-integrity 0.8; in the coordinated tag set since Eucalyptus)
- [[vti-setup]] — vti-setup: persona-organized guides for the full VTI stack, every download verified; deploy stream → the VTA Farm repos
- [[verifiable-git-infrastructure]] — VGI: `did-git-sign` (the VTA signs, the key stays there), `verify-trust`, the forge layer for GitHub and Forgejo, and the per-community `vgi-bridge` (0.18.2)
- [[vta-browser-plugin]] — VTA Wallet browser plugin: passkeys ↔ VTA DIDs, web login, consent approver, management console, faces manager, data-rooms pane (0.1.2 / pnm-core 0.9.1)
- [[rp-sdk-js]] — `@openvtc/rp-sdk`: server-side verification of wallet logins for relying parties
- [[vti-didcomm-js]] — browser-side DIDComm v2 subset used by the wallet, with an egress policy, sender-bound authcrypt and TSP Rev 3 framing (0.12.0)

### Mobile (Keyring, Berkman Klein Center)
- [[keyring-wallet]] — Keyring: the iOS/Android wallet for VRC exchange, witnessed exchange and hardware attestation that became a Personal Network Manager over cloud VTAs — joining communities and running the full peer identity vetting flow, applicant and vetter, from a phone
- [[keyring-bifold]] — Keyring's fork of OpenWallet Foundation Bifold: the core packages, the Trust Tasks client, the Credo TSP adapter, the witness and mediator servers

### VTA Farm (hosted VTAs on Kubernetes)
- [[vtafarm]] — VTA Farm portal: passkey sign-in, create and manage a hosted Personal VTA or Full Stack, admin console
- [[vtafarm-api]] — VTA Farm backend: per-user namespaces, Vault-sealed seeds, `vta setup` / `import-did` as Kubernetes Jobs, platform stack, sharing, custom domains
- [[vtafarm-k8s]] — OpenTofu stacks for a Farm on Hetzner: k3s + Rancher → RKE2 → cert-manager / Longhorn / two Vaults → the apps; runbooks including safe node retirement
