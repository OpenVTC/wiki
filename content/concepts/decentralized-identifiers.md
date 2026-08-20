---
title: "Decentralized Identifiers (DIDs)"
type: concept
tags: [did, identity, w3c, standards]
date-updated: 2026-08-19
sources: [verifiable-trust-infrastructure, openvtc, didwebvh-rs, affinidi-tdk, affinidi-webvh-service, dtg-credential-spec]
---

# Decentralized Identifiers (DIDs)

## What They Are

A Decentralized Identifier (DID) is a globally unique identifier that you create and control yourself — no registration authority required. Unlike an email address (controlled by your email provider) or a social media handle (controlled by the platform), a DID is cryptographically yours. You prove you own it by demonstrating control of the associated private keys.

DIDs are a W3C standard. They look like this:

```
did:webvh:QmExample123:example.com
```

Every DID resolves to a **DID Document** — a JSON file that lists your public keys, how to communicate with you, and what services you offer. Anyone can look up your DID Document and verify that messages or credentials from you are authentic.

## Why They Matter for OpenVTC

The entire OpenVTC ecosystem is built on DIDs. Every participant — every person, every service, every community — has a DID. These identifiers are the nodes in the [[decentralized-trust-graph|Decentralized Trust Graph]]. When someone issues a [[verifiable-credentials|Verifiable Credential]] to you, it's addressed from their DID to yours. When you send a [[didcomm|DIDComm message]], it's encrypted from your DID's keys to the recipient's DID's keys.

## DID Methods in the Ecosystem

A "DID method" defines how a particular type of DID is created, resolved, and updated. The ecosystem uses several:

### did:webvh (Primary)

[[did-webvh|did:webvh]] is the primary DID method for the ecosystem. It extends `did:web` (which simply hosts a DID document at a URL) with a **verifiable history** — a cryptographically signed log of every change to the DID document. This gives you:

- **Portability** — you can move your DID to a new domain without losing your identity, thanks to a Self-Certifying Identifier (SCID)
- **Key rotation** — you can update your keys while proving continuity of identity
- **Pre-rotation** — you can commit to your next key before you need it, preventing key compromise from hijacking your identity
- **Witness proofs** — third parties can attest to the integrity of your DID history

### did:key (Simple)

Used for simple, self-contained identifiers — typically for credential signing keys that don't need the full lifecycle management of did:webvh. A did:key is just a public key encoded as an identifier. No resolution infrastructure needed.

### did:peer (Private)

Used for [[relationship-credential|Relationship DIDs (R-DIDs)]] — private, pairwise identifiers created for individual relationships. When you connect with someone, you create a unique did:peer for that relationship so your primary Persona DID isn't exposed in every interaction.

## DID Type Taxonomy

The DTG specification defines a formal taxonomy of DID types, each serving a specific role. See [[did-types|DID Types in the DTG]] for the full reference. In brief:

- **C-DID** — Community DID (identifies a VTC or VTN)
- **M-DID** — Member DID (identifies an individual within a community)
- **R-DID** — Relationship DID (unique per relationship, for privacy)
- **P-DID** — Persona DID (for selective persona disclosure)

(The earlier W-DID / Witness DID was dropped in the spec's Working Draft 01; witnesses act under an M-DID or as a VTA.)

## Agent Names — human-readable shortcuts for DIDs

A DID is unreadable to humans. Since July 2026 the ecosystem layers **agent names** on top — URLs whose path starts with `/@`, such as `example.com/@alice` or the *community form* `example.com/@` for the VTC that owns the domain. An agent name is a *shortcut layer*, not a DID method: the name URL redirects to a DID, the DID resolves normally, and the DID document **must claim the name back in `alsoKnownAs`** before any software displays it — otherwise anyone could point a name at someone else's DID. The [[affinidi-tdk|TDK]] resolves them (`agent-names` crate, `resolve_any()`), [[affinidi-webvh-service|did-hosting-service]] serves `/@name` redirects and keeps the registry, the [[verifiable-trust-agent|VTA]] manages a persona's names as Trust Tasks, and [[openvtc]] shows a verified name wherever a DID would appear and accepts names wherever a DID is entered.

## How DID Resolution Works

When an application encounters a DID, it needs to resolve it — look up the DID Document to get the public keys and service endpoints. The [[affinidi-tdk|Affinidi TDK]] provides a high-performance DID resolver that:

1. Supports multiple DID methods (webvh, key, peer, etc.)
2. Caches resolved documents locally (claiming 250k+ resolutions/sec from cache)
3. Validates the cryptographic integrity of did:webvh history logs
4. Plugs into the [[didwebvh-rs]] library for webvh-specific resolution

## The Relationship Between DIDs and Keys

In the OpenVTC ecosystem, all keys derive from a single BIP-39 mnemonic seed via [[bip32-key-derivation|BIP-32 derivation]]. This means one backup phrase protects your entire identity. The [[verifiable-trust-agent|VTA]] manages this derivation, creating separate key contexts for different purposes:

- **Persona keys** — your primary identity keys
- **DID management keys** — for updating your did:webvh document
- **Relationship keys** — unique keys for each relationship you establish
- **Application keys** — for specific services and integrations

See also: [[did-types]], [[did-webvh]], [[verifiable-trust-agent]], [[bip32-key-derivation]]
