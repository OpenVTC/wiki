---
title: "DID Types in the DTG (retired)"
type: concept
tags: [did, taxonomy, identity, dtg, history]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc]
---

# DID Types in the DTG (retired)

> **The four-way DID taxonomy — C-DID, M-DID, R-DID, P-DID — was retired in Working Draft 02 of the [[dtg-credential-spec|DTG Core Credentials spec]] (PR #30, 2026-09-05).** Its replacement is [[correlation-scope]]: a holder-declared `pairwise` | `directed` | `public` width, with the identifier's *role* read from the credentials it appears in. This page is kept so that older wiki pages, code comments and discussions that still say "M-DID" or "R-DID" can be understood; new writing should use the scope vocabulary.

## Why it was retired

Each type named two independent things in one token: *what the identifier is attached to* (a relationship, a membership, a community, a persona) and *how widely it may be correlated*. The two disagreed whenever an identifier did two jobs — and WD01 explicitly permitted an M-DID inside a VRC, at which point the same identifier was "an M-DID" and "an R-DID" at once. The first fact was redundant (a VMC already says its subject is a member; a VRC already says its issuer is a party to a relationship); only the second needed a home. WD02 kept that one axis as a declaration by the holder, deleted the four glossary entries outright, and lists the old names under *Avoid* in its contributor guide. See [[correlation-scope]] for the model that replaced them.

## What each old name meant, and what it maps to now

| Old type | Meant | Typical method | In WD02 terms |
|---|---|---|---|
| **C-DID** — Community DID | The identifier of a [[verifiable-trust-community\|VTC]] or [[verifiable-trust-network\|VTN]] | [[did-webvh\|did:webvh]] | "the VTC's own identifier", which can only truthfully be declared **`public`** — a community that cannot be found cannot be joined |
| **M-DID** — Member DID | The identifier a member used with a community (and, if they chose, across communities and in VRCs) | did:webvh / did:key | an identifier that *has a VMC*; **`pairwise`** if used only with the community, **`directed`** if also used with fellow members or across communities |
| **R-DID** — Relationship DID | A per-relationship identifier, never reused | did:peer | an identifier declared **`pairwise`**; reuse with a second counterparty now *falsifies the declaration* rather than merely breaking a rule |
| **P-DID** — Persona DID | A persona identity asserted via a VPC | did:webvh | an identifier under which a [[persona-credential\|persona]] is asserted, ordinarily declared **`directed`** ("a private persona") or `public` ("a public persona") |
| **W-DID** — Witness DID | *(dropped earlier, in WD01)* | — | a witness issues from its own identifier — a member's, or a VTA's under VTC policy — which is `directed` at minimum |

The privacy design the old separation encoded survives intact, just stated differently: the spec still RECOMMENDS a `pairwise` identifier per relationship, still expects a persona to be a deliberate, selective act of correlation, and still treats a community's identifier as the one thing that must be findable. What changed is that these are now the holder's *declarations*, and a verifier MUST NOT infer scope from an identifier's value, DID method, or where it was encountered.

## How credentials name their parties now (WD02)

| Credential | Issuer | Subject |
|---|---|---|
| [[membership-credential\|VMC]] (grant) | the VTC/VTN's own identifier (`public`) | the member's chosen identifier, at whatever scope the member declared |
| VMC (acknowledgement) | the member, from the same identifier the grant named | the VTC/VTN |
| [[relationship-credential\|VRC]] | source party (`pairwise` RECOMMENDED; `directed` permitted) | target party as used in this relationship |
| [[delegation-credential\|VDC]] | delegator (ideally a `directed` identifier scoped to the context) | delegate |
| [[invitation-credential\|VIC]] | the VTC/VTN or an authorised member | the identifier the prospect proposes to use |
| [[persona-credential\|VPC]] | the persona's identifier (`directed`) | the counterparty as used in the relationship |
| [[endorsement-credential\|VEC]] | endorser | endorsed party |
| [[witness-credential\|VWC]] | witness (`directed` at minimum) | the *issuer* of the witnessed edge credential |
| [[authority-credential\|VAC]] | the party governing the scope, or an attenuating holder | the party receiving authority |

## In the OpenVTC implementation

[[openvtc|OpenVTC]] and the [[verifiable-trust-agent|VTA]] were built against the old vocabulary and their key layout still reflects it — which is fine, because the derivation paths express *purpose*, not scope:

| Path | Old name | Now |
|---|---|---|
| `m/1'/0'/` | Persona keys (P-DID) | the persona identifier a member joins communities with |
| `m/2'/1'/` | WebVH management keys | did:webvh update keys |
| `m/3'/1'/1'/N` | Relationship keys (one R-DID per relationship) | one `pairwise`-scope identifier per relationship (the default since Dogwood, openvtc #254/#255 on VTI #1061) |

See [[bip32-key-derivation]]. The [[dtg-credentials]] crate dropped the retired names from its documentation in 0.7.0 and implements nothing further for scope, because the spec has not yet named the property that carries a declaration.

See also: [[correlation-scope]], [[decentralized-identifiers]], [[decentralized-trust-graph]], [[bip32-key-derivation]]
