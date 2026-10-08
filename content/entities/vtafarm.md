---
title: "vtafarm — VTA Farm portal (frontend)"
type: entity
tags: [vta-farm, hosting, kubernetes, frontend, react, passkeys, keyring, mobile, secondary, deployment]
date-updated: 2026-10-07
repo: https://github.com/ic3software/vtafarm
---

# vtafarm — VTA Farm portal (frontend)

*Repo: [github.com/ic3software/vtafarm](https://github.com/ic3software/vtafarm)*

**VTA Farm** is the hosted service where a person gets a [[verifiable-trust-agent|Personal VTA]] without running any infrastructure — and this repo is the part of it you can see. For months the wiki described the Farm only through its users ([[vti-setup]]'s "Path A", the [[vta-topology]] table) and promised that the sysop *deploy* stream — Kubernetes, HashiCorp Vault, the Farm itself — was "coming soon". In August 2026 it shipped as three open-source repos under the `ic3software` org: this portal, the [[vtafarm-api]] that does the provisioning, and [[vtafarm-k8s]], which builds the cluster it all runs on. Together they are the reference **Verifiable Trust Service Provider** the spec vocabulary anticipated — and since 09-18 the one [[vti-setup]]'s deploy stream points at.

## Why a portal

A cloud VTA has to be always-on, reachable at a public HTTPS name, hold a [[did-webvh]] log somewhere resolvable, and be wired to a mediator — a weekend for a sysop, a wall for everyone else. The portal turns it into a form: sign in with a passkey, name your agent, pick an image, click **Create**. What makes it *acceptable* to host other people's agents — the seed sealed in Vault, one namespace per user, an operator that provisions access but never reads a seed — is the API's and the cluster's job. The portal's job is to make it legible: what is running, what its DIDs are, and how to hand control to your own PNM — which, since the Eucalyptus-era releases, is as likely to be a phone as a terminal.

## What It Does

A React 19 + Vite 8 + TypeScript 6 single-page app (Tailwind v4, shadcn/ui, Radix, Lucide; `@simplewebauthn/browser` for passkeys; `qrcode.react` for the connection codes), served by nginx from a container that renders the API URL into `/config.js` at start-up so one image serves every deployment (#35). Since v0.12.2 the public site and portal carry a **red** accent palette (the mockups and every release before were violet) and the landing page leads with **Create account**, with **Login** for returning users. Five routes:

- **`/`** — the marketing site (hero, how-it-works, features).
- **`/login`, `/register`, `/recover`** — passkey-only user auth (#1), accounts from an invitation link or, since July, an email **signup request** (#6, the "open self-signup"). Since v0.5.0 an account can also **link a VTA Wallet identity** and sign in with it as a second method ([[vta-browser-plugin]] persona DIDs, verified by the API); at least one passkey must remain as the recovery path.
- **`/portal`** — the user portal: *Agents* list (now with the account's VTA usage and limit), *Create agent*, per-agent detail, *Domains*, *Settings*.
- **`/admin/login`, `/admin/enroll`** — admin auth via single-use enrollment tokens, then passkeys (or a linked wallet).
- **`/admin`** — the operator console.

### Creating an agent

The create form offers two modes. **VTA Only** deploys just the VTA, pointed by default at the Farm's shared *platform stack* mediator and DID host — or, under **Customize**, at any DID-hosting DID and mediator DID you type in, which the API inspects and classifies as platform, in-farm or external before anything is created (v0.8.0; an external DID host pauses the flow while you publish the generated `did.jsonl` yourself). **Full Stack** deploys VTA + mediator + DID-hosting daemon + VTC in your own namespace and is gated by **Fullstack Access**, the admin-set flag that replaced `beta_access` in v0.12.0; everyone else may hold at most **two** VTAs and never sees the mode selector. Images are chosen from a live list of GHCR tags with the newest marked *latest* and preselected. A phase stepper follows the API's state machine with server-sent log streaming and, since v0.9.0, marks the stage where a failed setup actually stopped.

The one human step comes after `vta setup` has run and the page shows your **VTA DID**: the Farm needs an **Admin DID** to import as your VTA's super-admin, and since v0.11.0 there are two ways to give it one. **Connect with Keyring** — the recommended default — shows a QR code; you scan it with the Berkman Klein Center's [[keyring-wallet|Keyring]] phone wallet (TestFlight and Google Play links, themselves offered as QR codes since v0.12.1), the app posts its hardware-held `did:key` to a signed one-time callback, and the page follows the connection through *pending* → *provisioning* → *connected* with an expiry countdown and a replace-expired-code action. **Connect with PNM** is the original flow: run `pnm setup` locally ("connect to an existing non-TEE VTA"), paste its temporary `did:key` back, click **Provision agent**; the download dialog now covers Linux and macOS with copyable terminal instructions. (A third, transitional "scan the VTA DID and paste the app's DID manually" option shipped in v0.11.0 and was removed in #67 a few days later.) Either way nobody at the Farm ever holds the admin key. From there `pnm health`, the [[openvtc|OpenVTC TUI]], the browser wallet (its extension origin is pre-allowed in CORS) and Keyring connect as they would to any VTA.

### Living with an agent

A running agent's page is organized (v0.11.2) into **Overview**, **Connections**, **Credentials** and **Settings** tabs around a larger live console. *Connections* carries the same Keyring / PNM controls as setup, for adding another administrator to the running VTA, plus the VTA's ACL as the Farm last synchronized it (Super Admin entries only, with an explicit refresh from the live VTA — v0.6.x). *Settings* holds the **self-service version card** to move any component to another registry tag (#7) — a failed upgrade now rolls back automatically and the page says whether the previous image was restored (v0.9.1) — a **per-component TOML editor** that checks syntax, restarts only that component and reports its readiness check (v0.7.0), the **Configs & logs** export (#37, explicitly a credential disclosure), and a type-the-name delete. The **Share** panel of August (mint a share code for a friend) is **gone**: v0.8.0 replaced share codes with the DID-pair connection above. The **Domains** page (#18, #21) verifies a zone you own (one TXT plus four CNAMEs) so a Full Stack can run at `vta.yourdomain` with a Let's Encrypt certificate.

### The admin console

Dashboard with placement-simulated cluster headroom (#8); Sessions with pagination, mode filter, batch image upgrades and, since v0.9.0, per-component **memory requests and limits** inspected and changed on one or many running sessions; **Resource Defaults** for the factory memory profile new deployments get (v0.10.0); Users (flip **Fullstack Access**), Invitations, Signup requests, Admins, Security (incl. linked wallets), Audit; **Platform stack** — since v0.11.2 a page shaped like an agent's, with a live VTA console, administrator management and its live ACL, credentials, version controls, exports and a guarded danger zone (#30 grants, #47 ACL); and **Load testing** — 1–50 VTA Only sessions with an ephemeral admin DID, torn down in one action (#38, #41).

## Components

| Path | Role |
|------|------|
| `src/pages/portal/` | Agents, CreateVTA, SessionDetail (tabs), ConnectionMethodUi / SessionPnmCard / VtaConnectionCard (Keyring + PNM), ExternalDIDPublicationCard, FullStackOutputs, Domains, Settings, VtaLimitDialog, version/export cards |
| `src/pages/admin/` | Dashboard, Sessions, Users, Invitations, Admins, Security, Audit, PlatformStack (+Admins), ResourceDefaults, ResourceModal, UpgradeModal, LoadTesting |
| `src/contexts/` | separate user and admin auth contexts (cookie-scoped to `/admin`) |
| `helm/vtafarm/` | chart; `Chart.yaml` is the single version number, `appVersion` = image tag (#36); each release names the API version it requires |
| `docker/` | entrypoint that renders `$API_URL` into `/config.js` |
| `docs/` | frontend design notes for custom domains; the release guide |
| `claude-design/` | the HTML mockups the UI was built from (violet primary, IBM Plex — superseded by the red palette) |

## Dependencies & relationships

Everything the portal shows comes from [[vtafarm-api]] (`/api/v1/...`); it is deployed by [[vtafarm-k8s]] stack 05 next to the API, behind Traefik. It is the "VTA Farm" of [[vti-setup]]'s Path A and deploy stream, and the cloud-personal-VTA row of [[vta-topology]]. Its two clients for the admin key are the `pnm` CLI from [[verifiable-trust-infrastructure]] and the [[keyring-wallet|Keyring]] phone wallet (a Berkman Klein Center project, not an OpenVTC repo). It is *not* a VTA client: after provisioning, your PNM surfaces talk to the VTA directly.

## Recent Development

Releases: **v0.1.0 / v0.2.0** (2026-08-19), **v0.3.0** (08-20), **v0.4.0** (08-31), then **v0.5.0 → v0.12.2** between 09-18 and 10-05 — eighteen releases in seventeen days, each pinned to a [[vtafarm-api]] version. Image `ghcr.io/ic3software/vtafarm`, chart `ghcr.io/ic3software/charts/vtafarm`, signed tags. 116 commits since 2026-06-08. The Farm is not in the `VTI-Eucalyptus` tag set; it offers whatever GHCR image tags exist rather than pinning a coordinated release ([[coordinated-releases]]).

### Eucalyptus-era releases — 2026-09-18 → 10-05 (v0.5.0 → v0.12.2; #44–#82)

The month the Farm stopped assuming its user owns a laptop. The Keyring wallet's own plan for "the phone at every level of the developer path" (its `keyring-on-the-vta-farm.md`, aimed at the OSS Summit Europe in Prague on 10-01) asked for exactly one Farm-side change — a QR the phone can answer instead of a DID the human pastes — and the Farm built it.

- **10-05 v0.12.2** — accent **violet → red** across light and dark themes, favicon included; **Create account** promoted to the landing page's primary action (#82). **v0.12.1** — Keyring download dialogs with TestFlight / Google Play QR codes; PNM downloads for macOS with copyable platform instructions; Linux PNM from the latest release and `./pnm setup` (#71, #81). **v0.12.0** — **Fullstack Access** replaces Beta Access; VTA usage and the two-VTA limit shown in the agent list, with a dialog explaining how to free a slot (#72). Dependabot (#73–#80).
- **10-04 v0.11.2 / v0.11.3** — the running-agent page reorganized into Overview / Connections / Credentials / Settings tabs; the admin Platform Stack page rebuilt in the same shape; **Connect with Keyring** made the recommended default and local setup labeled **Connect with PNM**; expired-QR handling; mobile-friendly agent cards (#68–#70). The manual "scan then paste" mobile option removed (#67).
- **09-30 v0.11.0 / v0.11.1** — **mobile integration** (#65): the Automatic Mobile Connection QR flow for the first administrator and for additional devices, with restored pending requests and expiry replacement; the create flow stays on *Deploy VTA* until the API confirms readiness (#66). **v0.10.0** — admin **Resource Defaults** page (#64).
- **09-29 v0.9.2 / v0.9.3** — DID Hosting enrollment shows and copies the **claim code** current daemon images require, and no longer offers the link-only invitation of older images (#62, #63 "latest did hosting"). **v0.9.1** — upgrade views follow a failed upgrade through automatic rollback (#60).
- **09-27 v0.9.0** — admin per-component memory tuning across one or many sessions; failed-stage markers (#59). **v0.8.0** — **share codes removed**; VTA-only creation connects to an in-farm or external DID host and an independently chosen mediator by DID, with the `did.jsonl` publication step for external hosts (#55, #57).
- **09-23 v0.7.0 / v0.7.1** — **per-component TOML editor** (#50); scrollable dialogs (#52); duplicate names in upgrade dialogs (#54).
- **09-21 v0.6.0 / v0.6.1** — link additional PNM administrators to a running agent, inspect and refresh its ACL; admins the same for the platform stack (#46, #47); ACL lists filtered to Super Admin entries (#49).
- **09-18 v0.5.0** — **linked VTA Wallet login** (#44): link a persona DID from Settings / Security and sign in with it beside your passkeys; Apache-2.0 + DCO; ephemeral load-test admin DIDs.

### Earlier

- **08-31 v0.4.0** load-test UI (#38). **08-20 v0.3.0** configs & logs download (#37). **08-19 v0.1.0 / v0.2.0** first published release — GHCR images and charts, changelog, release guide; runtime API URL (#35); chart appVersion as image tag (#36). **08-17** Traefik (#33).
- **08-02/03** VTA Only against a shared custom stack (#27); platform-stack admin grant (#30). **07-26 → 07-28** custom domains (#18, #21); `full_stack_with_vtc` folded into `full_stack` (#16); admin delete (#15). **07-09 → 07-23** admin Sessions view and batch upgrades; **signup requests** (#6); version card (#7); dashboard (#8). **07-01 → 07-08** Full Stack mode (#4). **06-08 → 06-26** scaffold from Claude-generated mockups; portal/admin split, log streaming, Docker/Helm/GHA; **passkey-only auth** (#1) and rename to `vtafarm` (#2).

### Maturity and known gaps

0.x, values may change between releases. Full Stack is behind Fullstack Access; custom domains ship but wait on cluster prerequisites; the Automatic Mobile Connection is labeled *Testing* in the API's design note and depends on the Keyring app's side of the callback; the marketing copy still promises "hardware enclave" keys and "pick a region", which is not what the current Vault-backed, single-region deployment does. The wallet login is SIOPv2 — the shape the browser plugin's `proxyLogin` still produces, though its plain `login` moved to `auth/authenticate/0.2` Trust Tasks on 09-28.

See also: [[vtafarm-api]], [[vtafarm-k8s]], [[vti-setup]], [[vta-topology]], [[verifiable-trust-agent]], [[openvtc]], [[vta-browser-plugin]], [[coordinated-releases]]
