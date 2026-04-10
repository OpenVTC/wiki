---
title: "did:webvh — Web DIDs with Verifiable History"
type: concept
tags: [did, did-webvh, identity, dif]
date-updated: 2026-04-09
sources: [didwebvh-rs, affinidi-webvh-service, openvtc]
---

# did:webvh — Web DIDs with Verifiable History

## What It Is

`did:webvh` is a [[decentralized-identifiers|DID method]] that combines the simplicity of hosting a DID document on the web with the security of a cryptographically verifiable history log. It's specified by the Decentralized Identity Foundation (DIF) and is the primary DID method used throughout the OpenVTC ecosystem.

The "vh" stands for **Verifiable History** — the key innovation over plain `did:web`.

## The Problem with did:web

Plain `did:web` is simple: your DID document lives at a URL on your domain. Anyone can resolve it by fetching that URL. But it has serious weaknesses:

- **No history** — if someone compromises your server and changes your DID document, there's no way to detect it
- **No portability** — your DID is tied to your domain; move domains and you lose your identity
- **No key rotation proof** — you can update your keys, but there's no verifiable chain proving continuity
- **DNS dependency** — whoever controls the domain controls the identity

## How did:webvh Fixes This

did:webvh adds a **verifiable history log** — a JSONL file (`did.jsonl`) hosted alongside the DID document. Each entry in the log is:

1. Cryptographically signed by the DID controller
2. Hash-chained to the previous entry (like a blockchain, but for one identity)
3. Timestamped
4. Optionally witnessed by third parties

This gives you:

### Self-Certifying Identifier (SCID)

Every did:webvh includes a SCID — a hash derived from the initial DID document. This SCID stays constant even if you move to a new domain, making the identity **portable**. The DID looks like:

```
did:webvh:QmSCIDhash:example.com:path
```

The SCID also generates a `did:scid:vh` alias that's completely domain-independent.

### Pre-rotation

You can commit to your next public key *before* you need it, by including its hash in the current log entry. If your current key is compromised, the attacker can't rotate to a key they control — only the pre-committed key is valid. This is a powerful defense against key compromise.

### Witness Proofs

Third parties (witnesses) can sign log entries to attest that they observed the update. This creates multi-party verification — even if someone compromises your server *and* your keys, the witnesses would need to be compromised too.

### Domain Migration

Because of the SCID, you can move your DID to a new domain while maintaining identity continuity. The history log proves the chain of custody across domains.

## How It Works in Practice

When a user sets up [[openvtc-cli|OpenVTC]]:

1. The [[verifiable-trust-agent|VTA]] generates keys from the user's BIP-32 seed
2. A did:webvh is created with the initial DID document and history log
3. The `did.jsonl` file is hosted on the domain of the user's choice (their own, or via a provider like the [[affinidi-webvh-service]])
4. Key rotations, service endpoint changes, and other updates are appended as new log entries
5. Optional witnesses attest to the integrity of updates

When someone resolves the DID:

1. The resolver fetches the `did.jsonl` file
2. It validates every log entry in the chain — checking signatures, hash links, timestamps, and witness proofs
3. It returns the current DID document, with confidence in the complete history

## Implementation

- [[didwebvh-rs]] — the Rust library implementing the did:webvh specification (creation, resolution, update, validation, witness management)
- [[affinidi-webvh-service]] — the production service infrastructure for hosting and resolving did:webvh identifiers at scale

See also: [[decentralized-identifiers]], [[didwebvh-rs]], [[affinidi-webvh-service]]
