---
title: "Relationship Credential (VRC)"
type: concept
tags: [credentials, dtg, relationships, trust, edge, zkp]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Relationship Credential (VRC)

A Verifiable Relationship Credential attests to a trust relationship between two entities, from the perspective of the issuer. It's a primary building block of the [[decentralized-trust-graph|Decentralized Trust Graph]] and an [[credential-categories|Edge Credential]] — it forms graph structure between existing entities.

## Bidirectionality: Two VRCs = One Edge

The spec is explicit: **"Two VRCs (one each direction) form a complete DTG edge."** When Alice and Bob establish a trust relationship, each issues one VRC to the other. Alice's VRC says "I trust Bob"; Bob's says "I trust Alice." Together they form a complete, bilateral edge — the relationship doesn't exist in the DTG until both halves are issued. Each half is signed by its own issuer and evaluated independently; nothing requires a single credential to carry both signatures (Working Draft 02 struck an old glossary condition that said otherwise, since no credential could satisfy it).

## The Relationship Protocol

Establishing a relationship and exchanging VRCs follows a multi-step protocol over [[didcomm|DIDComm]] or [[trust-spanning-protocol|TSP]]:

1. **Request** — Alice sends a relationship request to Bob
2. **Accept** — Bob accepts the request
3. **Finalize** — both parties confirm, creating a private channel under dedicated per-relationship identifiers
4. **VRC Request** — either party requests a formal credential
5. **VRC Issuance** — the other party issues a signed VRC

For witnessed exchanges, see the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]].

## Identifiers and Privacy

WD02 replaced the old "each entity MUST generate a new R-DID per relationship" rule with the same idea stated through [[correlation-scope]]: a **`pairwise`** identifier is RECOMMENDED for a VRC, an identifier declared `pairwise` MUST NOT be used with more than one counterparty, and a verifier that sees it with a second counterparty MUST treat the declaration as false. Implementations SHOULD default to minting a distinct identifier per relationship. A wider declaration is permitted — `directed`, for a relationship the holder intends to be correlated with others they choose, including relationships inside a shared [[verifiable-trust-community|VTC]] — but it is a disclosure the holder makes deliberately. Each peer chooses its own identifier and scope; the two halves need not agree, and an edge's effective disclosure is the *wider* of the two.

An identifier minted for one relationship and declared `pairwise` is, from its controller's point of view, a globally unique name for that edge — so semantic statements, metadata or private context about the relationship can be anchored to the controller's own identifier without resolving the counterparty's (*Unilateral Relationship Identification*).

## What a VRC Contains

- **Issuer** — the source party's identifier (`pairwise` RECOMMENDED)
- **Subject** — the target party's identifier *as used in this relationship*
- **Type** — `["VerifiableCredential", "DTGCredential", "RelationshipCredential"]`
- **Validity period**; optional **`taskContext`** ([[trust-task-context-binding]])
- **Proof** — Data Integrity signature

## When Is a VRC an Edge? (Edge Verifiability, WD02)

A VRC whose proof verifies establishes that its issuer made the statement. Whether a verifier *also* treats it as an edge of a particular graph is a separate determination, and WD02 (PR #26) defines it **relative to the verifier**: a VRC is verifiable as a DTG edge *by a given verifier* when its proof verifies and the verifier can establish that the issuer's membership in a VTC **in the anchor set that verifier accepts** is complete. A [[verifiable-trust-network|VTN]] is the common anchor set, but none need exist; the same VRC may be an edge to one verifier and not to another, and neither is wrong. The membership condition may be met **by disclosure** (the VMC pair) or **by proof** (the community-anchored ZKP), and the spec insists the two are equivalent in principle — a `pairwise` did:peer VRC with a valid proof is an edge on the same terms as one issued from the VMC's own identifier. This matters because the pairwise form is the one the spec recommends, and a definition that admitted only disclosure would have excluded it.

## ZKP Presentation

VRCs can stand alone — two individuals can issue VRCs to each other without either being a member of any VTC, and the resulting edge is a valid trust attestation on the strength of the signatures and whatever real-world context the parties bring. The spec defines two ZKP constructions and recommends ZKP presentation by default. See [[zero-knowledge-proofs]].

### Pairwise ZKP (per VRC, no shared community required)

The holder MAY prove possession of a valid VRC while selectively disclosing chosen attributes, identifiers, or predicates. The canonical application is to disclose the parties' `directed` persona identifiers while hiding the underlying `pairwise` ones — a public, verifiable claim that two known [[persona-credential|personas]] have a relationship, without exposing the private channel between them. Available to any two VRC holders; confers no community-level assurance by itself.

### Community-Anchored ZKP (when both parties hold VMCs from the same community)

When both parties hold [[membership-credential|VMCs]] from the same community, the holder MAY prove (1) possession of the VRC, (2) possession of their own community-issued VMC, and (3) that the VRC issuer holds a VMC from the *same* community identifier. WD02 adds two honest caveats: statement 3 currently establishes only that the community *attested* the counterparty's membership, not that the counterparty acknowledged it; and where a party used a `pairwise` identifier toward the community and another toward the counterparty, the proof must additionally establish **common control** of the two — a primitive the ZKP task force has not yet delivered (spec issue #9). When the community's VMCs are [[personhood-credential|PHCs]], that assurance carries forward.

## Trust Graph Significance

VRCs are the edges that make the trust graph traversable. When evaluating trust in someone you don't know directly, you look for paths through the graph — chains of VRCs connecting you to them through mutual connections. Multiple independent paths increase confidence. VRCs can be strengthened by [[witness-credential|Witness Credentials]] and complemented by [[endorsement-credential|Endorsement]] and [[persona-credential|Persona Credentials]]. A [[delegation-credential|VDC]] neither requires nor implies a VRC between delegator and delegate — relationship evidence and delegation evidence are different things.

## Implementation Status

In [[openvtc|OpenVTC]] since Dogwood (openvtc #254/#255, requiring VTI #1061) a pairwise relationship identifier is the default and the VRC is issued under it — in WD02 terms a `pairwise`-scope identifier per relationship. The [[verifiable-trust-infrastructure|VTI]] distinguishes half-edges (one VRC) from complete edges (both) on the graph (#1073).

See also: [[zero-knowledge-proofs]], [[dtg-credentials-overview]], [[credential-categories]], [[witnessed-vrc-exchange]], [[correlation-scope]], [[verifiable-trust-network]]
