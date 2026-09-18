---
title: "Endorsement Credential (VEC)"
type: concept
tags: [credentials, dtg, endorsement, skills, roles]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Endorsement Credential (VEC)

A Verifiable Endorsement Credential lets one participant vouch for another's skills, competencies, or attributes. Unlike a [[relationship-credential|Relationship Credential]] (which says "I know this person"), an endorsement says "I can attest to this person's ability in X." It is an [[credential-categories|Annotation Credential]]: it attaches a claim to a party already in the [[decentralized-trust-graph|graph]] and creates no structure.

## What It Contains (Working Draft 02)

- `type` includes `EndorsementCredential`
- `issuer` — the endorser; `credentialSubject.id` — the endorsed party
- `credentialSubject.endorsement` — REQUIRED, a community- or VTN-defined structure; the spec's example is `{ "type": "SkillEndorsement", "name": "Software Development", "competencyLevel": "expert" }`

The [[dtg-credential-spec|spec]] is careful about the word *verifiable*: it applies to the cryptographic assurance of the issuer's signature, **not to the truth of the assertion**, which must be weighed independently. The vocabulary of what may be endorsed, and what weight it carries, is defined by the governing [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]].

## What a VEC Is Not: a Permission

WD02 added the [[authority-credential|Verifiable Authority Credential]] precisely because implementations had been packing "may write" into endorsements. The spec now draws the line: an endorsement is a statement *about* a party — skilled, trusted, of good standing — that a verifier decides for itself what to do with; a VAC is a statement *to* a verifier, where the party governing the scope has already decided. "Conflating the two puts a decision that belongs to the governing party into a claim that reads as reputation, and leaves verifiers to infer permission from adjectives." A VEC can be *evidence* a governing party weighs before issuing a VAC; it never confers authority.

## Where It Is Going — `main` (Working Draft 0.4.0, not yet tagged or implemented)

On the spec's `main` branch (2026-09-15) the VEC stops being a concrete type and becomes the **`dtg:endorses` predicate profile** of the [[statement-credential|Verifiable Statement Credential]]: `type` is `StatementCredential`, `credentialSubject.predicate` is `https://firstperson.network/credentials/dtg/v1#endorses`, and the endorsement payload moves to `credentialSubject.object.value`. The profile classifies an endorsement as **evidence**, keeps `taskContext` OPTIONAL and the issuer's scope unconstrained, and states what verification establishes — that the issuer endorsed the subject with that payload — and does not: that the endorsement is accurate, that the issuer is qualified to give it, or that the subject holds any membership, authority or status. Communities may define their own endorsement-like predicates under namespaces they control.

## Use in the Trust Graph

Endorsements add qualitative depth. A VRC tells you two people are connected; an endorsement tells you *what* one trusts the other to do. For the Know Your Developer use case, endorsements are how technical competence gets verified — not by a certification authority, but by peers who've worked with you.

## In OpenVTC: role endorsements

[[openvtc|OpenVTC]] and the [[verifiable-trust-infrastructure|VTI]] use the VEC for **community roles**: the VTC admin console issues a member's VMC together with a role VEC, and the Dogwood-era **peer identity vetting** design (openvtc #292–#343, design DRAFT v3) names vetters by a **revocable `CommunityRole` VEC**, with a vetter directory and QR tickets built on it — see [[peer-identity-vetting]]. Under `main`'s model this is exactly the kind of statement a community would issue under a `dtg:endorses` or community-defined predicate: it is evidence of a role the community has granted, and the community's own policy — not the credential — decides what a vetter may do.

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[authority-credential]], [[statement-credential]], [[decentralized-trust-graph]], [[peer-identity-vetting]]
