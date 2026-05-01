---
title: "Relationship Credential (VRC)"
type: concept
tags: [credentials, dtg, relationships, trust, edge]
date-updated: 2026-04-30
sources: [dtgwg-cred-tf, dtg-credentials, openvtc]
---

# Relationship Credential (VRC)

A Verifiable Relationship Credential attests to a trust relationship between two entities, from the perspective of the issuer. It's a primary building block of the [[decentralized-trust-graph|Decentralized Trust Graph]] and an [[credential-categories|Edge Credential]] — it forms graph structure between existing entities.

## Bidirectionality: Two VRCs = One Edge

The spec is explicit: **"Two VRCs (one each direction) form a complete DTG edge."** A relationship is verified through a bi-directional pair of VRCs. When Alice and Bob establish a trust relationship, each issues one VRC to the other. Alice's VRC says "I trust Bob"; Bob's VRC says "I trust Alice." Together, these two credentials form a complete, bilateral trust edge in the graph — the relationship doesn't exist in the DTG until both halves are issued.

## The Relationship Protocol

Establishing a relationship and exchanging VRCs follows a multi-step protocol over [[didcomm|DIDComm]]:

1. **Request** — Alice sends a relationship request to Bob
2. **Accept** — Bob accepts the request
3. **Finalize** — both parties confirm, creating a private channel with a dedicated [[did-types|R-DID]] (Relationship DID)
4. **VRC Request** — either party requests a formal credential
5. **VRC Issuance** — the other party issues a signed VRC

The spec requires that **each entity MUST generate a new, unique R-DID for every single entity they connect with**, even within the same community. This is critical for privacy — your [[did-types|M-DID]] isn't exposed in individual relationships.

For witnessed exchanges, see the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]].

## What a VRC Contains

- **Issuer** — the [[did-types|R-DID]] or M-DID of the person attesting
- **Subject** — the R-DID or M-DID of the counterparty
- **Type** — `["VerifiableCredential", "DTGCredential", "RelationshipCredential"]`
- **Validity period** — when the attestation is valid
- **Proof** — EdDSA JCS 2022 Data Integrity signature

## Community-Anchored ZKP Proofs

VRCs can stand alone — two individuals can issue VRCs to each other without either being a member of any [[verifiable-trust-community|VTC]], and the resulting edge is a valid trust attestation. The cryptographic signatures speak for themselves; the meaning of the attestation is whatever real-world context the parties bring to it.

When both parties *are* members of the same community, the holder can additionally construct a **community-anchored ZKP** of the relationship. The spec describes one such proof in §5.2:

1. Possession of the VRC
2. Possession of an underlying [[membership-credential|VMC]] from a community
3. That the VRC issuer also holds a VMC from the *same* [[did-types|C-DID]]

This proof anchors the relationship within a community's governance context (e.g., a community whose VMCs are also [[personhood-credential|PHCs]] lends personhood assurance to every relationship proven through it) without revealing the underlying DIDs. It is **one proof construction available to relationships within a shared community**, not a universal precondition for issuing or holding a VRC.

## Trust Graph Significance

VRCs are the edges that make the trust graph traversable. When evaluating trust in someone you don't know directly, you look for paths through the graph — chains of VRCs connecting you to them through mutual connections. Multiple independent paths increase confidence.

VRCs can be strengthened by [[witness-credential|Witness Credentials]] and complemented by [[endorsement-credential|Endorsement Credentials]], [[persona-credential|Persona Credentials]], and other [[credential-categories|Annotation Credentials]].

See also: [[dtg-credentials-overview]], [[credential-categories]], [[witnessed-vrc-exchange]], [[did-types]]
