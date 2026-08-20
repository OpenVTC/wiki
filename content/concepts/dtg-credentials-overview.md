---
title: "DTG Credential Types"
type: concept
tags: [credentials, dtg, trust-graph, trust-over-ip]
date-updated: 2026-08-19
sources: [dtg-credential-spec, dtg-credentials]
---

# DTG Credential Types

The Decentralized Trust Graph (DTG) is populated by a family of [[verifiable-credentials|Verifiable Credential]] types, each representing a different kind of trust relationship. These are defined by the Trust Over IP Foundation's DTG Working Group Credentials Task Force in the [[dtg-credential-spec|DTG Core Credentials specification]] (v1.0 Working Draft 01 since July 2026) and implemented in the [[dtg-credentials|dtg-credentials]] library (0.2.0 tracks WD01).

All DTG credentials share a common W3C VC format with JSON-LD contexts, signed using EdDSA JCS 2022 Data Integrity Proofs. They use the `https://firstperson.network/credentials/dtg/v1` JSON-LD context. Both W3C VC v2.0 (primary) and v1.1 (legacy) are supported.

The spec (v1.0 Working Draft 01, July 2026) organizes its six credential types into three [[credential-categories|descriptive functional categories]]: Edge, Invitation, and Annotation. These categories are for conceptual understanding only — they don't appear in credential schemas.

DTG credentials MAY be presented using standard W3C VC presentation methods, but they SHOULD be presented as [[zero-knowledge-proofs|zero-knowledge proofs]] whenever privacy preservation is desired — and implementations SHOULD make ZKP presentation the default. The spec defines two ZKP constructions for Edge Credentials: a **pairwise** construction anchored to the VRC, and a **community-anchored** construction anchored to the VMC. See [[zero-knowledge-proofs]].

## The Credential Types

### Membership Credential (VMC) — Edge
**"This entity is a member of community X."**

A [[membership-credential|Membership Credential]] attests to the membership of an entity in a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. Membership is verified through a **bi-directional pair of VMCs** — one from the community to the member, and one back. The issuer is a [[did-types|C-DID]]; the subject is an [[did-types|M-DID]] (or another C-DID for VTN↔VTC membership). When the issuing community's governance enforces personhood guarantees, the VMC qualifies as a [[personhood-credential|Personhood Credential (PHC)]] — determined by [[trust-registries|trust registries]], not credential structure.

### Relationship Credential (VRC) — Edge
**"I have a genuine trust relationship with this person."**

A [[relationship-credential|Relationship Credential]] attests to a peer-to-peer relationship between two entities. The relationship is verified through a **bi-directional pair of VRCs** — two VRCs (one each direction) form a complete DTG edge. Each relationship uses a unique [[did-types|R-DID]] for privacy. The issuance follows a multi-step protocol: request → accept → finalize → VRC exchange. See also the [[witnessed-vrc-exchange|Witnessed VRC Exchange Protocol]].

### Invitation Credential (VIC) — Invitation
**"I invite this entity to join the trust graph."**

An [[invitation-credential|Invitation Credential]] authorizes onboarding of a new member into a VTC or VTN. The issuer can be the community's C-DID or an authorized member's M-DID, depending on community policy.

### Persona Credential (VPC) — Annotation
**"I am revealing a persona identity to you."**

A [[persona-credential|Persona Credential]] links a [[did-types|P-DID]] (Persona DID) to an existing relationship. It enables selective persona disclosure — including the "Banksy Maneuver" (proving you control a pseudonymous identity to a specific person).

### Endorsement Credential (VEC) — Annotation
**"I endorse this person's competency in X."**

An [[endorsement-credential|Endorsement Credential]] lets one person vouch for another's skills or attributes. Includes a required `endorsement` object with community/VTN-defined structure (type, name, competency level).

### Witness Credential (VWC) — Annotation
**"I witnessed that this relationship is genuine."**

A [[witness-credential|Witness Credential]] is a third-party attestation — by a person, or by a VTA applying a community's witnessing policy. Since WD01 it MUST carry `taskContext` (the exchange it was issued in — see [[trust-task-context-binding]]) and a required `digest` of the specific VRC it attests (SHA-256 over the VRC's JCS canonical form, encoded `sha256:<hex>`); `credentialSubject.id` is the issuer of that VRC, and a witnessed bidirectional exchange yields one VWC per direction. An optional `witnessContext` object carries event, session ID, and verification method (e.g., "in-person-proximity"). See [[witnessed-vrc-exchange]] for the full protocol.

### Relationship card (r-card) — a companion Verifiable Data Structure, not a credential
**"Here is my contact information."**

An r-card carries vCard/jCard contact information (per RFC 7095) in a verifiable wrapper — "a modern, self-updating vCard," typically exchanged alongside VRCs. It is **not a DTGCredential** and, since WD01, is no longer defined in the core spec at all: it moves to a planned *DTG Core Verifiable Data Structures* companion (with an agent card). The [[dtg-credentials]] crate keeps deprecated RCard types for now.

## How They Fit Together

In practice, a participant's trust profile might look like:

1. They hold **VMCs** proving membership (and personhood) in two VTCs within a VTN
2. They have **VRCs** with 10 people they know personally (20 credentials — one each direction, forming 10 complete edges)
3. Several counterparties have issued **VECs** endorsing their development skills
4. Three of their relationships have **VWCs** from a [[witnessed-vrc-exchange|witnessed exchange]] at a conference
5. They've shared a **VPC** with a trusted contact, linking a pseudonymous identity

Anyone evaluating this participant can traverse these credentials to build a trust assessment — following multiple independent paths, checking witness attestations, and verifying every signature along the way.

See also: [[credential-categories]], [[decentralized-trust-graph]], [[verifiable-credentials]], [[dtg-credentials]]
