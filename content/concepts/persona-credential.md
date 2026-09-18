---
title: "Persona Credential (VPC)"
type: concept
tags: [credentials, dtg, persona, privacy, zkp]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, verifiable-trust-infrastructure]
---

# Persona Credential (VPC)

A Verifiable Persona Credential links a **persona** to an existing relationship. It lets you selectively reveal a persona identity — potentially a pseudonymous one — to a specific counterparty, so that they can prove they know you *in the context of that persona*.

## How It Works

The VPC is an [[credential-categories|Annotation Credential]] — it doesn't create new graph structure but attaches persona information to an existing relationship. The issuer is the persona's own identifier; the subject is the counterparty's identifier as used in the relationship.

This means: "I am revealing to you that this persona belongs to the same person you already have a relationship with."

Since Working Draft 02 of the [[dtg-credential-spec|spec]] a persona is no longer "a P-DID" ([[did-types]] is retired). A persona is simply an identifier its holder has declared with a **`directed`** [[correlation-scope]] — "a private persona", known to the set of counterparties the holder chooses and no one else — or `public` for a public persona. The spec puts it well: *a persona is what a `directed` declaration is for.* Membership in a community does not require one; a member who declares `pairwise` toward the community has no persona there, while a member who wants to be recognised as the same person by other members, or across communities, is asserting a persona and declares the identifier `directed` accordingly. Asserting a persona is how a person controls intentional correlation *deliberately*, rather than acquiring it as a side effect of reusing an identifier.

## The "Banksy Maneuver"

The spec highlights a use case called the "Banksy Maneuver" — proving that you control a pseudonymous identity to a specific person, without revealing it to anyone else. A developer known by their real name could prove to a trusted contact that they also control a well-known pseudonymous open-source identity, without publicly linking the two.

This works because the identifiers are separate by design: the persona identifier is distinct from the `pairwise` identifiers used in each relationship, so linking them is a deliberate, selective act.

## Relationship to Pairwise ZKPs

The Banksy Maneuver is one application of the **pairwise ZKP** the spec defines on the [[relationship-credential|VRC]]: a VRC holder selectively discloses chosen attributes — most usefully, the parties' `directed` persona identifiers — while hiding the underlying `pairwise` ones that constitute the private channel. The VPC is what makes the disclosed persona *meaningful* to a counterparty as a persona link, layered on top of the cryptographic primitive. See [[zero-knowledge-proofs]].

Two WD02 privacy points bear on personas. Intentional correlation should occur *only* through a deliberate VPC or a deliberate `directed`/`public` declaration, never as a side effect of credential structure. And a persona's exposure is set by where it is used: the effective disclosure of any edge is the wider of its two halves, so a persona published under a `public` identifier by one party is correlated to that party even if the counterparty kept their own half `pairwise`.

## On `main`

The spec's `main` branch (heading for Working Draft 0.4.0) keeps the VPC as a concrete type even though it is statement-shaped — because its issuer *is* the persona identifier and so carries correlation-scope semantics that a generic [[statement-credential|VSC]] predicate could not.

## Implementation Status

VPC issuance shipped in the [[verifiable-trust-infrastructure|VTI]] (#1074). In [[openvtc|OpenVTC]] the persona identifier is the one a member joins communities with, derived at `m/1'/0'/` ([[bip32-key-derivation]]); relationships get their own `pairwise` identifiers by default (openvtc #254/#255).

See also: [[zero-knowledge-proofs]], [[correlation-scope]], [[did-types]], [[credential-categories]], [[dtg-credentials-overview]]
