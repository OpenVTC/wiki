---
title: "DTG Credential Categories"
type: concept
tags: [credentials, dtg, taxonomy, categories]
date-updated: 2026-04-30
sources: [dtgwg-cred-tf]
---

# DTG Credential Categories

The DTG specification organizes its credential types into four **descriptive** (non-normative) functional categories. These categories don't appear in credential schemas — they're a conceptual framework for understanding what each credential type does in the [[decentralized-trust-graph|trust graph]].

## The Four Categories

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
- **[[witness-credential|VWC (Witness)]]** — third-party attestation that an edge (VRC exchange) actually occurred

### Verifiable Data Structures (VDS)

Structured data exchange — not technically DTG credentials.

- **RCard (Relationship Card)** — human-readable contact information (vCard/jCard per RFC 7095)

Note: RCard does **not** include `DTGCredential` in its W3C type array — its type is `["VerifiableCredential", "RelationshipCard"]`. It is a Verifiable Data Structure, not a credential in the DTG sense.

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

VerifiableCredential
└── RelationshipCard (RCard)  ← NOT a DTGCredential
```

The only abstract parent in the formal hierarchy is `DTGCredential`. The four descriptive categories above are for human understanding only.

See also: [[dtg-credentials-overview]], [[decentralized-trust-graph]]
