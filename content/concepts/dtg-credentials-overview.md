---
title: "DTG Credential Types"
type: concept
tags: [credentials, dtg, trust-graph, trust-over-ip]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# DTG Credential Types

The Decentralized Trust Graph (DTG) is populated by a family of [[verifiable-credentials|Verifiable Credential]] types, each representing a different kind of trust relationship — and, since September 2026, a different kind of *permission*. They are defined by the Trust Over IP Foundation's DTG Working Group Credentials Task Force in the [[dtg-credential-spec|DTG Core Credentials specification]] and implemented in the [[dtg-credentials|dtg-credentials]] library.

Two spec states matter as of 2026-09-18:

- **Working Draft 02** (tagged 2026-09-07) — **eight types** in three [[credential-categories|descriptive categories]] (Edge, Invitation, Annotation) plus the VAC outside them. This is what `dtg-credentials` 0.7.0–0.9.1 implements.
- **`main`, heading for Working Draft 0.4.0** (as of 2026-09-15) — **seven types**: the [[statement-credential|VSC]] absorbs the VEC and VWC as predicate profiles, the VIC is promoted out of its single-member category, leaving two categories (Edge, Annotation) with the VIC and VAC standing apart. Not yet implemented anywhere.

All DTG credentials share a common W3C VC format with JSON-LD contexts (`https://firstperson.network/credentials/dtg/v1`), signed with Data Integrity proofs — EdDSA JCS 2022 in the library, and since VTI #1553/#1557 the VTC issues **hybrid multi-proof credentials** (Ed25519 + ML-DSA). W3C VC v2.0 is primary, v1.1 legacy. Every type may carry `taskContext` ([[trust-task-context-binding]]). Where one credential references another — the VMC acknowledgement, the VWC, VDC and VAC chains — it does so by **`digestMultibase`**: SHA-256 over the JCS form excluding `proof`, as a base58btc multihash (WD02 replaced WD01's `sha256:<hex>`). Identifiers are no longer typed (no C/M/R/P-DID); each carries a holder-declared [[correlation-scope]] instead.

DTG credentials MAY be presented as ordinary VCs but SHOULD be presented as [[zero-knowledge-proofs|zero-knowledge proofs]] whenever privacy matters, by default.

## Edge credentials — bidirectional, the second half is consent

### Membership Credential (VMC)
**"This entity is a member of community X" — and "I agree that I am."**

A [[membership-credential|Membership Credential]] attests to membership in a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. WD02 finally specified both halves: the community-issued **grant** (VTC → member) and the member-issued **acknowledgement** (member → VTC, carrying `digestMultibase` of the grant), the member's consent artifact without which a community cannot prove anyone's membership. When the community's governance enforces personhood and one-membership-per-person, the grant is a [[personhood-credential|PHC]] — a matter for [[trust-registries|trust registries]], not schema. A [[data-rooms|data room]] uses the same pair to form its membership edge.

### Relationship Credential (VRC)
**"I have a genuine trust relationship with this person."**

A [[relationship-credential|Relationship Credential]] attests to a peer-to-peer relationship; two VRCs (one each direction) form a complete edge. A `pairwise` identifier per relationship is RECOMMENDED. WD02's *Edge Verifiability* section defines when a VRC counts as an edge *to a given verifier* — against the VTCs that verifier accepts as anchors, by disclosure or by community-anchored ZKP. See also the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]].

### Delegation Credential (VDC) — new in WD02
**"I appoint this party to act in my name, for these acts, until then."**

A [[delegation-credential|Delegation Credential]] is a grant from delegator to delegate plus the delegate's **required acceptance**. It establishes representation, never authority: the verifier substitutes the delegator and asks whether *they* may act; reach is the intersection. Single-hop by default (`maxDepth`), `validUntil` required, status conditional, not a bearer token. This is how a person appoints an AI agent to act *as them*.

## Annotation credentials — attach data, create no structure

### Persona Credential (VPC)
**"I am revealing a persona identity to you."**

A [[persona-credential|Persona Credential]] links a persona — an identifier ordinarily declared `directed` — to an existing relationship, enabling the "Banksy Maneuver". VPC issuance shipped in VTI #1074.

### Endorsement Credential (VEC)
**"I endorse this person's competency in X."**

An [[endorsement-credential|Endorsement Credential]] lets one party vouch for another's skills or attributes, with a community-defined `endorsement` payload. WD02 stresses it is a statement *about* a party, never a permission — that is the VAC's job. [[openvtc|OpenVTC]] uses a revocable `CommunityRole` VEC to name vetters in [[peer-identity-vetting]]. On `main` the VEC is the `dtg:endorses` profile of the VSC.

### Witness Credential (VWC)
**"I witnessed that this specific edge was established, in this exchange."**

A [[witness-credential|Witness Credential]] is a third-party attestation by a person or a VTA applying community witnessing policy. `taskContext` and `digestMultibase` (of the witnessed edge credential — a VRC *or* a VMC since WD02) are REQUIRED; `credentialSubject.id` is the issuer of that credential; one VWC per direction. On `main` the VWC is the `dtg:witnessed` profile of the VSC, with direction binding made unconditional.

### Statement Credential (VSC) — `main` only
**"I state that ⟨predicate⟩ holds of this node."**

The [[statement-credential|Statement Credential]] is one type carrying subject, an absolute-IRI `predicate` from a governed vocabulary, and an `object`. Verifiers fail closed on predicates they are not configured for; a VSC *attests* and never *establishes*. Not in WD02, not implemented.

## Outside the categories

### Invitation Credential (VIC)
**"I invite this entity to join."**

An [[invitation-credential|Invitation Credential]] authorizes onboarding into a VTC or VTN (two variants by issuer/subject rules). In WD02 its own "Invitation" category; on `main` a top-level section, since it bootstraps a node into a community rather than forming or annotating an edge. Roles and access do *not* belong in a VIC — that is the VAC. A [[data-rooms|data room]] admits members by VIC.

### Authority Credential (VAC) — new in WD02
**"You may do these actions at this scope, as yourself."**

An [[authority-credential|Authority Credential]] confers permission within a governed `scope` as an explicit `actions` list, and can be **attenuated** by its holder — an agent gets four hours of read-only, not its principal's standing authority — with the verifier walking the whole holder-presented chain (digest `parent`, depth ≤ 8). `validUntil` required. On `main`: not a bearer credential (key control at invocation, `audience` removed), `maxAttenuation`, and revocation that cascades. The permission model of [[data-rooms]] (`read`/`write`/`curate`/`admin`).

### Relationship card (r-card) — a companion Verifiable Data Structure, not a credential
**"Here is my contact information."**

vCard/jCard data in a verifiable wrapper, exchanged alongside VRCs; removed from the core spec in WD01 and bound for the planned *DTG Verifiable Data Structures* companion (with an agent card). The crate keeps deprecated RCard types.

## How They Fit Together

A participant's trust profile might look like:

1. Two **VMC pairs** proving (consented) membership — and personhood — in two VTCs within a VTN
2. **VRCs** with 10 people they know (20 credentials, 10 complete edges), each under its own `pairwise` identifier
3. Several **VECs** endorsing their development skills
4. Three relationships carrying **VWCs** from a [[witnessed-vrc-exchange|witnessed exchange]] at a conference
5. A **VPC** shared with one trusted contact, linking a pseudonymous persona
6. A **VAC** from a data room for `read`/`write`, attenuated to `read`-for-four-hours for their agent
7. A **VDC** appointing an assistant service to schedule in their name

Anyone evaluating this participant can traverse these credentials — following independent paths, checking witness attestations, walking authority chains back to the governing party — and verify every signature along the way. The [[verifiable-trust-infrastructure|VTI]] draws the resulting graph, distinguishing half-edges from complete edges (VTI #1073, #1213).

See also: [[credential-categories]], [[decentralized-trust-graph]], [[verifiable-credentials]], [[dtg-credentials]], [[correlation-scope]], [[data-rooms]]
