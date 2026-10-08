---
title: "Endorsement Credential (VEC) — the endorses/1 statement"
type: concept
tags: [credentials, dtg, endorsement, skills, statement, predicate]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Endorsement Credential (VEC) — the `endorses/1` statement

A Verifiable Endorsement Credential lets one participant vouch for another's skills, competencies, or attributes. Unlike a [[relationship-credential|Relationship Credential]] (which says "I know this person"), an endorsement says "I can attest to this person's ability in X." It attaches a claim to a party already in the [[decentralized-trust-graph|graph]] and creates no structure. Since Working Draft 0.4.0 of the [[dtg-credential-spec|spec]] (2026-09-15), and in every Eucalyptus implementation, **the VEC is not a credential type**: it is a [[statement-credential|Statement Credential]] under the **`dtg:endorses` predicate profile**, `https://registry.trustoverip.org/dtg/vsc/endorses/1`. The name VEC survives for the profile; the type string `EndorsementCredential` does not.

## What an `endorses/1` statement contains

- `type` — `["VerifiableCredential", "DTGCredential", "StatementCredential"]`, under the v1 context
- `issuer` / `issuerScope` — the endorser and its declared [[correlation-scope]]; the profile sets no minimum
- `credentialSubject.id` — the endorsed party
- `credentialSubject.predicate` — `https://registry.trustoverip.org/dtg/vsc/endorses/1`
- `credentialSubject.object.value` — the endorsement payload, a community- or VTN-defined structure; the spec's example is `{ "type": "SkillEndorsement", "name": "Software Development", "competencyLevel": "expert" }` (WD02 carried the same payload at `credentialSubject.endorsement`)
- `taskContext` — OPTIONAL

The profile's normative definition is its registry entry; the spec (since #71) no longer restates it. It classifies an endorsement as **evidence**, and states what verification establishes — that the issuer endorsed the subject with that payload — and does not: that the endorsement is accurate, that the issuer is qualified to give it, or that the subject holds any membership, authority or status. The word *verifiable* applies to the cryptographic assurance of the issuer's signature, **not to the truth of the assertion**, which must be weighed independently. The vocabulary of what may be endorsed, and what weight it carries, is defined by the governing [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]] — and a verifier accepts `endorses/1` at all only because it has been configured to.

## What a VEC Is Not: a Permission

WD02 added the [[authority-credential|Verifiable Authority Credential]] precisely because implementations had been packing "may write" and "is a vetter" into endorsements. The spec draws the line: an endorsement is a statement *about* a party — skilled, trusted, of good standing — that a verifier decides for itself what to do with; a VAC is a statement *to* a verifier, where the party governing the scope has already decided. "Conflating the two puts a decision that belongs to the governing party into a claim that reads as reputation, and leaves verifiers to infer permission from adjectives." A VEC can be *evidence* a governing party weighs before issuing a VAC; it never confers authority. The type-level bound of every VSC says the same thing from the other side: a VSC attests and never establishes, whatever its predicate says.

## Use in the Trust Graph

Endorsements add qualitative depth. A VRC tells you two people are connected; an endorsement tells you *what* one trusts the other to do. For the Know Your Developer use case, endorsements are how technical competence gets verified — not by a certification authority, but by peers who've worked with you. The spec's ZK wish-list includes "holder holds a statement from an issuer in set S, under predicate P, about the holder", so an endorsement can eventually be shown without naming the endorser.

## In OpenVTC and the VTI: what moved out of the VEC

The September 2026 wiki recorded that [[openvtc|OpenVTC]] and the [[verifiable-trust-infrastructure|VTI]] used the VEC for **community roles** — a member's VMC was issued together with a role VEC, and the Dogwood-era [[peer-identity-vetting]] design named vetters by a revocable `CommunityRole` VEC. **That is no longer true.** VTI #1859 (2026-09-30) and OpenVTC #397 (2026-10-01) moved every role to a [[authority-credential|role VAC]] (`actions: ["role:<role>"]`, `role:vetter` for vetters), and the vetter's Vetting Statement — formerly an `EndorsementCredential` with `endorsement.type: "IdentityVerification"` — to a `vetted/1` statement with its own predicate, because a record of an identity check is not an endorsement. What remains under `endorses/1` is what the word means: the VTC's **custom endorsements**, issued through `vtc/endorsements/issue/0.1` by a member holding the Issuer role (or an admin) under a predicate the community has registered — the community's registered "endorsement types" are now its predicate accept list, each `typeUri` an absolute predicate IRI with an optional `claimSchema` the claim is validated against — with the community as issuer, `issuerScope: public`, the claim at `object.value`, and a revocation slot on the community's bitstring status list. A custom Rego policy that still reads `credentialSubject.endorsement` or matches `"CommunityRole"` silently denies; the VTI ships a migration note.

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[authority-credential]], [[statement-credential]], [[witness-credential]], [[decentralized-trust-graph]], [[peer-identity-vetting]]
