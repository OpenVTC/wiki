---
title: "The Decentralized Trust Graph (DTG)"
type: concept
tags: [trust-graph, dtg, trust-over-ip, credentials]
date-updated: 2026-04-30
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# The Decentralized Trust Graph (DTG)

## The Core Idea

The Decentralized Trust Graph is the conceptual model at the heart of the OpenVTC ecosystem. It answers a deceptively simple question: **how do you decide whether to trust someone you've never met?**

In the physical world, you rely on chains of trust. You trust your friend. Your friend trusts their colleague. If your friend vouches for their colleague, you have a reason — not a guarantee, but a reason — to extend some trust. The DTG makes this kind of reasoning cryptographically verifiable in the digital world.

The graph is built from two primitives:
- **Nodes** — entities in the world: people, devices, agents, and communities. Each is identified by a [[decentralized-identifiers|Decentralized Identifier (DID)]].
- **Edges** — created by [[credential-categories|Edge Credentials]]: [[membership-credential|Membership Credentials (VMCs)]] connect entities to communities, and [[relationship-credential|Relationship Credentials (VRCs)]] connect entities to other entities. **Both edge types are bidirectional**: a complete edge requires a pair of credentials, one issued from each side.

Additional [[credential-categories|Annotation Credentials]] ([[endorsement-credential|endorsements]], [[witness-credential|witnesses]], [[persona-credential|personas]]) attach data to existing edges without creating new graph structure.

Anyone can traverse the graph to discover trust paths between two entities. The credentials are cryptographically signed, so every edge is verifiable. The graph is decentralized — no single authority controls it, and no single point of failure can break it.

## How Trust Is Built

Trust in the DTG is built incrementally, from the ground up. The graph supports two complementary patterns: peer-to-peer relationships between individuals, and community-anchored relationships that gain extra proof guarantees from a shared VTC.

### Form Relationships Directly

The base case is two people who know and trust each other exchanging [[relationship-credential|Relationship Credentials (VRCs)]]. Each party issues one VRC to the other; together the two VRCs form a complete edge in the graph. Neither party needs to be a member of any community for this to be meaningful — the relationship stands on the cryptographic attestations themselves and on whatever real-world context the parties bring to it.

The protocol:

1. One person sends a relationship request via [[didcomm|DIDComm]]
2. The other accepts
3. Both finalize the relationship, creating a private channel with a unique [[did-types|R-DID]]
4. Each party issues a VRC to the other

The spec requires each entity to generate a **new, unique R-DID for every relationship**, ensuring privacy.

### Join a Community for Anchored Proofs and Personhood

Membership in a [[verifiable-trust-community|Verifiable Trust Community]] is optional but powerful. A [[membership-credential|Membership Credential (VMC)]] connects a participant to a community whose governance defines who counts as a member, and a bidirectional pair of VMCs (one from the community to the member, one back) forms a complete membership edge. Communities can themselves be members of [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]] via the same bidirectional pattern, creating a VTN → VTC → member hierarchy.

Joining a VTC unlocks two things that pure peer-to-peer VRCs cannot provide on their own:

- **Personhood attestation.** When the community's governance enforces real human personhood and one-membership-per-person rules, the VMC qualifies as a [[personhood-credential|Personhood Credential (PHC)]] — determined by the community's [[trust-registries|trust registry]].
- **Community-anchored relationship proofs.** A holder can construct a ZKP showing that both parties to a VRC hold VMCs from the same community, lending the relationship the community's governance assurances without exposing identifying details. See [[relationship-credential]].

VRCs between people who *don't* share a community are still valid trust attestations; they just can't be proven through community-anchored ZKPs.

### Annotate with Endorsements and Witnesses

Trust relationships — whether peer-to-peer or community-anchored — can be strengthened through [[credential-categories|Annotation Credentials]]:
- **[[endorsement-credential|Endorsements (VEC)]]** — "I endorse this person's skills in X"
- **[[witness-credential|Witnesses (VWC)]]** — "I witnessed that this relationship is genuine" (especially powerful via the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]])
- **[[persona-credential|Personas (VPC)]]** — selectively linking a persona identity to a relationship

### Scale Through Networks

Communities can federate into [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]], enabling community-anchored trust paths to traverse community boundaries. VTNs and their member VTCs exchange bidirectional VMC pairs, creating a shared trust anchor across independent communities.

## Traversing the Graph

The power of the DTG is in traversal. Imagine you're evaluating a contributor to an open-source project:

1. They present their [[did-types|M-DID]]
2. You look up their credentials in the graph
3. You find they have VRCs with three people you already trust
4. Those people have endorsement credentials attesting to their coding skills
5. Two of those endorsements have witness credentials from an in-person meetup

You've now established a multi-path, multi-evidence trust assessment — all without a central authority, all cryptographically verifiable.

When the parties share a community, the holder can additionally construct a community-anchored ZKP: a proof that they hold the VRC, that they hold a VMC from a community, and that the counterparty holds a VMC from the *same* community — without revealing the underlying DIDs. This anchors that proof within the community's governance context. It's one proof construction, not the only way a VRC can be presented or verified.

## The DTG Specification

The credential types that populate the DTG are defined by the **Trust Over IP Foundation's DTG Working Group Credential Task Force Specification** (v0.3). The [[dtg-credentials|dtg-credentials]] library provides the Rust implementation. See [[dtg-credentials-overview]] for the complete taxonomy and [[credential-categories]] for the functional classification.

## Why Decentralized?

The "decentralized" in DTG is load-bearing. In a centralized trust model (like a certificate authority), trust flows from one root. If the root is compromised, everything breaks. If the root decides you're not trustworthy, you're out.

In the DTG:
- Trust is peer-to-peer — no root authority
- Multiple independent paths can corroborate trust
- No single entity can revoke your participation
- The graph is resilient to individual node compromise
- Communities set their own trust policies via [[trust-registries|trust registries]]
- Networks federate communities under shared governance

This is the [[first-person-network|First Person Network]] vision: identity and trust that belong to the individual, not to any institution.

See also: [[dtg-credentials-overview]], [[credential-categories]], [[did-types]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]]
