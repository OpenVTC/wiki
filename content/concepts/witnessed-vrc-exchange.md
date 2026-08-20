---
title: "Witnessed VRC Exchange Protocol"
type: concept
tags: [protocol, witness, vrc, flow, didcomm]
date-updated: 2026-08-19
sources: [dtg-credential-spec, dtg-credentials]
---

# Witnessed VRC Exchange Protocol

The Witnessed Session-Based VRC Exchange (v0.2, kept as supporting material in the DTG task-force repo; its per-direction VWC pattern became normative in the [[dtg-credential-spec|spec]]'s Working Draft 01) is a five-phase protocol for creating [[relationship-credential|Relationship Credentials (VRCs)]] with third-party [[witness-credential|Witness]] attestation. It ensures that both the relationship and the witness proof are cryptographically bound to a specific session.

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
2. Each VWC carries a `taskContext` naming this session's trust-task thread and (since WD01, REQUIRED) a `digest` of the witnessed VRC — SHA-256 over its JCS canonical form, encoded `sha256:<hex>` — with `credentialSubject.id` set to the issuer of that VRC; see [[witness-credential]] and [[trust-task-context-binding]]
3. Distribution is cross-wise: Alice receives the VWC witnessing Bob's VRC, and Bob receives the VWC witnessing Alice's VRC

### Phase 5: Verification

At the end, each party holds:
- Their counterparty's VRC (the trust attestation)
- A VWC from the Witness attesting that the VRC was created during the specific session

Anyone verifying the relationship later can check both the VRC (peer attestation) and the VWC (third-party attestation of the exchange).

## Trust Implications

Witnessed VRCs carry significantly more weight in the [[decentralized-trust-graph|trust graph]] than standard VRCs because:
- A third party independently verified the exchange happened
- The session binding prevents replay or backdating
- The verification method in the VWC (e.g., "in-person-proximity") describes the context

This protocol is particularly important for bootstrapping trust in new communities, where the initial relationships need stronger evidence.

See also: [[relationship-credential]], [[witness-credential]], [[didcomm]], [[decentralized-trust-graph]]
