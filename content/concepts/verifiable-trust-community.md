---
title: "Verifiable Trust Communities (VTCs)"
type: concept
tags: [vtc, community, trust, membership, administration, roles, two-person-rule, eucalyptus]
date-updated: 2026-10-07
sources: [verifiable-trust-infrastructure, openvtc, dtg-credential-spec, verifiable-git-infrastructure]
---

# Verifiable Trust Communities (VTCs)

## What They Are

A Verifiable Trust Community is a group of participants who have established a shared trust framework — agreed-upon rules for membership, credential issuance, and trust evaluation. Think of it as a club or professional association, but one where membership and trust relationships are cryptographically verifiable.

VTCs create denser clusters of trust within the broader [[decentralized-trust-graph|Decentralized Trust Graph]]. While the DTG as a whole is an open, permissionless web of trust, a VTC adds structure: who can join, what credentials members can issue, what trust policies the community enforces.

## How They Work

A VTC is identified by its own DID — since Working Draft 02 of the spec no longer called a "C-DID" ([[did-types]] is retired), but simply the community's identifier, which can only truthfully be declared with a **`public`** [[correlation-scope]]: a community that cannot be found cannot be joined. It has a community-level service — the **VTC Service** — that coordinates community operations. Members hold [[membership-credential|Membership Credentials]]: a grant from the community and an acknowledgement back from the member, under an identifier and scope *the member* chooses for that membership. When a VTC's governance enforces personhood guarantees, the grants qualify as [[personhood-credential|Personhood Credentials]] — determined by the community's [[trust-registries|trust registry]].

WD02 also puts one normative duty on every VTC that issues VMCs: it **MUST publish**, in its governance framework or trust registry, whether member identifiers are disclosed beyond the VTA and to whom — because a member's `pairwise` declaration only stays truthful if the community keeps it so, and a verifier MUST NOT assume it does. A VTA SHOULD show the community's answer to a prospect before they choose a scope for joining.

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

Since mid-2026 a community **chooses and publishes the transports it offers** (TSP, DIDComm, REST) and which trust registry is authoritative for it, and its admin console (`/admin`, passkey-protected) approves joins, issues the member's VMC + role VEC, and manages the ACL. The spec names the bootstrap roles: an **initiator** generates the community's identifier, instantiates the community VTA and invites **community trust anchors (CTAs)**, who are issued VMCs (and, since WD02, acknowledge them like any other member); a **Policy Enforcement Point (PEP)** enforces the community's issuance/revocation policies. See [[vta-topology]] for how a community is served by a *network* of its members' agents.

**Peer identity vetting.** Since Dogwood, [[openvtc|OpenVTC]] carries community-run identity vetting (design DRAFT v3; V0 complete in Eucalyptus): the community names **vetters** by issuing them a revocable role credential — since DTG Credentials v1 a community role [[authority-credential|VAC]] with action `role:vetter`, not an endorsement — publishes an opt-in vetter directory, and hands out QR tickets that a prospect brings to a vetter. The vetter's attestation is a [[statement-credential|statement credential]] under the registry predicate `vetted/1`, counted by the community under rules it publishes in its join manifest; with the `vetting-pcs` feature a community can instead accept a zero-knowledge proof that enough vetters vouched, without learning which. See [[peer-identity-vetting]].

## Administration as of Eucalyptus: Roles, Capabilities and a Second Approver

The `VTI-Eucalyptus` release (2026-10-07) rebuilt how a community is *run*, on one principle: an administrator's credential can be stolen, or an administrator can go rogue, and no single one of them should be able to take the community over. The VTI documentation (`docs/03-vtc/admin-access.md`) records a survey of every VTC operation on 2026-10-02 that found three ways one administrator could get round a second-administrator rule alone — remove the others, lower the consent threshold, or replace the policy that decides authority — and closed all three.

- **Every call is a signed Trust Task** (VTI #1840, 2026-09-29). The VTC's client library sends nothing else, over TSP, DIDComm or HTTPS alike, and the REST and bearer-token admin surfaces — members (#1845, #1846), the remaining admin routes (#1824–#1858), git-namespace reads (#1841) — were retired in the same fortnight. Member verbs became Trust Tasks too (#1809), including **membership renewal**, `vtc/members/renew/0.1`, which OpenVTC exposes from its Communities view (#398): a renewal keeps the DID and re-issues the credential pair, distinct from a key rotation.
- **An administrator is an ACL entry with an administrative role** (#1924, 2026-10-03). Authority is read from the entry at the moment an act runs; a credential, a session or a console key carries none of its own. A **capability** is one administrative power (twenty of them, fixed in code — `vtc.roles.assign`, `vtc.policy.admin`, `vtc.vetting.manage`, `git.ns.admin`, …), and an administrative role is a *ceiling* of capabilities: seven built-in roles — `community-admin`, `moderator`, `vetting-lead`, `repo-manager`, `credential-officer`, `auditor`, and the least-privilege `approver`, which acts nowhere and only approves — plus **custom roles** a community defines for itself (#1927), such as an `events-team` of `vtc.surface.admin` + `vtc.invitations.manage`. An entry holds its role's ceiling or a narrower set, each optionally qualified to a resource (a git namespace, a policy purpose, a join criterion). Nobody can widen their own entry and no grant can exceed its granter (#1738, VTI-ACL-052/053 — a rule whose enforcement was prompted by a `vgi-bridge` context administrator).
- **Consequential actions wait for a second approver** (#1917, #1918). Granting an authority-conferring capability, inviting an administrator, taking authority away from another administrator, lowering the consent threshold, replacing an authority-deciding policy, defining a custom role, or committing a backup restore each becomes an item in the community's **action list**: the requester's own step-up is asked for *first* (so a thief holding only a signing key cannot start one), then the N-th approval from other holders of the same capability runs it, within a default lifetime of 72 hours. When nobody is left to approve a removal — two administrators, one removing the other — it *cools off* for a configurable window (24 hours by default) during which the subject is **suspended**: its entry authorizes nothing, its git rights are withdrawn from the registry and the forge, and the first to act wins (#1920, #1944, #1945). The same list carries the community's queues — a break-glass to ratify, a referred join, a withdrawn vetting statement — and **acknowledge** items for every offline write an operator makes with the daemon stopped (`AclBreakGlassWritten`), which cannot be prevented, only made visible.
- **Separation of duties.** No one grants themselves anything, writes an entry that outlives their own, approves their own request, or ratifies their own break-glass; the VTC refuses to remove the last holder of `vtc.roles.assign`. A community run by one person under several identifiers can opt into **single-administrator mode** at install (#1925), where the operation-bound step-up stands in for the second party and everything is audited at `Critical`.
- **Git namespaces** put a community's forge under the same model: repository rights are capabilities on the member's ACL entry, granted member to member, projected onto GitHub or Forgejo by a bridge and published to the trust registry for CI. See [[community-git-namespaces]].

The console's **Access control**, **Roles** and **Actions** pages, `cnm actions list` and `cnm acl …`, and the [[vta-browser-plugin|browser wallet]]'s per-community step-up approver (#291, #293) are the surfaces; the design notes are `vtc-admin-roles.md`, `vtc-action-list.md` and `vtc-approver-step-up.md`. Not yet built: an approvals rule list keyed on Trust Task URI (the rules are fixed in code), a join review with more than one decider, and mobile approvers.

## Trust Policies

Communities can define their own policies for evaluating trust. For example:

- "Require at least 3 VRCs from existing members to grant membership"
- "Require at least 1 in-person witness attestation"
- "Endorsements from members with >5 VRCs carry more weight"

These policies are the community's own governance — the DTG provides the verifiable data, and the community decides how to interpret it.

See also: [[verifiable-trust-network]], [[trust-registries]], [[decentralized-trust-graph]], [[membership-credential]], [[first-person-network]]
