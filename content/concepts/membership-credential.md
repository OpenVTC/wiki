---
title: "Membership Credential (VMC)"
type: concept
tags: [credentials, dtg, membership, community, personhood, edge, zkp, consent]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Membership Credential (VMC)

A Verifiable Membership Credential attests to the **membership of an entity in a community**. It connects a person, device, agent or service to a [[verifiable-trust-community|VTC]] — or one community to a [[verifiable-trust-network|VTN]], or a member to a [[data-rooms|data room]]. VMCs are [[credential-categories|Edge Credentials]].

Since Working Draft 02 of the [[dtg-credential-spec|spec]] the identifiers are no longer typed: the issuer of a grant is simply the VTC's own identifier (which can only truthfully be declared `public`), and the member appears under whatever identifier — at whatever [[correlation-scope]] — the member chose for this membership. The old C-DID / M-DID vocabulary is retired ([[did-types]]).

## Two VMCs = One Membership Edge — and the Second One Is Consent

Membership in the DTG is symmetric: it isn't enough for a community to claim a member. **Membership is verified through a bi-directional pair of VMCs**, and WD02 (spec PR #12, 2026-08-28) finally made both halves constructible after a real contradiction — five places said "two VMCs form an edge" while the schema only allowed the community-issued one:

| | `issuer` | `credentialSubject.id` | `digestMultibase` |
|---|---|---|---|
| **Community-issued VMC — the grant** | the VTC / VTN | the member | MUST be absent |
| **Member-issued VMC — the acknowledgement** | the member, from the same identifier the grant named | the VTC / VTN | REQUIRED: digest of the grant |

The two directions are distinguished by these rules and by the presence of the digest, not by separate type strings (where both ends are communities, as in VTN membership, the digest is the discriminator). The digest is SHA-256 over the grant's JCS form *excluding `proof`*, as a base58btc multihash — so a re-signed grant with identical claims still satisfies an existing acknowledgement, while a re-issued grant with different claims does not, forcing re-acknowledgement.

**Why a pair.** The acknowledgement is the member's **consent artifact**. A community can always issue a credential naming someone as a member, but it cannot produce the acknowledgement without that party's signature. So: the grant MUST be issued first; an acknowledgement whose digest matches no valid grant MUST NOT complete the edge; and whenever anyone *other than the member* asserts that an entity is a member, the verifier MUST require the acknowledgement — a community asserting a membership MUST be able to produce it. Unconsented membership claims become unprovable, and a community that cannot show an acknowledgement is visibly asserting a membership nobody agreed to.

The rule is deliberately direction-sensitive: a member presenting *their own* grant, with proof of control of the subject key, MAY be accepted alone — the presentation is itself the participation. This is what keeps the community-anchored ZKP and the [[personhood-credential|PHC]] constructions working, since both rest on the member holding the grant.

Lifecycle (withdrawal, revocation, re-issuance, and where a verifier learns the status of a *member-issued* VMC, which must be under the member's control) is deferred to the planned Trust Task Protocols spec. Two interim controls follow from the digest binding: a short `validUntil` on the grant forces periodic re-acknowledgement; a short `validUntil` on the acknowledgement bounds how long the community holds a presentable proof of consent — because the acknowledgement is also a **disclosure artifact** the community can show to third parties without the member's involvement.

## What Has Members

A WD02 editor's note fixes a boundary: **a VMC binds a member to a node that has members** — a VTC, a VTN, a service with registered clients, a device with authorised identities. A person is not a collective; "membership in a person" is a [[relationship-credential|VRC]] (peers) or a [[delegation-credential|VDC]] (one acts in the other's name), never a VMC.

## Dual Purpose

1. **Community membership** — belonging to a specific community, enabling community-level policies
2. **Personhood attestation** — when the issuing community's governance enforces real human personhood and one-membership-per-person, the *grant* qualifies as a [[personhood-credential|PHC]]. Whether or not the member has acknowledged it; the acknowledgement gates only the community's ability to assert that membership to others. Determined by the [[trust-registries|trust registry]], not by structure.

## VTN Membership

A VTN issues a grant to a VTC's identifier, and the VTC acknowledges back — the same pair, same rules. Since WD02's *Edge Verifiability* section, a VTN is one example of the anchor set a verifier accepts, not a precondition for an edge to exist.

## Community-Anchored ZKP

The VMC anchors the **community-anchored ZKP**: when both parties to a VRC hold VMCs from the same community, the holder proves possession of the VRC, possession of their own grant, and that the counterparty's grant is from the same community — without revealing identifiers. WD02 is candid that the third statement currently establishes only that the community *attested* the counterparty's membership, not that the counterparty acknowledged it, and that under strict `pairwise` scopes the proof must additionally establish common control of two distinct identifiers. See [[zero-knowledge-proofs]].

## Implementation Status

The pair was harder to ship than to specify. In [[openvtc|OpenVTC]] the member→community half **had never actually landed** before Dogwood: VMCs had no `id`, [[dtg-credentials]] 0.2.0 had no field for one, and the VTC's rejection of the reciprocal came back as an uncorrelated problem-report the client discarded — silent on both sides. It was fixed across openvtc #259–#267 and `dtg-credentials` 0.3.0 (`with_id`), then 0.4.0 (`CredentialSubjectMembership`, `new_member_vmc`, `acknowledges()`) and 0.5.0 (digest the *received* grant JSON, not a re-serialisation). Receiving a grant now auto-issues the reciprocal and closes the join; 0.10.0's `new_member_vmc_for` refuses a grant that does not name the party answering it. On the VTI side, #1073 distinguishes half-edges from complete edges and #1213 (the Dogwood tag commit) draws the membership edge on the graph; the VTC issues hybrid multi-proof VMCs (Ed25519 + ML-DSA) since #1553/#1557.

See also: [[zero-knowledge-proofs]], [[personhood-credential]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[credential-categories]], [[correlation-scope]], [[data-rooms]]
