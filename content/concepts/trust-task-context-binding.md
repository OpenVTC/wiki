---
title: "Trust Task Context Binding (taskContext)"
type: concept
tags: [credentials, dtg, trust-tasks, spec, witness]
date-updated: 2026-08-19
sources: [dtg-credential-spec, dtg-credentials]
---

# Trust Task Context Binding (`taskContext`)

Most DTG credentials are produced *inside a protocol exchange* — a witnessed VRC exchange, a community join ceremony, an invitation acceptance. The ecosystem expresses those exchanges as ToIP **Trust Tasks**: versioned JSON documents with a thread identifier, carried over [[trust-spanning-protocol|TSP]], [[didcomm|DIDComm]] or HTTPS. Working Draft 01 of the [[dtg-credential-spec|DTG Core Credentials spec]] (July 2026) added one small property and one careful rule to connect the two worlds without confusing them.

## The Property

Every DTG credential's base structure MAY carry **`taskContext`**: the identifier (`threadId`) of the trust-task exchange in which the credential was issued. It is OPTIONAL on all six types and **REQUIRED on the [[witness-credential|Witness Credential]]** — a VWC "MUST be bound to the trust task exchange in which it was issued."

## The Rules

1. **Standalone interpretability.** A DTG credential *without* `taskContext` MUST be interpretable standing alone. The property adds context; it never becomes a dependency.
2. **Outcome interpretability.** A verifier MUST NOT interpret a `taskContext`-bearing credential as proof that the associated trust task or ceremony *completed* unless the matching trust-task outcome evidence is also present and verified. Knowing *which* exchange a credential came from is not knowing *how it ended*.

The spec offers an informative test for the boundary the rule protects — **credential or artifact?** "True outside the exchange? → credential. Only meaningful inside the exchange? → artifact." Credentials go in the DTG; artifacts (receipts, verdicts, completion records) belong to the trust-task protocol and its planned companion spec, *DTG Core Trust Task Protocols*, which will define offer / issue / request / present / revoke and the completion artifact that `taskContext` points at.

## Why It Exists

The witnessed-exchange work made the gap visible: a witness observes *a session*, and the [[witnessed-vrc-exchange]] protocol had always carried a session/thread id — but nothing in the credential model let a VWC say which session it attests, so a VWC could float free of the exchange it came from. `taskContext` is that anchor. Paired with the now-REQUIRED `digest` (a JCS/SHA-256 hash of the specific VRC being witnessed), a VWC identifies *the exchange* and *the edge*; `credentialSubject.id` identifies the observed party.

The rule against outcome-inference is the other half: it stops verifiers from treating "this VMC names join ceremony X" as "join ceremony X succeeded" — the success evidence is a separate, verifiable artifact.

## In the Implementation

[[dtg-credentials]] 0.2.0 added `taskContext` to `DTGCommon` and made it required on VWC construction and deserialisation (`MissingTaskContext`). This fixed a live bug: before 0.2.0 the field was silently dropped on deserialise, so issuers signed one document and verifiers hashed another. In the [[verifiable-trust-infrastructure|VTI]] and [[openvtc]], the thread id is simply the Trust-Task document id the ceremony already uses.

See also: [[witness-credential]], [[witnessed-vrc-exchange]], [[dtg-credentials-overview]], [[verifiable-credentials]]
