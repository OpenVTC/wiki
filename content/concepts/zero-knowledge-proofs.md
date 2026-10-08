---
title: "Zero-Knowledge Proofs in the DTG"
type: concept
tags: [zkp, privacy, credentials, dtg, presentation, vetting, pcs]
date-updated: 2026-10-07
sources: [dtg-credential-spec, openvtc, verifiable-trust-infrastructure]
---

# Zero-Knowledge Proofs in the DTG

DTG credentials are W3C-compliant Verifiable Credentials. They MAY be presented using standard VC presentation methods, but the [[dtg-credential-spec|spec]] says they SHOULD be presented as **zero-knowledge proofs (ZKPs)** whenever privacy preservation matters — and that implementations SHOULD make ZKP presentation the default. This page explains why, lays out the two constructions the spec defines, says plainly which of the spec's ZK predicates exist today and which are waiting on work not yet done, and — new since Eucalyptus — describes the one zero-knowledge scheme actually running in the ecosystem: the **Predicate Credential System** behind OpenVTC's hidden vetting.

## Why ZKPs Matter Here

The DTG is an attempt to build a trust graph that survives mass-scale impersonation by AI agents and Sybil attackers without becoming a surveillance graph in the process. A naïve presentation of a [[membership-credential|VMC]] reveals which community you belong to, your identifier there, and (transitively) every relationship anchored to it. Once that's done a few times, your "trust profile" is correlatable across every counterparty you've ever proven anything to.

ZKPs sever that correlation. The holder proves what is necessary — "I'm a member of *some* community in this VTN," "this persona is a real person," "I have a relationship with that persona" — without disclosing the underlying identifiers or credentials. The spec cites Adler et al. 2024, [Personhood Credentials](https://arxiv.org/pdf/2408.07892), which argues that ZKPs are the only inherently privacy-preserving option for proof of personhood with credentials of this kind. Hence "ZKPs by default": privacy should not require any extra effort on the user's part.

## Two Constructions

### 1. Pairwise ZKP (anchored to the VRC)

**What it proves:** Possession of a valid [[relationship-credential|VRC]], with selective disclosure of chosen attributes, identifiers, or predicates. The canonical application is to disclose the parties' **`directed` persona identifiers** while hiding the underlying **`pairwise`** ones (see [[correlation-scope]]) — a public, verifiable claim that two known personas have a relationship, without exposing the private channel between them or enabling correlation across the holder's other presentations.

**Who can construct it:** Any two parties who hold a VRC between them. Shared community membership is not required.

**What assurance it carries:** Whatever the parties bring to it — the VRC's integrity and the public reputation of any disclosed persona. No community-level assurance such as personhood. This is what makes the [[persona-credential|VPC's "Banksy Maneuver"]] viable.

### 2. Community-Anchored ZKP (anchored to the VMC)

**What it proves:** (1) possession of the VRC; (2) possession of the holder's own community-issued VMC; (3) that the VRC issuer holds a VMC from the *same community identifier*. The relationship is proven within a shared community's governance context without revealing identifiers.

**Who can construct it:** Both parties must hold VMCs from the same community.

**What assurance it carries:** Whatever the community's [[trust-registries|trust registry]] attaches to its VMCs — most importantly personhood, when the VMCs are [[personhood-credential|PHCs]]. "Two real, unique humans within community X have a relationship," without saying which.

**Two WD02 caveats.** Statement 2 is the holder demonstrating their own grant, which the *Membership Edge Completion* rule accepts. Statement 3 rests on a grant whose subject is the *counterparty*, and a grant alone does not establish that its subject consented; until the trust-task and ZK work closes this, a verifier SHOULD read statement 3 as "the community attested the issuer's membership," not "the issuer acknowledged it." And where a party used one `pairwise` identifier toward the community and another toward the counterparty — the ordinary case under strict pairwise — the identifiers differ by construction, so the proof must additionally establish **common control** of both.

## Choosing Between Them

| | Pairwise ZKP | Community-Anchored ZKP |
|---|---|---|
| **Requires shared VTC?** | No | Yes |
| **Anchored to** | VRC | VRC + VMC + same community identifier |
| **Hides** | `pairwise` identifiers (the private channel) | All identifiers and credential details |
| **Discloses (typical)** | `directed` persona identifiers, chosen predicates | Predicates only (e.g., "personhood") |
| **Personhood assurance?** | Only via a disclosed persona's reputation | Yes, when the community's VMCs are PHCs |
| **Best for** | Public, persona-level relationship proofs (Banksy) | Anonymous proof of *real-human* relationship within a community |

Both routes are equal citizens: WD02's *Edge Verifiability* section lets the membership condition for an edge be met by disclosure *or* by the community-anchored proof, and calls the two equivalent in principle.

## The Predicates the Schemas Are Shaped For

The spec keeps its schemas minimal so that common predicates can be proven. WD02 and `main` extend the list well beyond relationships:

- "Holder has a valid community-issued VMC from a recognized VTC"; "Issuer is an authorized member"; "Two distinct VRCs exist"
- "Holder has a valid, unrevoked **delegation** to act in the name of a member of a recognized VTC, covering act X" — and "this [[delegation-credential|VDC]] chain is valid" without disclosing the chain
- "Holder holds a [[authority-credential|VAC]] conferring action X at scope S, and its chain is valid and unrevoked" without disclosing the chain
- "Two credentials presented together **share a subject**" — REQUIRED whenever membership and authority are both proven with the subject withheld, else two parties can pool one's membership with the other's authority
- "Holder holds a [[statement-credential|statement credential]] from an issuer in set S, under predicate P, about the holder" — one construction for every VSC profile, since all share one shape

## What Is Waiting on the ZKP Task Force

An editor's note (2026-09-10, now in Working Draft 0.6.0) says what earlier drafts left implicit: these predicates are *requirements on the schemas*, not machinery that exists. **Four of them rest on one primitive no DTG specification yet defines — a proof that two credentials, or two identifiers, are under common control, without disclosing either** (spec issue #9): the community-anchored proof wherever VMC and VRC identifiers differ; the shared-subject requirement; and the ZK forms of both the VDC and VAC chains. Correlation scope makes the first the ordinary case rather than an edge case. Separately, none of the spec's digest-valued members is salted, so a digest over low-entropy content can be reversed by enumeration (issue #38) — the `predicate` of a VSC is a blinding target for the same reason, being drawn from a small vocabulary — and the `taskContext`/`taskDigestMultibase` citation has the same value on every presentation, so it links presentations even where everything else is proven in zero knowledge; a committed form of the citation is under consideration ([[trust-task-context-binding]]). The `vetted/1` profile salts its own `identityCommitment` rather than wait. The ZKP task force's working draft and construction catalog (records 007 common control, 010 community-anchored composition, 020 delegation chains, 008 blinded binders) bear on these but close nothing yet.

**What holds meanwhile:** nothing in the spec is unverifiable — every requirement can be checked by presenting the credentials themselves. The cost is privacy, not correctness, and it falls hardest on chains, whose disclosure boundary is the whole chain. Implementations should not defer shipping a rule because its ZK form is unspecified.

## ZKPs Across the Credential Family

- **VMCs** — prove membership (and personhood) without revealing the member's identifier
- **VRCs** — both constructions above
- **[[persona-credential|VPCs]]** — selective disclosure linking a persona to one counterparty
- **VSCs** (`endorses/1`, `witnessed/1`, `vetted/1`, `presented/1`) — predicate-only disclosure, e.g. "endorsed for X" without the endorser; holders should be able to withhold `witnessContext`
- **VDCs / VACs** — chain validity and scope containment without ancestry disclosure (future); today a derived VDC or attenuated VAC reveals its whole chain, principal included

The binding to specific schemes (BBS+, SD-JWT-VC, etc.) is out of scope for the credential spec.

## In production: the Predicate Credential System and hidden vetting

The constructions above are requirements on schemas. The one zero-knowledge scheme running in the ecosystem as of Eucalyptus sits beside them, in [[peer-identity-vetting]]. Peer vetting admits an applicant on `minStatements` `vetted/1` statements from distinct eligible vetters — and in the named flow each statement carries the vetter's member DID in the clear, so the community learns exactly who vouched for whom. The **Predicate Credential System (PCS)** — `OpenVTC/predicate-credential-system`, a Rust implementation of a construction from the academic literature, built on arkworks — removes that disclosure. A **helper** (the community service) issues **blind credentials** to users; a credentialed user can **attest** for another user's identifier; and the applicant then **proves in zero knowledge that it holds `k` attestations from pairwise-distinct credentialed users, none of whom is itself**. The helper verifies the proof and issues the applicant's own credential blindly, learning the applicant's identifier, that `k` distinct valid credential holders vouched for it, and the class label of each voucher's credential — and nothing about *which* members vouched, although it issued their credentials.

The trick is the **tag**, a key-injective PRF: every public value a user emits is `Tag(usk, ·)` under a secret key that never leaves the user's device. An attestation carries `T_j = Tag(usk_j, H0(id))`, deterministic per (vetter, applicant) — so two vouches from the same vetter collide and are refused (`DuplicateAttester`), which is what makes attesters *countable* — yet unlinkable across applicants and to the vetter's identity. The scheme is generic over a credential base: Σ-PS (Pointcheval–Sanders, the main instantiation), Σ-BBS and Σ-EQ over BLS12-381, plus a designated-verifier MAC; with Σ-PS and the DDH tag an attestation is 240 bytes, a credential 96, and a **proof at `k = 5` is 1392 bytes**, proved and verified in about 12 ms. It is a **research artifact**: unaudited, no constant-time claims, random-oracle model with plain Fiat–Shamir (so the theorems hold for sequential issuance and constant `k`), attestations are standing endorsements that can be re-presented for the same `id`, and the helper's admission policy decides everything the construction does not.

**How hidden vetting uses it.** OpenVTC's design (`docs/design/vetting-hidden-vetters-pcs.md`, 2026-09-22) and the VTI's `vetting-pcs` feature (off by default because it vendors an unaudited library; a community built without it does not advertise the mode) map the pieces: helper = the VTC, with keys derived from its credential signer; user = the applicant's per-community persona with a fresh local `usk` that never goes to the VTA; attestation = what the vetter hands back instead of a named `vetted/1` statement; predicate `(k, label)` = the criterion's `minStatements` plus the vetter class (`AllowList` policy, so only credential holders with the vetter label count); `Prove → Issue → Unblind` = join submit → verdict → credential delivery. The applicant-to-vetter ceremony — ticket, `vetting/request`, `vetting/session`, signed Vetting Card, human check, match code — is unchanged; only the artifact and what the VTC verifies change, and hidden vetting *qualifies* a criterion's ordinary vetting requirements rather than replacing them. The cost the design states plainly: the named flow wanted *accountable* vetters with per-vetter velocity caps and cascade review, and tags make per-vetter accounting impossible by construction. It recovers a velocity cap with **attestation tokens on a constant drip** (one token per vetter per three days, replenished without asking, so fetching the drip reveals no preference), a separate short-lived token key for approved **event mode** with a group floor so the anonymity set stays large, and labels grouped into coarse bands. The VTC publishes labels, drip rate, suite and keys in the join manifest and reports only *counts* of enrolled vetters; it runs hidden vetting on one criterion at a time, and the October fixes (VTI #1956–#1977) made the drip a window of time that a signing-key change never re-keys and made refusals say why a proof did not count. OpenVTC pins the published `predicate-credential-system` crate (0.1.0) since #396; the Keyring wallet pins the same release.

Hidden vetting is the ecosystem's first deployed answer to the question the spec's ZK predicates pose — prove a threshold of statements about yourself without disclosing their issuers — and it does it outside the W3C credential layer altogether: the PCS objects are their own multibase-encoded wire format, and the `vetted/1` VSC remains the named-flow artifact.

## Privacy Considerations

> **ZKPs by default:** ZKP presentation should be used by default so that privacy preservation does not require any extra effort on behalf of users.

The non-ZKP path remains available — the credentials are W3C-compliant — but it is the explicit fallback, not the norm. Implementations that ship standard VC presentation as the default are out of step with the spec's privacy posture.

See also: [[membership-credential]], [[relationship-credential]], [[persona-credential]], [[correlation-scope]], [[credential-categories]], [[trust-registries]], [[dtg-credentials-overview]]
