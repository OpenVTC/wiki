---
title: "Affinidi Trust Development Kit (TDK)"
type: entity
tags: [affinidi, tdk, library, messaging, did-resolution, bbs, openid4vc, agent-names, tsp, did-webs, post-quantum, secondary, cypress, dogwood, eucalyptus]
date-updated: 2026-09-18
repo: https://github.com/affinidi/affinidi-tdk-rs
---

# Affinidi Trust Development Kit (TDK)

*Repo: [github.com/affinidi/affinidi-tdk-rs](https://github.com/affinidi/affinidi-tdk-rs)*

The Affinidi TDK is a comprehensive Rust toolkit providing identity, messaging, and credential primitives for the OpenVTC ecosystem. It's the foundational library that higher-level projects depend on for DID resolution, secure communication, and cryptographic operations.

## Key Components

### DID Resolution (`affinidi-did-resolver`)
High-performance [[decentralized-identifiers|DID]] resolution with local and network caching:
- 250k+ resolutions per second from cache
- Pluggable DID method support: did:webvh (via [[didwebvh-rs]]), did:web, did:key, did:peer, did:jwk, did:scid (`vh:1` and, since August 2026, `ke:1`), **did:webs** (KERI-verified key state, new August 2026), did:ethr / did:pkh (re-implemented in-tree, off by default), did:ebsi. did:cheqd *parses* but is no longer resolved (retired September 2026 to clear eight advisories rooted in the abandoned `ssi-*` stack)
- **Public-hosts-only by default** since September 2026: did:web and did:webvh resolution refuse loopback/private/link-local/metadata targets (one `with_host_policy(HostPolicy::AllowPrivate)` setting opts local stacks back in); a raw did:webvh log cache on the cache server stops hot DIDs hammering their host

### Egress guard (`affinidi-net-guard`) — *new September 2026*
A leaf crate (no `affinidi-*` dependencies, so [[didwebvh-rs]] and external clients can use it) that vets attacker-influenceable URLs — a `did:web` host, a service endpoint, a redirect `Location` — against loopback, private, CGNAT, link-local and cloud-metadata space, *and* installs a DNS resolver that refuses any non-routable answer and pins the connection to the checked addresses (closing DNS rebinding). Documented in ADR 0006; now underneath the mediator's forwarding client.

### Messaging (`affinidi-messaging`)
Secure messaging built on [[didcomm|DIDComm v2.1]] — and, since August 2026, DIDComm **v1** for interop with Aries/Credo-lineage wallets:
- SDK, mediator/relay service, and terminal chat client
- Authcrypt and anoncrypt packing; since 0.19.0 (July 2026) **unpack accepts only authenticated envelopes by default** (`authcrypt`, `authcrypt(sign)`, `anoncrypt(authcrypt)`) and enforces `from == skid`
- Message forwarding and routing; cross-mediator forwarding when the next hop is a DID — federation of independent mediators is documented in `docs/multi-mediator.md` (September 2026), and DIDComm v2 mediation is **DID-addressed with no keylist** (`docs/mediation-and-routing.md`; the keylist exists only for DIDComm v1)
- Production features: circuit breakers, per-IP *and* per-DID rate limiting (429s that name the refusing service), graceful shutdown, `explicit_allow` ACL mode gating authentication; since 0.25 every refused delivery answers one uniform `delivery.refused` so an unauthenticated sender cannot probe which ACL rule turned it away

### Reliable delivery (`affinidi-messaging-core`, `affinidi-messaging-delivery`) — *new July 2026*
The transport-neutral contracts and the reliability layer above them. `affinidi-messaging-core` defines `MessagingProtocol` (packing) and the `MessageTransport` trait (truthful `send` → hop-acceptance receipt, re-falsifiable connection state, `inbound()` + `ack()` *after* durable handoff). `affinidi-messaging-delivery` adds a durable **outbox** (`Queued → Sent → Delivered | Unconfirmed | Failed`), a `MessagingService` front-end (`send(BestEffort|Guaranteed)`, thread-correlated `request`, `subscribe`), delivery evidence (outbox-drain, layer-receipt, protocol-reply), escalate-on-expiry, multi-transport and multi-identity operation, and a conformance suite. This is what the [[verifiable-trust-agent|VTA]], the VTC service, and [[openvtc]] now run their messaging on.

### Agent names (`agent-names`) — *new July 2026*
Human-memorable handles for DIDs — `example.com/@alice`, or the community form `example.com/@` — implemented as a *shortcut layer*, not a DID method: the name URL redirects to a DID, the DID resolves normally, and the DID document **must claim the name back in `alsoKnownAs`** (typed in `affinidi-did-common` 0.4) before it is ever displayed. Exposed via `resolve_any()` in the resolver cache SDK, an opt-in `resolve-name` endpoint on the cache server (rate-limited by the new `affinidi-rate-limit` crate), and display-name shortcuts. See [[decentralized-identifiers]].

### Trust Spanning Protocol (`affinidi-tsp`)
Implementation of the Trust over IP [[trust-spanning-protocol|TSP]] specification — since 0.2.0 (September 2026) **specification Rev 3**, which shares no frame with Rev 2 (no compatibility mode, no negotiation):
- **HPKE-Base** encryption (RFC 9180 mode `0x00`; Rev 2 used HPKE-Auth) with sender authenticity carried by the ESSR signature alone; CESR binary encoding; version marker `YTSP-AAC`
- Direct, Routed, and Nested message modes; mediator-integrated routing and federation
- **Relationships are enforced, not just recorded** (§7.2.2): an application message from a VID with no relationship is dropped by default; invites/accepts/cancels, the invite-race tiebreak, `Reply_Path`, `Referral_Field`, padding (`XPAD`) and upper-layer control (`XCTL`) are all implemented, plus durable relationship stores and a recovery runtime
- **Post-quantum** (ML-KEM-768 + X25519 hybrid KEM, ML-DSA-65 signatures) implemented behind a `pq` feature and verified against the spec's own vector — the VID model above it is not yet PQ-aware
- **Graduated from experimental to supported in June 2026** and interoperable with the ToIP reference `tsp_sdk` (0.10.0 for Rev 3; 14/14 harness runs); the mediator serves TSP and DIDComm on the same endpoint and clients prefer TSP when both ends support it. The **DIDComm↔TSP bridge was removed** in Rev 3 — re-signing in the middle is exactly what ESSR forbids — so both ends of a conversation must be on one protocol

### Cryptographic Primitives
- Ed25519, P-256, secp256k1 key support; post-quantum ML-DSA-44/65/87 (persistable as `-priv-seed` multikeys since September 2026) and SLH-DSA (memory-only — no registered private-key multicodec)
- W3C Data Integrity proofs (EdDSA JCS 2022, EdDSA RDFC 2022)
- Multibase/multicodec encoding
- RDF canonicalization

### Credentials (`affinidi-vc`, `affinidi-sd-jwt`, `affinidi-bbs`, `affinidi-mdoc`, OpenID4VC crates)
W3C VC data model + Data Integrity suites (EdDSA JCS/RDFC 2022, BBS-2023, and since August 2026 `ecdsa-jcs-2019` for P-256 device keys; ML-DSA suites behind a `ml-dsa` feature); Selective Disclosure JWT (RFC 9901); BBS signatures / blind BBS / pseudonyms; **ISO mdoc** (CBOR codecs for `IssuerSigned` and `DeviceResponse`, August 2026; on `coset` 0.4 since `affinidi-mdoc` 0.3.0) — the format the VTA now receives and presents over OID4VP; `affinidi-openid4vp` / `affinidi-openid4vci`; status lists and trust lists.

### Meeting Place (`affinidi-meeting-place`)
Discovery and connection service using DIDs.

## Role in the Ecosystem

The TDK is the Swiss Army knife that everything else depends on:
- The [[verifiable-trust-agent|VTA]] uses it for DID resolution and DIDComm
- The [[affinidi-webvh-service]] uses it for DID operations and messaging
- [[openvtc|OpenVTC]] uses it for messaging and credential operations
- [[dtg-credentials|dtg-credentials]] uses its data integrity proofs for signing

## Recent Development

The TDK is a multi-crate workspace; entries below name the affected crate. Direction is toward production readiness with stronger security guarantees and better modularity. Implementation is evolving quickly; treat low-level APIs as in flux.

The August–September 2026 cycle (81 commits, PRs #716–#821; ~55k insertions, most of them between Dogwood-R1 and Eucalyptus-RC-0) had one headline and three undercurrents. The headline: **TSP moved to specification Rev 3** — a clean wire break with post-quantum cryptography underneath and relationship gating on top. The undercurrents: a **security review campaign** (SEC-3896–3899 and SEC-4045, "Dogwood security recon") that produced an egress-guard crate, public-hosts-only DID resolution, and a run of mediator authorisation fixes; **multi-mediator federation** finally working in production (and documented); and a **dependency ladder** — `trust-tasks-rs` 0.9 → 0.21 in seven steps — that, because Trust-Task types cross the messaging SDK's public API, forced a minor bump on every messaging consumer each time (mediator 0.18 → **0.26**, messaging-sdk 0.19 → **0.26**, `affinidi-tdk` facade 0.8 → **0.16**, didcomm-service 0.3 → **0.11**). Three coordinated tags fell in the window ([[coordinated-releases]]): **`VTI-Dogwood`** (2026-08-30, tag-only, no GitHub Release — deliberately quiet, mostly dependency and did-method work), **`VTI-Dogwood-R1`** (09-01, a re-cut with four production fixes) and **`VTI-Eucalyptus-RC-0`** (09-17, in flight). New crates: `affinidi-net-guard`, `did-webs`, `did-ethr`, `did-pkh`, `did-jwk`.

### Release snapshots — Dogwood, Dogwood-R1, Eucalyptus-RC-0

| Crate | Cypress (08-17) | VTI-Dogwood (08-30, #747) | VTI-Dogwood-R1 (09-01, #751) | VTI-Eucalyptus-RC-0 (09-17, #818) | HEAD (09-18, #821) |
|---|---|---|---|---|---|
| affinidi-messaging-mediator | 0.18.19 | 0.20.3 | 0.20.6 | 0.26.2 | 0.26.3 |
| affinidi-messaging-sdk | 0.19.8 | 0.21.0 | 0.21.1 | 0.26.7 | 0.26.7 |
| affinidi-messaging-didcomm-service | 0.3.26 | 0.5.0 | 0.5.1 | 0.11.0 | 0.11.0 |
| affinidi-tsp | 0.1.14 | 0.1.14 | 0.1.15 | 0.2.1 | 0.2.1 |
| affinidi-messaging-core / -delivery | 0.1.6 / 0.1.14 | 0.1.6 / 0.1.14 | 0.1.6 / 0.1.14 | 0.1.8 / 0.1.15 | 0.1.8 / 0.1.15 |
| affinidi-messaging-mediator-common / -config | 0.15.34 / 0.2.1 | 0.15.36 / 0.2.1 | 0.15.37 / 0.2.1 | 0.16.0 / 0.3.0 | 0.16.2 / 0.3.0 |
| affinidi-messaging-test-mediator | 0.2.51 | 0.4.0 | 0.4.3 | 0.9.1 | 0.9.1 |
| affinidi-messaging-didcomm-v1 | 0.2.0 | 0.2.1 | 0.2.1 | 0.2.1 | 0.2.1 |
| `affinidi-tdk` facade / tdk-common | 0.8.5 / 0.6.7 | 0.10.0 / 0.6.10 | 0.11.0 / 0.6.10 | 0.16.0 / 0.6.11 | 0.16.0 / 0.6.11 |
| did-resolver-cache-sdk / -server | 0.8.22 / 0.9.10 | 0.8.34 / 0.9.12 | 0.8.34 / 0.9.12 | 0.8.38 / 0.9.14 | 0.8.38 / 0.9.14 |
| did-scid / did-webs / did-web | 0.1.13 / — / 0.1.3 | 0.2.5 / 0.7.0 / 0.1.3 | 0.2.5 / 0.7.0 / 0.1.3 | 0.2.7 / 0.7.0 / 0.1.5 | same |
| affinidi-net-guard / affinidi-rate-limit | — / 0.1.0 | — / 0.1.0 | — / 0.1.0 | 0.1.0 / 0.1.2 | 0.1.0 / 0.1.2 |
| affinidi-did-authentication / did-common | 0.3.10 / 0.4.1 | 0.3.12 / 0.4.2 | 0.3.12 / 0.4.2 | 0.3.13 / 0.4.2 | same |
| affinidi-data-integrity / affinidi-mdoc | 0.7.10 / 0.2.7 | 0.7.10 / 0.2.7 | 0.7.10 / **0.3.0** | 0.7.12 / 0.3.1 | 0.7.13 / 0.3.1 |
| affinidi-secrets-resolver / crypto | 0.5.9 / 0.2.7 | 0.5.10 / 0.2.8 | 0.5.10 / 0.2.8 | 0.5.12 / 0.2.9 | same |
| consumed: trust-tasks-rs / vta-sdk / [[didwebvh-rs]] | 0.9 / 0.25 / 0.6 | 0.17 / 0.32 / 0.6 | 0.17 / 0.32 / 0.6 | 0.21 / 0.40 / 0.7 | same |

`VTI-Dogwood-RC-1` (08-29) sits one commit before Dogwood (#746). Crate CHANGELOGs label most of these versions "Unreleased (x.y.z)" even though per-crate git tags and crates.io publishes exist for them — the coordinated tag, not the CHANGELOG, is the reference point.

**Dogwood vs Dogwood-R1.** R1 is Dogwood plus four PRs (#748–#751, ~2,200 lines), three of them production federation bugs found *after* Dogwood was cut: with the default `RelayMode::Blind`, a mediator refused *every* message relayed by a peer as a session mismatch, so no cross-mediator DIDComm delivery completed (#748, mediator 0.20.4); the problem report the mediator sends when it abandons a forward went out as bare plaintext, which every authcrypt-only SDK client discards, so abandonment was silent to the sender (#749, 0.20.5); and TSP remote forwarding treated a next hop whose `TSPTransport` endpoint is a *mediator DID* as a URL and failed after five retries — now resolved one hop, mirroring the DIDComm fix in #705 (#750, 0.20.6 / tsp 0.1.15). The fourth, `affinidi-mdoc` 0.3.0 on `coset` 0.4 (#751, facade 0.11.0), unblocked VTI #1225 in `vta-vault`.

### TSP Rev 3 — 2026-09-15 → 09-17 (#796, #803–#806, #810, #812, #814–#817)

**Why.** The ToIP specification moved to Rev 3, and Rev 3 changed the crypto mode, the version byte, the long count-code prefix and every payload type code at once. There is no frame the two revisions can both classify, so `affinidi-tsp` **0.2.0** is a deliberate hard break: "nothing this crate packs can be unpacked by a Rev 2 peer, and nothing a Rev 2 peer packs can be unpacked here" (a Rev 2 frame is now reported as `TspError::RevisionMismatch` rather than a misleading crypto error; `docs/tsp/rev3-migration.html` is the migration guide).

- **Wire**: HPKE-Auth → **HPKE-Base** (sender authenticity from the ESSR signature alone); version `YTSP-AAC` read as MAJOR.MINOR (the crate documents *disagreeing* with the spec's `ABA` MAJOR.MINOR.PATCH reading, raised upstream on spec PR #63 — interop does not depend on it); `--X#####` long codes; new payload codes `XSCS/XHOP/XRFI/XRFA/XRFD/XCTL/XPAD`; signed-only wrapper gone; 128-bit nonce; §7.2.1 SAID digests. The libsodium sealed box (§8.3) is implemented for *reading* legacy peers only.
- **Protocol behaviour, all new**: application messages **gated on a relationship** (`RelationshipPolicy::Gated` default, §7.2.2); invite-race tiebreak by digest (§7.2.3); three-case cancellation (§7.3); key-state re-resolution on failure and after silence with rate limiting (§7.4.2, `KeyStatePolicy`); `Reply_Path` (§7.2.4); `Referral_Field` (§7.2.5); fillable padding and `XPAD`; `XCTL`. Two latent bugs found on the way: long-form counts decoded to the wrong length, and long-framed TSP messages were not recognised as TSP by any ingress classifier.
- **Conformance**: the specification's own ten Appendix A vectors run as a test suite (checked against `tsp_sdk` 0.10.0's `rev3.json`), all passing including the post-quantum one; five defects in the published appendix were found and reported; the AAC vectors re-pack byte for byte (#810). `MAX_HOPS` raised 16 → 64 (#806).
- **Post-quantum** (`pq` feature, `docs/tsp/post-quantum.md`): hybrid `MLKEM768-X25519` KEM and ML-DSA-65 signatures, opening the spec's `direct-hpke-base-pq` vector end to end. Built only once four appendix defects (short values, an unexplained 32-byte ML-KEM key that turned out to be a seed, a naming clash with X-Wing, unrendered FIPS references) were resolved upstream — "a hybrid KEM ... would have shipped validated by nothing but agreement with themselves". Status: cryptography verified, VID model not yet PQ-aware, so nothing above the crate uses it.
- **Up the stack**: messaging-sdk **0.25.0** — `unpack_message` returns `InboundTsp` (application vs control vs `Padding` vs `UpperLayerControl`), relationship state enforced, key-state freshness on every unpack, `send_padding` / `send_generic_control`; messaging-core **0.1.8** — an `Inbound` says whether it is traffic or a request about the relationship (#812, breaking for constructors); didcomm-service **0.9.0** handles TSP control messages (it had no relationship lifecycle, which under gating would have made it inert) and **0.11.0** adds `ListenerConfig::with_relationship_store` + `tsp_ensure_relationship` (#817); mediator **0.25.0** — a single uniform `delivery.refused` replaces five ACL-revealing problem codes, the **DIDComm↔TSP bridge is removed**, and a relayed endpoint-to-endpoint VID is no longer written to the durable forward queue (§5.3.3).
- **Relationship recovery runtime** (tsp 0.2.1, sdk 0.26.5–0.26.7, #814–#816): reconcile transition, `PersistentRelationshipStore<RelationshipKv>`, recovery-aware send (`SendReadiness`), capped-exponential backoff, 7-day idle eviction, single-flight `RecoveryCoordinator`, inbound-invite rate limiter, §7.2.2 drop counter. The consumer side lives in [[affinidi-webvh-service|did-hosting-service]] (#193/#194) and the VTA/VTC (VTI #1525).

### Security review campaign — SEC-3896–3899, SEC-4045 — September 2026

- **`affinidi-net-guard`** (#788, ADR 0006): the `did:web` SSRF fix from #753 (block non-routable hosts, cap body at 1 MiB) generalised into a leaf crate — URL vetting *and* a guarded DNS resolver, because `reqwest` never consults a custom resolver for an IP-literal host and a proxy bypasses the resolver entirely. Applied to the mediator's forwarding HTTP/WS client (#819, mediator-common 0.16.1: fail-closed resolver, no redirects, no proxy, https/wss + globally-routable only), with a TLS-validation hard gate in release builds and a WS DNS-rebinding guard (#820, 0.16.2).
- **Public-hosts-only DID resolution**: did:web in `affinidi-did-web` 0.1.4 / cache-sdk 0.8.35; did:webvh via [[didwebvh-rs]] **0.7** in cache-sdk 0.8.37 / cache-server 0.9.13 / did-scid 0.2.7 (#789). One `with_host_policy(HostPolicy::AllowPrivate)` opts local stacks back in.
- **Mediator TSP authorisation parity** (#756, #762, #765, #819): the TSP ingress trusted the envelope's *claimed* sender — an authenticated client could borrow any allow-listed VID (#754; 0.20.7 binds the outer sender to the session DID, the TSP twin of the 0.15.5 DIDComm fix); TSP direct delivery now honours `local_direct_delivery_allowed` (0.20.9, a behaviour change); the peer-mediator allowlist applies to TSP relay hops, with a *stronger* guarantee than DIDComm because every TSP hop is authenticated by construction (0.20.10); TSP routed relay requires `SEND_FORWARDED` and `/readyz` no longer leaks backend detail (0.26.3).
- **Rate limits that exist**: `did_rate_limit_per_second` was parsed, announced and never called — now charged once per authenticated request (#808, 0.26.2); a 429 names the mediator (`x-rate-limit-source`) and is typed all the way down — `HttpStatusError` in core 0.1.7, `ATMError::HttpStatus`, `NetworkFetchError` in the resolver (a rate-limited DID host no longer looks like an invalid DID, and N concurrent resolutions of a failing DID no longer make N fetches) (#801, #805, #807, #816).
- **Supply chain**: `Cargo.lock` committed and `--locked` passed everywhere a build is emitted, including the wizard-generated Dockerfile (#793; the trigger was an `aws-smithy-types` 1.7 minor that broke lockless builds, #791); fuzz CI pinned and egress-blocked (#753); did:cheqd resolution retired and `did-resolver-cheqd` dropped, clearing eight advisories (#763); did:ethr / did:pkh / did:jwk re-implemented in-tree so no `ssi-*` crate is compiled anywhere (#719); `jsonwebtoken` made private and moved to 11 (#772); keyring 4 via `keyring-core` with the Linux keyutils store kept deliberately (#776); RustCrypto `digest` 0.11 generation (#777).
- **Post-quantum hygiene**: ML-DSA secrets could not be persisted — `secret_material` was written as an empty string, so a saved store lost the key on restart (#797, secrets-resolver 0.5.12); the seven PQ multicodec code points pinned against a dated `table.csv` commit, with the note that `-priv-seed` is what lets an ML-DSA key be re-derived from a BIP-32 chain (#798); the data-integrity ML-DSA tests had never compiled (#821, 0.7.13).

### Multi-mediator federation — 2026-08-31 → 09-08 (#748–#750, #759, #781–#783)

The Dogwood-R1 fixes above were the symptom; the cause was that federation had never been written down. `docs/multi-mediator.md` (#781, mediator 0.22.1) now documents the two hop shapes (a double forward needs `RECEIVE_FORWARDED`; `send_to`'s single forward arrives as *direct delivery* and needs `local_direct_delivery_allowed`), the four accounts one cross-mediator delivery consults — including the non-obvious one, that the *peer mediator's* DID needs an account with `RECEIVE_FORWARDED` — blind vs rewrap relay, and a symptom-to-cause table; "the shipped default grants neither forwarded bit, so it is not a federation configuration". The gaps it exposed were then closed: an inter-mediator relay over **WebSocket with a per-frame `RelayAck`** (#782, 0.22.2 — never registered with the streaming task, gated on `SEND_MESSAGES`, bounded one-hour lifetime); **management Trust Tasks answered over TSP** so a TSP-only client can set its own ACL (#783, 0.22.3 — the dispatch split into a core plus a wrapper per transport); and `docs/mediation-and-routing.md` (#759, 0.20.8) stating the v2 addressing contract — DID-addressed, no keylist, `coordinate-mediation` deliberately not advertised — in answer to a downstream transport binding's question.

### DID methods — did:webs, did:scid:ke, in-tree ethr/pkh/jwk — 2026-08-22/23 (#719, #723, #734–#741)

**`did-webs`** (~new crate, published at 0.7.0) resolves `did:webs` — did:web discovery with **KERI-verified key state**: the document is *derived* from the verified `keri.cesr` key event log, never copied from the published `did.json`, which is cross-checked and fails resolution on disagreement. Verified: every event's SAID, digest chain, controller signatures, pre-rotation commitments, delegation seals (bounded, cycle-checked), witness receipts when a KEL declares witnesses (#735), and *designated aliases* — `alsoKnownAs` counts only if the AID issued an anchored credential saying so (#734, #741). A `create` feature adds create/update (#740). **`did-scid` 0.2.x** adds `did:scid:ke:1` (KERI AIDs via did:webs, #736 — flagged as a *proposed* registry entry, and note the SCID sits first for webvh but the AID sits last for webs) and fixes `did:scid:ke` being unreachable through resolve (#739). Hosting-side consumer: [[affinidi-webvh-service|did-hosting-service]] #169.

### Dependency ladder + facade — throughout

`trust-tasks-rs` 0.11 (#717) → 0.12 (#743; `ConsumeChecks` required, `ping` gains freshness bounds) → 0.17 (#744; generated types `#[non_exhaustive]`, builders mandatory — the mediator now *refuses* an unknown account role rather than storing a privilege it cannot reason about) → 0.18 (#769/#771) → 0.19 (#784) → 0.20 (#786) → 0.21 (#799). Each step is a minor on the facade (0.9, 0.10, 0.12, 0.14, 0.16) because "two `trust-tasks-rs` versions in one graph fail to compile rather than warn". The mirror problem — `vta-sdk` pinning *older* TDK crates so `[patch.crates-io]` silently stopped applying and the lockfile carried two `affinidi-tdk`, two SDKs, two `didwebvh-rs` — was unwound twice (#792 to vta-sdk 0.38, #811 to 0.40): the frozen registry SDK had compiled against the *patched* messaging-core, "freezing this workspace's API against the registry" and blocking the delivery layer from carrying a TSP message kind. Dogwood also carried mediator-setup fixes for a VTA reachable only over DIDComm/TSP (no REST URL, #745/#746), CORS refusals that name the origin (#747), a websocket close reason so a refused duplicate stops reading as a network fault (#718), Credo 0.7.0 fixtures for the DIDComm v1 harness (#794), and a cache-server that actually serves `did:jwk` (0.9.11) and caches raw did:webvh logs (0.9.14, #813).

The July–August 2026 cycle (103 commits, PRs #589–#716) shifted from *transports* to *reliability and names*: a new **reliable messaging delivery layer**, the **agent names** shortcut layer, a run of security-by-default breaking changes (authcrypt enforced, ACL gating authentication), and **DIDComm v1** for Aries/Credo interop — capped by the coordinated **`Cypress`** release ([[coordinated-releases]], tag at #715, 2026-08-17). Four new crates: `affinidi-messaging-delivery`, `agent-names`, `affinidi-rate-limit`, `affinidi-messaging-didcomm-v1`.

### Cypress snapshot — 2026-08-17

At the `Cypress` tag: mediator **0.18.19**, messaging-sdk **0.19.8**, messaging-delivery **0.1.14**, messaging-core 0.1.6, didcomm-v1 0.2.0, didcomm-service 0.3.26, tdk-common 0.6.7, did-auth 0.3.10, did-resolver-cache-server 0.9.10 / cache-sdk 0.8.22, did-common 0.4.1, agent-names 0.1.3, `affinidi-tdk` facade 0.8.5, trust-tasks-rs 0.9, vta-sdk 0.25. Release candidates `VTI-Cypress-RC-0` (#674, 08-02) and `VTI-Cypress-RC-1` (#699, 08-11) preceded it. Post-tag: #716 (tdk-common 0.6.8) fixed `force_refresh` so a proactive auth refresh actually refreshes, ending a reconnect storm seen by OpenVTC.

### Reliable messaging delivery layer ("D1 Phase 2") — 2026-07-16 → 07-26

**Why.** The SDK's websocket `send_message` returned `Ok` the moment a frame was *enqueued* — even mid-reconnect with no socket — so frames were silently dropped while callers recorded "delivered". Inbound, the live listener acked (deleted) a message at the mediator *before* dispatching it, so a crash in between lost it forever. Raw-TSP delivery had the same at-most-once shape. The D1 work makes the stack truthful, then builds at-least-once, evidence-confirmed delivery on top — the root fix behind the "join sits Pending while the community's outbox says Sent" class of bug that OpenVTC v0.3.0 chased.

- **Wire contract** in `affinidi-messaging-core` 0.1.3–0.1.5 (#603, #604, #612): `ConnState` watch channel and the `MessageTransport` trait (truthful `send` → `SendReceipt` = hop-acceptance only; `inbound()` + `ack()` after durable handoff; `outbox_message_ids()`).
- **Truthful websocket send** (SDK 0.18.52/53, #605; deadlock fix #618) and **ack-after-handoff** in didcomm-service 0.3.19 (#606); the last hole — acking when no subscriber received the message — closed in delivery 0.1.14 (#710, 08-16).
- **`DidCommTransport`** (#607, #620–#622, #627): the first `MessageTransport` over ATM; `sender` is the DID whose key actually authcrypted (spoofed/anonymous → `None`); surfaces inbound TSP frames on the multiplexed socket.
- **New crate `affinidi-messaging-delivery`** 0.1.0 → 0.1.12 in ten days (#608–#626, #661): `OutboxEntry` state machine + `OutboxStore`; `MessagingService` front-end with `BestEffort`/`Guaranteed` send, thread-correlated `request`, single inbound dispatcher; confirmation state machine; the **evidence trio** — outbox-drain (hop-id = `sha256(packed)`), layer-receipt, protocol-reply; `ExpiryEscalator` (→ `Rebound`/`Failed`/`Unconfirmed`, never silent success); serde on outbox types; a feature-gated **conformance suite** asserting seven guarantees over any wire; **multi-transport** (`add/remove/promote`, `request_via`) so a VTA can migrate mediators live; **multi-identity** (`send_via`, per-transport `ConnState`).
- Related: opt-in `tsp-ack` delete-to-ack for raw TSP (#651); mediator 0.18.16 delivers already-queued messages when a socket enables live delivery (#707).

Note: the wiki previously said ADR 0005's `AffinidiMessageService` was "likely to supersede `DIDCommService`". What actually landed is `MessagingService` in `affinidi-messaging-delivery` — a different crate and name, and broader (multi-transport, multi-identity).

### Agent names — 2026-07-19 → 07-23

An **agent name** is a URL whose path starts with `/@`: `example.com/@alice`, `firstperson.network/@drummond/h2hsummit`, or the **community form** `example.com/@` (the VTC owning the domain). Resolution is three-stage: the name URL redirects to a DID (≤5 hops); the DID resolves normally; **the DID document must claim the name back in `alsoKnownAs`** — mandatory, since anyone can publish a redirect to someone else's DID. Canonical form `https://host/@local` (host lowercased, local case preserved). Landed as: `affinidi-did-common` **0.4.0** typed `also_known_as` (#629; 17 dependents patch-bumped, publish runbook); new **`agent-names`** crate 0.1.0 → 0.1.3 (#631, SSRF hardening #633, community form #652); cache-sdk `resolve_any()` (#632), single-flight (#640), WebSocket resolution (#642), `display_name()`/`DidShortcut` that only ever shows a *verified* name (#645); cache-server `resolve-name` endpoint, **off by default** and returning the DID only — "a cache, never a trust anchor" (#634), bounded outbound fetches (#636), per-IP rate limiting via the new **`affinidi-rate-limit`** crate extracted from the mediator (#637/#638). A Layer-2 "agent name credential" is anticipated but not implemented. The consumer side is in [[openvtc]] (display on every DID surface) and [[affinidi-webvh-service|did-hosting-service]] (`/@name` redirects + registry).

### Security-by-default breaks — late July → August 2026

- **authcrypt enforced by default** — messaging-sdk **0.19.0** (#671, 07-29): `unpack` accepts only `authcrypt(plaintext)`, `authcrypt(sign(plaintext))`, `anoncrypt(authcrypt(plaintext))` and enforces `from == skid`, closing a forged-sender bypass; layered unpacking, multi-signature verification, unprocessable-message channel. Reaches facade consumers as `affinidi-tdk` 0.8.5 (a *patch*, with a loud rollout table).
- **`explicit_allow` gates authentication** — mediator **0.18.0** (#669): unknown DIDs rejected at `/authenticate/challenge`; previously the mode never gated auth. Preceded by a **mediator ACL audit** (#662, 0.17.11): a non-admin could grant itself `blocked/local/self_manage_*` bits (escalation, fixed); `RECEIVE_MESSAGES` was never enforced (now is); shipped default flipped to `explicit_deny`; new `docs/acls.md`.
- JWS signer `kid` SSRF (#676/#677): a pre-auth `kid` naming `did:web:<host>` was resolved; now refused unless it matches the signed `from`. SSRF hardening in `HttpRedirectResolver` (#633); legacy `rustls 0.21` dropped from the AWS path (#673).
- **curve25519-dalek 5** across the workspace (#672; X25519 keys zeroized); **elliptic-curve 0.14** with `did:ethr`/`did:pkh` behind off-by-default features, removing `ssi-*` from default builds (#674, = RC-0); `vta-sdk` optional behind a default-on `vta` feature in the mediator (#703); pins tightened to vta-sdk 0.25 (#715).

### DIDComm v1 — Aries/Credo interop — 2026-08-08/09

Credo and essentially every Aries-lineage wallet speak DIDComm v1 only, and the TDK had no way to reach them. New crate **`affinidi-messaging-didcomm-v1`** (#687, ~6k lines): pack/unpack, `~thread`, `Protocol::DIDCommV1` in core 0.1.6, verified against Credo 0.6.3 fixtures. Mediator 0.18.8 adds RFC 0019 forward ingress behind a `didcomm-v1` feature (#689); 0.18.9 adds coordinate-mediation 1.0 + message-pickup 2.0 with return-route and `did:key` account identity (#690); both-direction Credo tests (#691). Positioned as the base for a Trust Tasks `bindings/didcomm-v1/0.1`.

### Other — July–August 2026

- **Trust-task family 19 → 9** (#668, mediator 0.17.13, SDK 0.18.65 breaking): `account/update`, `access-list/update`, generic `audit/list`, `config/show`; retired URIs answer `unsupported`. trust-tasks-rs consumed 0.2.46 → 0.4.0 (#692) → 0.6.1 (#709) → **0.9.0** (#714, `PayloadPolicy` on `consume_inbound`).
- Mediator ops: S3-backed did:webvh `did.jsonl` (#600); read-only secret-backend probe at boot and `/readyz` (#589/#591); ~256 MB RSS memory bounds, two state-leak fixes, O(n) audit inserts removed, jemalloc (#598); GHCR/ECR multi-arch image CI with SLSA provenance (#594); secp256k1 ES256K (#619); DID-named next-hop forwarding (#705).
- Credentials: mdoc CBOR codecs for `IssuerSigned` (#711) and `DeviceResponse` (#712, mdoc 0.2.7); **`ecdsa-jcs-2019`** cryptosuite (#713, data-integrity 0.7.10) so P-256 / mdoc device keys can sign Data Integrity proofs — consumed by the VTA's mdoc-over-OID4VP work.
- Version movement in the window: mediator **0.16.41 → 0.18.19**; messaging-sdk 0.18.49 → **0.19.8**; didcomm-service 0.3.17 → 0.3.26; tdk-common 0.6.5 → 0.6.8; `affinidi-tdk` 0.8.3 → 0.8.5; did-auth 0.3.9 → 0.3.11; cache-server 0.9.2 → 0.9.10; cache-sdk 0.8.12 → 0.8.22; affinidi-tsp 0.1.12 → 0.1.14; mediator-setup 0.1.20 → 0.1.28; vta-sdk consumed 0.18 → 0.25.

The June–July cycle below (193 commits, ~44,600 insertions) was the TDK's largest yet, and its headline was unambiguous: **[[trust-spanning-protocol|TSP]] became a first-class, supported transport** — interoperable with the ToIP reference implementation, federated across mediators, advertised in DID documents, and *preferred over DIDComm* when both ends support it. Around it: a unified dual-protocol client architecture (ADR 0005), a document-based **Trust Tasks** replacement for the legacy mediator admin protocol, and three coordinated quality waves (semver/API hardening, test infrastructure, mediator internals).

### TSP goes first-class — 2026-06-22 → 07-04 (~60 commits)

A sustained push took `affinidi-tsp` (0.1.1 → 0.1.12) from nascent library to fully interoperable, mediator-integrated, SDK-exposed transport:

- **Library completion**: DID-document VID resolver, Routed/Nested message modes, ingress sniffing (#488–#490).
- **Mediator integration**: an ingress dispatcher sniffs DIDComm vs TSP on the same endpoint (#491/#492); TSP Direct local delivery (#493); pure-TSP client authentication (#495, #533); the mediator's own TSP identity (#499); routed relay (#500); a **TSP↔DIDComm bridge** (#501); remote forwarding to another mediator (#502); `TSPTransport` advertised in the mediator's DID document (#527) and baked into generated did:peer/did:webvh DIDs (#565); raw-TSP WebSocket delivery (#534) with SDK consumer `atm.tsp().connect_websocket` (#536).
- **ToIP interop**: CESR framing + RFC-9180 HPKE compliance (#540, #542, #543); full `tsp_sdk` wire parity for relationship Control messages (#544); declared **fully interoperable with the ToIP reference** (#545), verified by a standalone `interop/` harness round-tripping against ToIP `tsp_sdk` 0.9.0-alpha2; two-mediator TSP federation e2e (#546).
- **Graduation + selection intelligence**: TSP moved from experimental to **supported** (#528); `atm.tsp()` relationship management (#529); TSP-preferred selection with DIDComm fallback in `send_to` (#573), learning TSP capability from relationships and observed inbound traffic (#575), proactive discovery via Discover Features 2.0 (#579). New docs: TSP cookbook, operator enablement guide.

### `AffinidiMessageService` — unified DIDComm+TSP client (ADR 0005) — late June 2026

Because the mediator enforces one websocket per DID, a node speaking both protocols needs one multiplexed socket. ADR 0005 (#548) proposes `AffinidiMessageService`; staged implementation landed (`live_stream_next_frame` multiplexed receive, a `TspHandler` trait, inbound TSP frame routing on the shared websocket, symmetric TSP replies — #549–#556, #568). At the time this looked likely to supersede `DIDCommService` as the public client surface; in practice the July delivery layer's `MessagingService` (above) became that surface.

### Trust Tasks migration — 2026-06-23/24 (T1–T18)

A rapid, complete replacement of the legacy mediator admin/ACL client protocol with document-based **Trust Tasks** carried in a DIDComm binding envelope: `atm.trust_tasks()` on the SDK, then the full account / acl / access-list / admin families (#506–#516, #518). Legacy `atm.mediator()` methods **deprecated** (#517) and all in-repo consumers migrated (#519–#523). This aligns the messaging stack with the wider VTI "everything is a trust task" document model.

### Semver/API-hardening wave (W1–W19) + ADRs — 2026-06-13/14

- Security: cache-server panic removal + bounded upstream resolution, BBS proof DoS bound + explicit CSPRNG, log redaction + constant-time compares, OID4VC **JWT algorithm allowlist** + nonce replay helper (#441–#445, #461).
- API sealing: `#[non_exhaustive]` across public error enums and structs workspace-wide (#446–#449, #471–#476); a tdk-common API-stability contract (#453); ADR 0003 (public-API semver policy) + ADR 0004 (release automation) + release CI guards.
- Structural: **`affinidi-sd-jwt-vc` merged into `affinidi-vc`** as its `sd_jwt_vc` module (the old crate is a deprecated re-export shim); new **`affinidi-task-utils`** crate for shared task supervision; facade completion with capability features for `affinidi-tdk` 0.8.

### Test infrastructure wave (TI0–TI7) — mid-June 2026

New **`affinidi-tdk-test-support`** crate: did:web/webvh mock servers, `StaticResolver` fixtures, a multi-mediator `TestTopology`, a docker-compose test stack with committed test-only identities, `CredentialScenario` fixtures for sd-jwt-vc and mdoc/OID4VP, seeded did:peer generation, an injectable Clock, and an in-repo cargo-fuzz workspace for the DIDComm envelope layer and SD-JWT (#439–#481).

### Mediator simplification/hardening (T1–T26) — 2026-06-10 → 06-13

Systematic internals cleanup: task supervision + `/livez` health split; fail-closed session handling; a central authz module replacing scattered ACL checks; per-DID WebSocket cap; a backend-conformance suite for `MediatorStore` run against Redis in CI; a Fjall circuit breaker + schema-version marker; a new **`affinidi-messaging-mediator-config`** crate extracting the TOML schema; bounded privileged-change audit log (#401–#438). Preceded by cross-mediator DIDComm federation work: least-privilege anonymous relay, minimal relay ACLs, per-hop re-wrapping `relay_mode=rewrap` (#383–#400).

### Secrets backends + mediator setup — early July 2026

Native **Kubernetes Secrets** backend (#558) and **HashiCorp Vault** Kubernetes/AppRole auth + Enterprise namespaces (#557), wired into recipes and the interactive wizard — the same enterprise-deployment direction as VTI's `vti-secrets`. Opt-in P-256 key suite for mediator-setup (#531).

### Version movement — June–July 2026

The mediator went 0.15.15 → **0.16.41** (~26 releases) and messaging-sdk 0.18.7 → 0.18.49; the `affinidi-tdk` facade hit **0.8.3**; `affinidi-vc` 0.2.1 (absorbing sd-jwt-vc); `affinidi-openid4vci` 0.2.1 (breaking: alg allowlist threading); did-resolver cache-server 0.7.5 → 0.9.2 (hardening wave). vta-sdk consumed at 0.18 by window end. Notable fixes: did:cheqd made opt-in so the resolver SDK no longer forces the rustls ring backend (#486); data-integrity 0.7.5 rejects forged undefined attributes in bbs-2023 safe mode (#382).

The May–June cycle below (~50 commits) was dominated by the new **`affinidi-bbs` crate**, **JOSE centralisation**, and OpenID4VC family expansion.

### `affinidi-bbs` v0.1.0 → v0.3.0 — May–June 2026 — BBS signatures, blind BBS, per-verifier pseudonym

New crate. Pure-Rust BBS signatures per `draft-irtf-cfrg-bbs-signatures` over BLS12-381, two ciphersuites (SHA-256 XMD and SHAKE-256 XOF), keygen / sign / verify / proof-gen / proof-verify with unlinkable presentations. Targets eIDAS 2.0 ARF ZKP requirements (ZKP_01, _02, _03, _06).

- **Blind BBS** (Commit / BlindSign / BlindVerify) for blind-issuance flows.
- **Per-verifier pseudonym layer** — nym commit / sign / verify + bound proof; pairs with the W3C `vc-di-bbs` per-verifier pseudonym document layer.
- **Audit-readiness hardening** — BBS proof verifier hardened against malformed input.

### `affinidi-data-integrity` v0.7.x — vc-di-bbs document layer

- Document-level `bbs-2023` sign / derive / verify; standards-interoperable W3C selective disclosure.
- BLS12-381 G2 did:key support for BBS+ issuer keys.
- **RDFC-1.0 hash N-Degree Quads** fix (`_:` path delimiter) — full 63/63 W3C rdf-canon conformance.
- Republished on `affinidi-crypto` 0.2.
- Legacy `bbs_2023` encoding deprecated in favour of `bbs_2023_transform`.

### `affinidi-crypto` — JOSE centralisation + DIDComm rewire

The #327 5-part PR series: an additive `affinidi_crypto::jose` module exposing JOSE primitives + a trait seam (PR 5b), JOSE key agreement + ECDH derivation (PR 5c), didcomm rewired onto `affinidi-crypto::jose` with the bespoke crypto deleted (PR 5d). Ships with an ADR + KAT harness (PR 5a).

- VC key-agreement negotiation + P-384 / P-521 curves.
- `affinidi-crypto` 0.1.x → 0.2.

### OpenID4VC family — DCQL + key-binding proof

- **`affinidi-openid4vp` 1.0** — Digital Credentials Query Language (DCQL) type model in `affinidi-openid4vp`; DCQL **matcher** evaluates a query against held credentials.
- **`affinidi-openid4vci`** — OpenID4VCI key-binding proof layer + Ed25519 JWT signer / verifier.

### DIDComm 0.15 — across the stack

The whole workspace moved to `affinidi-messaging-didcomm` 0.15, breaking the previous two-`Message`-type split. `affinidi-tdk` 0.7.3 / 0.7.4 pick up `didcomm ^0.15`; the affinidi mediator 0.15.12 → 0.15.15 and test-mediator 0.2.4 follow. `affinidi-tdk-common` republished at 0.6.3.

### Messaging — routing + reliability

- Routing-2.0 forward handler classifies a service URI as local when `(host, port)` matches the mediator's bind or any operator-declared alias (load-balancer / reverse-proxy deployments).
- Redeliver in-flight live-stream messages on duplicate-WebSocket replacement; fail in-flight WebSocket requests on disconnect.
- Mediator-setup no longer clobbers unified secret backend; `file://` URL handling fixed.

### `affinidi-did-web` — new crate

Minimal in-workspace `did:web` resolver replacing the upstream `did-web` crate; drops a vulnerable transitive `reqwest 0.11` / `rustls 0.21` chain inherited from upstream.

### mediator 0.15.2 — 2026-05-07

- Foolproof `api_prefix` normalisation

### mediator 0.15.1 + test-mediator 0.2.2 — 2026-05-05

- Routing fix
- `mediator-common` feature gating
- ACL / admin surface

### `affinidi-messaging-test-mediator` initial publication — 2026-05-04

- Promoted from in-tree fixture to published crate with third-party ergonomics
- Self-loopback routing fix
- Types relocation
- `local_dids` setter and `affinidi-messaging-mediator` boot wrapper for integration tests
- Downstream `openvtc` workspace immediately migrated to consume this, dropping ~400 lines of fixture code

### mediator 0.14.0 — 2026-05-04 — pluggable storage + unified secret backend + setup wizard

- Pluggable storage backends
- Unified secret backend
- New dedicated **`mediator-setup`** wizard package at `crates/messaging/affinidi-messaging-mediator/tools/mediator-setup`
- Wizard iterated in subsequent 0.14.1 / 0.15.x point releases: sealed-handoff webvh-server prompt restructure; `pnm --create-context` emission; Open/Closed network mode selection; fjall data-dir confirmation; security hygiene (zeroize sealed-handoff secrets on drop, shell-quote operator fields, restrict sensitive writes to 0o600, `deny_unknown_fields`)

### `affinidi-tdk-common` v0.6.0 — 2026-05-01

- Hardening + API tightening release
- Workspace-wide bump to consume it across crates

### `affinidi-tdk-rs` v0.5.4 — 2026-04-18 — post-quantum cryptography + data-integrity API refactor

- PQC support across the workspace
- Data-integrity API refactor
- New `affinidi-did-web` crate
- MSRV bumped to 1.94

### `affinidi-messaging` 0.1.5 / 0.2.0 — 2026-04-13 — DIDComm service usability + outbound messaging

- Improved API ergonomics for the DIDComm service
- New outbound-messaging path

### DIDComm 0.13.0 — 2026-04-09 — VTA integration for centralized key management

- Mediator / DIDComm service can delegate signing to the VTA

See also: [[didwebvh-rs]], [[verifiable-trust-agent]], [[didcomm]]
