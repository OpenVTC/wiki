---
title: "Invitation Credential (VIC)"
type: concept
tags: [credentials, dtg, invitation, onboarding]
date-updated: 2026-09-18
sources: [dtg-credential-spec, openvtc, verifiable-trust-infrastructure]
---

# Invitation Credential (VIC)

A Verifiable Invitation Credential authorizes the onboarding of a new member into a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. It's the bootstrap mechanism for bringing new participants into the [[decentralized-trust-graph|trust graph]].

## Who Can Invite

The issuer of a VIC depends on community policy:

- **For VTC membership**: the VTC's own DID, or an authorized member's DID (if the community allows member-initiated invitations)
- **For VTN membership**: the VTN's DID, or a member VTC's DID

This flexibility lets communities choose between centralized invitation (only the community itself can invite) and decentralized invitation (existing members can bring in new people). The [[dtg-credential-spec|spec]] makes explicit that these are **two functional variants of one credential** — the *VTC invitation credential* (issued to the identifier the prospect proposes to use in that community) and the *VTN invitation credential* (issued to a prospective member VTC's identifier) — distinguished by issuer/subject rules, not by separate type strings. (WD01 said "M-DID" and "C-DID"; WD02 retired those types in favour of [[correlation-scope]].) Its Security Considerations add replay guidance: VICs should be issued with **short validity periods** and treated as **single-use** by the accepting VTA / Policy Enforcement Point (PEP — the VTC's policy engine for credential issuance and revocation).

WD01's open editor's note — should role or access-control information be embedded in the VIC? — was answered in WD02 (spec PR #29): **it should not.** What a party may *do* is conferred by an [[authority-credential|Authority Credential]], which can be re-issued or attenuated without touching the invitation that admitted them; roles and policy are otherwise inferred from the issuer plus the [[trust-registries|trust registry]].

The spec also sketches the identity-proofing path a VIC can start: the VTC issues a VIC to the prospect's proposed identifier → the prospect proves themselves to an **identity verification provider** (IDVP — Veriff, Jumio, Yoti and the like are the examples given) → the IDVP issues an **identity verification credential** (IDVC, not a DTG credential) to that same identifier, which the community's join policy can then require.

## Role in the Ecosystem

In Working Draft 02 the VIC was the sole member of an "Invitation Credentials" [[credential-categories|category]]; on the spec's `main` branch (2026-09-10, closing issue #28) it was **promoted to a top-level section standing outside the categories**, alongside the VAC — it bootstraps a node *into* a community rather than forming an edge or annotating one. Nothing normative changed. Once the invitee completes onboarding and the [[membership-credential|VMC]] pair is formed, the invitation has served its purpose. A [[data-rooms|data room]] — a DTG node with its own DID — admits a member the same way: VIC for entry, VMC pair to form the membership edge, then [[authority-credential|VACs]] for what the member may do inside.

The [[verifiable-trust-agent|VTA/PEP]] processes invitation credentials during the onboarding flow.

## Implementation Status

As of June 2026 the VIC is **implemented end-to-end**, making it the first invitation mechanism to go from spec to working code; by August (OpenVTC v0.3.x / the `Cypress` release) a pasted VIC pre-fills the community in the join flow, the join can run over TSP, and an applicant can poll a community about an unanswered join. On the community side, the VTC service supports automatic join via VIC — with role-on-invite, revocation, QR-sized invitations in the admin UI, and a verdict-model admission pipeline. On the member side, [[openvtc|OpenVTC]] presents a VIC at join, stores VICs in the VTA credential vault, and supports a **subject-linkage proof** so an invitee can join under a freshly minted DID different from the one the VIC names. Since Dogwood a pasted VIC must carry the DTG common structure at ingest (openvtc #256), and the join now completes properly: receiving the community's VMC grant auto-issues the member's acknowledgement, closing the membership edge (openvtc #259–#267). See the Recent Development sections on [[openvtc]] and [[verifiable-trust-infrastructure]].

See also: [[membership-credential]], [[authority-credential]], [[credential-categories]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[data-rooms]]
