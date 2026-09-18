---
title: "The Decentralized Trust Graph (DTG)"
type: concept
tags: [trust-graph, dtg, trust-over-ip, credentials]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# The Decentralized Trust Graph (DTG)

## The Core Idea

The Decentralized Trust Graph is the conceptual model at the heart of the OpenVTC ecosystem. It answers a deceptively simple question: **how do you decide whether to trust someone you've never met?**

In the physical world, you rely on chains of trust. You trust your friend. Your friend trusts their colleague. If your friend vouches for their colleague, you have a reason — not a guarantee, but a reason — to extend some trust. The DTG makes this kind of reasoning cryptographically verifiable in the digital world.

The graph is built from two primitives:
- **Nodes** — entities in the world: people, devices, AI agents, communities, networks, and (since Working Draft 02 of the spec) **services** — an operated endpoint with its own identifier, such as a message mediator, a DID host or a trust registry, as distinct from the provider that runs it. The list is illustrative, not closed: what makes something a node is that it holds a [[decentralized-identifiers|verifiable identifier]] and forms edges. Each identifier carries a holder-declared [[correlation-scope]].
- **Edges** — created by [[credential-categories|Edge Credentials]]: [[membership-credential|Membership Credentials (VMCs)]] connect entities to communities, [[relationship-credential|Relationship Credentials (VRCs)]] connect entities to other entities, and [[delegation-credential|Delegation Credentials (VDCs)]] connect a principal to a party appointed to act in its name. **Every edge is bidirectional**: a complete edge requires a pair of credentials, one from each side — and the second half is the counterparty's *consent*.

[[credential-categories|Annotation Credentials]] ([[endorsement-credential|endorsements]], [[witness-credential|witnesses]], [[persona-credential|personas]]) attach data to existing structure. Two credentials stand apart from the graph structure: the [[invitation-credential|VIC]] bootstraps a node into a community, and the [[authority-credential|VAC]] confers permission to act within a scope a node governs.

Anyone can traverse the graph to discover trust paths between two entities. The credentials are cryptographically signed, so every edge is verifiable. The graph is decentralized — no single authority controls it, and no single point of failure can break it.

## How Trust Is Built

### Form Relationships Directly

The base case is two people who know and trust each other exchanging [[relationship-credential|VRCs]]. Each issues one to the other; together the two form a complete edge. Neither needs to belong to any community — the relationship stands on the attestations themselves and whatever real-world context the parties bring.

The protocol: one person sends a relationship request via [[didcomm|DIDComm]] or [[trust-spanning-protocol|TSP]]; the other accepts; both finalize, creating a private channel under per-relationship identifiers; each issues a VRC. The spec RECOMMENDS a **`pairwise`** identifier per relationship — declared as such, never reused with a second counterparty.

### Join a Community for Anchored Proofs and Personhood

Membership in a [[verifiable-trust-community|Verifiable Trust Community]] is optional but powerful. A community issues a VMC *grant*, and the member issues an *acknowledgement* back carrying a digest of the grant — the member's consent artifact. Without it a community cannot prove anyone's membership to a third party. Communities can themselves be members of [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]] via the same pair.

Joining unlocks two things pure peer-to-peer VRCs cannot provide:

- **Personhood attestation.** When the community's governance enforces real human personhood and one-membership-per-person, the grant is a [[personhood-credential|Personhood Credential (PHC)]] — determined by the community's [[trust-registries|trust registry]].
- **Community-anchored relationship proofs.** A holder can construct a [[zero-knowledge-proofs|ZKP]] showing both parties to a VRC hold VMCs from the same community, lending the relationship the community's assurances without exposing identifiers.

### Appoint and Empower Agents

WD02 gives the graph a vocabulary for the AI-agent case. A person who wants an agent to act **as itself**, with strictly less than the person holds, attenuates an [[authority-credential|Authority Credential]] to it — four hours of read-only access to one room, verified by walking the chain back to the room. A person who wants an agent's acts **attributed to them** issues a [[delegation-credential|Delegation Credential]], which the agent accepts; the verifier then asks whether *the person* may do the act. Which of the two a community admits for agents is governance; that a verifier can always tell which it was shown is what keeping them separate buys.

### Annotate with Endorsements and Witnesses

- **[[endorsement-credential|Endorsements (VEC)]]** — "I endorse this person's skills in X"
- **[[witness-credential|Witnesses (VWC)]]** — "I witnessed this edge being formed" (especially powerful via the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]])
- **[[persona-credential|Personas (VPC)]]** — selectively linking a persona to a relationship

On the spec's `main` branch endorsements and witness attestations become profiles of one [[statement-credential|Statement Credential]] — a signed statement by one node about another, under a governed predicate.

### Scale Through Networks

Communities federate into [[verifiable-trust-network|VTNs]]. Since WD02 a VTN is best understood as one example of the **anchor set** a verifier accepts: an edge credential is "verifiable as a DTG edge *by a given verifier*" when its proof verifies and the issuer's membership in a VTC in that verifier's anchor set is complete — by disclosing the VMC pair or by community-anchored proof. The same edge may count for one verifier and not another, and neither is wrong.

## Traversing the Graph

Imagine you're evaluating a contributor to an open-source project:

1. They present an identifier they have chosen to make `directed` or `public` for this purpose
2. You look up their credentials in the graph
3. You find they have VRCs with three people you already trust
4. Those people have endorsement credentials attesting to their coding skills
5. Two of those endorsements have witness credentials from an in-person meetup

You've now established a multi-path, multi-evidence trust assessment — all without a central authority, all cryptographically verifiable. Where the parties share a community, the holder can additionally construct a community-anchored ZKP. The [[verifiable-trust-infrastructure|VTI]] draws this graph, distinguishing half-edges from complete edges (#1073, #1213).

## The DTG Specification

The credential types that populate the DTG are defined by the **Trust Over IP Foundation's DTG Working Group Credentials Task Force** in the [[dtg-credential-spec|DTG Core Credentials specification]] — a formal ToIP deliverable at **v1.0 Working Draft 02** (tagged 2026-09-07), with `main` heading for Working Draft 0.4.0. It gives *node* and *edge* their glossary definitions: a **DTG node** is an entity identified by at least one DTG verifiable identifier and reachable via a [[vta-topology|VTA]]; a **DTG edge** is a cryptographically verifiable trust relationship between two nodes, formed by a pair of edge credentials. One boundary the spec draws explicitly: a VMC binds a member to a node that *has members* — a person is not a collective, and "membership in a person" is a VRC or a VDC, never a VMC. The [[dtg-credentials|dtg-credentials]] library provides the Rust implementation. See [[dtg-credentials-overview]] for the complete taxonomy and [[credential-categories]] for the functional classification.

## Why Decentralized?

The "decentralized" in DTG is load-bearing. In a centralized trust model (like a certificate authority), trust flows from one root. If the root is compromised, everything breaks. If the root decides you're not trustworthy, you're out.

In the DTG:
- Trust is peer-to-peer — no root authority
- Multiple independent paths can corroborate trust
- No single entity can revoke your participation — and no community can claim your membership without your signed consent
- The graph is resilient to individual node compromise
- Communities set their own trust policies via [[trust-registries|trust registries]]
- Networks federate communities under shared governance
- Authority chains and delegation chains are verified from what the holder presents, never fetched — so verification stays offline and nobody learns when a credential is used

This is the [[first-person-network|First Person Network]] vision: identity and trust that belong to the individual, not to any institution.

See also: [[dtg-credentials-overview]], [[credential-categories]], [[correlation-scope]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[authority-credential]], [[delegation-credential]]
