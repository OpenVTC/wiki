---
title: "Wiki Log"
type: log
date-updated: 2026-06-07
---

# Wiki Log

A record of major wiki updates: new sources ingested, significant concept and entity additions, and meaningful structural changes.

---

## [2026-06-07] Ecosystem refresh — multi-community pivot, mobile holder, BBS, did-hosting-service rename

Entity activity logs refreshed for the May–June 2026 cycle — the largest single push in the VTI workspace's history (~530 commits) and a comparable surge in the surrounding repos.

**OpenVTC** — [[openvtc]] now reflects the multi-community pivot: v0.2.1 (nine CLI security/hardening fixes, plus retirement of the `openvtc-service` and `robotic-maintainers` crates whose roles are now covered by the TUI's own DIDComm session and the in-tree mediator harness), followed by a DRAFT v5 design spec (D1–D17), a T1 active-identity API sketch, and an additive T1 implementation slice in `openvtc-core` (`Account` / `PersonaRecord` / `CommunityRecord` / `IdentityRegistry`).

**VTI** — [[verifiable-trust-infrastructure]] now documents the new `vta-mobile-core` (UniFFI engine behind the Authenticator + PNM mobile apps, v0.3.0) and `vti-webauthn` crates; the BBS-2023 end-to-end credential exchange (VTA receive + present, VTC join verifier); DCQL / OpenID4VP `vp_token` verification on both sides; TRQP issuer-trust + status-list verification wired into the join evidence; the four hierarchical-context slices; Trust Tasks 0.2 dual-accept; the documentation restructure into a five-chapter book. [[verifiable-trust-agent]] keeps a focused, VTA-relevant subset.

**did-hosting-service** — [[affinidi-webvh-service]] reflects the v0.7.0 rename (`affinidi-webvh-service` → `did-hosting-service`), multi-domain hosting with `DomainScope` ACL, multi-method (`did:webvh` + `did:web`) via a `DidMethod` trait, a separate `did-hosting-client` companion crate, Trust Tasks 0.2 ACL, and the VTA-proxied SIOP login + visualisation flow (M2B.4).

**TDK** — [[affinidi-tdk]] gained sections for the new `affinidi-bbs` crate (BBS signatures, blind BBS, per-verifier pseudonym), W3C `vc-di-bbs` document-level selective disclosure in `affinidi-data-integrity` 0.7, JOSE centralisation via a new `affinidi-crypto::jose` module that DIDComm 0.15 is rewired onto, DCQL + OpenID4VCI key-binding in the OpenID4VC family.

**didwebvh-rs** — [[didwebvh-rs]] picked up v0.5.3 (a 15-patch cross-implementation security audit covering authorisation, SSRF, witness threshold, path traversal, and percent-encoding) and v0.5.4 (witness-ID serialisation fixes for spec compliance + `affinidi-data-integrity` 0.7).

**DTG Credentials** — [[dtg-credentials]] released v0.1.3 picking up `affinidi-data-integrity` / `affinidi-tdk` 0.7.

[[overview]] was refreshed to reflect the new state; [[index]] date-updated; root log appended.

---

## [2026-05-08] Structural: Sources folded into Entities

`wiki/sources/` has been deleted. Each of the seven source-summary pages was either merged into its entity counterpart (the six project sources) or promoted to a new spec entity ([[dtg-credential-spec]], from the ToIP DTGWG spec source). Two entity files were renamed in the same pass to align filenames with their upstream repos: `entities/openvtc-cli.md` → `entities/openvtc.md` and `entities/dtg-credentials-repo.md` → `entities/dtg-credentials.md`. Each entity page now carries a `repo:` URL in its frontmatter and owns both the project's conceptual structure and its `Recent Development` activity log. The VTI / VTA case kept both entities: VTI carries the canonical workspace activity log; VTA keeps a focused, VTA-relevant subset and points back to VTI for full release notes.

The motivation was maintenance burden: in practice the parallel "Recent Activity" / "Recent Development" sections were drifting out of sync (didwebvh-rs's entity had been at v0.4.1 while its source was at v0.5.2), and every wiki update was producing two near-identical writeups. With consolidation, every project / spec has one canonical page. `CLAUDE.md` was updated to drop the `source-summary` page type, restate the Ingest workflow on entities, and note `repo:` as the canonical provenance field. ~24 cross-references (`[[sources/...]]` links and concept-page `sources:` frontmatter) were redirected.

---

## [2026-05-08] New concept page: Zero-Knowledge Proofs in the DTG

DTG spec PR #33 (merged 2026-05-08) replaced the single VRC ZKP subsection with two distinct constructions: a **pairwise ZKP** anchored to the VRC (available between any two VRC holders, no shared community required) and a **community-anchored ZKP** anchored to the VMC (the three-part proof requiring same C-DID). The spec Overview was rewritten to clarify that DTG credentials SHOULD use ZKP presentation when privacy is desired, and Privacy Considerations gained a "ZKPs by default" guidance.

A new concept page [[zero-knowledge-proofs]] was created to give the pairwise/community-anchored distinction a single home and to capture the broader "ZKPs by default" framing. Pages updated to link in: [[relationship-credential]] (its old "Community-Anchored ZKP Proofs" section was replaced with a broader "ZKP Presentation" section covering both constructions), [[membership-credential]] (added a Community-Anchored ZKP subsection), [[persona-credential]] (added a Relationship to Pairwise ZKPs section showing the Banksy Maneuver as one application), [[dtg-credentials-overview]], [[credential-categories]], [[overview]], [[index]], and [[dtg-credential-spec]].

The earlier-anticipated bidirectional-Edge-Credentials PR (#31) also merged on 2026-04-30; the source page note was updated from "pending" to "merged."

Alongside these conceptual changes, source summaries and entity pages were refreshed to capture substantial code activity since 2026-04-30:

- **VTI** released v0.5.0 `sealed-bootstrap` (HPKE-sealed transfers throughout, runtime-mutable DIDComm protocol surface, six new operator commands); runtime service management P0–P5 merged on `main`
- **OpenVTC** released v0.2.0 (workspace consolidation, full TUI main menu, DIDComm service integration, R-DID generation across both backends, substantial folded-in security pass)
- **WebVH service** released v0.6.0 (web-based ACL invites, VTA template, offline bootstrap, plus a substantial cross-service refresh-handler / TOCTOU / registry-proxy security pass)
- **TDK** shipped tdk-common 0.6, mediator 0.14.0 with a new `mediator-setup` wizard, and published `affinidi-messaging-test-mediator` as a standalone crate

---

## [2026-04-30] Edge Credentials reframed as bidirectional

In anticipation of a pending PR on the [[dtg-credential-spec|dtgwg-cred-tf]] `bidirectional` branch, both Edge Credentials have been reframed across the wiki. Previously the spec described **VMCs as creating nodes** and **VRCs as creating directed edges**. The updated framing treats both as edges between *existing* entities (nodes), each verified through a **bi-directional pair**. Nodes are entities (people, devices, agents, communities), not credentials.

Pages updated: [[decentralized-trust-graph]], [[membership-credential]], [[relationship-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[verifiable-trust-network]], [[overview]], [[index]], and the [[dtg-credential-spec|spec source summary]].

Alongside this conceptual update, source summaries and the overview were refreshed to capture recent code activity (April 2026): VTI v0.4.x with a production-grade DIDComm service, OpenVTC v0.1.5 security hardening, dtg-credentials v0.1.2 API migration, post-quantum cryptography support in the Affinidi TDK, WebVH service v0.5.0 with DIDComm control plane, and didwebvh-rs reaching v0.5.x with 1.0 spec compliance.

---

## [2026-04-13] AI agent framing added across core concepts

Updated [[overview]], [[first-person-network]], [[personhood-credential]], and [[verifiable-trust-community]] to reflect AI agent impersonation as a named threat alongside Sybil attacks. Elevated humanness/personhood framing; added ZKPs to The Big Picture.

---

## [2026-04-09] New source ingested: trustoverip/dtgwg-cred-tf (DTG spec v0.3)

Added the authoritative DTG credential specification as a primary source. Created 7 new concept pages: [[credential-categories]], [[did-types]], [[trust-registries]], [[verifiable-trust-network]], [[witnessed-vrc-exchange]], [[persona-credential]], [[invitation-credential]]. Updated 10+ existing pages to align with the spec, including a full rewrite of [[decentralized-trust-graph]].

Key findings: PHC is a governance-layer property (not credential structure); VRCs are directional; VTNs sit above VTCs in a federation hierarchy; trust registries are authoritative for roles and policies.

---

## [2026-04-09] Initial wiki created from 6 source repos

Generated the wiki from scratch across 6 repositories:

- **Primary:** OpenVTC/verifiable-trust-infrastructure, OpenVTC/openvtc, OpenVTC/dtg-credentials
- **Secondary:** affinidi/affinidi-tdk-rs, affinidi/affinidi-webvh-service, decentralized-identity/didwebvh-rs

Created 24 pages: 1 overview, 12 concept pages, 7 entity pages, 6 source summaries, 1 index.

The wiki is organized around the "First Person Network" / "Know Your Developer" vision, with the ecosystem spanning key management (VTA), messaging/resolution (TDK), DID hosting (WebVH), trust credentials (DTG), and user tooling (OpenVTC).
