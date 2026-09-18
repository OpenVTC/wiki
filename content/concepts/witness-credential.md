---
title: "Witness Credential (VWC)"
type: concept
tags: [credentials, dtg, witness, attestation]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials]
---

# Witness Credential (VWC)

A Verifiable Witness Credential is a third-party attestation that adds credibility to claims in the [[decentralized-trust-graph|Decentralized Trust Graph]]. A witness says "I observed that this specific edge credential was issued, in this specific exchange."

## What Makes Witnesses Powerful

Two-party claims (like [[relationship-credential|VRCs]]) are only as trustworthy as the two parties involved. A witness adds an independent third-party perspective. This is especially valuable for:

- **In-person verification** — "I met these two people at a conference and can confirm they know each other"
- **Event attestation** — "I witnessed this transaction/interaction at this event"
- **Sybil resistance** — it's hard to fake a witness who was physically present

The witness need not be a person: it may be **a VTA applying the witnessing policies of a VTC** — verifying that both parties were at the same event, or that each gave proof of biometric liveness. The issuer is the witness's own identifier — a member's, or a VTA's under community policy — which under WD02's [[correlation-scope]] must be **`directed` at minimum**: a witness has to be recognisable to both parties and to the community whose policy applies, so `pairwise` cannot describe it truthfully. (The old separate "W-DID" type was dropped in WD01; see [[did-types]].)

## What It Contains — Working Draft 02 (what implementations use)

Beyond standard VC fields:

- **`taskContext`** — REQUIRED: the thread identifier of the trust-task exchange in which the VWC was issued. A VWC "MUST be bound to the trust task exchange in which it was issued." See [[trust-task-context-binding]].
- **`credentialSubject.id`** — REQUIRED: the DID of the **issuer of the edge credential being attested** (the observed party), not its recipient.
- **`credentialSubject.digestMultibase`** — REQUIRED: a digest of the witnessed edge credential — SHA-256 over its JCS (RFC 8785) canonical form **excluding the top-level `proof`**, wrapped as a `sha2-256` multihash and base58btc-encoded with a `z` prefix (the W3C `digestMultibase` encoding). This binds the VWC to *a specific edge* rather than to "some activity involving the subject during a trust task." Verifiers compare decoded bytes, never strings. WD01 called the property `digest` and encoded it `sha256:<hex>`; WD02 (spec #19) changed both.
- **`witnessContext`** — OPTIONAL: event name, session ID, verification method (e.g., "in-person-proximity", "video-call").

**One VWC per direction, for VRC pairs and VMC pairs alike.** A witnessed exchange of a complete edge is bidirectional — two edge credentials, one each way, in a single witnessing event. Since WD02 this applies to a membership edge as well as a peer edge: the VWC for the community's grant names the community; the VWC for the member's acknowledgement names the member. See [[witnessed-vrc-exchange]].

**The binding is only as strong as access to the referenced credential.** `credentialSubject.id` and `taskContext` identify the observed party and the exchange, not the edge; a digest without the referenced credential to hand is an opaque hash. Issuers and holders presenting a VWC as evidence of a specific edge SHOULD make that credential available alongside it. Because the digest excludes `proof` and status, a VWC attests the *claims* at the moment of witnessing — not that the credential is still valid or unrevoked.

## Where It Is Going — `main` (Working Draft 0.4.0, not yet tagged or implemented)

On the spec's `main` branch (2026-09-15) the VWC is no longer a concrete type. It is the **`dtg:witnessed` predicate profile of the [[statement-credential|Verifiable Statement Credential]]**: `type` is `StatementCredential`, `credentialSubject.predicate` is `https://firstperson.network/credentials/dtg/v1#witnessed`, and the digest moves to `credentialSubject.object.digestMultibase`. Everything above carries over — `taskContext` REQUIRED, `directed` minimum scope, one VWC per direction, `witnessContext` — with one tightening: **direction binding is unconditional**. WD02 required "subject = issuer of the referenced credential" only for bidirectional exchanges; the profile makes it a rule for every VWC, because a verifier holding a VWC and its referenced credential cannot tell whether that credential was half of a pair. "Witnessed a party *present* or *hold* a credential" is a different predicate. The profile also says what a pass does *not* establish: that the credential is current, that its claims are true, that the exchange completed, that the witness is a member, or that anything is authorised.

## Implementation Status

[[dtg-credentials]] 0.7.0+ implements the WD02 shape: `CredentialSubjectWitness { id, digest_multibase, witness_context }`, serialising as `digestMultibase` and still accepting the WD01 name `digest` on parse; `verify_digest()` compares decoded bytes. The 0.2.0 encoding divergence recorded here previously is closed (the crate moved to the hex form in 0.4.0, then the spec moved to multibase in WD02, adopted in 0.7.0). One gap remains: the crate still treats the digest as **optional** — `new_vwc(.., digest: Option<String>, ..)`, `Option<String>` on the struct, no `MissingDigest` error — although the spec has required it since WD01 PR #14. The VSC form is not implemented.

## Role in Trust Assessment

When traversing the trust graph, witnessed relationships carry more weight than unwitnessed ones. A relationship with an in-person witness attestation from a well-known conference is significantly stronger than a purely online claim. Communities can encode this into their [[verifiable-trust-community|trust policies]] — and on `main` the spec classifies a witness statement explicitly as *evidence*, weighed by the community whose witnessing policy it was issued under.

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[membership-credential]], [[witnessed-vrc-exchange]], [[trust-task-context-binding]], [[statement-credential]]
