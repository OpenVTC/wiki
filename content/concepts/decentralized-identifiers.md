---
title: "Decentralized Identifiers (DIDs)"
type: concept
tags: [did, identity, w3c, standards, did-webs, did-scid, keri, fig]
date-updated: 2026-11-28
sources: [verifiable-trust-infrastructure, verifiable-trust-agent, openvtc, didwebvh-rs, affinidi-tdk, affinidi-webvh-service, dtg-credential-spec, vti-didcomm-js]
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

### did:scid (Portable from birth) — *a full identity since October 2026*

A `did:scid:vh:1` is a did:webvh's self-certifying identifier on its own, without the host in the name. It uses the same verifiable log, but `?src=` is only a hint about where to fetch it, so the identifier never has to change when the log moves. Until October 2026 it was an alias. In the Fig cycle it became an identity the whole stack can hold: the TDK resolves it under its bare DID and keeps a version floor so a host cannot roll it back (TDK #965, #966, #981). It speaks DIDComm as itself, in Rust and in the browser ([[vti-didcomm-js]] 0.13). The VTA, VTC, trust registry, mediator and did-hosting all accept did:scid parties, and [[openvtc]] can create **did:scid personas** (openvtc #503). [[didwebvh-rs]] 0.8.1 does the conversion each way. It is the answer to the DTG spec's warning that a did:webvh is relocatable only if `portable` was set in its first entry.

### did:webs (KERI underneath) — *alpha, November 2026*

`did:webs` publishes a DID document on the web like did:web, but its keys come from a **KERI key event log** (`keri.cesr`). KERI (Key Event Receipt Infrastructure) is a protocol in which an identifier is derived from its first key commitment, and every later rotation is a signed event that must follow the previously committed next keys. A did:webs resolver replays that log, so the keys in the document are only as trustworthy as a verifiable chain of rotations, wherever the document happens to be hosted. That gives it what did:webvh offers (history, pre-rotation, portability) from a different lineage, the one behind vLEI and ACDC credentials in organizational identity.

The TDK had *verified* did:webs since August 2026. In the Fig cycle (2026-11-08 → 11-17) the stack learned to *create, host and act as* one, in this order:

1. **Libraries.** Affinidi's KERI implementation (`affinidi-keri-rs`, 0.4 → 0.8.1, its first coordinated tag) moved to **KERI v2** by default, checked against the Python reference keripy. On top of it, `affinidi-did-webs` reached 0.14, with recovery and a proposed **key role designation** extension that says which key does which job (see [[affinidi-tdk]]).
2. **Hosting.** [[affinidi-webvh-service|did-hosting-service]] lets a did:webs **register itself**, authenticated by its own log (#411, #430).
3. **The VTA and the VTC.** A [[verifiable-trust-agent|VTA]] can create did:webs personas and integrations, and can itself be a key-role did:webs from first boot, rotating its role keys from its log (VTI #2563, #2679, #2685, #2696). A VTC can take a did:webs as its DID (#2698), and a member can rotate onto one (#2517).
4. **Other clients.** The browser resolves and encrypts to did:webs parties (vti-didcomm-js 0.15). The Dart TSP SDK resolves did:webs VIDs with full KEL verification.

VTI's design note `did-webs-keri-v2.md` takes a position on each open KERI v1/v2 question in the did:webs specification. VTI creates only v2 identifiers and reads v1 and mixed streams. The note labels the integration **alpha**: a did:webs created now may have to be created again as the specifications settle, so it should not anchor a trust relationship that must outlive that. The VTI specification's **DID classes** (VTI-KEY-190–192) now admit did:webs for all three classes: relationship, persona and *service* DIDs, the durable identity of a VTA, VTC or host service. This follows dtgwg-vti-spec #121 and #123.

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

Beyond the methods above, the TDK resolves `did:web`, `did:jwk` and `did:scid:ke:1` (August 2026). `did:ethr` and `did:pkh` were re-implemented in-tree (off by default) so that no third-party `ssi-*` crate is compiled anywhere, and `did:cheqd` still parses but is no longer resolved. In the November 2026 hardening sweep every web method was made to check that its decoded domain is a host and each path label a single segment (TDK #1093, #1094). Deactivated did:webs and did:scid:ke identifiers resolve without keys (#1096, #1097).

### Resolution is public-hosts-only by default (September 2026)

A DID document is a list of places to connect to, and for web-hosted methods the DID itself names a host to fetch from. In the SEC-4045 hardening sweep of 2026-09-10 → 09-12 the whole stack adopted the same rule: a resolver, a mediator client or a browser DIDComm stack will only fetch a `did:web` / `did:webvh` log from, and only open a connection to, a **public** host. [[didwebvh-rs]] 0.7.0 made `HostPolicy::PublicOnly` the default (special-use names blocked, a guarded DNS resolver, no proxy); the TDK, the VTI, [[openvtc|OpenVTC]] and [[vti-didcomm-js]] each refuse private, loopback and link-local hosts unless explicitly allowed. The reason is server-side request forgery: a DID document that anyone can publish must not be able to steer a VTA, a mediator or a wallet into probing the network it runs on. Local development needs the private-hosts allowance switched on deliberately.

### A deactivated DID resolves to nothing (October 2026)

The `VTI-Eucalyptus` release (2026-10-07) closed a quieter gap in the same SEC-4045 series: a `did:webvh` (or `did:scid:vh`) whose log ends in deactivation had still *resolved* — to its last document — so a signature by a key that controller had deliberately retired could still verify. The TDK resolver (0.8.39, #907, 2026-09-29) no longer resolves a deactivated DID at all; VTI (#1881), [[openvtc|OpenVTC]] (#400) and the predicate-credential-system repository took the fix the same week, and the [[affinidi-webvh-service|did-hosting-service]] refuses a deactivated signer as final (#252). In the same pass `did:web` and `did:ebsi` refuse a document whose `id` does not match the DID that was asked for (#911). Resolution is no longer only *where* a document may be fetched from, but *whether the identifier is still alive*.

## The Relationship Between DIDs and Keys

In the OpenVTC ecosystem, all keys derive from a single BIP-39 mnemonic seed via [[bip32-key-derivation|BIP-32 derivation]]. This means one backup phrase protects your entire identity. The [[verifiable-trust-agent|VTA]] manages this derivation, creating separate key contexts for different purposes:

- **Persona keys** — your primary identity keys
- **DID management keys** — for updating your did:webvh document
- **Relationship keys** — unique keys for each relationship you establish
- **Application keys** — for specific services and integrations

See also: [[correlation-scope]], [[did-types]], [[did-webvh]], [[trust-spanning-protocol]], [[verifiable-trust-agent]], [[bip32-key-derivation]]
