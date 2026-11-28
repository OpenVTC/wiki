---
title: "Wiki Index"
type: index
date-updated: 2026-11-28
---

# Wiki Index

## Overview

- [[overview]] — The OpenVTC ecosystem: what it is, how the pieces fit, where it's heading

## Concepts

### Identity & DIDs
- [[decentralized-identifiers]] — What DIDs are, the methods used (webvh, key, peer, and since Fig **did:scid** and **did:webs** on KERI v2 as full identities), resolution — public-hosts-only by default
- [[did-webvh]] — did:webvh method: verifiable history, SCIDs, pre-rotation, witnesses, portability
- [[correlation-scope]] — WD02's replacement for DID types: the holder declares each identifier `pairwise`, `directed` or `public` — named `issuerScope` in the credential; since WD 0.7.0 a community may declare its own identifier directed
- [[did-types]] — The retired DID taxonomy (C/M/R/P-DID, dropped in WD02) and what each maps to now
- [[bip32-key-derivation]] — How all keys derive from one seed phrase via BIP-32/BIP-39 — Ed25519 and ML-DSA alike
- [[post-quantum-cryptography]] — ML-DSA keys, hybrid multi-proof credentials and TSP 1.0's PQ profile: what is on by default, what is behind a flag

### Trust & Credentials
- [[decentralized-trust-graph]] — The DTG model: entities as nodes (people, communities, rooms), bidirectional credential pairs as edges, per-verifier edge verifiability
- [[verifiable-credentials]] — W3C VCs: what they are, signing, verification, selective disclosure, the formats the vault holds
- [[dtg-credentials-overview]] — The family of DTG credential types at the v1 context: edges, delegation, authority, statements, and the ToIP registry they now live in
- [[credential-categories]] — What happened to the credential categories: Edge Credentials remain a class, the informative categories were dropped
- [[zero-knowledge-proofs]] — Why DTG defaults to ZKP presentation; pairwise vs community-anchored constructions; the Predicate Credential System behind hidden vetting
- [[trust-task-context-binding]] — `taskContext` and `taskDigestMultibase`: binding a credential to the exchange that produced it, without making it proof of the outcome

### Individual Credential Types
- [[membership-credential]] — VMC: a community grant plus the member's acknowledgement; two halves = one complete edge; renewable; directed community grants and networks of networks since WD 0.7.0
- [[personhood-credential]] — PHC: a governance-layer property of a membership grant, not a structural subtype; a community's own `vetted/1` statements as evidence
- [[relationship-credential]] — Peer-to-peer trust attestation (VRC); two VRCs = one complete edge; pairwise identifiers recommended
- [[delegation-credential]] — VDC: a third edge type — grant plus acceptance — that moves the permission question without answering it; no longer a bearer credential
- [[authority-credential]] — VAC: what a holder may do, attenuable down a digest chain; community roles (vetter, maintainer, custom) are VACs; since Fig a VAC states its purposes of use
- [[invitation-credential]] — Bootstrap new participants into communities and rooms (VIC)
- [[persona-credential]] — Selective persona disclosure and the "Banksy Maneuver" (VPC)
- [[endorsement-credential]] — VEC: peer endorsement of skills or roles — a statement, never a permission; now the `endorses/1` statement profile
- [[witness-credential]] — Third-party attestations bound to a specific edge and exchange (VWC); now the `witnessed/1` statement profile with `taskDigestMultibase`
- [[statement-credential]] — VSC: one type, registry predicate profiles (`endorses/1`, `witnessed/1`, `vetted/1`, `presented/1`), fail-closed acceptance — implemented across the stack

### Protocols
- [[trust-tasks]] — The signed, transport-agnostic JSON document every operation in the stack is expressed as; the ToIP registry (45 families at Fig), its bindings (TSP binding 0.3 requires TSP 1.0), and how Eucalyptus made it the only door
- [[witnessed-vrc-exchange]] — Five-phase Witnessed Session-Based VRC Exchange protocol
- [[peer-identity-vetting]] — Vetted admission: existing members check an applicant in person or on video and sign `vetted/1` statements the community counts — from the TUI, the Keyring phone or the console — plus **hidden vetting**, a zero-knowledge k-of-n proof over unnamed vetters, run by the VTA since Fig
- [[didcomm]] — DIDComm v2: end-to-end encrypted DID-based messaging, mediators, the no-keylist mediation contract, egress guards, sender-bound proofs
- [[trust-spanning-protocol]] — TSP 1.0: the ecosystem's default transport (HPKE-Base + CESR, relationships first), in Rust, TypeScript, Go and Dart since Fig with the drafts refused, the conformance suite, DIDComm as the separate interop carrier

### Governance & Community
- [[trust-registries]] — Authoritative governance: roles, policies, PHC determination, commit-signing rights; the registry's own writes now authenticated and audited
- [[verifiable-trust-community]] — VTCs: structured trust communities with policies, role-based administration, a second approver for consequential actions, vetters, git namespaces, hosted rooms — and since Fig **member badges** and a richer member directory
- [[community-governance]] — **New (Fig).** Boards and elections: members propose ideas, accepted ideas become elections with blind ballots, credential rolls and vote checks — from the portal, OpenVTC or Keyring
- [[verifiable-trust-network]] — VTNs: networks of communities and other networks — listing vs membership, nesting, signed broadcast, a federated directory; running software since Fig ([[vtn-service]])
- [[community-git-namespaces]] — A VTC governing a GitHub or Forgejo namespace: the rights model (admin / create / own / maintain / commit.sign), the vgi-bridge, PR-open gates, required approvals, VTA-held commit signing
- [[first-person-network]] — The First Person vision: self-asserted identity, peer trust — and Know Your Developer walked end to end
- [[kernel-web-of-trust]] — The Linux kernel's PGP web of trust, Linux ID, and the Prague week of 2026-10-06/08: what was presented at the Linux Plumbers Conference and what shipped for the maintainer pilot
- [[vta-topology]] — The spec's VTA vocabulary (personal / community, local / cloud, VTA networks, PNM, PNV, VTSP) mapped to the software, including the Farm and the Keyring phone
- [[data-rooms]] — Credential-governed, MLS-encrypted shared spaces with their own DIDs: shared memory for agents, hosted by a VTC or a tiny `room-host`, portable because there is no member list; since Fig also conversations — replies, files, live watch, read markers kept by the member's VTA

### Releases
- [[coordinated-releases]] — The tree-named coordinated releases (Aspen → Banyan → Cypress → Dogwood → Eucalyptus → **Fig** 2026-11-27, 20 repos, the first on its own release branch; Ginkgo next): what they are, what each marked, which versions go together, the breaking changes to plan for

## Entities

Each entity page covers both the project's structure (components, role, dependencies) and its recent development activity.

### Primary
- [[verifiable-trust-infrastructure]] — VTI workspace: 51 crates (40 published) (VTA, VTC, SDKs, PNM and CNM CLIs, mobile core, MCP, persona store, data rooms, vetting PCS, voting, VTN client), the infrastructure stack — vta-service 0.87.2 / vta-sdk 0.94.2 at Fig
- [[verifiable-trust-agent]] — VTA: key management, signing oracle (now for git commits too), credential vault (DI/BBS/SD-JWT/mdoc), persona faces, room key custody, approvals with user-verifying step-up, hash-chained audit, TEE support; did:webs and did:scid identities since Fig
- [[openvtc]] — OpenVTC TUI: user-facing multi-community client (0.9.0 at Fig — vetting journeys with hidden vetting on the VTA, elections, data rooms, witnessing, did:scid personas, government-wallet joins, headless onboarding)
- [[vtn-service]] — **New (Fig).** The Verifiable Trust Network service and the `nnm` network manager CLI: listing and membership, nested networks, roles and broadcast, federated directory, trust graph, trust-registry projection (0.1.0)
- [[dtg-credentials]] — dtg-credentials library: DTG credential implementation (0.16.0 at Fig; issuer-key proofs, VAC purposes, directed community grants, Working Draft 0.7.0)

### Specifications
- [[dtg-credential-spec]] — ToIP DTG Credentials Core Specification — Working Draft 02 tagged 2026-09-07; main at Working Draft 0.7.0 (untagged): every credential salted, directed community identifiers, VAC purposes of use, networks of networks

### Secondary (Building Blocks)
- [[affinidi-tdk]] — Affinidi TDK and Messaging Mediator: DID resolution (webvh, webs on KERI v2, scid), messaging (TSP 1.0 default + DIDComm v2/v1), reliable delivery (affinidi-tdk 0.50); the mediator, in its own repository since October 2026 (0.56.0)
- [[affinidi-webvh-service]] — did-hosting-service: did:webvh / did:web / did:webs hosting, three transports, Trust-Task-only management; self-registering did:webs and step-up before destructive console actions since Fig (0.12.0)
- [[didwebvh-rs]] — didwebvh-rs: reference did:webvh Rust implementation (0.8.3 at Fig; did:scid:vh:1 conversions; in the coordinated tag set since Eucalyptus)
- [[vti-setup]] — vti-setup: persona-organized guides for the full VTI stack, all verified on **VTI-Fig** by automated runs (release policy: guides track coordinated releases); Trust Registry in the explore stack, Explore 03 for a GitHub org under the VTC; deploy stream → the VTA Farm repos
- [[verifiable-git-infrastructure]] — VGI: `did-git-sign` (the VTA signs, the key stays there), `verify-trust`, the forge layer for GitHub and Forgejo, and the per-community `vgi-bridge`; did:scid signers and P-256/FIDO SSH keys since Fig (0.37.0)
- [[vta-browser-plugin]] — VTA Wallet browser plugin: passkeys ↔ VTA DIDs, web login, consent approver, management console, faces manager, data-rooms pane; since Fig rooms as conversations, elections, trigger-link sign-in and TSP 1.0 (tsp-js 0.4.0 / pnm-core 0.9.1)
- [[rp-sdk-js]] — `@openvtc/rp-sdk`: server-side verification of wallet sign-ins for relying parties: `auth/oob` trigger links, SIOPv2 deprecated (0.3.1; not in the Fig tag set)
- [[vti-didcomm-js]] — browser-side DIDComm v2 subset used by the wallet, with an egress policy, sender-bound authcrypt, did:webs and did:scid resolution and TSP 1.0 framing (0.16.1)

### Mobile (Keyring, Berkman Klein Center)
- [[keyring-wallet]] — Keyring: the iOS/Android wallet for VRC exchange, witnessed exchange and hardware attestation that became a Personal Network Manager over cloud VTAs — joining communities and running the full peer identity vetting flow, applicant and vetter, from a phone; since Fig also private vetting, room chat, polls, badges and a per-phone DIDComm mailbox
- [[keyring-bifold]] — Keyring's fork of OpenWallet Foundation Bifold: the core packages, the Trust Tasks client, the Credo TSP adapter, the witness and mediator servers; folded into keyring-wallet in November 2026

### VTA Farm (hosted VTAs on Kubernetes)
- [[vtafarm]] — VTA Farm portal: passkey sign-in, create and manage a hosted Personal VTA or Full Stack, admin console; since Fig public sign-up, Keyring sign-in, an optional trust registry, metrics, logs and alerts (v0.23.1)
- [[vtafarm-api]] — VTA Farm backend: per-user namespaces, Vault-sealed seeds, `vta setup` / `import-did` as Kubernetes Jobs, platform stack, sharing, custom domains, workload placement, maintenance mode, tenant metrics and alerts
- [[vtafarm-k8s]] — OpenTofu stacks for a Farm on Hetzner: k3s + Rancher → RKE2 → cert-manager / Longhorn / two Vaults → the apps; runbooks including safe node retirement; Prometheus/Loki observability and named node pools since Fig
