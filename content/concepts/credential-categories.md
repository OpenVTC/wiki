---
title: "DTG Credential Categories"
type: concept
tags: [credentials, dtg, taxonomy, categories]
date-updated: 2026-08-19
sources: [dtg-credential-spec]
---

# DTG Credential Categories

The [[dtg-credential-spec|DTG Core Credentials specification]] (v1.0 Working Draft 01) organizes its six credential types into three **descriptive** (non-normative) functional categories. These categories don't appear in credential schemas — they're a conceptual framework for understanding what each credential type does in the [[decentralized-trust-graph|trust graph]].

## The Three Categories

### Edge Credentials

Establish relationships between existing entities (nodes) in the graph. Both edge credential types are **bidirectional** — a complete edge requires a pair, one from each side.

- **[[membership-credential|VMC (Membership)]]** — a membership edge between an entity and a community, verified through a bi-directional pair of VMCs
- **[[relationship-credential|VRC (Relationship)]]** — a peer-to-peer relationship edge between two entities, verified through a bi-directional pair of VRCs

### Invitation Credentials

Bootstrap new participants into communities.

- **[[invitation-credential|VIC (Invitation)]]** — authorizes onboarding of a new member into a VTC or VTN

### Annotation Credentials

Attach additional data to existing graph structure without creating new edges.

- **[[persona-credential|VPC (Persona)]]** — links a persona identity to an existing relationship
- **[[endorsement-credential|VEC (Endorsement)]]** — endorses skills or reputation of an existing member
- **[[witness-credential|VWC (Witness)]]** — third-party attestation that a specific edge (VRC) was established in a specific exchange; one VWC per direction

### What happened to the fourth category?

Until July 2026 the spec (v0.3) listed a fourth category, **Verifiable Data Structures (VDS)**, containing the **RCard / relationship card** — human-readable contact information (vCard/jCard per RFC 7095) in a verifiable wrapper, typed `["VerifiableCredential", "RelationshipCard"]` *without* the `DTGCredential` parent. Working Draft 01 removed it from this spec: the relationship card is a VDS ("a data structure digitally signed by the publisher so that subscribers can verify the original and any updates — a VC is one kind of VDS, an r-card is another"), not a DTG credential, and will be defined in a planned companion, **DTG Core Verifiable Data Structures**, alongside an *agent card* modelled on the A2A protocol's AgentCard. The [[dtg-credentials]] crate deprecated (but kept) its RCard types in 0.2.0.

## The Formal Type Hierarchy

All DTG credentials share a common W3C type hierarchy:

```
VerifiableCredential
└── DTGCredential
    ├── MembershipCredential (VMC)
    ├── RelationshipCredential (VRC)
    ├── InvitationCredential (VIC)
    ├── PersonaCredential (VPC)
    ├── EndorsementCredential (VEC)
    └── WitnessCredential (VWC)
```

The only abstract parent in the formal hierarchy is `DTGCredential`. The three descriptive categories above are for human understanding only. Every type may also carry a `taskContext` binding it to the trust-task exchange that produced it — see [[trust-task-context-binding]].

## ZKP Anchor Points

Both Edge Credentials are anchors for [[zero-knowledge-proofs|ZKP constructions]] defined in the spec:

- The **VRC** anchors a **pairwise ZKP** — available between any two VRC holders, no shared community required, useful for selectively disclosing P-DIDs while hiding R-DIDs.
- The **VMC** anchors a **community-anchored ZKP** — requires both parties to hold VMCs from the same community, carries that community's governance assurance (including personhood when applicable) into the proof.

The spec recommends ZKP presentation by default for all DTG credentials.

See also: [[zero-knowledge-proofs]], [[dtg-credentials-overview]], [[decentralized-trust-graph]]
