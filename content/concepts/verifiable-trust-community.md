---
title: "Verifiable Trust Communities (VTCs)"
type: concept
tags: [vtc, community, trust, membership]
date-updated: 2026-08-19
sources: [verifiable-trust-infrastructure, openvtc, dtg-credential-spec]
---

# Verifiable Trust Communities (VTCs)

## What They Are

A Verifiable Trust Community is a group of participants who have established a shared trust framework — agreed-upon rules for membership, credential issuance, and trust evaluation. Think of it as a club or professional association, but one where membership and trust relationships are cryptographically verifiable.

VTCs create denser clusters of trust within the broader [[decentralized-trust-graph|Decentralized Trust Graph]]. While the DTG as a whole is an open, permissionless web of trust, a VTC adds structure: who can join, what credentials members can issue, what trust policies the community enforces.

## How They Work

A VTC is identified by its own [[did-types|C-DID]] (Community DID) and has a community-level service — the **VTC Service** — that coordinates community operations. Members hold [[membership-credential|Membership Credentials]] issued by the community. When a VTC's governance enforces personhood guarantees, these VMCs qualify as [[personhood-credential|Personhood Credentials]] — determined by the community's [[trust-registries|trust registry]].

VTCs can belong to [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]] — higher-level federations that enable trust paths to cross community boundaries.

The lifecycle looks like:

1. A community is established with a DID and trust policies
2. Prospective members are invited or apply
3. The community evaluates the applicant (potentially checking their existing trust graph)
4. Members receive Membership Credentials
5. Members can issue credentials within the community's scope (endorsements, witness attestations, etc.)
6. The community maintains a registry of members and their roles

## The Know Your Developer Use Case

The driving use case for OpenVTC is **Know Your Developer** — verifying that contributors to open-source projects are real people with genuine reputations. This matters increasingly because AI agents can now convincingly imitate human contributors: committing, reviewing, and communicating in ways indistinguishable from a person. In this context:

- A VTC might be a Linux Foundation project, a GitHub organization, or a professional developer community
- Membership proves you're a verified human participant — not just an account or an agent
- [[relationship-credential|Relationship Credentials]] between members prove genuine connections
- [[endorsement-credential|Endorsement Credentials]] attest to technical competence
- [[witness-credential|Witness Credentials]] from conferences and meetups strengthen the graph

## VTC Infrastructure

The [[verifiable-trust-infrastructure|VTI]] workspace includes a **VTC Service** (`vtc-service`) that handles community-level coordination. The [[openvtc|OpenVTC]] tools include:

- **CNM CLI** (Community Network Manager) — for managing multiple communities
- **PNM CLI** (Personal Network Manager) — for individual participation in communities
- the **[[openvtc|OpenVTC TUI]]** — the member-side client: join by DID or agent name, present a VIC, see which capabilities a community has enabled, hold many memberships under distinct personas

Since mid-2026 a community **chooses and publishes the transports it offers** (TSP, DIDComm, REST) and which trust registry is authoritative for it, and its admin console (`/admin`, passkey-protected) approves joins, issues the member's VMC + role VEC, and manages the ACL. The spec's Working Draft 01 names the bootstrap roles: an **initiator** generates the C-DID, instantiates the community VTA and invites **community trust anchors (CTAs)**, who are automatically issued VMCs; a **Policy Enforcement Point (PEP)** enforces the community's issuance/revocation policies. See [[vta-topology]] for how a community is served by a *network* of its members' agents.

## Trust Policies

Communities can define their own policies for evaluating trust. For example:

- "Require at least 3 VRCs from existing members to grant membership"
- "Require at least 1 in-person witness attestation"
- "Endorsements from members with >5 VRCs carry more weight"

These policies are the community's own governance — the DTG provides the verifiable data, and the community decides how to interpret it.

See also: [[verifiable-trust-network]], [[trust-registries]], [[decentralized-trust-graph]], [[membership-credential]], [[first-person-network]]
