---
title: "Decentralized Identifiers (DIDs)"
type: concept
tags: [did, identity, w3c, standards]
date-updated: 2026-09-18
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

Used for per-relationship identifiers — private, pairwise identifiers created for individual [[relationship-credential|relationships]]. When you connect with someone, you create a unique did:peer for that relationship so your persona identifier isn't exposed in every interaction.

## From DID Types to Correlation Scope

Until September 2026 the DTG specification typed its identifiers — **C-DID** (community), **M-DID** (member), **R-DID** (relationship), **P-DID** (persona); the earlier W-DID was dropped in WD01. **Working Draft 02 retired all four** ([[did-types]] keeps the history). Each name bundled *what the identifier is attached to* — already said by the credentials it appears in — with *how widely it may be correlated*, and the two disagreed as soon as one identifier did two jobs. What remains is the second axis alone, as a holder's declaration: a **[[correlation-scope]]** of `pairwise` (one counterparty), `directed` (a chosen set — where personas live) or `public` (unbounded — the only truthful scope for a community's identifier). Roles are conferred by credentials; scope is declared by the holder; a verifier must never infer scope from the DID method or the identifier's value.

## What the DTG Needs from a DID Method (WD02)

The spec mandates no DID method, but WD02 added an informative *DID Method Considerations* section stating what it relies on one for — in terms of the identifier's job, so any method can be judged:

- **Durable identifiers** — a community's, a member's for the life of a membership, a witnessing VTA's — need **verifiable key history** (which key was authoritative *when a credential was signed*, since DTG credentials are presented long after issuance), **rotation without changing the identifier**, **pre-rotation**, **independence from a single operator or hosting location**, and **discoverable service endpoints**. [[did-webvh|did:webvh]] satisfies the first three; independence must be confirmed separately, because `did:webvh` is relocatable only if `portable` was set in the *first* log entry (methods like `did:scid` avoid the choice). Plain `did:web` provides neither history nor a successor-key commitment, so a verifier cannot tell a legitimate rotation from an attacker's substitution.
- **Narrow-scope identifiers** (`pairwise`, `directed`) need **cheap creation with no registration step**, **no shared resolution origin**, and **no dependency on infrastructure that observes their use** — a party that resolves, or acts as DID-log witness for, many of a person's pairwise identifiers can correlate them regardless of the credentials. `did:peer` and `did:key` fit; anything published at a common web origin does not.
- **Durability and scope are chosen independently.** A `pairwise` identifier toward a community must still stay verifiable for the life of the membership. Expect to **mix methods** — durable issuers on `did:webvh`, subjects on `did:key`/`did:peer`, as the spec's own examples now do — rather than seeking one method for every role. Choosing a method is a privacy decision as much as a key-management one.

## Agent Names — human-readable shortcuts for DIDs

A DID is unreadable to humans. Since July 2026 the ecosystem layers **agent names** on top — URLs whose path starts with `/@`, such as `example.com/@alice` or the *community form* `example.com/@` for the VTC that owns the domain. An agent name is a *shortcut layer*, not a DID method: the name URL redirects to a DID, the DID resolves normally, and the DID document **must claim the name back in `alsoKnownAs`** before any software displays it — otherwise anyone could point a name at someone else's DID. The [[affinidi-tdk|TDK]] resolves them (`agent-names` crate, `resolve_any()`), [[affinidi-webvh-service|did-hosting-service]] serves `/@name` redirects and keeps the registry, the [[verifiable-trust-agent|VTA]] manages a persona's names as Trust Tasks, and [[openvtc]] shows a verified name wherever a DID would appear and accepts names wherever a DID is entered.

## How DID Resolution Works

When an application encounters a DID, it needs to resolve it — look up the DID Document to get the public keys and service endpoints. The [[affinidi-tdk|Affinidi TDK]] provides a high-performance DID resolver that:

1. Supports multiple DID methods (webvh, key, peer, web, webs, scid, jwk, …)
2. Caches resolved documents locally (claiming 250k+ resolutions/sec from cache)
3. Validates the cryptographic integrity of did:webvh history logs
4. Plugs into the [[didwebvh-rs]] library for webvh-specific resolution

### Other methods the resolver understands

Beyond the three methods above, the TDK resolves `did:web`, `did:jwk`, `did:scid` (`vh:1`, and since August 2026 `ke:1`) and — new in the Dogwood cycle — **`did:webs`**, whose key state is verified through a KERI event log and whose designated aliases surface as `alsoKnownAs`. `did:ethr` and `did:pkh` were re-implemented in-tree (off by default) so that no third-party `ssi-*` crate is compiled anywhere; `did:cheqd` still parses but is no longer resolved.

### Resolution is public-hosts-only by default (September 2026)

A DID document is a list of places to connect to, and for web-hosted methods the DID itself names a host to fetch from. In the SEC-4045 hardening sweep of 2026-09-10 → 09-12 the whole stack adopted the same rule: a resolver, a mediator client or a browser DIDComm stack will only fetch a `did:web` / `did:webvh` log from, and only open a connection to, a **public** host. [[didwebvh-rs]] 0.7.0 made `HostPolicy::PublicOnly` the default (special-use names blocked, a guarded DNS resolver, no proxy); the TDK, the VTI, [[openvtc|OpenVTC]] and [[vti-didcomm-js]] each refuse private, loopback and link-local hosts unless explicitly allowed. The reason is server-side request forgery: a DID document that anyone can publish must not be able to steer a VTA, a mediator or a wallet into probing the network it runs on. Local development needs the private-hosts allowance switched on deliberately.

## The Relationship Between DIDs and Keys

In the OpenVTC ecosystem, all keys derive from a single BIP-39 mnemonic seed via [[bip32-key-derivation|BIP-32 derivation]]. This means one backup phrase protects your entire identity. The [[verifiable-trust-agent|VTA]] manages this derivation, creating separate key contexts for different purposes:

- **Persona keys** — your primary identity keys
- **DID management keys** — for updating your did:webvh document
- **Relationship keys** — unique keys for each relationship you establish
- **Application keys** — for specific services and integrations

See also: [[correlation-scope]], [[did-types]], [[did-webvh]], [[verifiable-trust-agent]], [[bip32-key-derivation]]
