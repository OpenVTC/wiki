---
title: "The Decentralized Trust Graph (DTG)"
type: concept
tags: [trust-graph, dtg, trust-over-ip, credentials]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# The Decentralized Trust Graph (DTG)

## The Core Idea

The Decentralized Trust Graph is the conceptual model at the heart of the OpenVTC ecosystem. It answers a deceptively simple question: **how do you decide whether to trust someone you've never met?**

In the physical world, you rely on chains of trust. You trust your friend. Your friend trusts their colleague. If your friend vouches for their colleague, you have a reason — not a guarantee, but a reason — to extend some trust. The DTG makes this kind of reasoning cryptographically verifiable in the digital world.

The graph is built from two primitives:
- **Nodes** — created by [[membership-credential|Membership Credentials (VMCs)]], representing verified members of communities
- **Directed edges** — created by [[relationship-credential|Relationship Credentials (VRCs)]], representing trust attestations between members. Two VRCs (one each direction) form a complete bilateral edge.

Additional [[credential-categories|Annotation Credentials]] ([[endorsement-credential|endorsements]], [[witness-credential|witnesses]], [[persona-credential|personas]]) attach data to existing nodes and edges without creating new graph structure.

Anyone can traverse the graph to discover trust paths between two entities. The credentials are cryptographically signed, so every edge is verifiable. The graph is decentralized — no single authority controls it, and no single point of failure can break it.

## How Trust Is Built

Trust in the DTG is built incrementally, from the ground up:

### Step 1: Join a Community

Before you can participate meaningfully, you need a [[membership-credential|Membership Credential (VMC)]] from a [[verifiable-trust-community|Verifiable Trust Community]] — proof that you're a real, unique person within that community. When the community's governance enforces personhood guarantees, this VMC qualifies as a [[personhood-credential|Personhood Credential (PHC)]] — determined by the community's [[trust-registries|trust registry]].

Communities themselves can belong to [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]], creating a hierarchy: VTN → VTC → member.

### Step 2: Form Relationships

When two community members establish a genuine trust relationship, they exchange [[relationship-credential|Relationship Credentials (VRCs)]]. Each party issues one VRC — a directed trust assertion — and together the two VRCs form a complete edge. The protocol:

1. One person sends a relationship request via [[didcomm|DIDComm]]
2. The other accepts
3. Both finalize the relationship, creating a private channel with a unique [[did-types|R-DID]]
4. Each party issues a VRC to the other

The spec requires each entity to generate a **new, unique R-DID for every relationship**, even within the same community, ensuring privacy.

### Step 3: Annotate with Endorsements and Witnesses

Trust relationships can be strengthened through [[credential-categories|Annotation Credentials]]:
- **[[endorsement-credential|Endorsements (VEC)]]** — "I endorse this person's skills in X"
- **[[witness-credential|Witnesses (VWC)]]** — "I witnessed that this relationship is genuine" (especially powerful via the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]])
- **[[persona-credential|Personas (VPC)]]** — selectively linking a persona identity to a relationship

### Step 4: Scale Through Networks

Communities can federate into [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]], enabling trust paths to traverse community boundaries. VTNs issue VMCs to their member VTCs, creating a shared trust anchor across independent communities.

## Traversing the Graph

The power of the DTG is in traversal. Imagine you're evaluating a contributor to an open-source project:

1. They present their [[did-types|M-DID]]
2. You look up their credentials in the graph
3. You find they have VRCs with three people you already trust
4. Those people have endorsement credentials attesting to their coding skills
5. Two of those endorsements have witness credentials from an in-person meetup

You've now established a multi-path, multi-evidence trust assessment — all without a central authority, all cryptographically verifiable.

To formally prove a relationship, the holder must demonstrate via ZKP: (1) possession of the VRC, (2) possession of the underlying VMC (community membership), and (3) that the counterparty also holds a VMC from the same community. This anchors all relationships within a community context.

## The DTG Specification

The credential types that populate the DTG are defined by the **Trust over IP Foundation's DTG Working Group Credential Task Force** (v0.3). The [[dtg-credentials-repo|dtg-credentials]] library provides the Rust implementation. See [[dtg-credentials-overview]] for the complete taxonomy and [[credential-categories]] for the functional classification.

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
