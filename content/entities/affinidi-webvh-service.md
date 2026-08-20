---
title: "did-hosting-service (formerly Affinidi WebVH Service)"
type: entity
tags: [affinidi, webvh, did-hosting, did-web, service, secondary, multi-method, multi-domain, tsp, agent-names, cypress]
date-updated: 2026-08-19
repo: https://github.com/affinidi/affinidi-webvh-service
---

# did-hosting-service (formerly Affinidi WebVH Service)

*Repo: [github.com/affinidi/affinidi-webvh-service](https://github.com/affinidi/affinidi-webvh-service)*

Production infrastructure for hosting, resolving, and managing [[did-webvh|did:webvh]] (and, since v0.7.0, `did:web`) identifiers at scale. It's the operational backbone that makes self-hosted DIDs practical — handling the hosting, witnessing, and monitoring that individual users shouldn't have to manage themselves.

The repository was **renamed from `affinidi-webvh-service` to `did-hosting-service`** in v0.7.0 (May 2026). The rename reflects two architectural shifts: the service is no longer single-method (it now hosts both `did:webvh` and `did:web` by default, with a `DidMethod` trait abstraction and compile-time feature gating), and the binaries are now named for the **capability** they expose rather than a specific underlying method (`did-host-http`, `did-host-didcomm`, `did-host-http-didcomm`).

## Components

The service is a Rust workspace. Since the v0.7.0 rename the crates are named for the *capability* they expose, and since 0.8.0 (July 2026) they are **versioned per crate** — so a snapshot lists several numbers. Versions below are those in the coordinated **`Cypress`** release ([[coordinated-releases]], 2026-08-17):

| Crate | Port | Role | Cypress |
|-------|------|------|---------|
| **did-hosting-server** | 8530 | Core DID hosting — create, upload, resolve, delete DIDs; serves `did.jsonl` and `/@name` agent-name redirects | 0.8.3 |
| **webvh-witness** | 8531 | Generate cryptographic witness proofs for DID integrity (DIDComm-only) | 0.8.3 |
| **did-hosting-control** | 8532 | Management UI backend, service registry, reverse proxy, passkey auth, ACL, agent-name registry (source of record) | 0.8.8 |
| **webvh-watcher** | 8533 | Read-only DID mirror for redundancy (receives pushed updates) | 0.8.3 |
| **did-hosting-daemon** | 8534 | All-in-one binary (server + witness + watcher + control) for simple deployments | 0.8.3 |
| **did-hosting-client** | — | Companion client crate for talking to a hosting node (DID management, agent names) | 0.1.2 |
| **webvh-ui** | — | Web UI bundle (packaged for cargo publish since #157) | 1.1.0 |
| **did-hosting-common** | — | Shared library: clients, DID operations, auth, storage, config, trust-task pipeline | 0.8.6 |

Every node is a **three-transport, document-driven** endpoint: HTTPS (`POST /api/trust-tasks`), [[didcomm|DIDComm v2]], and [[trust-spanning-protocol|TSP]] all deliver the same Trust Task documents to one dispatch core, and a node's DID document is the authority for which transports it offers.

## How It Works

1. A user creates a did:webvh via the [[verifiable-trust-agent|VTA]]
2. The VTA uploads the DID document and history log to a webvh-server
3. The server serves the `did.jsonl` at the DID's well-known URL
4. Witnesses attest to the integrity of DID updates via DIDComm protocol
5. Watchers mirror the DID for redundancy
6. The control plane manages service registration and access control

## VTA Integration

The WebVH service integrates deeply with the [[verifiable-trust-agent|VTA]]:
- Each service component authenticates to a VTA context during bootstrap
- DIDComm challenge-response authentication replaces bearer tokens between services
- The service uses the VTA's signing oracle for DID operations

The cold-start bootstrap flow (`import-secrets` CLI) can bring up an entire environment from scratch: VTA → mediator → webvh-server.

## Recent Development

After hardening cross-service trust paths in v0.6.0 and pivoting to multi-domain / multi-method in v0.7.0, the July–August 2026 cycle (101 commits, PRs #59–#167) shipped **0.8.0** — "transport as a first-class negotiable property of every node" — then converged the service hard on the ToIP **Trust Tasks** registry as its wire authority, added **agent names** as a new product surface, and landed in the coordinated **`Cypress`** release ([[coordinated-releases]]). Note: the wiki previously reported that 0.8.0 would *drop* the legacy `/api/acl` REST surface; it did not — at HEAD it is still served with `Deprecation`/`Sunset: 2026-12-01` headers pointing at `/api/trust-tasks`.

### Cypress snapshot + Trust-Tasks 0.9 — 2026-08-17 (#167)

The `Cypress` tag (2026-08-17) sits on #167, which moved the workspace to **trust-tasks 0.9 / vta-sdk 0.25** (framework errors now `trust-task-error/0.5`; payload policy chosen once in `run_pipeline`). Snapshot versions: server/daemon/watcher/witness 0.8.3, control 0.8.8, common 0.8.6, client 0.1.2, UI 1.1.0. Release candidates `VTI-Cypress-RC-0` (#152, 07-30) and `VTI-Cypress-RC-1` (#159, 08-10) preceded it. Much of the post-0.8.3 work sits under "Unreleased" in the CHANGELOG — the tag is the cross-project reference point, not a CHANGELOG release.

Security/interop fixes in the run-up: unrouted DIDComm messages now get an `e.p.msg.unsupported-task` problem-report instead of silence (#152, control 0.8.7); the DIDComm trust-task envelope is gated against replay like the bare path (#155, control 0.8.8); `payloadDigest` emitted as `digestMultibase` rather than hex, coordinated with VTI #911 (#159); UI recognises rejections again (#160); one `framework_error_type_uri()` so unrouted paths can't emit a different error version (#162). Dependency ladder: trust-tasks 0.2 → 0.4 (#158) → 0.6 (#164) → 0.9 (#167); vta-sdk 0.20 → 0.23 → 0.24 + vti-common 0.12 → 0.25; [[didwebvh-rs]] 0.6 (#136).

### Canonicalisation onto the Trust Tasks registry — 0.8.3 — 2026-07-28 → 07-29

A clean cutover (no dual-accept — pre-production policy) to the consolidated, registry-published task URIs: `did-management/agent-name/update/0.1 {state: active|parked}` replaces set/enable/disable; `did/publish/0.1` retired in favour of `did/register`; REST `Trust-Task` headers moved from the service's own `did-hosting/*/1.0` to canonical `spec/did-management/*` plus new `did/set-state` / `domain/set-state` (#144). The VTI side responded the next day (VTI #879 "stop sending Trust-Task URIs did-hosting retired in 0.8.3"). The old `confirm/*` pair became `task-consent/{request,decision}/0.1` with a mandatory verified Data Integrity proof and `payloadDigest` binding (#145, control 0.8.4); the *request* leg of task-consent and step-up approve-request is now signed too (`eddsa-jcs-2022`, via `trust-tasks-proof` 0.2.2; #149–#151). Also: UI honours `retryable`/`retryAfter` (#140), clock-skew-tolerant proofs (#138/#139), idempotent `acl/grant` retry (#142). Direction signal: the service keeps its own URIs only where the registry has no spec; everything else follows the registry.

### Agent names — `/@name` — 2026-07-21 → 07-23 (#103–#137)

The big new feature of the cycle, and the hosting-side half of the ecosystem's **agent names** story (see [[decentralized-identifiers]] and [[openvtc]]): a human-memorable handle like `example.com/@alice` that resolves to a DID. The *server* answers `/@name` with a 302 to the DID, derived at the edge from the signed DID log's `alsoKnownAs`; the *control plane* keeps the registry — including parked names — and is the source of record: publish reconciles the registry (#110) and enforces reserved/taken preconditions so a name can't be hijacked via publish (#113). Names are managed as Trust Tasks over DIDComm/TSP (#105, #129) and REST (#106; owner-auth, not step-up, on remove/disable #108), surfaced in UI cards for manage/park/resume (#107, #109) with DIDs resolved to names across the UI (#122, #130), advertised on `/api/server-info` (#114), exposed in `did-hosting-client` (#115), default name = the DID's path segment (#119), and accepted wherever an ACL takes a DID — resolved once at write time (#134). The **community form** `{domain}/@` is bound structurally to `.well-known` only (#127, #137). A decision was recorded *not* to advertise the control plane in DID documents (#117).

### 0.8.0 → 0.8.2 — 2026-07-15 — transport as a negotiable property

0.8.0 (#89) bundled the TSP work below plus: the DID document is authoritative for *send* transport — `resolve_send_binding` precedence document → config → fail, no blind-DIDComm default (#86); a standalone server advertises its messaging transports on its own DID (#87); mediator-configured node DIDs omit the `WebVHHosting` service (#88); `identity-rotate-keys` for the service's own key-agreement and signing keys with grace/drain (#82, #84); runtime DID pick-up without restart (#78); **edit a DID document through the user's agent** from the UI — the service proposes, the VTA dry-runs and decides whether consent is needed (#77, fixed end-to-end in #79); root-DID `.well-known` fixes (#72, #80). 0.8.1 added delta-sync on register and self-resolve from the local store (#93); 0.8.2 stopped a metadata-only identity change from rotating (and destroying) key material (#95, safety nets #96). Follow-on hardening: a nightly unlocked-resolve CI canary (#75); the `?domain=` cross-tenant check — silently dropped by axum — enforced on publish/delete (#94); batched `MSG_SYNC_BATCH` (≤50 DIDs / 512 KB) under the mediator rate limit (#97); delegated updates auto-publish on the wallet's grant event instead of polling (#99–#102).

### TSP decoupled from DIDComm — 2026-07-07 → 07-10 (#59–#71)

Follow-through on #58: DID-management ops accepted as trust-task documents over HTTPS too (`POST /api/trust-tasks` via `bridge_did_management`, #60; step-up over TSP declared a deliberate non-goal — no session to bind); a typed `did-hosting/did/*/1.0` protocol with eight ops — check-name, info, list, delete, publish, register, change-owner, witness-publish — carrying the `didLog` the upstream record-centric spec had no room for (#61); **outbound** control→server sync and domain pushes over TSP when the target advertises `TSPTransport` (#62/#63), closing the "no outbound Trust-Task sender" gap noted for #58; **TSP fully decoupled from DIDComm** — `FEATURES_TSP`, `Protocols` BOTH / TSP_ONLY / DIDCOMM_ONLY, a 3-way `TransportSelection` wizard/recipe field, TSP→DIDComm send fallback, DID docs advertising only the selected transports; the witness stays DIDComm-only (#64); TSP-only nodes mint the `did-host-http-tsp` VTA template (#65); DID-document services shown as badges across the controller UI (#67–#69); server registration and health as transport-agnostic trust tasks with a `trust_task_capable` flag for rolling upgrades (#70); observed control-link transport recorded per service instance ("↓in/↑out", #71).

### TSP transport alongside DIDComm — 2026-07-07 (#58) — "everything is a trust task"

The headline change, and a clean illustration of the architecture: every wire operation in the workspace is a **Trust Task** — a versioned, JSON, transport-agnostic document — and the dispatch core doesn't care which transport delivered it. Adding TSP was therefore adding one *transport binding*, not a new protocol. Three bindings now exist: HTTPS (`POST /api/trust-tasks`), DIDComm v2 (mediator envelope), and TSP.

- TSP rides the **same per-DID mediator websocket** as DIDComm (no second socket): `affinidi-messaging-didcomm-service` unpacks inbound TSP frames, authenticates the sender VID, and routes to a new `WebvhTspHandler`, which dispatches through the shared core.
- `build_did_document` can emit a `#tsp` service of type `TSPTransport`, ordered *before* `#vta-didcomm` to match the VTA templates' canonical TSP-first order; a new `resolve_transport` helper prefers a peer's `TSPTransport` and falls back to `DIDCommMessaging`.
- All DID-management ops (check-name, publish, register, delete, change-owner, info, list, witness/publish) became reachable as trust-task documents over both TSP and DIDComm via a `bridge_did_management` facade; legacy `MSG_*` messages kept for back-compat.
- Scope limit at the time: inbound request/response over TSP was fully supported, but proactive outbound push (control→server sync) still used DIDComm — closed days later by #62/#70 (above).

### Trust-flow hardening — June–July 2026

- **Step-up converges on holder-self-signs** (#57): the wallet signs an `auth/step-up/approve-response/0.2` Trust Task with a W3C Data Integrity proof (eddsa-jcs-2022) over its session-subject key, and the RP verifies that proof directly — the VTA is **no longer a trusted third party** for step-up. Includes a cross-language interop test against the JS wallet (`@openvtc/pnm-core`) proving both eddsa-jcs-2022 implementations canonicalise byte-identically.
- A VTA-provisioned daemon now auto-trusts its provisioning VTA to publish DIDs (idempotent Admin ACL seeding at setup, #55); passkey-authenticated ACL writes fixed under trust-tasks-proof 0.2's stricter issuer rule via a `TransportBoundVerifier` (#44); the UI resolves the SIOP RP DID from the control plane at runtime instead of a build-time env var (#51).

### Ops/deployment maturity — June 2026

- Two new SecretStore backends ported from VTI's `vti-secrets` design: **HashiCorp Vault** KV v2 (K8s ServiceAccount JWT / static token / AppRole, background token renewal) and native **Kubernetes Secrets** (#53); priority chain now AWS → GCP → Azure → Vault → K8s → keyring → plaintext, wired into the wizard and the non-interactive TOML setup recipes.
- **Fuzzing harness** (#48): a detached cargo-fuzz crate with four libFuzzer targets, including a structure-aware one built on [[didwebvh-rs]]'s new `arbitrary` feature — a coordinated cross-repo fuzzing push (both landed 2026-06-14). Plus an OpenAPI 3.1 spec for the upload/resolve API with a drift-checked committed snapshot.
- Fixes: percent-decode the did:webvh host authority before domain validation — previously every port-bearing host like `localhost%3A8534` got a 400 (#56); DynamoDB binary-key prefix-scan fix (#43).

Earlier release history:

### v0.7.0 — 2026-05-24 — `did-hosting-service` rename + multi-domain + multi-method + client crate + Trust Tasks ACL

The single largest release since v0.1.0. Bundles three coordinated specs (`docs/multi-domain-spec.md`, `docs/multi-method-hosting-spec.md`, `docs/did-hosting-client-crate-spec.md`) and a 57-task rollout plan into one cutover.

- **Repository + binary rename.** `webvh-server` / `webvh-control` / `webvh-daemon` keep their service-binary names internally, but the public templates and binaries are renamed to capability names (`did-host-http`, `did-host-didcomm`, `did-host-http-didcomm`). The `webvh-*` template names remain aliased for one release.
- **First-class domain objects.** A single deployment hosts DIDs across multiple domains. ACL `DomainScope` semantics; control-plane-driven server assignment with retain-then-purge unassignment lifecycle; transport over Trust Tasks 0.2; `trusted_proxy_cidrs` for safe `Host` / `Forwarded` handling; opt-in `/.well-known/did-hosting-domain.json` for external discovery.
- **Multi-method.** `DidMethod` trait abstracts resolution + lifecycle differences. Both `did:webvh` and `did:web` are default-enabled; storage uses a unified `DidRecord` shape; compile-time feature gating per method.
- **`did-hosting-client` companion crate.** Trust-Tasks URLs only; multi-domain + multi-method aware from v0.1. Intended for downstream consumers like the [[verifiable-trust-infrastructure|VTI]] daemon.
- **Trust Tasks 0.2 ACL.** ACL operations move onto Trust Tasks 0.2 with the dual-accept envelope.

Follow-on fixes in the same line: `check-name` probe/reserve/auto-assign contract (PR #38); accept canonical camelCase log/owner fields on did-management wire (PR #39); set in-band recipient on every trust-task envelope (PR #41); bump `vta-sdk` to 0.10 (lockstep with `vti-common` 0.9.1, PR #42); enable `did:webvh` + `did:web` by default in daemon; `host:port` domains resolve consistently end-to-end.

### VTA-proxied SIOP login + visualization (M2B.4) — 2026-05-26

End-to-end demo of the **VTA-as-credential-manager** model — the user logs in with a `did-self-issued` vault entry pinned to this RP's DID; the long-term signing key never leaves the VTA, and the page only ever sees a short-lived SIOPv2 `id_token`. Three round-trips, each timed and visualised:

1. Page `POST /auth/challenge` with the entry's principal DID → RP returns a one-shot nonce bound to that DID.
2. Wallet asks the VTA via `vault/proxy-login/0.1` to mint a SIOP `id_token` signed by the entry's signing key, embedding the RP's challenge as `nonce`. Wallet receives a `SessionBlob` with the `id_token` in an `Authorization: Bearer …` header.
3. Page `POST /auth/` with the `id_token` → server resolves the entry's DID, verifies the signature, checks `nonce == challenge`, issues a bearer access token.

UI additions: feature-detect `Login via VTA proxy` button (hidden when the wallet is too old), candidate picker modal when the user has multiple matching entries, visualisation modal with per-step timeline + decoded `id_token` claims + `SessionBlob` summary. Cleanly extends the existing `/auth/challenge` + `/auth/` routes in `did-hosting-control`; no Rust changes needed there.

### Post-v0.6.0 — DID ownership management

DID ownership management (REST + DIDComm + UI). `did-hosting accepts canonical webvh/*` and `did-management` spec URIs for info / list / change-owner + me/domains; alias bridge dropped in the end-state cutover (PR #28).

### v0.6.0 — 2026-05-05 — web-based ACL invites, VTA template, offline bootstrap

- New `webvh-ui` crate joins the workspace
- All three refresh handlers (control, server, witness) require a JWS-signed DIDComm envelope and bind the signer to the session DID
- Offline-bootstrap latent bug fixed: previously `BTreeMap::iter().next()` picked the wrong `DidKeyMaterial` entry by alphabetical iteration; now matches by `did_document.id`
- Refresh-token rotation TOCTOU closed end-to-end via a new `KeyspaceOps::take_raw_atomic` primitive (Redis `GETDEL` / DynamoDB `DeleteItem ALL_OLD` / fjall mutex / per-keyspace mutex on Firestore + Cosmos DB)
- Registry / proxy trust chain hardened in `webvh-control`: `RegistryConfig` gains an optional `url_allowlist`; reqwest `Policy::none()` blocks third-party redirects; the proxy strips RFC 7230 §6.1 hop-by-hop headers and `Set-Cookie` from upstream responses
- Watcher `/api/sync/did` body limited to 4 MiB; `validate_did_jsonl` requires `state.id` to start with `did:webvh:`
- DIDComm authentication closes an auth-bypass on every REST `/api/auth/` endpoint (`unpack_signed` rejects envelopes whose `from` field disagrees with the JWS-verified signer)
- Witness `sign_proof` is now Admin-only with audit-log emission on every signed proof

### v0.5.0 — 2026-04-13 — DIDComm control-plane integration

- DIDComm control-plane integration
- Daemon parity with the split deployment
- Architecture simplified to consume the published `vta-sdk` crate

### Cold-start bootstrap, stats overhaul, VTA integration — 2026-03-31 to 2026-04-09

- Stats overhaul (unified collector, time-series tracking, per-DID resolve counts)
- VTA integration with unified startup and local session caching
- `import-secrets` CLI for self-contained environment bootstrap

### v0.1.0 — 2026-03-30 — first production release

- DIDComm auth migration
- Security audit fixes
- Passkey enrollment
- Root DID bootstrap
- Setup wizards

See also: [[did-webvh]], [[didwebvh-rs]], [[verifiable-trust-agent]]
