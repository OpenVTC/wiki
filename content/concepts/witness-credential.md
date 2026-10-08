---
title: "Witness Credential (VWC) — the witnessed/1 statement"
type: concept
tags: [credentials, dtg, witness, attestation, statement, predicate]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, verifiable-trust-infrastructure, openvtc, keyring-wallet]
---

# Witness Credential (VWC) — the `witnessed/1` statement

A Verifiable Witness Credential is a third-party attestation that adds credibility to claims in the [[decentralized-trust-graph|Decentralized Trust Graph]]. A witness says "I observed that this specific edge credential was issued, in this specific exchange." Since Working Draft 0.4.0 of the [[dtg-credential-spec|spec]] (2026-09-15) — and in every Eucalyptus implementation — **the VWC is not a credential type.** It is a [[statement-credential|Statement Credential]] under the **`dtg:witnessed` predicate profile**, `https://registry.trustoverip.org/dtg/vsc/witnessed/1`. The name VWC survives for the profile; the type string `WitnessCredential` does not.

## What Makes Witnesses Powerful

Two-party claims (like [[relationship-credential|VRCs]]) are only as trustworthy as the two parties involved. A witness adds an independent third-party perspective. This is especially valuable for:

- **In-person verification** — "I met these two people at a conference and can confirm they know each other"
- **Event attestation** — "I witnessed this transaction/interaction at this event"
- **Sybil resistance** — it's hard to fake a witness who was physically present

The witness need not be a person: it may be **a VTA applying the witnessing policies of a VTC** — verifying that both parties were at the same event, or that each gave proof of biometric liveness. The issuer is the witness's own identifier — a member's, or a VTA's under community policy — whose declared [[correlation-scope|`issuerScope`]] must be **`directed` at minimum**: a witness has to be recognizable to both parties and to the community whose policy applies, so `pairwise` cannot describe it truthfully. (The old separate "W-DID" type was dropped in WD01; see [[did-types]].)

## What a `witnessed/1` statement contains

The profile's normative definition is its entry in the DTG VSC Predicate Registry; the spec (since #71) says only how its requirements engage the spec's own mechanisms. On the wire:

- `type` — `["VerifiableCredential", "DTGCredential", "StatementCredential"]`; `@context` the W3C v2 context then `https://registry.trustoverip.org/dtg/context/v1`
- `issuer` / `issuerScope` — the witness, `directed` or `public`
- **`taskContext`** — REQUIRED: the `id` of the document that opened the exchange in which the witnessing happened (for the `witness/session/0.1` Trust Task, the session document's `id`)
- **`taskDigestMultibase`** — REQUIRED (#56, WD 0.5.0): the task digest of that document, so the statement is bound to the exact session it cites rather than to an `id` anyone could reuse. See [[trust-task-context-binding]].
- `credentialSubject.id` — the DID of the **issuer of the edge credential being attested** (the observed party), unconditionally. WD02 required "subject = issuer of the referenced credential" only for bidirectional exchanges; the profile makes it a rule for every VWC, because a verifier holding a VWC and its referenced credential cannot tell whether that credential was half of a pair. "Witnessed a party *present* a credential" is a different predicate — the registry's **`presented/1`**, whose subject is the referenced credential's *subject*.
- `credentialSubject.predicate` — `https://registry.trustoverip.org/dtg/vsc/witnessed/1`, as an absolute IRI
- `credentialSubject.object.digestMultibase` — REQUIRED: the digest of the witnessed edge credential — SHA-256 over its JCS canonical form **excluding the top-level `proof`**, as a base58btc `sha2-256` multihash. (WD01 called the property `digest` with `sha256:<hex>`; WD02 moved it to `credentialSubject.digestMultibase`; the profile moved it under `object`.) Verifiers compare decoded bytes, never strings.
- `credentialSubject.witnessContext` — OPTIONAL: `event`, `sessionId`, `method` (e.g. `in-person-proximity`, `video-call`), all defined as terms in the v1 context, so adding a member would be a new context version.

**One VWC per direction, for VRC pairs and VMC pairs alike.** A witnessed exchange of a complete edge is bidirectional — two edge credentials, one each way, in a single witnessing event — and the witness SHOULD issue one statement per direction. For a membership edge the VWC for the community's grant names the community; the VWC for the member's acknowledgement names the member. See [[witnessed-vrc-exchange]].

**The binding is only as strong as access to the referenced credential.** A digest without the referenced credential to hand is an opaque hash, so issuers and holders presenting a VWC as evidence of a specific edge SHOULD make that credential available alongside it. Because the digest excludes `proof` and status, a VWC attests the *claims* at the moment of witnessing — not that the credential is still valid or unrevoked.

**What a pass establishes, and does not.** That the witness observed the subject issue those claims in that exchange. Not that the credential is current, that its claims are true, that the exchange completed (that needs the Trust Task's outcome evidence), that the witness is a member, or that anything is authorized. A witness statement is *evidence*, weighed by the community whose witnessing policy it was issued under — and, like every VSC, it is accepted only by a verifier configured for its predicate.

## Implementation Status (Eucalyptus)

[[dtg-credentials]] went through the change in three releases. 0.11.0 (2026-09-22) added `taskDigestMultibase` and `new_vwc_for_session`, which reads both `taskContext` and the task digest from the `witness/session` document so the pair cannot disagree, and finally made the edge digest REQUIRED (closing a gap recorded here since 0.2.0). **0.12.0** (2026-09-30) removed `WitnessCredential` outright — `CredentialSubjectWitness`, `new_vwc`, `new_vwc_for_session` are gone and the type is refused at parse — and replaced it with `new_witnessed_vsc(issuer, scope, &edge_credential_json, &session, from, until, witness_context)`, which reads the subject *and* the digest from the edge credential so the profile's subject–object rule holds by construction; `witnesses_issuance_of(&credential)` is the verifier-side check, `witnesses_presentation_of` its `presented/1` counterpart, and a `PredicateAcceptList` decides whether a verifier accepts the predicate at all. `WitnessContext` stays as the `witnessed/1` subject member.

The [[verifiable-trust-infrastructure|VTI]] community service (#1859) reads witness evidence in its personhood policy as a `StatementCredential` under `witnessed/1` with the digest at `object.digestMultibase`, and refuses to *issue* `witnessed/1` itself (`predicateNotIssuable`) — a witness statement is made by the party that ran the exchange, never by the community. [[openvtc|OpenVTC]] (#397) accepts it through the same fail-closed core list. The Berkman Klein [[keyring-wallet|Keyring]] wallet, whose witness server was the ecosystem's main VWC issuer and whose implementation feedback shaped the WD01 digest rules, has a merged plan (`docs/plans/vsc-migration-plan.md`, 2026-09-18) to move its witness credential to `dtg:witnessed`; its findings — the name survives, the type string goes; detection becomes a predicate question; JSON-LD terms must exist before members are signed — are summarized on [[statement-credential]].

## Role in Trust Assessment

When traversing the trust graph, witnessed relationships carry more weight than unwitnessed ones. A relationship with an in-person witness attestation from a well-known conference is significantly stronger than a purely online claim. Communities encode this into their [[verifiable-trust-community|trust policies]] — the spec classifies a witness statement explicitly as *evidence*, weighed by the community whose witnessing policy applies, and it never establishes an edge or a status by itself.

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[membership-credential]], [[witnessed-vrc-exchange]], [[trust-task-context-binding]], [[statement-credential]], [[endorsement-credential]]
