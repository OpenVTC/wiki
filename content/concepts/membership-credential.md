---
title: "Membership Credential (VMC)"
type: concept
tags: [credentials, dtg, membership, community, personhood, edge, zkp]
date-updated: 2026-05-08
sources: [dtg-credential-spec, dtg-credentials]
---

# Membership Credential (VMC)

A Verifiable Membership Credential attests to the **membership of an entity in a community**. It connects a person, device, or agent to a [[verifiable-trust-community|VTC]] — or one community to a [[verifiable-trust-network|VTN]].

VMCs are [[credential-categories|Edge Credentials]]. The issuer is a [[did-types|C-DID]] (the community's DID); the subject is an [[did-types|M-DID]] (a member's DID) or another C-DID (when a VTN grants membership to a VTC).

## Bidirectionality: Two VMCs = One Membership Edge

Membership in the DTG is symmetric: it isn't enough for a community to claim a member, or for a member to claim a community. **Membership is verified through a bi-directional pair of VMCs** — one issued by the community to the member, and one issued by the member back to the community. Together the pair forms a complete membership edge between two entities (nodes) in the trust graph.

This mirrors the bidirectional model used for [[relationship-credential|Relationship Credentials (VRCs)]]: in the DTG, edges are always two-sided, attested by both ends.

## Dual Purpose

VMCs serve two functions:

1. **Community membership** — proving you belong to a specific community, enabling community-level policies (who can endorse, what trust thresholds apply)
2. **Personhood attestation** — when the issuing community's governance enforces real human personhood and one-membership-per-person rules, the VMC qualifies as a [[personhood-credential|Personhood Credential (PHC)]]

Whether a VMC is a PHC is determined by the community's [[trust-registries|trust registry]], not by any structural difference in the credential. See [[personhood-credential]] for details.

## VTN Membership

VMCs also express the relationship between [[verifiable-trust-network|VTNs]] and VTCs. A VTN issues a VMC to a VTC's C-DID, and the VTC issues a VMC back, proving the community is a recognized member of the network. This enables hierarchical trust structures.

## Community-Anchored ZKP

The VMC is the anchor for the **community-anchored ZKP** construction defined in spec §5.2. When both parties to a [[relationship-credential|VRC]] hold VMCs from the same community, the holder can prove the existence of a relationship *within the community's governance context* — without revealing the specific DIDs or other credential details. When the community's VMCs qualify as [[personhood-credential|PHCs]], that personhood assurance carries forward into every relationship proven through this construction.

This is one of the two ZKP constructions defined for [[credential-categories|Edge Credentials]]; the other is the pairwise construction anchored to the VRC. See [[zero-knowledge-proofs]] for the full picture, including how to choose between them.

See also: [[zero-knowledge-proofs]], [[personhood-credential]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[credential-categories]]
