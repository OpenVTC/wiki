---
title: "DTG Credential Types"
type: concept
tags: [credentials, dtg, trust-graph, trust-over-ip]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# DTG Credential Types

The Decentralized Trust Graph (DTG) is populated by a family of [[verifiable-credentials|Verifiable Credential]] types, each representing a different kind of trust relationship, statement or permission. They are defined by the Trust Over IP Foundation's DTG Working Group in the **DTG Credentials Core Specification** — the title since 2026-09-24 (#61/#62); earlier wiki pages call it "DTG Core Credentials" — and implemented in the [[dtg-credentials|dtg-credentials]] library. The [[dtg-credential-spec|spec]] is at **Version 1.0, Document Status Working Draft 0.6.0** (`main`, 2026-09-28; tagged milestones `v0.4.0` 2026-09-15 and `v0.5.0` 2026-09-22; the informal `WD01`/`WD02` ordinals preceded semantic versioning). Companion repos: the **DTG VSC Predicate Registry** (`dtgwg-vsc-registry`, served at `https://registry.trustoverip.org/dtg/`), the **[[trust-tasks|Trust Tasks]]** spec, and the VTI system spec.

## "DTG Credentials v1" — what it means on the wire

As of the `VTI-Eucalyptus` release every implementation in the ecosystem — [[dtg-credentials]] 0.12+, the [[verifiable-trust-infrastructure|VTI]] community service (#1859), [[openvtc|OpenVTC]] (#397), the VTA rooms surfaces — issues and accepts only credentials in the shape WD 0.6.0 fixes, and this is what "DTG Credentials v1" means operationally:

- `@context` is `["https://www.w3.org/ns/credentials/v2", "https://registry.trustoverip.org/dtg/context/v1", …]`, the DTG IRI compared byte-exact; the `v1` document is frozen and its digest pinned in the spec. The pre-v1 `https://firstperson.network/credentials/dtg/v1` is refused with no alias.
- `type` is `VerifiableCredential`, `DTGCredential` and **exactly one** concrete subtype (`PersonhoodCredential` tolerated only as the hint on a VMC); `EndorsementCredential`, `WitnessCredential` and `RCardCredential` no longer exist.
- a REQUIRED top-level **`issuerScope`** — `pairwise` | `directed` | `public` — declaring the issuer's [[correlation-scope]]; a credential without one is rejected.
- `taskContext` is the `id` of the initiating document of the innermost exchange it cites, and **`taskDigestMultibase`** is REQUIRED beside it wherever a type or profile requires the citation ([[trust-task-context-binding]]).
- `proof` is a W3C Data Integrity proof (`DataIntegrityProof`; `eddsa-jcs-2022` RECOMMENDED because JCS needs no context resolution and is the canonicalization digests already use).
- community roles are **VACs**, and endorsements, witnessing and vetting are **VSCs** under registry predicates — `endorses/1`, `witnessed/1`, `vetted/1`, `presented/1` — accepted fail-closed.

The spec declares credentials issued before its Implementers Draft non-conformant, so there was no staged migration: issuers and verifiers moved together and re-issued what they held. Every digest changed with the shape, so acknowledgements, acceptances and attenuations were re-derived too — which is what OpenVTC's "set aside on load" and membership renewal exist for.

Identifiers are no longer typed (no C/M/R/P-DID). Where one credential references another — the VMC acknowledgement, a VSC's object, VDC and VAC chains — it does so by **`digestMultibase`**: SHA-256 over the JCS form excluding `proof`, as a base58btc multihash. W3C VC v2.0 is primary, v1.1 legacy. DTG credentials MAY be presented as ordinary VCs but SHOULD be presented as [[zero-knowledge-proofs|zero-knowledge proofs]] whenever privacy matters, by default.

## Edge credentials — bidirectional, the second half is consent

The only grouping the spec makes ([[credential-categories]]): each is one half of a pair, the pair forms a [[decentralized-trust-graph|DTG edge]], and every other credential is complete on its issuer's signature alone.

### Membership Credential (VMC)
**"This entity is a member of community X" — and "I agree that I am."**

A [[membership-credential|Membership Credential]] attests to membership in a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. The community-issued **grant** (always `issuerScope: public`) and the member-issued **acknowledgement** (carrying `digestMultibase` of the grant and the member's own scope) together form the edge; the acknowledgement is the member's consent artifact without which a community cannot prove anyone's membership. When the community's governance enforces personhood and one-membership-per-person, the grant is a [[personhood-credential|PHC]] — a matter for [[trust-registries|trust registries]], not schema. A [[data-rooms|data room]] uses the same pair.

### Relationship Credential (VRC)
**"I have a genuine trust relationship with this person."**

A [[relationship-credential|Relationship Credential]] attests to a peer-to-peer relationship; two VRCs (one each direction) form a complete edge. A `pairwise` identifier per relationship is RECOMMENDED and is what OpenVTC issues by default. *Edge Verifiability* defines when a VRC counts as an edge *to a given verifier* — against the VTCs that verifier accepts as anchors, by disclosure or by community-anchored ZKP. See also the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]].

### Delegation Credential (VDC)
**"I appoint this party to act in my name, for these acts, until then."**

A [[delegation-credential|Delegation Credential]] is a grant from delegator to delegate plus the delegate's **required acceptance**. It establishes representation, never authority: the verifier substitutes the delegator and asks whether *they* may act; reach is the intersection. Single-hop by default (`maxDepth`), `validUntil` required, status conditional, **not a bearer credential** (the delegate proves key control at invocation), `issuerScope` ordinarily `directed`. This is how a person appoints an AI agent to act *as them*.

## Complete on the issuer's signature

### Persona Credential (VPC)
**"I am revealing a persona identity to you."**

A [[persona-credential|Persona Credential]] links a persona — an identifier ordinarily declared `directed` — to an existing relationship, enabling the "Banksy Maneuver". Statement-shaped, but kept as its own type because its issuer *is* the persona identifier. VPC issuance shipped in VTI #1074.

### Statement Credential (VSC)
**"I state that ⟨predicate⟩ holds of this node."**

The [[statement-credential|Statement Credential]] is one type carrying subject, an absolute-IRI `predicate` from a governed vocabulary, and an `object` (`id` | `digestMultibase` | `value`). Verifiers fail closed on predicates they are not configured for; a VSC *attests* and never *establishes*. Its profiles are defined in the DTG VSC Predicate Registry; two are named by the spec:

- **Endorsement (VEC) — `endorses/1`.** *"I endorse this person's competency in X."* One party vouches for another's skills or attributes with a community-defined `object.value`; a statement *about* a party, never a permission. See [[endorsement-credential]].
- **Witness (VWC) — `witnessed/1`.** *"I witnessed that this specific edge was established, in this exchange."* A person or a VTA applying community policy attests that the subject issued the credential `object.digestMultibase` names; `taskContext` and `taskDigestMultibase` REQUIRED, issuer `directed` at minimum, one VWC per direction. See [[witness-credential]].

Two more registry predicates are treated as core by every Eucalyptus implementation: **`vetted/1`** — a vetter's (or the community's own) record of an identity check, the statement [[peer-identity-vetting]] counts — and **`presented/1`** — a witness that the subject *presented* a credential. New communities seed all four as their accept list.

### Invitation Credential (VIC)
**"I invite this entity to join."**

An [[invitation-credential|Invitation Credential]] authorizes onboarding into a VTC or VTN (two variants by issuer/subject rules). It bootstraps a node into a community rather than forming or annotating an edge. Roles and access do *not* belong in a VIC — that is the VAC. A [[data-rooms|data room]] admits members by VIC.

### Authority Credential (VAC)
**"You may do these actions at this scope, as yourself."**

An [[authority-credential|Authority Credential]] confers permission within a governed `scope` as an explicit `actions` list, and can be **attenuated** by its holder — an agent gets four hours of read-only, not its principal's standing authority — with the verifier walking the whole holder-presented chain (digest `parent`, depth ≤ 8, `maxAttenuation` as the governing party's policy limit). `validUntil` required; not a bearer credential; revocation cascades. It is the permission model of [[data-rooms]] (`read`/`write`/`curate`/`admin`) and, since #1859, of **community roles**: the VTC issues a member a **role VAC** — `scope` the community DID, `actions: ["role:<role>"]`, `maxAttenuation: 0` — alongside the VMC, and names vetters with `role:vetter`.

### Relationship card (r-card) — a companion Verifiable Data Structure, not a credential
**"Here is my contact information."**

vCard/jCard data in a verifiable wrapper, exchanged alongside VRCs; removed from the core spec in WD01 and bound for the planned *DTG Verifiable Data Structures* companion (with an agent card). The crate dropped its deprecated RCard types in 0.12.0.

## How They Fit Together

A participant's trust profile might look like:

1. Two **VMC pairs** proving (consented) membership — and personhood — in two VTCs within a VTN, each delivered with a **role VAC** saying what the member may do there
2. **VRCs** with 10 people they know (20 credentials, 10 complete edges), each under its own `pairwise` identifier
3. Several **`endorses/1` statements** vouching for their development skills, and three **`vetted/1` statements** from the vetters who checked their identity when they joined
4. Three relationships carrying **`witnessed/1` statements** from a [[witnessed-vrc-exchange|witnessed exchange]] at a conference
5. A **VPC** shared with one trusted contact, linking a pseudonymous persona
6. A **VAC** from a data room for `read`/`write`, attenuated to `read`-for-four-hours for their agent
7. A **VDC** appointing an assistant service to schedule in their name

Anyone evaluating this participant can traverse these credentials — following independent paths, checking witness statements, walking authority chains back to the governing party — and verify every signature along the way, accepting only the predicates their own governance has configured. The [[verifiable-trust-infrastructure|VTI]] draws the resulting graph, distinguishing half-edges from complete edges (VTI #1073, #1213).

See also: [[credential-categories]], [[decentralized-trust-graph]], [[verifiable-credentials]], [[dtg-credentials]], [[correlation-scope]], [[statement-credential]], [[data-rooms]]
