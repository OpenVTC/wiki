---
title: "DTG Credential Specification (ToIP DTGWG)"
type: entity
tags: [spec, dtg, trust-over-ip, primary]
date-updated: 2026-05-08
repo: https://github.com/trustoverip/dtgwg-cred-tf
---

# DTG Credential Specification (ToIP DTGWG)

*Repo: [github.com/trustoverip/dtgwg-cred-tf](https://github.com/trustoverip/dtgwg-cred-tf)*

The authoritative specification for the [[decentralized-trust-graph|Decentralized Trust Graph]] credential family, maintained by the **Trust over IP Foundation's DTG Working Group Credential Task Force**. This is the definitive source for DTG credential semantics — what each credential type means, how it's constructed, what proofs it supports, and how the wider trust graph composes from them. Implementations track this spec; where the wiki and the spec disagree, the spec wins.

The repo contains prose specifications in Markdown — no code. The wiki entity for the implementation that tracks this spec is [[dtg-credentials]]; for the conceptual taxonomy it defines, see [[dtg-credentials-overview]].

## Contents

- **`dtg.md`** — Core specification: credential type hierarchy, DID taxonomy, credential subjects, W3C VC v1.1/v2.0 support, ZKP constructions, personhood definition, trust registry references
- **`use_cases.md`** — Structured use cases: identity/sybil resistance, social capital, competence/reputation, persona management, advanced composite proofs
- **`witnessed_vrc_flow.md`** — Five-phase Witnessed Session-Based VRC Exchange protocol (v0.2)
- **`README.md`** — Index linking to spec, external documents (First Person Project Whitepaper, VTC Bootstrapping Process, DTG Glossary)

## Wiki pages derived from this spec

- [[credential-categories]] — The four functional categories (Edge, Invitation, Annotation, VDS)
- [[did-types]] — The formal DID taxonomy (C-DID, M-DID, R-DID, P-DID, W-DID)
- [[trust-registries]] — Governance layer that determines PHC status and policies
- [[verifiable-trust-network]] — VTN concept (VTN → VTC hierarchy)
- [[witnessed-vrc-exchange]] — The five-phase witnessed exchange protocol
- [[persona-credential]] — VPC and the "Banksy Maneuver"
- [[invitation-credential]] — VIC with issuer policy details
- [[zero-knowledge-proofs]] — Pairwise vs community-anchored ZKP constructions; ZKPs by default
- Plus updates to [[personhood-credential]], [[membership-credential]], [[relationship-credential]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], and others

## Recent Development

The spec is at v0.3; recent activity is per-PR. (PR numbers serve the role of version identifiers below since the spec version itself hasn't bumped.)

### PR #33 — 2026-05-08 — Split VRC/VMC ZKP proofs into pairwise and community-anchored constructions

- The old single "Zero-Knowledge Proof Requirements" subsection (under VRC) is replaced by two distinct constructions:
  - **Pairwise ZKP (under VRC §5.1)** — available to any two VRC holders, regardless of shared community membership; selectively discloses P-DIDs while hiding R-DIDs
  - **Community-Anchored ZKP (under VMC §5.2)** — requires both parties to hold VMCs from the same community; the three-part proof (VRC + VMC + same C-DID) is preserved but reframed as one option among several
- Section 5 reordered: VRC (5.1) now precedes VMC (5.2)
- Overview rewritten: DTG credentials are W3C-compliant VCs that MAY use standard presentation but SHOULD use ZKPs whenever privacy preservation is desired (citing [Adler et al. 2024 — Personhood Credentials](https://arxiv.org/pdf/2408.07892))
- New guidance: implementations SHOULD make ZKP presentation the default
- Privacy Considerations gained a "ZKPs by default" bullet
- Reflected in [[zero-knowledge-proofs]], [[relationship-credential]], [[membership-credential]], [[persona-credential]], [[credential-categories]], [[dtg-credentials-overview]]

### PR #31 — 2026-04-30 — Bidirectional Edge Credentials

- Both Edge Credentials reframed as edges between *existing* entities rather than node-creating or directional constructs
- **VMC** — "attests to the membership of an entity in a community; membership is verified through a bi-directional pair of VMCs"
- **VRC** — "attests to a relationship between two entities; the relationship is verified through a bi-directional pair of VRCs"
- Previously: VMCs were described as creating *nodes* and VRCs as creating *directed edges*
- Reflected in [[decentralized-trust-graph]], [[membership-credential]], [[relationship-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[verifiable-trust-network]]

See also: [[dtg-credentials]] (the Rust implementation), [[dtg-credentials-overview]] (the credential taxonomy as currently in the wiki).
