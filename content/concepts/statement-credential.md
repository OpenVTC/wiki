---
title: "Statement Credential (VSC)"
type: concept
tags: [credentials, dtg, statement, predicate, annotation, spec, draft]
date-updated: 2026-09-18
sources: [dtg-credential-spec]
---

# Statement Credential (VSC)

> **Status: on the spec's `main` branch only.** The VSC landed in `dtgwg-cred-spec` on 2026-09-15 (commit `5a660ea`, refs issues #45, #48, #52), *after* the `WD02` tag of 2026-09-07, and is heading for Working Draft 0.4.0. It is **not in WD02**, and the [[dtg-credentials]] crate — which tracks WD02 — does not implement it: the crate still has concrete `EndorsementCredential` and `WitnessCredential` types. Read this page as where the spec is going, not where implementations are.

The Verifiable Statement Credential is one W3C type carrying **a signed statement by one DTG node about another**: a subject, a predicate from a governed vocabulary, and an object. "I inspected this party's passport", "this party attended this event", "I witnessed this party issue this credential", "I endorse this party's skill" — each is a statement a verifier reads and either believes or does not. Rather than mint a type per predicate, the spec defines one type and lets a **predicate profile** fix each predicate's constraints.

## Why one type instead of many

Every DTG credential is either a **statement** or an **establishment**, and the difference is in what a verifier has to *do*. If verifying means checking the signature, checking status and reading the claim, it is a statement. If the verifier must do more — complete an edge from two halves, match a consent digest, resolve a chain, contain a scope, hand it to a policy enforcement point — the credential establishes something and keeps a concrete subtype: the [[relationship-credential|VRC]], [[membership-credential|VMC]], [[delegation-credential|VDC]], [[authority-credential|VAC]] and [[invitation-credential|VIC]]. The [[persona-credential|VPC]] is statement-shaped but stays concrete because its issuer *is* the persona identifier, which carries [[correlation-scope]] semantics.

So the WD02 `EndorsementCredential` and `WitnessCredential` subtypes become the first two profiles, **`dtg:endorses`** (the [[endorsement-credential|VEC]]) and **`dtg:witnessed`** (the [[witness-credential|VWC]]). The names VEC and VWC survive for the profiles; the type strings are **removed**, so a VSC carries exactly one channel of meaning — its `predicate` — and a type string and a predicate can never disagree. The type count goes from eight to seven.

A statement is **evidence**. Governance turns evidence into establishment: a VTC may weigh an observation statement when admitting a member, an `isHuman` statement when deciding whether a membership is a [[personhood-credential|PHC]], a role statement when deciding to issue a VAC. The statement never establishes the membership, personhood or authority itself.

## Shape

- `type` includes `StatementCredential` and no other concrete subtype
- `issuer` — the party making the statement; a profile MAY set a minimum correlation scope
- `taskContext` — OPTIONAL unless the profile requires it ([[trust-task-context-binding]])
- `credentialSubject.id` — the node the statement is about
- `credentialSubject.predicate` — an **absolute IRI**; no CURIEs or JSON-LD terms on the wire
- `credentialSubject.object` — exactly one of `id` (a DID or IRI), `digestMultibase` (another credential), or `value` (a payload whose schema the profile states)
- further members as the profile defines; verifiers MUST ignore members a profile does not define

A VSC is **unilateral** — its issuer alone signs it. A predicate that is only true when the counterparty agrees (a relationship, a membership, an appointment) is an edge and belongs with an acknowledgement half, not in a profile.

## Fail closed on predicates

A verifier MUST reject a VSC whose `predicate` is not an absolute IRI (a compact form is *malformed*, not unknown), and MUST reject one whose IRI is not in a vocabulary the verifier has been **configured** to accept — configuration informed by the governance frameworks and trust registries it relies on, never derived from the credential. It MUST NOT process an unrecognised predicate as a generic statement, infer meaning from its spelling, or accept it on the strength of an `owl:sameAs` published by anyone. Comparison is byte-exact on NFC-normalised IRIs; predicates resolve to their definitions at *configuration* time, never at verification. Vocabularies are additive — terms are deprecated, never changed or removed — and the namespace carries no version segment.

The rationale is explicit: a well-formed statement under an unrecognised predicate "is the intended shape of an attack that names authority, membership, or personhood in a string." Hence the type-level bound: **a VSC attests; it never establishes.** Whatever its predicate says, a verifier MUST NOT treat a VSC as conferring representation, authority, membership, admission or a governed status, nor as proof that a trust task completed. "A predicate named `mayActFor` is a string." Every profile must state what a pass means and what it explicitly does not.

## The two core profiles

- **`dtg:endorses` (VEC)** — evidence; `object.value` structured by the community's endorsement vocabulary; `taskContext` OPTIONAL. A pass establishes that the issuer endorsed the subject with that payload — not that it is accurate, that the issuer is qualified, or that the subject holds any status.
- **`dtg:witnessed` (VWC)** — evidence weighed by the community whose witnessing policy applies; `object.digestMultibase` names the witnessed edge credential; **`taskContext` REQUIRED**; issuer `directed` at minimum; optional `witnessContext`. Direction binding is now **unconditional**: `credentialSubject.id` MUST be the *issuer* of the credential the object names. A pass establishes that the witness observed the subject issue those claims in that exchange — not that the credential is still valid, that its claims are true, or that the exchange completed.

`dtg:` abbreviates `https://firstperson.network/credentials/dtg/v1#` in the document; on the wire the predicate is the absolute IRI. The namespace is a placeholder (issue #48); the final form will be unversioned.

## Community predicates and the registry

A VTC or VTN defines its own predicate by publishing, under a namespace it controls, the nine things a profile must state — IRI and labelled meaning; evidence vs assertion of status; permitted object kinds; subject–object relationships; extra members; whether `taskContext` is required; minimum issuer scope; who may issue; what a pass establishes and does not. A verifier not configured for that namespace rejects the credential however good its signature — the intended behaviour, since which vocabularies count is decided by the governance a verifier relies on, not by an issuer. Predicates beyond the core profiles will live in a planned **DTG Predicate Vocabulary**, a repo-driven registry on the model of the ToIP glossary (issue #52) that curates a default set without gating who may make a statement.

## What it means for older wiki pages

Where [[endorsement-credential]], [[witness-credential]] and [[witnessed-vrc-exchange]] describe `EndorsementCredential` / `WitnessCredential` types with `credentialSubject.endorsement` or `credentialSubject.digestMultibase`, that is the WD02 shape implementations use today. On `main` the same content moves under `object.value` and `object.digestMultibase`, beneath a `predicate`. The [[openvtc|OpenVTC]] `CommunityRole` VEC used in [[peer-identity-vetting]] would become a `dtg:endorses` or community-defined statement.

See also: [[endorsement-credential]], [[witness-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[dtg-credential-spec]]
