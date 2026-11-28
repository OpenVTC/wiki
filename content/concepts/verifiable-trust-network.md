---
title: "Verifiable Trust Networks (VTNs)"
type: concept
tags: [vtn, network, community, federation, hierarchy, trust, directory]
date-updated: 2026-11-28
sources: [vtn-service, dtg-credential-spec, verifiable-trust-infrastructure, dtg-credentials]
---

# Verifiable Trust Networks (VTNs)

## What They Are

A Verifiable Trust Network is a curated, nestable set of [[verifiable-trust-community|Verifiable Trust Communities (VTCs)]] and other networks. The VTI specification puts it in one line: *a VTC is a club, and a VTN is the association the clubs are listed in.* A club decides about people one at a time and needs both sides to agree. An association points at whole clubs, and it can point without being pointed back at.

Until Fig, the VTN was mostly a word in the [[dtg-credential-spec|DTG spec]]'s glossary. It is now running software, the [[vtn-service|VTN service]] with its `nnm` operator CLI, created on 2026-11-02 and shipped in the [[coordinated-releases|`VTI-Fig`]] release. This page explains the idea. The entity page covers the implementation.

## Why Communities Federate

Picture a doctor who wants to know whether a hospital's community is legitimate, or a regulator who wants to reach the security contact of every member organization in a sector. Without a network layer, each of them keeps a private list, and a community that wants to be found is found only by people who already know it. Recognition between communities works pairwise, and pairwise doesn't scale: *n* communities means *n²* relationships. The trust-registry rules deliberately refuse the shortcut of making recognition transitive.

A network is the other way to scale. It offers one curated set with an owner who is accountable for it. That makes **discovery** cheap and gives **joint recognition** a single place to live, without pretending that trusting the network means trusting everyone in it. The spec compares it to the Internet one layer down: an operator decides which machines are on its network, and an autonomous system decides which networks it announces to everyone else. A VTN occupies the second position.

The [[first-person-network|First Person Network]] is the motivating large-scale case. The design's worked example is a **World Health Network** of national networks, state networks and hospital communities.

## Above the VTC in Aggregation, Not in Authority

The single most important idea is that a network sits *above* communities only in how it groups them, never in what it can do to them.

| Node | Decides | Unit | Sides required |
|---|---|---|---|
| [[verifiable-trust-agent\|VTA]] | keys, contexts, delegated authority | one principal's own affairs | one |
| [[verifiable-trust-community\|VTC]] | admission, membership, recognition | one subject at a time | two |
| **VTN** | which communities and networks it lists | a whole community at a time | one |

A network grants its members nothing. It creates no trust contexts, derives no keys, holds no people, and removing a community from a network takes nothing away from that community's members (VTI-VTN-060…063). OpenVTC builds the network as a **separate service** rather than a VTC mode partly for this reason: a binary with no code for holding people can't accidentally hold them. Whether the VTN is formally its own node type or a VTC in a "curation role" is still an open working-group question (D9). The spec's requirements are written so that either answer works.

## Listing Is Not Membership

Because a network can list anyone without asking, it has to be scrupulous about what each entry means. The implementation separates three relationships, each evidenced by its own [[dtg-credentials-overview|DTG credential]] with its own status:

- **Listing**, which is one-sided: the network issues a [[statement-credential|Statement Credential]] under the registered predicate `lists/1`, naming the listed party's node type (VTC or VTN) and the network's governance framework. A Statement Credential "attests, never establishes", which is exactly what a one-sided listing is.
- **Membership**, which is two-sided: a [[membership-credential|VMC]] pair, the network's grant and the member's acknowledgement carrying the grant's digest. Both ends are communities, so the presence of `digestMultibase` is what tells the halves apart. The network offers the grant *unsigned* first, the party signs its acknowledgement over the grant's digest, and only then does the network sign. No membership credential exists until the party has agreed.
- **Repudiation**: a party listed against its wishes issues a `repudiates/1` Statement Credential. The network keeps publishing the listing *alongside* the repudiation, so readers see both sides.

Every published entry must say which state it is in (listed, acknowledged, repudiated, suspended, removed, departed). An unacknowledged listing must never be called membership (VTN-011…013). Listing is also not **recognition**. Recognizing a network never implies recognizing what it lists, unless a relying party adopts an explicit policy that names the framework version it relies on (VTN-022/023).

## Networks of Networks

A network may list other networks, without any depth limit, and a community or network may be listed by any number of networks. What a network must never do is **flatten** the path. Every search hit, graph view and broadcast carries each hop, with its own owner and acknowledgement state. A search for a hospital from the world network returns *WHN → Health-AU → Health-NSW → St Vincent's*, and each arrow is acknowledged or not on its own terms. A parent network presents a child's entries under the child's signature, never as its own (VTN-030…033).

The DTG spec caught up during Fig. Working Draft 0.7.0 allows a VTN's members to be VTCs **or** VTNs and keeps nested membership per-hop (spec PR #83).

## Reaching a Role Across a Network

A network is more than a list. It's also a delivery fabric for a **role**. A network defines roles such as `admins` or `security-contacts`, and each member registers one of its own groups for each role. A role can be required for admission, so a member is admitted only once the network can reach its admins. A broadcast to a role travels one signed hop at a time. A member network relays it into its own members' groups, and a member community passes it to the people in the group it registered. Each hop expands only its own groups and may apply its own policy. **The roster never leaves its owner**, so the world network learns that Health-AU's admins group accepted the message and nothing about who is in it. A provenance chain, a global message id and a hop limit handle overlapping memberships and loops, and receipts flow back up.

The same cascade admits people to **network rooms** ([[data-rooms]]). A person presents the chain linking their group to the network, receives a short-lived room pass, and the chain is evaluated again at each admission rather than cached as a roster.

## Discovery: Directory, Federated Search and the Trust Graph

Each network publishes a profile, a signed index and a directory whose visibility is public, members-only or admins-only. **Federated search** reaches into member networks' signed indexes and keeps each hit's path. A member index that can't be reached is reported as *indeterminate*, never as "not present". The **trust graph** view draws the [[decentralized-trust-graph|Decentralized Trust Graph]] straight from the credentials, one edge per credential, with nested networks expanding in place. People never appear in it.

Membership is meant to be checked rather than trusted. Anyone can verify a membership claim from the network's landing page or with `nnm verify`, which checks every signature itself, including [[decentralized-identifiers|did:webs]] signers. A network can also **project its membership into a [[trust-registries|trust registry]]** as `(party, network, member, vtn)` records. That way any existing TRQP client can ask "is X in network N?" without a new protocol, while path questions stay with the network.

## How a Community Takes Part

The community side lives in the VTC. A community receives a listing and acknowledges or repudiates it, can preview a network before joining, joins from its console or `cnm networks`, registers groups for network roles, and relays broadcasts to its members. The community and the network talk only through signed `vtn/*` and `vtc/networks/*` [[trust-tasks|Trust Tasks]]. That makes the network operator a third operator role alongside the person and the community, with the **NNM** joining the PNM and the CNM ([[vta-topology]]).

## Invitations

A network can invite a prospective member with the **VTN invitation credential**, the second variant of the [[invitation-credential|VIC]], issued to the prospective member community's identifier. A member VTC may also invite on the network's behalf if the network's policy allows it. In the running service, `nnm invite` lists the party and prints an invitation that links straight into the community's console.

## Identifiers

A network's identity is provisioned on an existing VTA (VTI-VTN-001). In the service, that means a `did:webvh` minted by the VTA from a `vtn-host` template, declared with a `public` [[correlation-scope]], because a network that can't be found can't be listed against.

## Edge Verifiability: the VTN as One Anchor Set Among Many

The DTG spec defines whether an edge credential counts as a DTG edge **relative to a verifier**. An edge is verifiable by a given verifier when its proof verifies and the verifier can establish that its issuer's membership in a VTC **in the anchor set that verifier accepts** is complete, either by disclosing the VMC pair or with a community-anchored [[zero-knowledge-proofs|ZKP]]. Working Draft 02 (spec PR #26) introduced this, replacing a glossary line that had tied verifiability to "a specific VTN" and asked both peers to sign one credential, which no credential could satisfy. A VTN is the *common* case of such an anchor set, but no VTN is required. An edge whose two halves trace to communities in different networks, or in none, is still an edge to any verifier whose anchor set includes both. Working Draft 0.5.0 (#55) kept *edge credential* as the spec's one normative class because Edge Verifiability depends on it.

## What's Still Open

Several pieces are still missing:

- **Recognition credentials:** recognition evidenced by VRCs between networks and communities is designed but not built.
- **Roles and approvals:** network administrators are still plain DIDs in config. The owner, curator, broadcaster and auditor roles and step-up approvals are still to come.
- **Transport:** delivery runs over HTTPS. TSP and DIDComm carriage are still to come.
- **Working-group questions:** node type versus VTC role (D9), the VMC lifecycle, and registering the group predicates are all still open with the working group.

See [[vtn-service]] for the full list.

See also: [[vtn-service]], [[verifiable-trust-community]], [[membership-credential]], [[statement-credential]], [[decentralized-trust-graph]], [[invitation-credential]], [[trust-registries]]
