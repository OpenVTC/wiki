---
title: "Witnessed VRC Exchange Protocol"
type: concept
tags: [protocol, witness, vrc, flow, didcomm, trust-tasks, fig]
date-updated: 2026-11-28
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure, keyring-wallet]
---

# Witnessed VRC Exchange Protocol

The Witnessed Session-Based VRC Exchange (v0.2, kept as supporting material in the DTG task-force repo; its per-direction VWC pattern became normative in the [[dtg-credential-spec|spec]]'s Working Draft 01, and Working Draft 02 extended it to witnessed VMC pairs as well) is a five-phase protocol for creating [[relationship-credential|Relationship Credentials (VRCs)]] with third-party [[witness-credential|Witness]] attestation. It ensures that both the relationship and the witness proof are cryptographically bound to a specific session.

## Why Witnessed Exchange?

A standard VRC exchange involves two parties attesting to each other. But how does a third party know the exchange actually happened? The witnessed exchange adds a Witness who observes the credential creation in real time and produces cryptographic proof that it occurred during a specific session — for example, an in-person meetup or a video call.

## The Five Phases

### Phase 1: Session Creation

1. A requester asks a Witness to create a session
2. The Witness generates a cryptographic nonce (the **Session Challenge**)
3. The Witness sends a `request-presentation` message to both parties via [[didcomm|DIDComm]]

### Phase 2: Credential Creation & Wrapping

1. Each party independently mints a standard VRC (addressed to the counterparty)
2. Each party wraps their VRC in a **Verifiable Presentation (VP)** signed with the Witness's Session Challenge
3. Each party submits their wrapped VP to the Witness

### Phase 3: Witness Verification

The Witness performs three checks on each submission:

- **Context Check** — the VP signature matches the session nonce (proves it was created for this session)
- **Identity Check** — the VRC signature belongs to the stated issuer (proves authenticity)
- **Freshness Check** — the VRC's `validFrom` timestamp is within session tolerance (e.g., +/- 5 minutes, proves the credential was freshly minted)

### Phase 4: Credential Distribution

1. The Witness mints two [[witness-credential|Witness Credentials (VWCs)]] — one for each observed VRC
2. Each VWC is a [[statement-credential|Statement Credential]] under the `witnessed/1` predicate (since Working Draft 0.4.0, and in every implementation since Eucalyptus). It carries `taskContext`, the `id` of the document that opened this session (not a thread id, corrected in spec #56), with a REQUIRED `taskDigestMultibase` of that document. It also carries `object.digestMultibase`, the digest of the witnessed VRC: SHA-256 over its JCS canonical form *excluding `proof`*, as a base58btc multihash (WD01 used `digest` = `sha256:<hex>`). `credentialSubject.id` is unconditionally the *issuer* of that VRC. See [[witness-credential]] and [[trust-task-context-binding]]
3. Distribution is cross-wise: Alice receives the VWC witnessing Bob's VRC, and Bob receives the VWC witnessing Alice's VRC

### Phase 5: Verification

At the end, each party holds:
- Their counterparty's VRC (the trust attestation)
- A VWC from the Witness attesting that the VRC was created during the specific session

Anyone verifying the relationship later can check both the VRC (peer attestation) and the VWC (third-party attestation of the exchange) — provided the VRC is to hand, since a digest without its referenced credential is an opaque hash. The witness's identifier must be `directed` at minimum ([[correlation-scope]]): it has to be recognizable to both parties and to the community whose witnessing policy applies.

## As implemented (Fig)

The five phases are now Trust Tasks rather than the DIDComm `request-presentation` messages of the task-force write-up. The session is **`witness/session`** and the submission **`witness/session/submit`**, both served **only at 0.2** since the Fig cycle, with the member's presentation (`memberPresentation`) a spec member rather than an `ext` carriage (VTI #2147, #2334). In [[openvtc|OpenVTC]] the member's **VTA is the witnessed party** (`vta/witness/{open,present,accept}`). It builds the presentation, verifies the witness's answer as the witness's own (so a forged refusal cannot end a session), and stores the resulting VWC. The client carries the documents to the witness over the relationship DID's own connection, choosing TSP over DIDComm and never REST (#494). Witnessings sync across a member's devices through the VTA's app state (#495). The outcome evidence a later personhood assertion needs travels as `outcomeEvidence` in `vtc/members/personhood/assert/0.2` (#496). The [[keyring-wallet|Keyring]] phone wallet runs its own witness server, which issues `witnessed/1` statements by default since release 242 and answers a TSP request in the TSP version it arrived in. It can also upgrade an existing relationship in place by adding a witness (keyring-bifold #471).

## Trust Implications

Witnessed VRCs carry significantly more weight in the [[decentralized-trust-graph|trust graph]] than standard VRCs because:
- A third party independently verified the exchange happened
- The session binding prevents replay or backdating
- The verification method in the VWC (e.g., "in-person-proximity") describes the context

This protocol is particularly important for bootstrapping trust in new communities, where the initial relationships need stronger evidence.

See also: [[relationship-credential]], [[witness-credential]], [[didcomm]], [[decentralized-trust-graph]]
