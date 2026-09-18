---
title: "vtafarm-api — VTA Farm provisioning backend"
type: entity
tags: [vta-farm, hosting, kubernetes, vault, go, provisioning, secondary, deployment]
date-updated: 2026-09-18
repo: https://github.com/ic3software/vtafarm-api
---

# vtafarm-api — VTA Farm provisioning backend

*Repo: [github.com/ic3software/vtafarm-api](https://github.com/ic3software/vtafarm-api)*

vtafarm-api is the engine behind **VTA Farm**: a Go REST service that turns "create agent" in the [[vtafarm]] portal into a running [[verifiable-trust-agent|VTA]] — DNS, TLS, a Kubernetes namespace, a Vault-sealed seed, a published [[did-webvh]] document, a mediator wiring, and a super-admin handed to the user's own PNM. It is the oldest of the three Farm repos (first commit 2026-05-26, 97 commits) and the one where the security model actually lives. It describes itself as "managing VTA setup sessions with per-user namespace isolation", which is exactly right: a *session* is one provisioned stack, and everything about it is scoped to the user who owns it.

## Why it is shaped this way

Hosting someone else's trust agent is a delicate promise: the VTA is a signing oracle whose value is that *only its controller* can make it act. The API answers that in three layers. **Per-user namespaces** (`vtafarm-user-<id>`) with their own ServiceAccounts and RBAC keep tenants apart. **HashiCorp Vault** holds each VTA's BIP-39 master seed at `secret/vta/user-<id>/session-<id>/master-seed`, readable only by a Vault role bound to that namespace's `vta` ServiceAccount; the API's own AppRole policy *deliberately has no read capability on any seed path* — it provisions and tears down access but never reads a secret. **Control stays with the user**: the Farm only ever runs `vta import-did --role admin` with a DID minted by the user's local `pnm setup`, so the admin key never exists on Farm infrastructure. What the operator *can* do is documented honestly: the ClusterRole includes `pods/exec` and PVC access, config exports reveal mediator admin material, and whoever holds Vault's root token holds everything — this is Vault-sealed hosting, not a TEE.

## What It Does

**Provisioning a VTA Only session** (the path every individual takes):

1. `POST /setup` validates, creates a proxied Cloudflare A record `vta-<name>.firstperson.dev`, persists the session.
2. `EnsureUserEnvironment` (namespace, `pod-operator` and `vta` ServiceAccounts, Role, RoleBinding) and `EnsureUserAccess` (Vault policy + kubernetes-auth role `vta-user-<id>`).
3. Renders `vta-setup.toml`: REST, [[didcomm|DIDComm]] **and** [[trust-spanning-protocol|TSP]] enabled (#25); `[secrets] backend = "vault"`; `[messaging] kind = "existing"` pointing at the platform stack's mediator DID; `[vta_did] kind = "create_webvh"` at the platform DID host under `/<name>-vta`; CORS pre-allowing the [[vta-browser-plugin|VTA Wallet]] extension origin.
4. Runs `vta setup` as a one-off Job on a 200 Mi PVC; parses the VTA DID and DID log from stdout; publishes the `did.jsonl` to the [[affinidi-webvh-service|did-hosting daemon]] using the Farm's own `did:key`, enrolled in that daemon's ACL as admin.
5. Parks at `awaiting_admin_did` until the user supplies the `did:key` from `pnm setup`; then a provision Job runs `vta import-did --role admin` (no context restriction — a super-admin) and `did-mgmt servers add`.
6. Creates Deployment, Service and a Traefik Ingress (wildcard TLS from the controller's default TLSStore, no per-Ingress config) and marks the session `running` only when `/health` reports Ready (0.4.0).

Teardown reverses all of it — DNS, hosted DID and ACL entry, Kubernetes resources, the Vault seed.

**Full Stack** (behind `beta_access`) runs the same pipeline for four components — VTA, mediator ([[affinidi-tdk]]), DID-hosting daemon and VTC ([[verifiable-trust-infrastructure]]) — on four hosts, every one using Vault kubernetes auth, the mediator keeping messages in fjall on its PVC (no Valkey), the VTC image required to be built with `--features vault-secrets`. It is the Kubernetes automation of [[vti-setup]]'s single-host explore flow, including the offline sealed-bundle steps.

**The platform stack** is one Full Stack at `vta.` / `mediator.` / `dids.` / `vtc.firstperson.dev`, owned by a system account, that every VTA Only agent depends on; `vta_only` is refused (503, with a reason) until it is running. Admins can add co-admins to its VTA from the panel (#23) — which scales the VTA to zero, runs an ACL Job against its fjall store and scales it back.

Around the core: **domains** (`managed` / `platform` / `custom` — custom zones verified by TXT + four CNAMEs, certificates via cert-manager HTTP-01); **stack sharing** (a share code lets up to ten VTA Only agents attach to a Full Stack's mediator and DID host); **capacity gating** (#14); **monitor endpoints** for UptimeRobot (#13); per-session and batch **image upgrades**; config/log **exports** (#34); and **load tests** (#37, #39). Images are listed live from GHCR (`ghcr.io/ic3software/{vta,mediator,did-hosting-daemon,vtc}`), newest first with `latest` flagged — the Farm does **not** pin a [[coordinated-releases|coordinated release]]; each session records the tag it was created with.

## Components

| Package | Role |
|---------|------|
| `internal/setup/` | orchestrator state machines (`vta_only`, `full_stack`, VTC), TOML templates, stdout parsers; resumes interrupted sessions on restart |
| `internal/k8s/` | client-go: namespaces, Jobs, Deployments, PVCs, Ingress/Traefik middleware, cert-manager Certificates, readiness, exec |
| `internal/vault/` | per-user policy and kubernetes-auth role; seed deletion |
| `internal/didhosting/` | control-plane client per daemon URL, cached tokens (0.4.0) |
| `internal/cloudflare/`, `internal/dnscheck/` | proxied A records; custom-domain verification |
| `internal/handler/` | user, admin, setup, domain, sharing, upgrade, monitor, load-test, signup, passkey routes (OpenAPI at `/docs`) |
| `migrations/` | 28 golang-migrate steps (admins → users → sessions → passkeys → full-stack → domains → sharing → grants → load tests) |
| `helm/vtafarm-api/` | chart with bundled PostgreSQL 18.4, ClusterRole, Vault/GHCR/WebAuthn values |
| `docs/` | nine design documents — the authoritative account of each feature |

Stack: Go 1.26, Gin, GORM, PostgreSQL 18, client-go v0.36, passkeys via WebAuthn, HS256 JWT cookies.

## Dependencies & relationships

Consumed by [[vtafarm]]; deployed and given its Vault by [[vtafarm-k8s]] (stack 04 installs Vault, `vault-bootstrap.sh farm` mints the API's AppRole; stack 05 installs the chart). Drives the `vta`, `mediator`, `did-hosting-daemon` and `vtc` binaries by their `setup --from` recipes exactly as [[vti-setup]] documents for a human. The user's side of the handshake is the `pnm` CLI from [[verifiable-trust-infrastructure]].

## Recent Development

Releases: **v0.1.0**, **v0.2.0** (2026-08-19), **v0.3.0** (08-20), **v0.3.1** (08-30), **v0.4.0** (08-31).

- **09-13** SIOPv2 wallet-login design, proposed (#40); **09-12** ephemeral load-test admin DID (#39); **09-04** Apache-2.0 + DCO (#38).
- **08-31 v0.4.0** load tests (#37); readiness-gated `running` (#36). **08-30 v0.3.1** full-stack mediators `cors = "any"` (#35). **08-20 v0.3.0** exports (#34); PVCs at `/work/<component>` (#33).
- **08-19 v0.1.0/v0.2.0** GHCR publishing, changelog; **Vault charts handed to vtafarm-k8s**; retaining StorageClass; origin and zone from config (#31, #32).
- **08-17/18** ingress-nginx → **Traefik** (#27, #28); VTA Wallet origin allowed; monitor window (#30).
- **08-12 TSP advertised across all four components (#25).** **08-02/03** VTA Only on a shared custom stack (#22); platform-stack co-admins (#23).
- **07-26 → 07-31** custom domains (#17, #18); `full_stack_with_vtc` folded (#16); admin delete (#15); env-pasted infra values removed (#19); shared dev PostgreSQL (#20).
- **07-09 → 07-23** admin session list and batch upgrades; signup requests (#9); self-service upgrades (#10); resource tuning (#11); dashboard (#12); monitor (#13); capacity gate (#14).
- **07-01 → 07-08** Full Stack (#5); Vault in mediator and DID hosting (#6); VTC (#7); custom naming (#8).
- **06-09 → 06-26** VTA Only wizard (#1); passkey-only auth (#2); rename (#3); **master seed moved from a K8s Secret into Vault (#4, 06-22)**; VTA linked to the DID-hosting control plane; single provision Job.
- **05-26/27** scaffold: per-user-namespace pod management, Helm deploy, Postgres 18.

### Maturity and known gaps

Production for individuals since June; Full Stack, sharing and custom domains are beta. Open by design: how a *user-supplied* DID host would authorise the Farm; single-region Cloudflare-only DNS; no per-connection revocation on shared stacks; SIOP login unbuilt.

See also: [[vtafarm]], [[vtafarm-k8s]], [[vti-setup]], [[vta-topology]], [[verifiable-trust-agent]], [[affinidi-tdk]], [[affinidi-webvh-service]]
