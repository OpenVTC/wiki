---
title: "DTG Core Credentials Specification (ToIP DTGWG)"
type: entity
tags: [spec, dtg, trust-over-ip, primary, working-draft]
date-updated: 2026-08-19
repo: https://github.com/trustoverip/dtgwg-cred-spec
---

# DTG Core Credentials Specification (ToIP DTGWG)

*Repo: [github.com/trustoverip/dtgwg-cred-spec](https://github.com/trustoverip/dtgwg-cred-spec) — normative spec, **Version 1.0, Working Draft 01**. Supporting materials and discussions: [github.com/trustoverip/dtgwg-cred-tf](https://github.com/trustoverip/dtgwg-cred-tf).*

The authoritative specification for the [[decentralized-trust-graph|Decentralized Trust Graph]] credential family, maintained by the **Trust over IP Foundation's DTG Working Group Credentials Task Force**. This is the definitive source for DTG credential semantics — what each credential type means, how it's constructed, what proofs it supports, and how the wider trust graph composes from them. Implementations track this spec; where the wiki and the spec disagree, the spec wins.

In July 2026 the spec **moved home and became a formal ToIP deliverable**: the informal `dtg.md` v0.3 that lived in the task-force repo was migrated into the ToIP **Spec-Up-T** template in a new repo, `dtgwg-cred-spec`, as *DTG Core Credentials V1.0 — Working Draft 01*. It now follows the Linux Foundation JDF process — a sequence of numbered Working Drafts until the task force submits it for a vote as a Working Group Approved Deliverable. The old repo (`dtgwg-cred-tf`) deleted its copy of the spec in August (#38) and keeps only supporting materials (`use_cases.md`, `witnessed_vrc_flow.md`, links to the First Person Project whitepaper, VTC Bootstrapping Process, DTG Glossary) plus the **discussions** board; spec-specific issues go to the new repo. RFC 2119 key words are binding only in sections that open with "*This section is normative.*" — the Introduction, Terminology, Taxonomy and all Considerations sections are informative.

The wiki entity for the implementation that tracks this spec is [[dtg-credentials]] (0.2.0 tracks WD01); for the conceptual taxonomy it defines, see [[dtg-credentials-overview]].

## Contents

Spec-Up-T layout (`specs.json` → `spec/`), rendered to `docs/`:

- **`header.md`** — title, Version 1.0 / Working Draft 01, editors (Alberto Leon, Brendan A. Miller — Harvard Applied Technology Lab; Geoff Turk, Martina Kolpondinos, Drummond Reed — First Person Project), IPR (CC BY 4.0, W3C patent mode, Apache 2.0)
- **`intro.md`** — abstract ("six W3C Verifiable Credential types that create and annotate the nodes and edges of a DTG"), the three functional categories, a note that this version uses DIDs exclusively as its verifiable identifiers (X.509 / KERI AIDs possible later)
- **`terms-and-definitions-intro.md`** + **`terms-definitions/*.md`** — ~50 glossary terms, one file each, imported from the DTG Glossary: the credential types, DID types, DTG node/edge/VID, and the **VTA topology vocabulary** (personal / community / local / cloud VTA, VTA networks, PNM, PNV, VTSP — see [[vta-topology]]), community roles (initiator, community trust anchor, PEP, IDVP/IDVC), relationship card, relationship invitation (OOBI)
- **`body.md`** — the normative core, in narrative order: Taxonomy → W3C VC version support (v2.0 primary, v1.1 legacy) → Base Structure (incl. the new `taskContext` property) → Edge Credentials (VRC, VMC) → Invitation Credential (VIC) → Annotation Credentials (VPC, VWC, VEC) → **Trust Task Context Binding** → Supporting Concepts (PHC, Trust Registries, IDVC, ZK & Selective Disclosure) → Security / Privacy / Governance / I18N / Accessibility Considerations → Conformance → References
- **`appendix.md`** — acknowledgements
- Companion specs announced but not yet written: **DTG Verifiable Data Structures** (relationship card, agent card) and **DTG Core Trust Task Protocols** (offer / issue / request / present / revoke and the trust-task completion artifact `taskContext` refers to)

## Wiki pages derived from this spec

- [[credential-categories]] — The three functional categories (Edge, Invitation, Annotation)
- [[did-types]] — The formal DID taxonomy (C-DID, M-DID, R-DID, P-DID)
- [[trust-task-context-binding]] — `taskContext`: binding a credential to the exchange that produced it, without making it proof of the outcome
- [[vta-topology]] — The VTA vocabulary: personal / community, local / cloud, VTA networks, PNM, PNV, VTSP
- [[trust-registries]] — Governance layer that determines PHC status and policies
- [[verifiable-trust-network]] — VTN concept (VTN → VTC hierarchy)
- [[witnessed-vrc-exchange]] — The five-phase witnessed exchange protocol (supporting material in the task-force repo; its per-direction VWC pattern is now normative)
- [[witness-credential]] — VWC with required `taskContext` and `digest`
- [[persona-credential]] — VPC and the "Banksy Maneuver"
- [[invitation-credential]] — VIC with issuer policy details
- [[zero-knowledge-proofs]] — Pairwise vs community-anchored ZKP constructions; ZKPs by default
- Plus updates to [[personhood-credential]], [[membership-credential]], [[relationship-credential]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], and others

## Recent Development

The spec is at **v1.0 Working Draft 01** in `dtgwg-cred-spec`; activity is per-PR. Entries before July 2026 refer to PRs in the old `dtgwg-cred-tf` repo.

### dtgwg-cred-tf #38 — 2026-08-18 — old repo retires its copy of the spec

`dtg.md` removed; README points to `dtgwg-cred-spec` as the normative home and to its issue tracker for spec issues. `use_cases.md` and `witnessed_vrc_flow.md` (v0.2, non-normative) stay as supporting material; discussions remain in the old repo.

### PR #14 — 2026-08-12 — VWC `digest` becomes REQUIRED, binding the credential to a specific edge

With only `issuer`, `taskContext` and `credentialSubject.id` required, a conforming VWC could attest merely that *some* activity involving the subject occurred during a trust task — not that a specific relationship edge was established. `digest` is promoted OPTIONAL → REQUIRED. New guidance: `credentialSubject.id` and `taskContext` identify only the observed party and the exchange, not the edge; a `digest` without the referenced VRC to hand is an opaque hash, so issuers and holders presenting a VWC as evidence of a specific edge SHOULD make the referenced VRC available alongside it. `witnessContext` stays OPTIONAL. Reflected in [[witness-credential]].

### PR #13 — 2026-08-06 — narrative ordering; status set to Working Draft 01

Taxonomy diagram flipped to left-to-right in the order VRC, VMC, VIC, VPC, VWC, VEC; the VWC section moved before VEC under Annotation Credentials; header status "Working Draft" → "Working Draft 01". No normative text changed.

### PR #7 — 2026-07-30 — implementation feedback from Keyring Wallet: VWC digest canonicalisation + per-direction witnessing

Two fixes driven by a real implementation (Keyring Wallet's witness server): (a) v0.3 said the digest was "a multibase string (multihash + multibase)" while its example showed `sha256:<hex>` — contradictory and unimplementable. Now: **the digest MUST be the SHA-256 of the credential's JSON canonicalised with JCS (RFC 8785), encoded as the string `sha256:` followed by the lowercase hex digest.** (b) **Per-direction witnessing**: a witnessed exchange of a complete edge is bidirectional — two VRCs, one each way, in a single witnessing event — so the witness SHOULD issue **one VWC per direction**, and in each VWC `credentialSubject.id` MUST be the DID of the *issuer* of the VRC being attested. Note the [[dtg-credentials]] crate (0.2.0) encodes the digest as multibase/multihash (`z…`, the W3C `digestMultibase` convention) instead — a flagged, unresolved divergence.

### PR #3 — 2026-07-13 — migrate v0.3 into the Spec-Up-T template (Working Draft)

Beyond the re-templating, several substantive changes:
- **New normative section "Trust Task Context Binding"** and a new base-structure property **`taskContext`** (the `threadId` of the trust-task exchange in which the credential was issued): OPTIONAL on all types, **REQUIRED on VWC**. A credential without `taskContext` MUST be interpretable standing alone; a verifier MUST NOT treat a `taskContext`-bearing credential as proof the associated task *completed* unless the matching outcome evidence is present and verified. Informative test: "true outside the exchange? → credential; only meaningful inside? → artifact." See [[trust-task-context-binding]].
- **W-DID dropped** from the identifier taxonomy — the VWC issuer is "an M-DID, or the DID of a VTA acting according to VTC policy"; four official DTG identifier types remain (R-DID, M-DID, C-DID, P-DID). Reflected in [[did-types]].
- **RCard section removed**; the relationship card is a VDS, not a `DTGCredential`, and moves to the planned *DTG Verifiable Data Structures* spec (alongside a planned agent card). The category count accordingly drops **four → three** (VDS gone). Reflected in [[credential-categories]], [[dtg-credentials-overview]].
- VWC purpose broadened (the witness may be a person *or a VTA applying VTC witnessing policy* — e.g. same-event presence, biometric liveness); VIC explicitly has two functional variants — VTC invitation and VTN invitation — distinguished by issuer/subject rules, not type strings; VPC purpose adds "control intentional correlation across relationships".
- New **Security Considerations** (7 items — incl. VIC replay: short validity, single-use at the accepting VTA/PEP), **Privacy** (2 → 6 items), **Governance** (4 — "whether a VMC qualifies as a PHC is a governance determination, not a schema property"), **Conformance** targets (issuers / holders / verifiers; no test suites yet), I18N/Accessibility stubs, normative/informative references.
- ZKP text, PHC, trust registries, IDVC carried over unchanged in substance from v0.3 (post-#31/#33). ~50 glossary terms imported as Spec-Up-T definitions.

### PR #2 / #1 — 2026-07-07/08 — repo created from the Spec-Up-T template; README for DTG Core Credentials V1.0

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
