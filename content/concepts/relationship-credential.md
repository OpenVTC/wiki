---
title: "Relationship Credential (VRC)"
type: concept
tags: [credentials, dtg, relationships, trust, edge]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf, dtg-credentials, openvtc]
---

# Relationship Credential (VRC)

A Verifiable Relationship Credential is a **directed** trust assertion from one person to another. It's the primary building block of the [[decentralized-trust-graph|Decentralized Trust Graph]] and an [[credential-categories|Edge Credential]] — it creates graph structure.

## Directionality: Two VRCs = One Edge

The spec is explicit: **"Two VRCs (one each direction) form a complete DTG edge."** When Alice and Bob establish a trust relationship, each issues one VRC to the other. Alice's VRC says "I trust Bob"; Bob's VRC says "I trust Alice." Together, these two directed credentials form a complete, bilateral trust edge in the graph.

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

## ZKP Proof Requirements

To prove a relationship to a verifier, the holder must demonstrate:
1. Possession of the VRC
2. Possession of the underlying [[membership-credential|VMC]] (proving community membership)
3. That the VRC issuer also possesses a VMC from the same [[did-types|C-DID]]

This ensures all relationships are anchored within a community context — you can't have a VRC without both parties being verified community members.

## Trust Graph Significance

VRCs are the edges that make the trust graph traversable. When evaluating trust in someone you don't know directly, you look for paths through the graph — chains of VRCs connecting you to them through mutual connections. Multiple independent paths increase confidence.

VRCs can be strengthened by [[witness-credential|Witness Credentials]] and complemented by [[endorsement-credential|Endorsement Credentials]], [[persona-credential|Persona Credentials]], and other [[credential-categories|Annotation Credentials]].

See also: [[dtg-credentials-overview]], [[credential-categories]], [[witnessed-vrc-exchange]], [[did-types]]
