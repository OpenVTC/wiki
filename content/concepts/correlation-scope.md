---
title: "Correlation Scope — pairwise, directed, public"
type: concept
tags: [identity, privacy, did, correlation, dtg, spec]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc]
---

# Correlation Scope — pairwise, directed, public

Working Draft 02 of the [[dtg-credential-spec|DTG Core Credentials spec]] (PR #30, 2026-09-05) retired the four-way DID taxonomy — R-DID, M-DID, C-DID, P-DID — and replaced it with a single question the *holder* answers about each identifier: **how widely do I intend this identifier to be correlated?** The answer is a **correlation scope**, one of three ordered values.

## Why the DID types had to go

Each old type packed two independent facts into one name: *what the identifier is attached to* (a relationship, a membership, a community, a persona) and *how widely it may be correlated*. The two disagreed as soon as an identifier did two jobs — and the spec explicitly allowed an M-DID inside a VRC, at which point the same identifier answered to two names at once.

The first fact was always redundant. An identifier is not "a membership identifier"; it is an identifier that *has* a [[membership-credential|VMC]]. It is not "a persona identifier"; it is one that *has* a [[persona-credential|VPC]]. Only the correlation width was unrepresented — and it is the one thing a person has to decide and a verifier has to respect. So the spec kept that axis and dropped the rest: **roles are conferred by credentials; scope is declared by the holder.** The four glossary entries were deleted outright. See [[did-types]] for the history.

## The three values

| Scope | Known to | What the holder intends |
|---|---|---|
| **`pairwise`** | exactly one counterparty | correlation confined to this one relationship |
| **`directed`** | a set of counterparties the holder chooses | deliberate correlation across that set and no further |
| **`public`** | anyone | correlation unbounded; ordinarily published so it can be found |

The values are ordered narrowest-first. Where the spec states a minimum scope for a purpose, a narrower declaration does not satisfy it: a [[witness-credential|VWC]] witness is `directed` at minimum, and a [[verifiable-trust-community|VTC]]'s own identifier can only truthfully be `public` — "a community that cannot be found cannot be joined." Elsewhere the holder may declare any of the three, and a verifier MUST NOT infer scope from an identifier's value, its DID method, or where it was encountered.

Three values, not four. A "community-bounded" value was proposed and rejected: its bound would come from a credential rather than from the holder — the very conflation being removed — and no verifier could tell it apart from `directed`. An identifier used only with the community is `pairwise`; one also used with fellow members is `directed`. The join-time choice is three-way: *a one-time pseudonym, a private persona, or a public persona.*

`pairwise` is not "disposable". An identifier used only toward a VTC must stay verifiable for the life of the membership, so it needs key history and rotation while avoiding a shared resolution origin. Durability and scope are independent axes — which is why the spec expects deployments to mix DID methods ([[decentralized-identifiers]], [[did-webvh]]).

## What a declaration cannot do alone

A declared scope binds only its holder's disclosure, not what a counterparty does with the identifier — and for a community that gap needs governance. A VTC that publishes a member directory, or hands a member-issued VMC to a third party, widens an identifier the member declared `pairwise` without the member choosing it. So WD02 adds a duty: **a VTC issuing VMCs MUST publish, in its governance framework or trust registry, whether member identifiers are disclosed beyond the VTA and to whom**; a verifier MUST NOT infer from a `pairwise` declaration that the community honours it; and a VTA SHOULD show the community's answer to a prospect *before* they choose a scope ([[trust-registries]]).

The same logic gives the **effective disclosure of an edge** (PR #27): each half of a [[decentralized-trust-graph|DTG edge]] is issued under an identifier its own party chose, so an edge's disclosure is the *wider* of its two halves. A correctly pairwise half is still correlated to a named party if the counterparty published the opposing half under a `directed` or `public` identifier. Compute an edge's privacy over both halves; never present a pairwise half as making the edge pairwise.

## Consequences for proofs

Under strict `pairwise`, the identifier a member uses toward their VTC and the one they use toward a fellow member differ *by construction*. A community-anchored [[zero-knowledge-proofs|ZKP]] can no longer read one identifier out of both the VMC and the VRC; it must prove **common control** of two distinct identifiers — a primitive no DTG spec yet defines (spec issue #9, with the ZKP task force). Members expecting to prove community-anchored relationships will in practice declare `directed` for intra-community use. Where a holder deliberately reuses one `directed` or `public` identifier, the correlation is on the face of the credentials and needs no proof.

## What is not yet decided

**The property that carries the declaration has not been named.** The spec settled *where* it goes — in the credential, declared by each issuer for its own identifier, since `did:key` and `did:peer` documents are derived from the identifier and have nowhere to hold a property — but the property and its `@context` term are open. Until then the rules bind a declaration that has been made and require none: no credential is non-conforming for lacking one, and in a bidirectional edge the subject's scope is undeclared until the reciprocal half exists. The [[dtg-credentials]] crate implements nothing for scope beyond dropping the retired names from its docs.

## In practice

[[openvtc|OpenVTC]] already behaves as the model expects: since Dogwood (openvtc #254/#255, on VTI #1061) a pairwise relationship identifier is the default and the [[relationship-credential|VRC]] is issued under it — a `pairwise`-scope identifier per relationship in WD02 terms — while the persona identifier a member joins with is what WD02 would call `directed` or `public`. What is missing everywhere is the declaration itself.

See also: [[did-types]], [[persona-credential]], [[relationship-credential]], [[membership-credential]], [[zero-knowledge-proofs]], [[decentralized-identifiers]]
