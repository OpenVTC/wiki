---
title: "Membership Credential (VMC)"
type: concept
tags: [credentials, dtg, membership, community, personhood, edge, zkp, consent, renewal, vtn, fig]
date-updated: 2026-11-28
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure, verifiable-trust-network]
---

# Membership Credential (VMC)

A Verifiable Membership Credential attests to the **membership of an entity in a community**. It connects a person, device, agent or service to a [[verifiable-trust-community|VTC]] — or one community to a [[verifiable-trust-network|VTN]], or a member to a [[data-rooms|data room]]. VMCs are [[credential-categories|Edge Credentials]] — the one grouping the [[dtg-credential-spec|spec]] still makes.

Since Working Draft 02 the identifiers are no longer typed: the issuer of a grant is simply the VTC's own identifier, and the member appears under whatever identifier the member chose for this membership. Since Working Draft 0.6.0 each half declares its issuer's [[correlation-scope]] in `issuerScope`: the grant's is the community's own declaration. Until Working Draft 0.7.0 it could only be **`public`** ("a community that cannot be found cannot be joined"). Since #86 (2026-11-11) it is **`directed` at minimum**, `public` where the community is open to outsiders, and never `pairwise`; [[dtg-credentials]] follows from 0.16.0. The acknowledgement carries the member's own declaration, `pairwise` for an identifier used only with the community or `directed` for one also used with fellow members. The old C-DID / M-DID vocabulary is retired ([[did-types]]).

## Two VMCs = One Membership Edge — and the Second One Is Consent

Membership in the DTG is symmetric: it isn't enough for a community to claim a member. **Membership is verified through a bi-directional pair of VMCs**, and WD02 (spec PR #12, 2026-08-28) finally made both halves constructible after a real contradiction — five places said "two VMCs form an edge" while the schema only allowed the community-issued one:

| | `issuer` / `issuerScope` | `credentialSubject.id` | `digestMultibase` |
|---|---|---|---|
| **Community-issued VMC — the grant** | the VTC / VTN, `directed` or `public` (only `public` before 0.7.0) | the member: a person's identifier, or since 0.7.0 a member VTC or member VTN | MUST be absent |
| **Member-issued VMC — the acknowledgement** | the member, from the same identifier the grant named, declaring its own scope | the VTC / VTN | REQUIRED: digest of the grant |

The two directions are distinguished by these rules and by the presence of the digest, not by separate type strings (where both ends are communities, as in VTN membership, the digest is the discriminator). The digest is SHA-256 over the grant's JCS form *excluding `proof`*, as a base58btc multihash — so a re-signed grant with identical claims still satisfies an existing acknowledgement, while a re-issued grant with different claims does not, forcing re-acknowledgement.

**Why a pair.** The acknowledgement is the member's **consent artifact**. A community can always issue a credential naming someone as a member, but it cannot produce the acknowledgement without that party's signature. So: the grant MUST be issued first; an acknowledgement whose digest matches no valid grant MUST NOT complete the edge; and whenever anyone *other than the member* asserts that an entity is a member, the verifier MUST require the acknowledgement — a community asserting a membership MUST be able to produce it. Unconsented membership claims become unprovable, and a community that cannot show an acknowledgement is visibly asserting a membership nobody agreed to.

The rule is deliberately direction-sensitive: a member presenting *their own* grant, with proof of control of the subject key, MAY be accepted alone — the presentation is itself the participation. This is what keeps the community-anchored ZKP and the [[personhood-credential|PHC]] constructions working, since both rest on the member holding the grant.

Lifecycle (withdrawal, revocation, re-issuance, and where a verifier learns the status of a *member-issued* VMC, which must be under the member's control) is deferred to the planned Trust Task Protocols spec. Two interim controls follow from the digest binding: a short `validUntil` on the grant forces periodic re-acknowledgement; a short `validUntil` on the acknowledgement bounds how long the community holds a presentable proof of consent — because the acknowledgement is also a **disclosure artifact** the community can show to third parties without the member's involvement. Since 0.7.0 (#90) *whether* it may do so is bounded by the disclosure practice the community published when the member joined, which is now binding on the community. A community that **respects declared scope** never presents the acknowledgement of a `pairwise` or `directed` member (see [[correlation-scope]]). Withdrawal is in the member's hands, but it is all-or-nothing: it ends the membership. Where the member is itself a VTC or VTN, it may carry `credentialStatus` on its acknowledgement, since it already runs a status mechanism under its own control (#83).

## What Has Members

A WD02 editor's note fixes a boundary: **a VMC binds a member to a node that has members** — a VTC, a VTN, a service with registered clients, a device with authorized identities. A person is not a collective; "membership in a person" is a [[relationship-credential|VRC]] (peers) or a [[delegation-credential|VDC]] (one acts in the other's name), never a VMC.

## Dual Purpose

1. **Community membership** — belonging to a specific community, enabling community-level policies
2. **Personhood attestation** — when the issuing community's governance enforces real human personhood and one-membership-per-person, the *grant* qualifies as a [[personhood-credential|PHC]]. Whether or not the member has acknowledged it; the acknowledgement gates only the community's ability to assert that membership to others. Determined by the [[trust-registries|trust registry]], not by structure.

What a member may *do* in the community is not in the VMC at all: since Eucalyptus the VTC issues a [[authority-credential|role VAC]] beside it, and the spec says a VAC MUST NOT be read as evidence of membership nor a VMC as evidence of authority.

## VTN Membership

A VTN issues a grant to a VTC's identifier, and the VTC acknowledges back: the same pair under the same rules. Since WD02's *Edge Verifiability* section, a VTN is one example of the anchor set a verifier accepts, not a precondition for an edge to exist.

**Networks of networks** (spec #83, Working Draft 0.7.0). A VTN's members may be VTCs **or other VTNs**, for example state, national and global networks. The VMC and VIC subject rules now admit a member VTN, and a member VTN may issue a VTN invitation. Membership is **per hop**: a VMC pair establishes membership only between its two parties, is never inferred through a chain of nested networks, and each pair is evaluated independently. A verifier whose anchor set names a VTN with VTN members expands it by its own policy (the VTN, its framework version and a nesting depth), counting completed memberships only.

**As built** ([[verifiable-trust-network]], new at `VTI-Fig`). The `vtn-service` lists a party one-sidedly by signing a listing VSC. The listed VTC or VTN fetches an unsigned membership offer, signs its VMC acknowledgement over that offer, and only then does the network sign the grant that completes the edge. A party can repudiate its listing or its grant (the latter counts as departing). Suspension and removal appear in W3C Bitstring Status Lists, and membership is projected into a [[trust-registries|trust registry]]. The VTI's community side acknowledges and repudiates as a network member under the same `issuerScope` its `[credentials] issuer_scope` setting declares (VTI #2802).

## Community-Anchored ZKP

The VMC anchors the **community-anchored ZKP**: when both parties to a VRC hold VMCs from the same community, the holder proves possession of the VRC, possession of their own grant, and that the counterparty's grant is from the same community — without revealing identifiers. The spec is candid that the third statement currently establishes only that the community *attested* the counterparty's membership, not that the counterparty acknowledged it, and that under strict `pairwise` scopes the proof must additionally establish common control of two distinct identifiers. See [[zero-knowledge-proofs]].

## Implementation Status (Eucalyptus and Fig)

The pair was harder to ship than to specify. In [[openvtc|OpenVTC]] the member→community half **had never actually landed** before Dogwood: VMCs had no `id`, [[dtg-credentials]] 0.2.0 had no field for one, and the VTC's rejection of the reciprocal came back as an uncorrelated problem-report the client discarded. It was fixed across openvtc #259–#267 and `dtg-credentials` 0.3.0–0.5.0 (digest the *received* grant JSON, not a re-serialization); 0.10.0's `new_member_vmc_for` refuses a grant that does not name the party answering it, and **0.12.0** adds the member's `issuer_scope` to it, fixes `new_vmc` at `public`, refuses a grant declaring otherwise (`NotAMembershipGrant`), and drops the WD01 wire name `digest`.

**The v1 upgrade re-issued every membership.** Because `issuerScope` and the new context changed every grant's digest, an acknowledgement of a pre-v1 grant completes no edge; the VTI's `vtc/members/credentials/0.1` (admin only) shows the grant, the acknowledgement and `memberVmcBound` — whether the digest was verified when it arrived — and the console offers **Request member VMC** where the edge is not bound. On the member side OpenVTC (#397) sets a pre-v1 VMC and role credential aside on load with a notice, and #398 (2026-10-01) added **membership renewal** from the Communities view: `R` sends `vtc/members/renew/0.1` (no parameters, signed by the persona's authentication key) and the reply — verified as the community's signed operational document — carries a fresh v1 VMC (`issuerScope: public`) and role VAC, which replace the old ones and are answered with a fresh `members/vmc` acknowledgement, exactly as the join flow does on admission. In the VTC, renewal (`POST /members/me/renew`) extends `validUntil` (mandatory and finite, 30 days by default) and re-evaluates personhood while preserving the member's status-list slot, so an external verifier who pinned `statusListIndex` sees continuous membership across renewals and DID rotations; inside the community the ACL stays authoritative and an expired VMC does not lock a member out.

**Fig.** [[dtg-credentials]] 0.16.0 (2026-11-24) gives `new_vmc` an `issuer_scope` parameter, accepts a `directed` grant in `new_member_vmc_for`, and refuses only `pairwise`. VTI #2802 adds the VTC setting `[credentials] issuer_scope` (`public` by default, or `directed`) and teaches `vtc-service`'s inbound-VMC check to accept a `directed` grant; OpenVTC does the same (#626). The salted grant/acknowledgement pair of 0.7.0 (#87) is the spec's worked example of salting. It is not on the wire yet, because context `v3` is unpublished and the crate's `context-v3` feature is off in every consumer. Spec #94 corrected the member-issued example's `digestMultibase`, which until then did not reproduce from the grant printed above it.

**Delivery.** On admission the VTC now pushes the VMC and the role VAC as two separate `credential-exchange/issue/0.1` Trust Tasks, in either order, through its durable push engine (TSP > DIDComm > REST, retried for up to 24 hours), so an applicant that was offline when admitted still receives them; a client that waits only for the answer to its join submit ends the join with no credentials. OpenVTC #406/#411 let an approved join ask the community to re-send a credential that never came. On the VTI side, #1073 distinguishes half-edges from complete edges and #1213 draws the membership edge on the graph. The VTI docs at Eucalyptus describe the VTC's proofs as `eddsa-jcs-2022` Data Integrity proofs, the suite the spec recommends; the hybrid Ed25519 + ML-DSA multi-proof recorded here in September (VTI #1553/#1557) is not mentioned in the current credential documentation, so treat its status as unconfirmed.

See also: [[zero-knowledge-proofs]], [[personhood-credential]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[credential-categories]], [[correlation-scope]], [[authority-credential]], [[data-rooms]]
