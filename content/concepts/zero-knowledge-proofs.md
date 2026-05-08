---
title: "Zero-Knowledge Proofs in the DTG"
type: concept
tags: [zkp, privacy, credentials, dtg, presentation]
date-updated: 2026-05-08
sources: [dtg-credential-spec]
---

# Zero-Knowledge Proofs in the DTG

DTG credentials are W3C-compliant Verifiable Credentials. They MAY be presented using standard VC presentation methods, but the [[dtg-credentials-overview|spec]] says they SHOULD be presented as **zero-knowledge proofs (ZKPs)** whenever privacy preservation matters — and that implementations SHOULD make ZKP presentation the default. This page explains why, and lays out the two distinct ZKP constructions the spec defines.

## Why ZKPs Matter Here

The DTG is an attempt to build a trust graph that survives mass-scale impersonation by AI agents and Sybil attackers without becoming a surveillance graph in the process. A naïve presentation of a [[membership-credential|VMC]] reveals which community you belong to, your member DID, and (transitively) every relationship anchored to that DID. Once that's done a few times, your "trust profile" is correlatable across every counterparty you've ever proven anything to.

ZKPs sever that correlation. The holder proves what is necessary for the verifier — "I'm a member of *some* community in this VTN," "this persona is a real person," "I have a relationship with that persona" — without disclosing the underlying DIDs, credentials, or other claims that would enable correlation. The spec cites Adler et al. 2024, [Personhood Credentials](https://arxiv.org/pdf/2408.07892), which argues that ZKPs are the only inherently privacy-preserving option for proof of personhood with credentials of this kind.

The "ZKPs by default" guidance in [Privacy Considerations](#privacy-considerations) follows directly: privacy preservation should not require any extra effort on the user's part.

## Two Constructions

The spec defines two ZKP constructions for [[credential-categories|Edge Credentials]]. They differ in what they prove, what they require to construct, and what assurance they carry.

### 1. Pairwise ZKP (anchored to the VRC)

**Where:** [[relationship-credential|VRC]], spec §5.1.

**What it proves:** Possession of a valid VRC, with selective disclosure of chosen attributes, subject DIDs, or predicates over them. The canonical application is to disclose the parties' [[did-types|P-DIDs (Persona DIDs)]] while hiding the underlying [[did-types|R-DIDs]] — a public, verifiable claim that two known personas have a relationship, without exposing the private pairwise channel between them or enabling correlation across the holder's other presentations.

**Who can construct it:** Any two parties who hold a VRC between them. **Shared community membership is not required.** Two entities that don't share (or don't hold) a VMC can still exchange VRCs and prove pairwise relationships through them.

**What assurance it carries:** Whatever the parties bring to it. The proof itself stands on the cryptographic integrity of the VRC and the public reputation attached to any disclosed persona DIDs. It does not by itself confer community-level assurance like personhood — that requires the community-anchored construction.

This construction is what makes the [[persona-credential|VPC's "Banksy Maneuver"]] viable: linking a pseudonymous P-DID to an existing relationship, selectively, to one counterparty.

### 2. Community-Anchored ZKP (anchored to the VMC)

**Where:** [[membership-credential|VMC]], spec §5.2.

**What it proves:** A three-part proof of relationship-within-a-shared-community:

1. Possession of the VRC
2. Possession of the underlying VMC (proving membership in the community)
3. The VRC issuer also holds a VMC from the *same* [[did-types|C-DID]]

The relationship's existence is proven *within the governance context of a shared community* without revealing the specific DIDs or other credential details.

**Who can construct it:** Both parties to the VRC must hold VMCs from the same community.

**What assurance it carries:** Whatever assurances the community's [[trust-registries|trust registry]] attaches to its VMCs. Most importantly, when a community's VMCs qualify as [[personhood-credential|PHCs]], that personhood assurance carries forward into every relationship proven through this construction. This is the proof that says "two real, unique humans within community X have a relationship," without disclosing which humans, or which relationship.

This is one proof construction available to relationships within a shared community — the spec is explicit that it is not the only one. Detailed ZK protocols and registry-ZK interactions are out of scope for the spec itself.

## Choosing Between Them

| | Pairwise ZKP | Community-Anchored ZKP |
|---|---|---|
| **Requires shared VTC?** | No | Yes |
| **Anchored to** | VRC | VRC + VMC + same C-DID |
| **Hides** | R-DIDs (pairwise channel) | All DIDs and credential details |
| **Discloses (typical)** | P-DIDs, chosen predicates | Predicates only (e.g., "personhood") |
| **Personhood assurance?** | Only via disclosed P-DID's reputation | Yes, when the community's VMCs are PHCs |
| **Best for** | Public, persona-level relationship proofs (Banksy) | Anonymous proof of *real-human* relationship within a community |

A holder may have both options available for a given counterparty, and choose based on what the verifier needs: if a verifier only needs "I have a relationship with this public persona," the pairwise construction is sufficient and exposes less. If a verifier needs "I have a relationship with a real human in community X," the community-anchored construction is the right tool.

## ZKPs Across the Credential Family

ZKP framing isn't limited to Edge Credentials. The spec's "ZKPs by default" guidance applies across all DTG credential presentation:

- **VMCs** can be presented to prove community membership (and, where applicable, personhood) without revealing the specific M-DID
- **VRCs** support both ZKP constructions above
- **[[persona-credential|VPCs]]** rely on selective-disclosure semantics to link a P-DID to a relationship for one specific counterparty without disclosing it more broadly
- **[[endorsement-credential|VECs]]** and **[[witness-credential|VWCs]]** can be presented with predicate-only disclosure (e.g., "endorsed for skill X" without revealing endorser identity)

Detailed ZK protocols, the binding to specific cryptographic schemes (BBS+, etc.), and registry-ZK interactions are out of scope for the credential spec; they belong to implementation profiles.

## Privacy Considerations

From the spec's [Privacy Considerations](#privacy-considerations) section:

> **ZKPs by default:** ZKP presentation should be used by default so that privacy preservation does not require any extra effort on behalf of users.

The non-ZKP path remains available — the credentials are W3C-compliant — but it is the explicit fallback, not the norm. Implementations that ship standard VC presentation as the default are out of step with the spec's privacy posture.

See also: [[membership-credential]], [[relationship-credential]], [[persona-credential]], [[credential-categories]], [[trust-registries]], [[dtg-credentials-overview]]
