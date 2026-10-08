---
title: "DTG Credential Categories — now just Edge Credentials"
type: concept
tags: [credentials, dtg, taxonomy, categories, edge, history]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials]
---

# DTG Credential Categories — now just Edge Credentials

For most of 2026 the [[dtg-credential-spec|DTG Credentials Core Specification]] grouped its credential types into descriptive, non-normative **functional categories** — Edge, Invitation, Annotation — as the quickest way to say what each credential does to the [[decentralized-trust-graph|trust graph]]. **Working Draft 0.5.0 (PR #55, 2026-09-22) dropped the categories.** One grouping survives, and it is a *class with normative consequences* rather than a taxonomy: the **Edge Credentials**. This page records the test that decided it, what the class requires, and the history for readers of older pages and code comments.

## The test that removed the categories

With the [[statement-credential|VSC]] on `main`, the Annotation category was down to two members under a heading that no longer described them, and the question of two categories against two standalone types was forced. The test the editors applied: *a grouping earns a heading only if the specification says something about the group that it does not say about each member.* "Edge credential" passes — Edge Verifiability, the VSC profile-versus-type test, the `dtg:witnessed` profile and the VRC, VMC and VDC glossary entries all depend on the class. "Annotation credential" fails — its preamble was one sentence, its glossary entry no longer described the VSC, and its only other use was the VAC preamble explaining why the VAC was not in it. So the Annotation heading and its editor's note went, the VPC and VSC were promoted to top-level sections, the VAC lost the paragraph justifying its standalone placement, the glossary entry *DTG annotation credential* was deleted, and the taxonomy's mermaid diagram — which duplicated the type hierarchy once the category nodes were gone — was removed. No schema, type string or `@context` changed.

The spec's own words now, in the Introduction: "The first three are DTG edge credentials: each is one half of a bi-directional pair, and the pair forms a DTG edge. The other four are each complete on the issuer's signature alone. **That is the only grouping this specification makes, and it is a property of the credentials rather than a taxonomy:** it does not appear in credential schemas, and the formal type hierarchy has only one abstract parent, `DTGCredential`." And in the Edge Credentials section: "What makes a credential an edge credential is that it is one half of such a pair: the relationship it attests to is only established when the counterparty issues the other half. Every other credential in this specification is complete on its issuer's signature alone. The requirements of this section apply to the class — a pair is required, and Edge Verifiability determines when a verifier treats a pair as an edge of a particular graph — and a statement that would need the counterparty's agreement to be true is an edge credential, not a VSC predicate profile."

## Edge Credentials — the class

Establish relationships between existing nodes. Every edge credential is **bidirectional**: a complete edge needs a pair, one from each side, and the second half is the counterparty's consent.

- **[[membership-credential|VMC (Membership)]]** — a community-issued *grant* plus a member-issued *acknowledgement* carrying a digest of the grant
- **[[relationship-credential|VRC (Relationship)]]** — one VRC from each peer
- **[[delegation-credential|VDC (Delegation)]]** — a delegator's *grant* plus the delegate's required *acceptance*; establishes that one party may act in another's name

Three things follow from membership of the class: a pair is required; *Edge Verifiability* decides when a verifier treats a pair as an edge of a particular graph (relative to the anchor set that verifier accepts — see [[verifiable-trust-network]]); and a predicate that would only be true with the counterparty's agreement cannot be a [[statement-credential|VSC]] profile. The class also fixes scope declarations for an edge: each half carries its own issuer's [[correlation-scope|`issuerScope`]], so a complete edge declares both parties' scopes and an incomplete one declares only the issuer's.

## The other four — complete on the issuer's signature

- **[[persona-credential|VPC (Persona)]]** — links a persona to an existing relationship; statement-shaped, but kept concrete because its issuer *is* the persona identifier
- **[[statement-credential|VSC (Statement)]]** — a signed statement about a node under a governed predicate; the [[endorsement-credential|VEC]] (`endorses/1`) and [[witness-credential|VWC]] (`witnessed/1`) are its first two predicate profiles, with `vetted/1` and `presented/1` alongside them in the registry
- **[[invitation-credential|VIC (Invitation)]]** — bootstraps a node *into* a community; promoted out of its one-member "Invitation" category on 2026-09-10 (issue #28), before the categories went altogether
- **[[authority-credential|VAC (Authority)]]** — confers permission to act within a named scope and may be attenuated; different in kind, since it *confers* rather than *attests*

## Statements versus establishments

The sharper test the VSC introduced is the one the spec now relies on where the categories used to be. A credential is a **statement** if verifying it means checking the signature, checking status and reading the claim; it is an **establishment** if the verifier must do more — complete an edge from two halves, match a consent digest, resolve a chain, contain a scope, or hand the credential to a policy enforcement point. Statements share one type (the VSC) and differ only in predicate; establishments (VRC, VMC, VDC, VAC, VIC) each keep a concrete subtype. A contributor proposing a new predicate uses this test to know whether it is a profile or a type.

## The formal type hierarchy (WD 0.6.0)

```
VerifiableCredential
└── DTGCredential
    ├── MembershipCredential (VMC)
    ├── RelationshipCredential (VRC)
    ├── DelegationCredential (VDC)
    ├── InvitationCredential (VIC)
    ├── PersonaCredential (VPC)
    ├── StatementCredential (VSC)
    │     ├── profile dtg:endorses (VEC)
    │     └── profile dtg:witnessed (VWC)
    └── AuthorityCredential (VAC)
```

Every type carries `issuerScope`, and may carry a `taskContext` binding it to the trust-task exchange that produced it — with `taskDigestMultibase` REQUIRED wherever `taskContext` is ([[trust-task-context-binding]]). Six members reference something by digest, all with one **`digestMultibase`** encoding (JCS over the document minus `proof`, SHA-256, base58btc multihash): the VMC acknowledgement, a VSC's `object.digestMultibase`, the VDC's `parent` and `accepts`, the VAC's `parent`, and `taskDigestMultibase`, which digests a Trust Task document rather than a credential.

## History, for readers of older pages

- **v0.3 (to July 2026)** — four categories including **Verifiable Data Structures** holding the RCard / relationship card. WD01 removed it: an r-card is a VDS, not a DTG credential, bound for the planned *DTG Verifiable Data Structures* companion alongside an agent card. [[dtg-credentials]] removed its deprecated RCard types in 0.12.0.
- **Working Draft 02 (2026-09-07)** — eight types; three categories (Edge: VMC, VRC, VDC; Invitation: VIC; Annotation: VPC, VEC, VWC) plus the VAC outside them.
- **`main` → WD 0.4.0 (2026-09-15)** — seven types; `EndorsementCredential` and `WitnessCredential` become VSC profiles; VIC promoted; two categories (Edge, Annotation) with VIC and VAC apart.
- **WD 0.5.0 (2026-09-22)** — categories dropped; Edge Credentials kept as a class. This is the current picture.

## ZKP anchor points

The two Edge Credentials that existed first remain the anchors for the [[zero-knowledge-proofs|ZKP constructions]] the spec defines: the **VRC** anchors the **pairwise ZKP** (any two VRC holders; discloses `directed` persona identifiers while hiding `pairwise` ones), the **VMC** anchors the **community-anchored ZKP** (both parties hold VMCs from the same community, whose assurances — including personhood — carry into the proof). The spec also lists chain-validity predicates for VDC and VAC chains, a shared-subject predicate for membership-plus-authority, and a single predicate shape for all VSC profiles, and recommends ZKP presentation by default.

See also: [[zero-knowledge-proofs]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], [[authority-credential]], [[delegation-credential]], [[statement-credential]]
