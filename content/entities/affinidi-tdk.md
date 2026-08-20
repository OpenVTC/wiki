---
title: "Affinidi Trust Development Kit (TDK)"
type: entity
tags: [affinidi, tdk, library, messaging, did-resolution, bbs, openid4vc, agent-names, tsp, secondary, cypress]
date-updated: 2026-08-19
repo: https://github.com/affinidi/affinidi-tdk-rs
---

# Affinidi Trust Development Kit (TDK)

*Repo: [github.com/affinidi/affinidi-tdk-rs](https://github.com/affinidi/affinidi-tdk-rs)*

The Affinidi TDK is a comprehensive Rust toolkit providing identity, messaging, and credential primitives for the OpenVTC ecosystem. It's the foundational library that higher-level projects depend on for DID resolution, secure communication, and cryptographic operations.

## Key Components

### DID Resolution (`affinidi-did-resolver`)
High-performance [[decentralized-identifiers|DID]] resolution with local and network caching:
- 250k+ resolutions per second from cache
- Pluggable DID method support (did:webvh, did:key, did:peer, did:scid)
- Integrates with [[didwebvh-rs]] for webvh verification

### Messaging (`affinidi-messaging`)
Secure messaging built on [[didcomm|DIDComm v2.1]] — and, since August 2026, DIDComm **v1** for interop with Aries/Credo-lineage wallets:
- SDK, mediator/relay service, and terminal chat client
- Authcrypt and anoncrypt packing; since 0.19.0 (July 2026) **unpack accepts only authenticated envelopes by default** (`authcrypt`, `authcrypt(sign)`, `anoncrypt(authcrypt)`) and enforces `from == skid`
- Message forwarding and routing; cross-mediator forwarding when the next hop is a DID
- Production features: circuit breakers, rate limiting, graceful shutdown, `explicit_allow` ACL mode gating authentication

### Reliable delivery (`affinidi-messaging-core`, `affinidi-messaging-delivery`) — *new July 2026*
The transport-neutral contracts and the reliability layer above them. `affinidi-messaging-core` defines `MessagingProtocol` (packing) and the `MessageTransport` trait (truthful `send` → hop-acceptance receipt, re-falsifiable connection state, `inbound()` + `ack()` *after* durable handoff). `affinidi-messaging-delivery` adds a durable **outbox** (`Queued → Sent → Delivered | Unconfirmed | Failed`), a `MessagingService` front-end (`send(BestEffort|Guaranteed)`, thread-correlated `request`, `subscribe`), delivery evidence (outbox-drain, layer-receipt, protocol-reply), escalate-on-expiry, multi-transport and multi-identity operation, and a conformance suite. This is what the [[verifiable-trust-agent|VTA]], the VTC service, and [[openvtc]] now run their messaging on.

### Agent names (`agent-names`) — *new July 2026*
Human-memorable handles for DIDs — `example.com/@alice`, or the community form `example.com/@` — implemented as a *shortcut layer*, not a DID method: the name URL redirects to a DID, the DID resolves normally, and the DID document **must claim the name back in `alsoKnownAs`** (typed in `affinidi-did-common` 0.4) before it is ever displayed. Exposed via `resolve_any()` in the resolver cache SDK, an opt-in `resolve-name` endpoint on the cache server (rate-limited by the new `affinidi-rate-limit` crate), and display-name shortcuts. See [[decentralized-identifiers]].

### Trust Spanning Protocol (`affinidi-tsp`)
Implementation of the Trust over IP [[trust-spanning-protocol|TSP]] specification:
- HPKE-Auth encryption (RFC 9180), CESR binary encoding
- Direct, Routed, and Nested message modes; mediator-integrated routing and federation
- **Graduated from experimental to supported in June 2026** and declared fully interoperable with the ToIP reference `tsp_sdk`; the mediator now serves TSP and DIDComm on the same endpoint, and clients prefer TSP when both ends support it

### Cryptographic Primitives
- Ed25519, P-256, secp256k1 key support
- W3C Data Integrity proofs (EdDSA JCS 2022, EdDSA RDFC 2022)
- Multibase/multicodec encoding
- RDF canonicalization

### Credentials (`affinidi-vc`, `affinidi-sd-jwt`, `affinidi-bbs`, `affinidi-mdoc`, OpenID4VC crates)
W3C VC data model + Data Integrity suites (EdDSA JCS/RDFC 2022, BBS-2023, and since August 2026 `ecdsa-jcs-2019` for P-256 device keys); Selective Disclosure JWT (RFC 9901); BBS signatures / blind BBS / pseudonyms; **ISO mdoc** (CBOR codecs for `IssuerSigned` and `DeviceResponse`, August 2026) — the format the VTA now receives and presents over OID4VP; `affinidi-openid4vp` / `affinidi-openid4vci`; status lists and trust lists.

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
