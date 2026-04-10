---
title: "DTG Credential Categories"
type: concept
tags: [credentials, dtg, taxonomy, categories]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf]
---

# DTG Credential Categories

The DTG specification organizes its credential types into four **descriptive** (non-normative) functional categories. These categories don't appear in credential schemas — they're a conceptual framework for understanding what each credential type does in the [[decentralized-trust-graph|trust graph]].

## The Four Categories

### Edge Credentials
Create structure in the trust graph — new nodes and relationships.

| Credential | What it creates |
|-----------|----------------|
| [[membership-credential\|VMC (Membership)]] | A node — proves membership (and personhood) in a community |
| [[relationship-credential\|VRC (Relationship)]] | A directed edge — one half of a trust relationship between two members |

### Invitation Credentials
Bootstrap new participants into communities.

| Credential | What it does |
|-----------|-------------|
| [[invitation-credential\|VIC (Invitation)]] | Authorizes onboarding of a new member into a VTC or VTN |

### Annotation Credentials
Attach additional data to existing graph structure without creating new nodes or edges.

| Credential | What it annotates |
|-----------|------------------|
| [[persona-credential\|VPC (Persona)]] | Links a persona identity to an existing relationship |
| [[endorsement-credential\|VEC (Endorsement)]] | Endorses skills or reputation of an existing member |
| [[witness-credential\|VWC (Witness)]] | Third-party attestation that an edge (VRC exchange) actually occurred |

### Verifiable Data Structures (VDS)
Structured data exchange — not technically DTG credentials.

| Structure | What it carries |
|----------|----------------|
| RCard (Relationship Card) | Human-readable contact information (vCard/jCard per RFC 7095) |

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
