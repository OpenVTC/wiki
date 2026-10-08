---
title: "vtafarm-api — VTA Farm provisioning backend"
type: entity
tags: [vta-farm, hosting, kubernetes, vault, go, provisioning, siopv2, mobile, secondary, deployment]
date-updated: 2026-10-07
repo: https://github.com/ic3software/vtafarm-api
---

# vtafarm-api — VTA Farm provisioning backend

*Repo: [github.com/ic3software/vtafarm-api](https://github.com/ic3software/vtafarm-api)*

vtafarm-api is the engine behind **VTA Farm**: a Go REST service that turns "create agent" in the [[vtafarm]] portal into a running [[verifiable-trust-agent|VTA]] — DNS, TLS, a Kubernetes namespace, a Vault-sealed seed, a published [[did-webvh]] document, a mediator wiring, and a super-admin handed to the user's own PNM or phone. It is the oldest of the three Farm repos (first commit 2026-05-26, 129 commits) and the one where the security model actually lives. It describes itself as "managing VTA setup sessions with per-user namespace isolation", which is exactly right: a *session* is one provisioned stack, and everything about it is scoped to the user who owns it.

## Why it is shaped this way

Hosting someone else's trust agent is a delicate promise: the VTA is a signing oracle whose value is that *only its controller* can make it act. The API answers that in three layers. **Per-user namespaces** (`vtafarm-user-<id>`) with their own ServiceAccounts and RBAC keep tenants apart. **HashiCorp Vault** holds each VTA's BIP-39 master seed at `secret/vta/user-<id>/session-<id>/master-seed`, readable only by a Vault role bound to that namespace's `vta` ServiceAccount; the API's own AppRole policy *deliberately has no read capability on any seed path* — it provisions and tears down access but never reads a secret. **Control stays with the user**: the Farm only ever runs `vta import-did --role admin` with a DID minted on the user's own device — by `pnm setup` on a workstation or, since 0.11.0, by the [[keyring-wallet|Keyring]] phone wallet answering a QR — so the admin key never exists on Farm infrastructure. What the operator *can* do is documented honestly: the ClusterRole includes `pods/exec` and PVC access, config exports and the TOML editor reveal mediator admin material, and whoever holds Vault's root token holds everything — this is Vault-sealed hosting, not a TEE.

## What It Does

**Provisioning a VTA Only session** (the path every individual takes):

1. `POST /setup` validates (including, since 0.12.0, the account's VTA limit), creates a proxied Cloudflare A record `vta-<name>.firstperson.dev`, persists the session.
2. `EnsureUserEnvironment` (namespace, `pod-operator` and `vta` ServiceAccounts, Role, RoleBinding) and `EnsureUserAccess` (Vault policy + kubernetes-auth role `vta-user-<id>`).
3. Renders `vta-setup.toml`: REST, [[didcomm|DIDComm]] **and** [[trust-spanning-protocol|TSP]] enabled (#25); `[secrets] backend = "vault"`; `[messaging] kind = "existing"` pointing at a mediator DID; `[vta_did] kind = "create_webvh"` at a DID host under `/<name>-vta`; CORS pre-allowing the [[vta-browser-plugin|VTA Wallet]] extension origin. By default both point at the platform stack; since 0.8.0 `POST /setup/connection/inspect` lets the user name any DID-hosting DID and mediator DID instead, classified as *platform*, *in-farm* or *external*.
4. Runs `vta setup` as a one-off Job on a 200 Mi PVC with explicit Fjall cache / write-buffer / journal budgets (0.9.3); parses the VTA DID and DID log from stdout; publishes the `did.jsonl` to the [[affinidi-webvh-service|did-hosting daemon]] — since 0.9.4 over **signed [[trust-tasks|Trust Tasks]] with verified signed replies**, the daemon's REST management and bearer-token flows having been removed upstream — using the Farm's own `did:key`, enrolled in that daemon's ACL as admin. An external DID host instead parks at `awaiting_did_publication` with the `did.jsonl` offered for download until the published history resolves.
5. Parks at `awaiting_admin_did` until an Admin DID arrives — pasted from `pnm setup`, or posted by a phone to the signed one-time callback URL in the **Automatic Mobile Connection** QR (0.11.0: the code carries `vta_did` and a `callback_url` whose credential the Farm minted; the app POSTs its Ed25519 `did:key`, gets a `progress_token`, polls progress and reports completion; accepted work is durable across retries and API restarts, migration 000039). Then a provision Job runs `vta import-did --role admin` (a super-admin; mobile administrators carry the ACL label `mobile integration`) and `did-mgmt servers add`.
6. Creates Deployment, Service and a Traefik Ingress (wildcard TLS from the controller's default TLSStore) and marks the session `running` only when `/health` reports Ready (0.4.0).

Teardown reverses all of it — DNS, hosted DID and ACL entry, Kubernetes resources, the Vault seed. The same connection flows (PNM paste or Keyring QR) add further administrators to a *running* VTA (0.6.0 / 0.11.0): ACL maintenance is serialized per session, keeps a synchronized ACL snapshot (exposed as Super Admin entries only, 0.6.1) and restarts the VTA afterwards.

**Full Stack** (behind **Fullstack Access**, the flag that replaced `beta_access` in 0.12.0) runs the same pipeline for four components — VTA, mediator ([[affinidi-tdk]]), DID-hosting daemon and VTC ([[verifiable-trust-infrastructure]]) — on four hosts, every one using Vault kubernetes auth, the mediator keeping messages in fjall on its PVC (no Valkey), the VTC image required to be built with `--features vault-secrets` and, since 0.11.1, provisioned in **single-admin mode** so the initial administrator can add another without a second existing approver. The ephemeral VTC setup DID is granted one-time hand-off access so VTC can replace it with its permanent admin DID (0.9.1 — the same VTI-ACL-054 hand-off the browser wallet adopted). It is the Kubernetes automation of [[vti-setup]]'s single-host explore flow, including the offline sealed-bundle steps, and vti-setup's deploy stream now documents it step by step.

**The platform stack** is one Full Stack at `vta.` / `mediator.` / `dids.` / `vtc.firstperson.dev`, owned by a system account, that every default VTA Only agent depends on; `vta_only` is refused (503, with a reason) until it is running. Admins can add co-admins to its VTA (#23), inspect and refresh its live ACL (0.6.0), and edit its components' TOML (0.7.0).

Around the core: **domains** (`managed` / `platform` / `custom` — custom zones verified by TXT + four CNAMEs, certificates via cert-manager HTTP-01); **per-component TOML configuration** read, validated and applied with a readiness check and automatic restore on failure (0.7.x); **image upgrades** per session or in batch, with automatic rollback to the previous image when a component fails to come up (0.9.1); **memory profiles** — admin-tunable requests and limits per component and session, persistent factory defaults (0.10.0: 128/256 Mi mediator, 64/256 Mi VTC, 16/64 Mi VTA, 64/128 Mi DID hosting — 272/704 Mi for a full stack) feeding capacity estimates (#14); **monitor endpoints** for UptimeRobot (#13); config/log **exports** (#34); **load tests** (#37, #39); and a **SIOPv2 wallet login** (0.5.0) — its own Go verifier of Ed25519 `id_token`s against `did:key` or `did:webvh` keys including did:webvh history and rotation, a second login method behind durable one-time challenges that issues the existing role-scoped cookie, with at least one passkey retained for recovery. Images are listed live from GHCR (`ghcr.io/ic3software/{vta,mediator,did-hosting-daemon,vtc}`), newest first with `latest` flagged — the Farm does **not** pin a [[coordinated-releases|coordinated release]]; each session records the tag it was created with, and nothing in the repo names a default tag.

## Components

| Package | Role |
|---------|------|
| `internal/setup/` | orchestrator state machines (`vta_only`, `full_stack`, VTC), TOML templates, stdout parsers, Fjall budgets; resumes interrupted sessions on restart |
| `internal/connection/`, `internal/didkey/` | DID-pair inspection (platform / in-farm / external); `did:key` validation for admin DIDs |
| `internal/k8s/`, `internal/upgrade/`, `internal/resourceprofile/`, `internal/capacity/` | client-go: namespaces, Jobs, Deployments, PVCs, Ingress/Traefik middleware, cert-manager Certificates, readiness, exec; upgrade + rollback; memory profiles and placement estimates |
| `internal/vault/` | per-user policy and kubernetes-auth role; seed deletion |
| `internal/didhosting/` | Trust-Task client per daemon URL (rewritten in #60 from the REST/bearer client) |
| `internal/siop/`, `internal/passkey/` | the SIOPv2 verifier and challenge store; WebAuthn |
| `internal/cloudflare/`, `internal/dnscheck/`, `internal/ghcr/` | proxied A records; custom-domain verification; live image-tag listing |
| `internal/handler/` | user, admin, setup, connection, mobile-connection, domain, upgrade, resource, monitor, load-test, signup, passkey, siop routes (OpenAPI at `/docs`) |
| `migrations/` | 40 golang-migrate steps (admins → users → sessions → passkeys → full-stack → domains → sharing → grants → load tests → wallet links → config → resources → mobile connections → fullstack access) |
| `helm/vtafarm-api/` | chart with bundled PostgreSQL 18.4, ClusterRole, Vault/GHCR/WebAuthn/SIOP/mobile-signing values |
| `docs/` | eleven design documents — VTA setup, full stack, custom domains, platform-stack grants, load tests, SIOP login (+ browser testing), the mobile connection design and the **Mobile Connection App API** the Keyring team integrates against |

Stack: Go 1.26, Gin, GORM, PostgreSQL 18, client-go, passkeys via WebAuthn, HS256 JWT cookies, Dependabot since 10-05.

## Dependencies & relationships

Consumed by [[vtafarm]]; deployed and given its Vault, SIOP settings and `MOBILE_CONNECTION_SIGNING_KEY` by [[vtafarm-k8s]] (stack 04 installs Vault, `vault-bootstrap.sh farm` mints the API's AppRole; stack 05 installs the chart). Drives the `vta`, `mediator`, `did-hosting-daemon` and `vtc` binaries by their `setup --from` recipes exactly as [[vti-setup]] documents for a human. The user's side of the handshake is the `pnm` CLI from [[verifiable-trust-infrastructure]] or the Keyring phone wallet speaking the Mobile Connection App API; the wallet login verifies tokens from the [[vta-browser-plugin]].

## Recent Development

Releases: **v0.1.0 / v0.2.0** (2026-08-19), **v0.3.0** (08-20), **v0.3.1** (08-30), **v0.4.0** (08-31), then **v0.5.0 → v0.12.1** between 09-18 and 10-05 — sixteen releases, each one the API half of a portal release.

### Eucalyptus-era releases — 2026-09-18 → 10-05 (v0.5.0 → v0.12.1; #41–#73)

- **10-05 v0.12.1** (#73) — Go dependency refresh via the new Dependabot (#65–#71: kubernetes group, gin-contrib/cors, golang-migrate 4.20, pgx driver, x/net, x/sync). **v0.12.0** (#64) — *breaking*: `fullstack_access` replaces `beta_access` and the admin endpoint moves to `/api/v1/admin/users/{id}/fullstack-access`; users without it hold at most **two** undeleted VTAs (provisioning and failed sessions count; deletion frees a slot; concurrent creation cannot exceed it); profiles carry `vta_count` / `vta_limit` (migration 000040).
- **10-04 v0.11.1** (#63) — Farm-provisioned VTCs enable **single-admin mode**.
- **09-30 v0.11.0** (#62) — **Automatic Mobile Connection**: signed QR callbacks, acceptance of a phone's Ed25519 `did:key`, progress and completion endpoints, durable connection requests (migration 000039), the `mobile integration` ACL label, a per-environment `MOBILE_CONNECTION_SIGNING_KEY`, callback URLs derived from the cluster domain, and the app-facing API document. **v0.10.0** (#61) — persistent **memory defaults** (admin endpoints, migration 000038), the 272/704 Mi factory profile, live-deployment fallback for session resource summaries.
- **09-29 v0.9.4** (#60) — **DID hosting over signed Trust Tasks**; the daemon's removed REST management and bearer-token flows no longer supported; enrollment requires the **claim code** beside the single-use URL (0.9.2, #57). **v0.9.3** (#58) — memory profiles and Fjall budgets applied to every new workload, capacity estimates aligned. **v0.9.1** (#55, #56) — failed image upgrades roll back automatically, surviving an API restart; the VTC setup DID gets one-time hand-off access.
- **09-27 v0.9.0** (#54) — admin **resource endpoints**: desired vs live memory, validated single or batch changes with sequential readiness and rollback; failed sessions keep the stage they stopped at. **v0.8.0** (#51, #52) — *breaking*: the share-code API (`PUT /setup/{id}/sharing`, `/setup/connection/validate`, `MAX_STACK_CONNECTIONS`) removed; `POST /setup/connection/inspect` takes a DID-hosting DID and a mediator DID and classifies the host; **external DID hosting** retains the generated `did.jsonl` and pauses at `awaiting_did_publication` until owner-only validation passes.
- **09-23/24 v0.7.0 / v0.7.1** (#47, #49) — per-component **TOML config** read/validate/update with targeted restart, readiness check and automatic restore; the temporary Secrets the write and rollback Jobs need.
- **09-21 v0.6.0 / v0.6.1** (#43, #44, #46) — link another PNM administrator to a running VTA; read and refresh the synchronized ACL; the platform stack's live ACL for admins; ACL endpoints filtered to unrestricted Super Admin entries.
- **09-18 v0.5.0** (#41, #42) — the **SIOP verifier** and linked-wallet login; accounts with a linked wallet must keep a passkey.

### Earlier

- **09-13** SIOPv2 wallet-login design, proposed (#40); **09-12** ephemeral load-test admin DID (#39); **09-04** Apache-2.0 + DCO (#38).
- **08-31 v0.4.0** load tests (#37); readiness-gated `running` (#36). **08-30 v0.3.1** full-stack mediators `cors = "any"` (#35). **08-20 v0.3.0** exports (#34); PVCs at `/work/<component>` (#33). **08-19 v0.1.0/v0.2.0** GHCR publishing, changelog; **Vault charts handed to vtafarm-k8s**; origin and zone from config (#31, #32). **08-17/18** ingress-nginx → **Traefik** (#27, #28); VTA Wallet origin allowed; monitor window (#30). **08-12 TSP advertised across all four components (#25).** **08-02/03** VTA Only on a shared custom stack (#22); platform-stack co-admins (#23).
- **07-26 → 07-31** custom domains (#17, #18); `full_stack_with_vtc` folded (#16); admin delete (#15); shared dev PostgreSQL (#20). **07-09 → 07-23** admin session list and batch upgrades; signup requests (#9); self-service upgrades (#10); dashboard (#12); monitor (#13); capacity gate (#14). **07-01 → 07-08** Full Stack (#5); Vault in mediator and DID hosting (#6); VTC (#7). **06-09 → 06-26** VTA Only wizard (#1); passkey-only auth (#2); **master seed moved from a K8s Secret into Vault (#4, 06-22)**. **05-26/27** scaffold.

### Maturity and known gaps

Production for individuals since June; Full Stack and custom domains are behind Fullstack Access or cluster prerequisites; the mobile connection is labeled *Testing* and its end-to-end path depends on the Keyring app. Open by design: how a *user-supplied* DID host authorizes the Farm (the external-host flow makes the user publish the log themselves rather than solve it); single-region Cloudflare-only DNS; the SIOP login verifies the wallet's `proxyLogin` shape, not the `auth/authenticate/0.2` Trust-Task sign-in the browser plugin's plain `login` moved to on 09-28.

See also: [[vtafarm]], [[vtafarm-k8s]], [[vti-setup]], [[vta-topology]], [[verifiable-trust-agent]], [[affinidi-tdk]], [[affinidi-webvh-service]], [[trust-tasks]], [[rp-sdk-js]]
