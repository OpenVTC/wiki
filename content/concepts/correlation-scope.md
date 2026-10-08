---
title: "Correlation Scope — pairwise, directed, public"
type: concept
tags: [identity, privacy, did, correlation, dtg, spec]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Correlation Scope — pairwise, directed, public

Working Draft 02 of the [[dtg-credential-spec|DTG Credentials Core Specification]] (PR #30, 2026-09-05) retired the four-way DID taxonomy — R-DID, M-DID, C-DID, P-DID — and replaced it with a single question the *holder* answers about each identifier: **how widely do I intend this identifier to be correlated?** The answer is a **correlation scope**, one of three ordered values. Since Working Draft 0.6.0 (PR #68, 2026-09-28) the answer has a home on the wire: the REQUIRED top-level **`issuerScope`** property of every DTG credential.

## Why the DID types had to go

Each old type packed two independent facts into one name: *what the identifier is attached to* (a relationship, a membership, a community, a persona) and *how widely it may be correlated*. The two disagreed as soon as an identifier did two jobs — and the spec explicitly allowed an M-DID inside a VRC, at which point the same identifier answered to two names at once.

The first fact was always redundant. An identifier is not "a membership identifier"; it is an identifier that *has* a [[membership-credential|VMC]]. It is not "a persona identifier"; it is one that *has* a [[persona-credential|VPC]]. Only the correlation width was unrepresented — and it is the one thing a person has to decide and a verifier has to respect. So the spec kept that axis and dropped the rest: **roles are conferred by credentials; scope is declared by the holder.** The four glossary entries were deleted outright. See [[did-types]] for the history.

## The three values

| Scope | Known to | What the holder intends |
|---|---|---|
| **`pairwise`** | exactly one counterparty | correlation confined to this one relationship |
| **`directed`** | a set of counterparties the holder chooses | deliberate correlation across that set and no further |
| **`public`** | anyone | correlation unbounded; ordinarily published so it can be found |

The values are ordered narrowest-first. Where the spec or a predicate profile states a minimum scope for a purpose, a narrower declaration does not satisfy it: a [[witness-credential|VWC]] witness is `directed` at minimum, as is a `vetted/1` or `presented/1` issuer, and a [[verifiable-trust-community|VTC]]'s own identifier can only truthfully be `public` — "a community that cannot be found cannot be joined." Elsewhere the holder may declare any of the three, and a verifier MUST NOT infer scope from an identifier's value, its DID method, or where it was encountered. A *counterparty* is a party to a relationship the identifier establishes or annotates; disclosure to a party in a supporting role — a witness, an IDVP, the resolution infrastructure — does not by itself widen scope, though it does place the identifier beyond the holder's control.

Three values, not four. A "community-bounded" value was proposed and rejected: its bound would come from a credential rather than from the holder — the very conflation being removed — and no verifier could tell it apart from `directed`. An identifier used only with the community is `pairwise`; one also used with fellow members is `directed`. The join-time choice is three-way: *a one-time pseudonym, a private persona, or a public persona.*

`pairwise` is not "disposable". An identifier used only toward a VTC must stay verifiable for the life of the membership, so it needs key history and rotation while avoiding a shared resolution origin. Durability and scope are independent axes — which is why the spec expects deployments to mix DID methods ([[decentralized-identifiers]], [[did-webvh]]).

## `issuerScope`: how a declaration is carried

Two placements were considered. The DID document is unavailable where it matters most — `did:key` and `did:peer` numalgo-0 documents are derived from the identifier and have nowhere to hold a property, and resolving a document to learn a scope has the observability cost the spec records for the resolution layer. So the declaration goes **in the credential, by the party whose identifier it is**: the top-level `issuerScope`, exactly one of `pairwise`, `directed` or `public`, compared case-sensitively, declaring the scope of the identifier in `issuer`. A verifier MUST reject a credential whose `issuerScope` is absent or is anything else. Two consequences follow:

- **A declaration is a property of the identifier, not of a credential.** All credentials issued under one identifier MUST declare the same scope; a contradiction between two of them falsifies the declaration, on the same footing as reusing a `pairwise` identifier with a second counterparty.
- **A first-party declaration covers only the issuer's own identifier.** A credential MUST NOT restate the scope of its subject or counterparty. Bidirectional edges complete themselves: in a VMC pair the community declares its scope in the grant and the member theirs in the acknowledgement. Until the reciprocal half exists the subject's scope is undeclared, and for VPCs, VICs and VSCs no credential declares the subject's scope at all.

The property arrived with the v1 context pinned (`https://registry.trustoverip.org/dtg/context/v1`), and because adding a REQUIRED property is a breaking change the spec makes credentials issued before its Implementers Draft non-conformant rather than aliasing them. This is the single biggest reason "DTG Credentials v1" was a wire break for every implementation.

## What a declaration cannot do alone

A declared scope binds only its holder's disclosure, not what a counterparty does with the identifier — and for a community that gap needs governance. A VTC that publishes a member directory, or hands a member-issued VMC to a third party, widens an identifier the member declared `pairwise` without the member choosing it. So the spec adds a duty: **a VTC issuing VMCs MUST publish, in its governance framework or trust registry, whether member identifiers are disclosed beyond the VTA and to whom**; a verifier MUST NOT infer from a `pairwise` declaration that the community honors it; and a VTA SHOULD show the community's answer to a prospect *before* they choose a scope ([[trust-registries]]).

The same logic gives the **effective disclosure of an edge** (PR #27): each half of a [[decentralized-trust-graph|DTG edge]] is issued under an identifier its own party chose, so an edge's disclosure is the *wider* of its two halves. A correctly pairwise half is still correlated to a named party if the counterparty published the opposing half under a `directed` or `public` identifier. Compute an edge's privacy over both halves; never present a pairwise half as making the edge pairwise.

## Consequences for proofs

Under strict `pairwise`, the identifier a member uses toward their VTC and the one they use toward a fellow member differ *by construction*. A community-anchored [[zero-knowledge-proofs|ZKP]] can no longer read one identifier out of both the VMC and the VRC; it must prove **common control** of two distinct identifiers — a primitive no DTG spec yet defines (spec issue #9, with the ZKP task force). Members expecting to prove community-anchored relationships will in practice declare `directed` for intra-community use. Where a holder deliberately reuses one `directed` or `public` identifier, the correlation is on the face of the credentials and needs no proof.

## In practice (Eucalyptus)

[[dtg-credentials]] 0.12.0 models `IssuerScope { Pairwise, Directed, Public }` — serialized lowercase, parsed case-sensitively, ordered narrowest-first with `satisfies(minimum)` — as a REQUIRED member of `DTGCommon`; every constructor takes it except where the spec fixes it (`new_vmc` and `new_community_role_vac` always declare `public`, and a grant declaring anything else is refused with `IssuerScopeTooNarrow`). The [[verifiable-trust-infrastructure|VTI]] community service always issues as `public`, the DID every verifier recognizes, and its relationships policy now receives the VRC's `issuer_scope` and refuses a VRC that declares `pairwise` but is issued under the member's membership DID, since that identifier is not pairwise. [[openvtc|OpenVTC]] (#397) spells out the scope of each identifier it controls: `directed` for the persona DID a membership names (so the member's VMC acknowledgement and VPCs declare `directed`), `pairwise` for a per-relationship DID and `directed` where a VRC is issued from the persona DID instead. A delegation grant can seldom truthfully be `pairwise` — every verifier the delegate acts toward sees the delegator — so `directed` is the ordinary declaration on a [[delegation-credential|VDC]]; a room's attenuated [[authority-credential|VAC]] leaf is `directed` too, issued under the one identifier the room admitted.

See also: [[did-types]], [[persona-credential]], [[relationship-credential]], [[membership-credential]], [[zero-knowledge-proofs]], [[decentralized-identifiers]], [[dtg-credentials-overview]]
