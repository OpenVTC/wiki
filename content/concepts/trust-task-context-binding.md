---
title: "Trust Task Context Binding (taskContext and taskDigestMultibase)"
type: concept
tags: [credentials, dtg, trust-tasks, spec, witness, vetting]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, verifiable-trust-infrastructure, openvtc]
---

# Trust Task Context Binding (`taskContext` and `taskDigestMultibase`)

Most DTG credentials are produced *inside a protocol exchange* — a witnessed VRC exchange, a vetting session, a community join ceremony, an invitation acceptance. The ecosystem expresses those exchanges as ToIP **[[trust-tasks|Trust Tasks]]**: versioned, signed JSON documents carried over [[trust-spanning-protocol|TSP]], [[didcomm|DIDComm]] or HTTPS. Working Draft 01 of the [[dtg-credential-spec|DTG Credentials Core Specification]] (July 2026) added one small property and one careful rule to connect the two worlds without confusing them. Working Draft 0.5.0 (PR #56, 2026-09-22) made the connection load-bearing: the credential now *binds* to the exchange it cites, through the mechanisms the published Trust Tasks specification defines, rather than merely naming it.

## The two properties

**`taskContext`** — the `id` of the document that initiated the innermost trust-task exchange attesting what the credential states. Not the exchange's `threadId`: the Trust Tasks spec lets an initiator mint a `threadId` unrelated to its `id` and does not require a `threadId` to be unique, whereas a document's `id` is. Where exchanges nest, it names the innermost exchange that attests the event, by the Trust Tasks spec's rule for *naming an exchange from outside the framework*. OPTIONAL on every type; REQUIRED where a credential type or a [[statement-credential|VSC]] predicate profile says so — the `witnessed/1`, `vetted/1` and `presented/1` profiles all do.

**`taskDigestMultibase`** — the *task digest* of the document `taskContext` names: the document with its top-level `proof` removed, JCS-canonicalized, SHA-256, as a base58btc multihash — the same Digest Encoding every other digest in the spec uses, applied to a Trust Task document instead of a credential. REQUIRED wherever `taskContext` is REQUIRED; SHOULD accompany an optional one. The reasoning is one sentence: an `id` names a document without binding anything to it, so anyone can write a different document carrying the same `id`, and a verifier pairing a credential with that document by `id` alone would accept evidence of a different event. `taskContext` locates the exchange; `taskDigestMultibase` binds the credential to it. Verifiers match it against the recomputed digest by decoded bytes.

A predicate whose truth depends on more than one non-nesting trust task is expressed as one VSC per task, each with its own citation — never one credential with several implicit referents.

## The rules

1. **Standalone interpretability.** A DTG credential *without* `taskContext` MUST be interpretable standing alone. The property adds context; it never becomes a dependency.
2. **Outcome interpretability.** A verifier MUST NOT interpret a `taskContext`-bearing credential as proof that the associated trust task or ceremony *completed* unless it also holds matching **outcome evidence** and has verified it. Outcome evidence, and the checks that pair it with the cited exchange, are now defined by the Trust Tasks specification (*Evidence That a Cited Exchange Completed*); a verifier applies those checks taking `taskContext` and `taskDigestMultibase` as the citation. A holder presenting a credential as evidence that the task completed MUST include that evidence; a verifier that does not receive it treats the credential as not evidencing completion, whether or not such evidence exists elsewhere. What a relying party may conclude from credential plus outcome evidence across the rest of an interaction is the VTI specification's business.

The spec's informative test for the boundary the rule protects — **credential or artifact?** "True outside the exchange? → credential. Only meaningful inside the exchange? → artifact." Credentials go in the DTG; artifacts (receipts, verdicts, completion records) belong to the trust-task protocol, and a VSC predicate profile is admitted only if its predicate passes the credential side. The [[delegation-credential|VDC]] is the clearest illustration: the delegation *grant* is true standing alone and is a credential; the *invocation* is meaningful only inside its exchange and is an artifact. Exercising a [[authority-credential|VAC]] splits the same way. The spec states the minimum companion version this binding depends on: **Trust Tasks Document Status 0.4.0** for the citation mechanics, with the outcome-evidence minimum recorded as pending until that definition is released.

## Why it exists

The witnessed-exchange work made the gap visible: a witness observes *a session*, and the [[witnessed-vrc-exchange]] protocol had always carried a session id — but nothing in the credential model let a VWC say which session it attests, so a VWC could float free of the exchange it came from. `taskContext` is that anchor, and `taskDigestMultibase` is what stops the anchor being swapped. Paired with `object.digestMultibase` (the specific edge credential being witnessed), a `witnessed/1` statement identifies *the exchange* and *the edge*; `credentialSubject.id` identifies the observed party. The same structure carries a `vetted/1` statement: a vetter's record of an identity check cites the `vetting/session` document the check happened in, which is what a dispute would examine, even though the statement remains true afterwards.

The rule against outcome-inference is the other half: it stops verifiers from treating "this VMC names join ceremony X" as "join ceremony X succeeded" — the success evidence is a separate, verifiable artifact.

**A privacy cost, recorded.** `taskContext` and `taskDigestMultibase` have the same values on every presentation of a credential, so they link those presentations even where everything else is proven in zero knowledge. The spec notes that a *committed* form of the citation, opened in proof against an exchange the verifier already holds, is under consideration — carried beside the two properties or by a profile replacing them.

## Credentials secured with Data Integrity

The same PR fixed how a DTG credential is signed: `proof` MUST be a W3C Data Integrity proof (`proof.type: DataIntegrityProof`) with the cryptosuite named in `proof.cryptosuite`, so that changing suite changes a value rather than the schema. `eddsa-jcs-2022` is RECOMMENDED because its JCS transformation needs no `@context` resolution at verification time — a credential formed in person and synchronized later stays verifiable offline — and it is the canonicalization the digests already use. Selective-disclosure and ZK mechanisms are carried in addition to this proof, as the governing framework determines.

## In the implementation (Eucalyptus)

[[dtg-credentials]] 0.11.0 (2026-09-22) added `DTGCommon::task_digest_multibase`, `task_digest_multibase_json(document)` (deliberately distinct from Trust Tasks' *step digest*, which includes the `proof`), `with_task_citation(&document)` to set both members from one document on any credential type, and `cites_task(&document)`, which checks the `id` and recomputes the digest — a credential with no `taskDigestMultibase` is `Ok(false)`, never an `id`-only match. Its test vector is not the crate's own: it reproduces the `taskDigestMultibase` printed in the `vetting/session/0.1` specification and verifies the Vetting Statement printed there. 0.12.0 made the digest REQUIRED wherever a core profile requires `taskContext` (`MissingTaskDigest`), and `new_witnessed_vsc` / `new_vetted_vsc` read both members from the session document so they cannot disagree.

In the [[verifiable-trust-infrastructure|VTI]] and [[openvtc|OpenVTC]] the citation is now everywhere a statement is made inside an exchange: the vetter's `vetted/1` statement cites the `vetting/session` document (the OpenVTC desk keeps the signed session and cannot attest a session without it; the applicant refuses a statement that does not cite the session it received); the community's own `vetted/1` identity check cites the `vtc/endorsements/issue` request that produced it; and the VTC enforces the binding on ingest rather than merely carrying the fields (since VTI #1178). The Keyring wallet's conformance inventory flagged, as of September, that its vetting statement carried no `taskDigestMultibase` and that the upstream verifier did not yet check it — the gap the 0.11/0.12 releases closed on the Rust side.

See also: [[witness-credential]], [[statement-credential]], [[witnessed-vrc-exchange]], [[peer-identity-vetting]], [[dtg-credentials-overview]], [[verifiable-credentials]], [[trust-tasks]]
