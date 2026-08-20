---
title: "Witness Credential (VWC)"
type: concept
tags: [credentials, dtg, witness, attestation]
date-updated: 2026-08-19
sources: [dtg-credential-spec, dtg-credentials]
---

# Witness Credential (VWC)

A Verifiable Witness Credential is a third-party attestation that adds credibility to claims in the [[decentralized-trust-graph|Decentralized Trust Graph]]. A witness says "I observed that this specific relationship was established, in this specific exchange."

## What Makes Witnesses Powerful

Two-party claims (like [[relationship-credential|VRCs]]) are only as trustworthy as the two parties involved. A witness adds an independent third-party perspective. This is especially valuable for:

- **In-person verification** — "I met these two people at a conference and can confirm they know each other"
- **Event attestation** — "I witnessed this transaction/interaction at this event"
- **Sybil resistance** — it's hard to fake a witness who was physically present

Since Working Draft 01 of the [[dtg-credential-spec|spec]] the witness need not be a person: it may be **a VTA applying the witnessing policies of a VTC** — for example verifying that both parties were present at the same event, or that each provided proof of biometric liveness. The issuer is therefore an M-DID or the DID of a VTA acting under community policy (the old separate "W-DID" type was dropped — see [[did-types]]).

## What It Contains (WD01)

Beyond standard VC fields:
- **`taskContext`** — REQUIRED: the thread identifier of the trust-task exchange in which the VWC was issued. A VWC "MUST be bound to the trust task exchange in which it was issued." See [[trust-task-context-binding]].
- **`credentialSubject.id`** — REQUIRED: the DID of the **issuer of the VRC being attested** (the observed party), not the recipient.
- **`credentialSubject.digest`** — REQUIRED (since spec PR #14, 2026-08-12): the SHA-256 hash of the attested VRC's JSON, canonicalised with JCS (RFC 8785), encoded as the string `sha256:` followed by the lowercase hex digest. This is what binds the VWC to *a specific edge* rather than to "some activity involving the subject during a trust task."
- **`witnessContext`** — OPTIONAL: event name, session ID, verification method (e.g., "in-person-proximity", "video-call").

**One VWC per direction.** A witnessed exchange of a complete edge is bidirectional — two VRCs, one each way, in a single witnessing event — so the witness SHOULD issue one VWC per direction, each naming the issuer of the VRC it attests. See [[witnessed-vrc-exchange]].

**The binding is only as strong as access to the VRC.** `credentialSubject.id` and `taskContext` identify the observed party and the exchange, not the edge; a `digest` without the referenced VRC to hand is an opaque hash. Issuers and holders presenting a VWC as evidence of a specific edge SHOULD make the referenced VRC available alongside it.

## Implementation Note

The [[dtg-credentials]] crate (0.2.0) implements `taskContext` and digest helpers but encodes the digest as a multibase base58btc multihash (`z…`, the W3C `digestMultibase` convention) rather than the spec's `sha256:<hex>` — same hash, different string, not interoperable in either direction. Flagged in the crate's README as unresolved; to be raised with the DTGWG. The crate also still treats `digest` as optional, which predates spec PR #14.

## Role in Trust Assessment

When traversing the trust graph, witnessed relationships carry more weight than unwitnessed ones. A relationship with an in-person witness attestation from a well-known conference is significantly stronger than a purely online claim. Communities can encode this into their [[verifiable-trust-community|trust policies]].

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[decentralized-trust-graph]], [[trust-task-context-binding]]
