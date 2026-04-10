---
title: "Wiki Log"
type: log
date-updated: 2026-04-09
---

# Wiki Log

## [2026-04-09] ingest | trustoverip/dtgwg-cred-tf (DTG spec v0.3)

**Source ingested:** trustoverip/dtgwg-cred-tf (Primary — authoritative specification)

**New pages created:** 7
- credential-categories — Four functional categories (Edge, Invitation, Annotation, VDS)
- did-types — Formal DID taxonomy (C-DID, M-DID, R-DID, P-DID, W-DID)
- trust-registries — Governance layer determining PHC status and policies
- verifiable-trust-network — VTN concept (VTN → VTC hierarchy)
- witnessed-vrc-exchange — Five-phase Witnessed VRC Exchange protocol
- persona-credential — VPC and the "Banksy Maneuver"
- invitation-credential — VIC with issuer policy details

**Pages updated:** 10+
- personhood-credential — PHC is governance, not structure; trust registries are authoritative
- membership-credential — Creates graph nodes; dual purpose (membership + personhood)
- relationship-credential — VRCs are directed; two VRCs = one complete edge; ZKP requirements
- dtg-credentials-overview — Full spec alignment: categories, VTN references, RCard not a DTGCredential
- decentralized-trust-graph — Rewritten to reflect spec: nodes from VMCs, directed edges from VRCs, VTN federation
- decentralized-identifiers — Added DID type taxonomy reference
- verifiable-trust-community — Added VTN and trust registry references
- overview — Updated Layer 4 with categories, directionality, VTNs, trust registries
- index — Restructured with new pages and sections
- Source summary added

**Key refinements from the spec:**
- PHC is a governance-layer property (trust registry), not a credential structure — `PersonhoodCredential` in type array is an optional non-authoritative hint
- VRCs are directional — two VRCs (one each direction) form one complete DTG edge
- VTNs exist above VTCs, creating hierarchical community structure
- Trust registries are the authoritative source for roles, policies, and PHC determination
- ZKP proof of relationship requires proving VMC possession for both parties from the same community
- RCard is NOT a DTGCredential subtype — different type array

---

## [2026-04-09] ingest | Initial wiki generation from 6 source repos

**Sources ingested:**
1. OpenVTC/verifiable-trust-infrastructure (Primary)
2. OpenVTC/openvtc (Primary)
3. OpenVTC/dtg-credentials (Primary)
4. affinidi/affinidi-tdk-rs (Secondary)
5. affinidi/affinidi-webvh-service (Secondary)
6. decentralized-identity/didwebvh-rs (Secondary)

**Pages created:** 24
- 1 overview
- 12 concept pages
- 7 entity pages
- 6 source summaries
- 1 index
- 1 log

**Process:** Cloned all 6 repos. Analyzed documentation, code structure, and recent commits (~1 month). Synthesized findings into a narrative-conceptual wiki focused on the "why" and evolution of the ecosystem. Primary sources received full treatment; secondary sources received lightweight entity pages and source summaries.

**Key findings:**
- The ecosystem is cohesive: VTA manages keys → TDK provides messaging/resolution → WebVH hosts DIDs → DTG credentials define trust edges → OpenVTC ties it together for users
- All projects are in active early development (v0.1-v0.3), with clear momentum toward production readiness
- The "First Person Network" / "Know Your Developer" vision provides strong narrative coherence
- Recent work emphasizes: TEE/enclave security, SDK consumability, crates.io publication, cold-start bootstrap
- The migration from LF-Decentralized-Trust-labs to OpenVTC organization is recent and ongoing
