---
title: "vtafarm — VTA Farm portal (frontend)"
type: entity
tags: [vta-farm, hosting, kubernetes, frontend, react, passkeys, secondary, deployment]
date-updated: 2026-09-18
repo: https://github.com/ic3software/vtafarm
---

# vtafarm — VTA Farm portal (frontend)

*Repo: [github.com/ic3software/vtafarm](https://github.com/ic3software/vtafarm)*

**VTA Farm** is the hosted service where a person gets a [[verifiable-trust-agent|Personal VTA]] without running any infrastructure — and this repo is the part of it you can see. For months the wiki described the Farm only through its users ([[vti-setup]]'s "Path A", the [[vta-topology]] table) and promised that the sysop *deploy* stream — Kubernetes, HashiCorp Vault, the Farm itself — was "coming soon". In August 2026 it shipped as three open-source repos under the `ic3software` org: this portal, the [[vtafarm-api]] that does the provisioning, and [[vtafarm-k8s]], which builds the cluster it all runs on. Together they are the reference **Verifiable Trust Service Provider** the spec vocabulary anticipated.

## Why a portal

A cloud VTA has to be always-on, reachable at a public HTTPS name, hold a [[did-webvh]] log somewhere resolvable, and be wired to a mediator — a weekend for a sysop, a wall for everyone else. The portal turns it into a form: sign in with a passkey, name your agent, pick an image, click **Create**. What makes it *acceptable* to host other people's agents — the seed sealed in Vault, one namespace per user, an operator that provisions access but never reads a seed — is the API's and the cluster's job. The portal's job is to make it legible: what is running, what its DIDs are, and how to hand control to your own PNM.

## What It Does

A React 19 + Vite 8 + TypeScript 6 single-page app (Tailwind v4, shadcn/ui, Radix, Lucide; `@simplewebauthn/browser` for passkeys), served by nginx from a container that renders the API URL into `/config.js` at start-up so one image serves every deployment (#35). Five routes:

- **`/`** — the marketing site (hero, how-it-works, features).
- **`/login`, `/register`, `/recover`** — passkey-only user auth (#1). Accounts come from an invitation link, or since July from an email **signup request** (#6) — the "open self-signup" the wiki has recorded since then.
- **`/portal`** — the user portal: *Agents* list, *Create agent*, per-agent detail, *Domains*, *Settings*.
- **`/admin/login`, `/admin/enroll`** — admin auth via single-use enrolment tokens, then passkeys.
- **`/admin`** — the operator console.

### Creating an agent

The create form offers two modes. **VTA Only** deploys just the VTA, pointed at the Farm's shared *platform stack* mediator and DID host; **Full Stack** (gated by an admin-set `beta_access` flag) deploys VTA + mediator + DID-hosting daemon + VTC in your own namespace. Images are chosen from a live list of GHCR tags with the newest marked *latest* and preselected. A phase stepper follows the API's state machine with server-sent log streaming. The one human step: after `vta setup` runs, the page shows your **VTA DID** and waits for an **Admin DID** — you run `pnm setup` locally ("connect to an existing non-TEE VTA"), paste its temporary `did:key` back, click **Provision agent**, and the Farm imports it as your VTA's super-admin. Nobody at the Farm ever holds that key. From there `pnm health`, the [[openvtc|OpenVTC TUI]] and the [[vta-browser-plugin|browser wallet]] (its extension origin is pre-allowed in CORS) connect as they would to any VTA.

### Living with an agent

The session page shows endpoints and DIDs, a **self-service version card** to move any component to another registry tag (#7), a **Configs & logs** export (#37) — live zips of rendered `config.toml`s or pod logs, explicitly a credential disclosure — and a type-the-name delete. A Full Stack session gains a **Share** panel (#27): mint a share code, and a friend can create a VTA Only agent that uses *your* mediator and DID host ("Customize" in the create form). The **Domains** page (#18, #21) verifies a zone you own (one TXT plus four CNAMEs) so a Full Stack can run at `vta.yourdomain` with a Let's Encrypt certificate.

### The admin console

Dashboard with placement-simulated cluster headroom (#8); Sessions with pagination, mode filter and batch image upgrades; Users (flip `beta_access`), Invitations, Signup requests, Admins, Security, Audit; **Platform stack** creation and co-admin grants (#30); and since v0.4.0 **Load testing** — 1–50 VTA Only sessions with an ephemeral admin DID, torn down in one action (#38, #41).

## Components

| Path | Role |
|------|------|
| `src/pages/portal/` | Agents, CreateVTA, SessionDetail, FullStackOutputs, Domains, Settings, version/export cards |
| `src/pages/admin/` | Dashboard, Sessions, Users, Invitations, Admins, Security, Audit, PlatformStack, LoadTesting |
| `src/contexts/` | separate user and admin auth contexts (cookie-scoped to `/admin`) |
| `helm/vtafarm/` | chart; `Chart.yaml` is the single version number, `appVersion` = image tag (#36) |
| `docker/` | entrypoint that renders `$API_URL` into `/config.js` |
| `docs/` | frontend design notes for custom domains and stack sharing; the release guide |
| `claude-design/` | the HTML mockups the UI is built from (violet primary, IBM Plex) |

## Dependencies & relationships

Everything the portal shows comes from [[vtafarm-api]] (`/api/v1/...`); it is deployed by [[vtafarm-k8s]] stack 05 next to the API, behind Traefik. It is the "VTA Farm" of [[vti-setup]]'s Path A and the cloud-personal-VTA row of [[vta-topology]]. It is *not* a VTA client: after provisioning, your PNM surfaces talk to the VTA directly.

## Recent Development

Releases: **v0.1.0** and **v0.2.0** (2026-08-19), **v0.3.0** (08-20), **v0.4.0** (08-31) — image `ghcr.io/ic3software/vtafarm`, chart `ghcr.io/ic3software/charts/vtafarm`, signed tags. 79 commits since 2026-06-08.

- **09-12** ephemeral load-test admin DID (#41); **09-04** Apache-2.0 + DCO (#39).
- **08-31 v0.4.0** load-test UI (#38). **08-20 v0.3.0** configs & logs download (#37).
- **08-19 v0.1.0 / v0.2.0** first published release — GHCR images and charts, changelog, release guide; runtime API URL (#35); chart appVersion as image tag (#36); `imagePullSecrets` dropped (breaking). **08-17** Traefik (#33).
- **08-02/03** VTA Only against a shared custom stack (#27); platform-stack admin grant (#30).
- **07-26 → 07-28** custom domains (#18, #21); `full_stack_with_vtc` folded into `full_stack` (#16); admin delete (#15); env-derived values removed (#23); fixes (#25, #26).
- **07-09 → 07-23** admin Sessions view and batch upgrades; **signup requests** (#6, open self-signup); version card (#7); dashboard (#8); "Unavailable" when full (#13).
- **07-01 → 07-08** Full Stack mode (#4); default names `myvta`/`myvtc` (#5).
- **06-08 → 06-26** scaffold from Claude-generated mockups; portal/admin split, log streaming, Docker/Helm/GHA; invitation registration; **passkey-only auth** (#1) and rename to `vtafarm` (#2); admin-DID validation (#3).

### Maturity and known gaps

0.x, values may change between releases. Full Stack and stack sharing are behind `beta_access`; custom domains ship but wait on cluster prerequisites; the marketing copy still promises "hardware enclave" keys and "pick a region", which is not what the current Vault-backed, single-region deployment does. A **VTA Wallet SIOPv2 login** to the portal is designed but not built (API #40).

See also: [[vtafarm-api]], [[vtafarm-k8s]], [[vti-setup]], [[vta-topology]], [[verifiable-trust-agent]], [[openvtc]], [[vta-browser-plugin]]
