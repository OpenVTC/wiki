---
title: "DTG Credential Categories"
type: concept
tags: [credentials, dtg, taxonomy, categories]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials]
---

# DTG Credential Categories

The [[dtg-credential-spec|DTG Core Credentials specification]] groups its credential types into **descriptive** (non-normative) functional categories. These never appear in credential schemas — the formal type hierarchy has exactly one abstract parent, `DTGCredential` — but they are the quickest way to understand what each credential does to the [[decentralized-trust-graph|trust graph]]: does it *form an edge*, *annotate one*, or neither?

The categorisation moved twice in 2026, so this page states both the tagged and the in-progress views:

- **Working Draft 02** (tagged 2026-09-07; what [[dtg-credentials]] 0.7+ implements): **eight types**, three categories, one outsider.
- **`main`, heading for Working Draft 0.4.0** (as of 2026-09-15): **seven types**, two categories, two outsiders.

## Edge Credentials — form graph structure

Establish relationships between existing entities (nodes). Every edge credential is **bidirectional**: a complete edge needs a pair, one from each side, and the second half is the counterparty's consent.

- **[[membership-credential|VMC (Membership)]]** — a community-issued *grant* plus a member-issued *acknowledgement* carrying a digest of the grant
- **[[relationship-credential|VRC (Relationship)]]** — one VRC from each peer
- **[[delegation-credential|VDC (Delegation)]]** *(new in WD02)* — a delegator's *grant* plus the delegate's required *acceptance*; establishes that one party may act in another's name

## Annotation Credentials — attach data to existing structure

Create no graph structure; annotate edges or parties that already exist.

- **[[persona-credential|VPC (Persona)]]** — links a persona identity to an existing relationship
- **[[endorsement-credential|VEC (Endorsement)]]** and **[[witness-credential|VWC (Witness)]]** — in WD02, two concrete types (`EndorsementCredential`, `WitnessCredential`). On `main` both become **predicate profiles** of a single **[[statement-credential|VSC (Statement)]]** type, `dtg:endorses` and `dtg:witnessed`; the type strings are removed and the VSC is the general "signed statement by one node about another"

## Outside the categories

- **[[invitation-credential|VIC (Invitation)]]** — in WD02 it was the sole member of an "Invitation Credentials" category. On `main` (2026-09-10, closing spec issue #28) it was promoted to a top-level section: a category with one member is the structural problem #28 exists to remove. The VIC bootstraps a node *into* a community; it neither forms an edge nor annotates one.
- **[[authority-credential|VAC (Authority)]]** *(new in WD02)* — confers permission to act within a named scope and may be attenuated by its holder. Placed outside every category from the start, for the same one-member reason, and because it is different in kind: it *confers* rather than *attests*.

So `main`'s picture is **two categories — Edge (VMC, VRC, VDC) and Annotation (VPC, VSC) — with the VIC and VAC standing apart**, the VSC carrying the VEC and VWC as profiles.

## Statements versus establishments

`main` also introduces a sharper test than the categories, and the VSC is its consequence. A credential is a **statement** if verifying it means checking the signature, checking status and reading the claim; it is an **establishment** if the verifier must do more — complete an edge from two halves, match a consent digest, resolve a chain, contain a scope, or hand the credential to a policy enforcement point. Statements share one type (the VSC) and differ only in predicate; establishments (VRC, VMC, VDC, VAC, VIC) each keep a concrete subtype. The VPC is statement-shaped but keeps its own type because its issuer *is* the persona identifier.

## What happened to the fourth category?

Until July 2026 the spec (v0.3) listed **Verifiable Data Structures (VDS)** containing the **RCard / relationship card** — vCard/jCard contact data (RFC 7095) in a verifiable wrapper, typed `["VerifiableCredential", "RelationshipCard"]` *without* the `DTGCredential` parent. Working Draft 01 removed it: an r-card is a VDS ("a data structure digitally signed by the publisher so that subscribers can verify the original and any updates — a VC is one kind of VDS, an r-card is another"), not a DTG credential, and will be defined in the planned **DTG Verifiable Data Structures** companion alongside an *agent card* modelled on A2A's AgentCard. The [[dtg-credentials]] crate keeps deprecated RCard types.

## The Formal Type Hierarchy

**WD02** (what implementations use today):

```
VerifiableCredential
└── DTGCredential
    ├── MembershipCredential (VMC)
    ├── RelationshipCredential (VRC)
    ├── DelegationCredential (VDC)
    ├── InvitationCredential (VIC)
    ├── PersonaCredential (VPC)
    ├── EndorsementCredential (VEC)
    ├── WitnessCredential (VWC)
    └── AuthorityCredential (VAC)
```

**`main` / WD 0.4.0**: the same, with `EndorsementCredential` and `WitnessCredential` replaced by a single `StatementCredential (VSC)` whose `predicate` selects the profile.

Every type may carry a `taskContext` binding it to the trust-task exchange that produced it — see [[trust-task-context-binding]]. Four credentials reference another by digest (VMC acknowledgement, VWC, VDC `parent`/`accepts`, VAC `parent`), all using one **`digestMultibase`** encoding defined in WD02.

## ZKP Anchor Points

The two Edge Credentials that existed first remain the anchors for the [[zero-knowledge-proofs|ZKP constructions]] the spec defines: the **VRC** anchors the **pairwise ZKP** (any two VRC holders; discloses `directed` persona identifiers while hiding `pairwise` ones), the **VMC** anchors the **community-anchored ZKP** (both parties hold VMCs from the same community, whose assurances — including personhood — carry into the proof). WD02 adds chain-validity predicates for VDC and VAC chains, a shared-subject predicate for membership-plus-authority, and, on `main`, a single predicate shape for all VSC profiles. The spec recommends ZKP presentation by default.

See also: [[zero-knowledge-proofs]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], [[authority-credential]], [[delegation-credential]], [[statement-credential]]
