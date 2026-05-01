---
title: "Wiki Log"
type: log
date-updated: 2026-04-30
---

# Wiki Log

A record of major wiki updates: new sources ingested, significant concept and entity additions, and meaningful structural changes.

---

## [2026-04-30] Edge Credentials reframed as bidirectional

In anticipation of a pending PR on the [[sources/dtgwg-cred-tf|dtgwg-cred-tf]] `bidirectional` branch, both Edge Credentials have been reframed across the wiki. Previously the spec described **VMCs as creating nodes** and **VRCs as creating directed edges**. The updated framing treats both as edges between *existing* entities (nodes), each verified through a **bi-directional pair**. Nodes are entities (people, devices, agents, communities), not credentials.

Pages updated: [[decentralized-trust-graph]], [[membership-credential]], [[relationship-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[verifiable-trust-network]], [[overview]], [[index]], and the [[sources/dtgwg-cred-tf|spec source summary]].

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
