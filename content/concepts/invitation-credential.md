---
title: "Invitation Credential (VIC)"
type: concept
tags: [credentials, dtg, invitation, onboarding]
date-updated: 2026-08-19
sources: [dtg-credential-spec, openvtc, verifiable-trust-infrastructure]
---

# Invitation Credential (VIC)

A Verifiable Invitation Credential authorizes the onboarding of a new member into a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. It's the bootstrap mechanism for bringing new participants into the [[decentralized-trust-graph|trust graph]].

## Who Can Invite

The issuer of a VIC depends on community policy:

- **For VTC membership**: the VTC's [[did-types|C-DID]], or an authorized member's M-DID (if the community allows member-initiated invitations)
- **For VTN membership**: the VTN's C-DID, or a member VTC's C-DID

This flexibility lets communities choose between centralized invitation (only the community itself can invite) and decentralized invitation (existing members can bring in new people). Working Draft 01 of the [[dtg-credential-spec|spec]] makes explicit that these are **two functional variants of one credential** — the *VTC invitation credential* (issued to the prospect's M-DID) and the *VTN invitation credential* (issued to a VTC's C-DID) — distinguished by issuer/subject rules, not by separate type strings. Its new Security Considerations add replay guidance: VICs should be issued with **short validity periods** and treated as **single-use** by the accepting VTA / Policy Enforcement Point (PEP — the VTC's policy engine for credential issuance and revocation). An open editor's note asks whether role information should be embedded in the VIC.

The spec also sketches the identity-proofing path a VIC can start: the VTC issues a VIC to the prospect's M-DID → the prospect proves themselves to an **identity verification provider** (IDVP — Veriff, Jumio, Yoti and the like are the examples given) → the IDVP issues an **identity verification credential** (IDVC, not a DTG credential) to that M-DID, which the community's join policy can then require.

## Role in the Ecosystem

VICs are [[credential-categories|Invitation Credentials]] — they bootstrap new participants but don't create persistent graph structure. Once the invitee completes onboarding and receives a [[membership-credential|Membership Credential (VMC)]], the invitation has served its purpose.

The [[verifiable-trust-agent|VTA/PEP]] processes invitation credentials during the onboarding flow.

## Implementation Status

As of June 2026 the VIC is **implemented end-to-end**, making it the first invitation mechanism to go from spec to working code; by August (OpenVTC v0.3.x / the `Cypress` release) a pasted VIC pre-fills the community in the join flow, the join can run over TSP, and an applicant can poll a community about an unanswered join. On the community side, the VTC service supports automatic join via VIC — with role-on-invite, revocation, QR-sized invitations in the admin UI, and a verdict-model admission pipeline. On the member side, [[openvtc|OpenVTC]] presents a VIC at join, stores VICs in the VTA credential vault, and supports a **subject-linkage proof** so an invitee can join under a freshly minted DID different from the one the VIC names. See the Recent Development sections on [[openvtc]] and [[verifiable-trust-infrastructure]].

See also: [[membership-credential]], [[credential-categories]], [[verifiable-trust-community]], [[verifiable-trust-network]]
