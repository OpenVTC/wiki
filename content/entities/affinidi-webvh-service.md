---
title: "did-hosting-service (formerly Affinidi WebVH Service)"
type: entity
tags: [affinidi, webvh, did-hosting, did-web, service, secondary, multi-method, multi-domain]
date-updated: 2026-07-06
repo: https://github.com/affinidi/affinidi-webvh-service
---

# did-hosting-service (formerly Affinidi WebVH Service)

*Repo: [github.com/affinidi/affinidi-webvh-service](https://github.com/affinidi/affinidi-webvh-service)*

Production infrastructure for hosting, resolving, and managing [[did-webvh|did:webvh]] (and, since v0.7.0, `did:web`) identifiers at scale. It's the operational backbone that makes self-hosted DIDs practical — handling the hosting, witnessing, and monitoring that individual users shouldn't have to manage themselves.

The repository was **renamed from `affinidi-webvh-service` to `did-hosting-service`** in v0.7.0 (May 2026). The rename reflects two architectural shifts: the service is no longer single-method (it now hosts both `did:webvh` and `did:web` by default, with a `DidMethod` trait abstraction and compile-time feature gating), and the binaries are now named for the **capability** they expose rather than a specific underlying method (`did-host-http`, `did-host-didcomm`, `did-host-http-didcomm`).

## Components

The service is a Rust workspace. As of v0.6.0, six service crates plus a UI crate and a shared library:

| Service | Port | Role |
|---------|------|------|
| **webvh-server** | 8530 | Core DID hosting — create, upload, resolve, delete DIDs via REST with DIDComm auth |
| **webvh-witness** | 8531 | Generate cryptographic witness proofs for DID integrity |
| **webvh-control** | 8532 | Management UI, service registry, reverse proxy, passkey auth, ACL |
| **webvh-watcher** | 8533 | Read-only DID mirror for redundancy (receives pushed updates) |
| **webvh-daemon** | 8534 | All-in-one binary (server + witness + watcher + control) for simple deployments |
| **webvh-ui** | — | Web UI assets (added in v0.6.0) |
| **webvh-common** | — | Shared library: clients, DID operations, auth, storage, config |

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

After hardening cross-service trust paths in v0.6.0 and pivoting to multi-domain / multi-method in v0.7.0, the June–July cycle (14 commits, all unreleased work heading toward a presumptive 0.8.0 — also the announced removal target for the deprecated legacy `/api/acl` REST surface, sunset header 2026-12-01) converges the service on the **Trust Tasks** framework as its universal wire abstraction and adds **[[trust-spanning-protocol|TSP]]** as a transport.

### TSP transport alongside DIDComm — 2026-07-07 (#58) — "everything is a trust task"

The headline change, and a clean illustration of the architecture: every wire operation in the workspace is a **Trust Task** — a versioned, JSON, transport-agnostic document — and the dispatch core doesn't care which transport delivered it. Adding TSP was therefore adding one *transport binding*, not a new protocol. Three bindings now exist: HTTPS (`POST /api/trust-tasks`), DIDComm v2 (mediator envelope), and TSP.

- TSP rides the **same per-DID mediator websocket** as DIDComm (no second socket): `affinidi-messaging-didcomm-service` unpacks inbound TSP frames, authenticates the sender VID, and routes to a new `WebvhTspHandler`, which dispatches through the shared core.
- `build_did_document` can emit a `#tsp` service of type `TSPTransport`, ordered *before* `#vta-didcomm` to match the VTA templates' canonical TSP-first order; a new `resolve_transport` helper prefers a peer's `TSPTransport` and falls back to `DIDCommMessaging`.
- All DID-management ops (check-name, publish, register, delete, change-owner, info, list, witness/publish) became reachable as trust-task documents over both TSP and DIDComm via a `bridge_did_management` facade; legacy `MSG_*` messages kept for back-compat.
- Scope limit (direction signal): inbound request/response over TSP is fully supported, but proactive outbound push (control→server sync) still uses DIDComm — the framework has no outbound Trust-Task sender yet.

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
