---
title: "vti-setup — VTI Setup Guides"
type: entity
tags: [vti, setup, deployment, documentation, guides, secondary, cypress, kubernetes]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/vti-setup
---

# vti-setup — VTI Setup Guides

*Repo: [github.com/OpenVTC/vti-setup](https://github.com/OpenVTC/vti-setup)*

vti-setup is the operational companion to the ecosystem's code repos: tested, version-pinned walkthroughs (plus a curl-able bootstrap script) for standing up the full [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]] — the [[verifiable-trust-agent|VTA]], the mediator, DID hosting, and the VTC service — and for the things people do on top of it: joining communities and running one.

Where the code repos answer "what is this component?", vti-setup answers "how do I actually run this?" It's a documentation-only repo — guides and one bash bootstrap script — but every walkthrough carries a "Verified with" version matrix and a "Tested on" platform line, and the dominant maintenance theme is keeping the guides verified against the fast-moving upstream binaries. Since August 2026 the guides are pinned to the coordinated **`Cypress`** release ([[coordinated-releases]]): VTA 0.17.0 / Mediator 0.18.19 / DID Hosting Daemon 0.8.3 / VTC 0.11.58 / OpenVTC 0.3.1.

## Organized by Persona, Not by Service

The repo's core design choice: guides are grouped by **who you are**, each persona folder led by a README that acts as that persona's journey index.

### `developer/` — participating in communities

The individual-user path, rewritten for Cypress (#26): stand up a **Personal VTA** → install and bind the [[openvtc|OpenVTC TUI]] → join a community.

The Personal VTA guide offers two paths:
- **Path A — VTA Farm** (vtafarm.firstperson.dev) — a managed VTA on a Kubernetes cluster run by the project; since July 2026 **open self-signup** (no invitation needed), passkey-based. The recommended default for individuals. The `pnm` binary (firstperson.dev downloads) checks your VTA, mediator, and DIDComm/TSP trust pings with `pnm health`.
- **Path B — self-hosted** — your own host, your own [[did-webvh|did:webvh]] log, your own mediator wiring ("the hard way")

The OpenVTC guide reflects the Cypress-era TUI: a clean four-section setup wizard (Get Started → Key Management → Profile Security → Setup Complete) that **mints no persona**; you authorise the TUI against your VTA with `pnm contexts create --id openvtc … --admin-expires 1h`, and it opens a [[trust-spanning-protocol|TSP]] or [[didcomm|DIDComm]] session — whichever the VTA advertises. The joining guide then has you mint a persona (M-DID) from the dashboard, enter the community's **DID or agent name** (`community.example.com/@acme`), optionally paste a [[invitation-credential|VIC]] or send an open request, and wait for an admin to approve in the VTC admin console (which creates the member + ACL row and issues the VMC + role VEC). The two-VRC peer-vouching flow described in the [[dtg-credential-spec|spec]] is explicitly labelled *target design, not current behaviour*.

### `community-manager/` — running a VTC

The VTC-operator path: bootstrap the community, author join/role policies, manage the ACL / [[trust-registries|trust registry]], run the manual-review queue. Still explicit roadmap stubs ("_To be documented_"); the README meanwhile points at the explore walkthrough's VTC step (install URL + claim code → passkey → `/admin` dashboard).

### `sysop/` — running the infrastructure

Two streams, of which one is currently live:

- **`explore/`** — the learning stream. A throwaway single VM (`scripts/setup-explore.sh`: Ubuntu, Valkey, ufw, Rust, Node, Docker, nginx + certbot, four vhosts), everything as root, each component set up through its interactive wizard, with loud "no real keys here" warnings. Walks the full chain — `vta setup` (selecting REST, DIDComm **and TSP**, a seed-storage backend, the hardened encrypted store, automatic mediator ACL provisioning), mediator (TSP + DIDComm), DID Hosting Daemon (transport "Both DIDComm and TSP"; then registered with the VTA via `pnm did-mgmt servers add`, #24), VTC (transports TSP & DIDComm, trust-registry DID, `admin-ui` feature, #23; its DID published via the daemon under the WebVH path `vtc`) — threading cross-step values via "save this ID" tables. Source builds `git checkout Cypress` in VTI, the TDK and did-hosting-service (#33); pre-built binaries come from `download.firstperson.dev/<component>/latest/` (tracking the newest tagged release) or `/main/`.
- **`deploy/`** — the hardened production stream. **Coming soon**: the earlier systemd + TOML-recipe deploy docs were retired in the Cypress pass (#25) in favour of a planned **Kubernetes deployment** — HashiCorp Vault as the secret store, TLS via cert-manager/Let's Encrypt, TOML recipes — documented alongside the **VTA Farm**, so that deploying a VTA for an individual becomes straightforward (whether you run the cluster or use the Farm). Today the section is a placeholder that points at the explore stream.

Both streams use the **offline sealed-bundle bootstrap over DIDComm** — the same HPKE-sealed flow used when the VTA is air-gapped — even when all services share a host.

## What It Wires Together

| Component | Upstream |
|-----------|----------|
| VTA (key store: BIP-39 seed, DIDs, contexts, ACL) + `pnm` client | [[verifiable-trust-infrastructure]] |
| DID Host (`dids.` subdomain) | [[affinidi-webvh-service|did-hosting-service]] |
| Mediator (DIDComm v2 + TSP) + `mediator-setup` | [[affinidi-tdk]] |
| VTC service (community policy layer, admin UI) | [[verifiable-trust-infrastructure]] |
| OpenVTC TUI | [[openvtc]] |
| Valkey | mediator storage backend (loopback-only, AOF persistence) |
| nginx + certbot, ufw | TLS on four subdomains (`vta`, `mediator`, `vtc`, `dids`), firewall |
| Pre-built binaries | `download.firstperson.dev` (`/latest/` = newest tagged release, `/main/` = main-branch builds) |

## Recent Development

The repo is young (~33 PRs since the initial scaffold on 2026-04-28) and has been restructured three times — a sign the team is converging on how to *teach* the stack, not just build it.

### Cypress pass — July–August 2026 (#23–#33)

- **Cypress release docs** (#25): every guide re-verified and pinned to the `Cypress` tag (VTA 0.17.0 / mediator 0.18.19 / DHD 0.8.3 / VTC 0.11.58 / OpenVTC 0.3.1); the guides now distinguish "latest tagged release" from "last compiled commit from main"; download host moved from `fpp.ic3.dev` to `download.firstperson.dev` with `/latest/` and `/main/` aliases; the `cnm` binary dropped from the guides. **The entire deploy stream was retired** (`sysop/deploy/01–04`, `kubernetes.md`, `local-dev.md`, `aws-ec2.md`, `bootstrap-user.sh`, `setup-deploy.sh`, −2,249 lines) in favour of the planned Kubernetes + Vault deploy stream.
- **Developer walkthroughs rewritten** (#26): Personal VTA (VTA Farm now open self-signup; `pnm health`), OpenVTC TUI (no-persona setup, `pnm contexts create` authorisation, TSP-or-DIDComm session), joining a community (persona from the dashboard, join by DID or agent name, VIC paste or open request, admin approval). Two-VRC vouching demoted to "target design".
- Explore source checkouts moved from `VTI-Cypress-RC-1` to the final `Cypress` tag (#33).
- Two upstream-driven steps from Danube Tech (Markus Sabadello): `admin-ui` feature on `vtc-service` install (#23); register the DID Hosting Daemon's DID with the VTA (#24).
- Issues worth knowing: #28 (a cross-mediator join request doesn't reach the VTC admin panel — multi-mediator explicitly out of scope for now), #30 (clarify the two-member VRC approval workflow — "still work in progress … one option in the set of join ceremonies"); #27 (Pending-after-approval, fixed by OpenVTC 0.3.1), #29, #31, #32 closed.

### Explore/deploy split + verification sweep — June 2026

- Sysop docs split into the **explore** and **deploy** streams (PR #13); explore stream refreshed with numbered journey files (#14)
- Mediator storage backend switched to **Valkey** (#15); mediator CORS moved into the provisioning recipe instead of nginx Origin-stripping (#19)
- **VTA Farm path** added to the Personal VTA guide (#17)
- Verification sweep against current binaries: explore path aligned with the current interactive flow (#18), VTC DID publishing + DID Host ACL prep documented (#20), Personal VTA walkthrough synced to current TUI prompts (#21), standalone deploy docs aligned with actual binary output and behaviour (#22)

### Personas restructure — 2026-05-29

- Repo reorganized around the three personas (PR #8); `webvh` subdomain renamed to `dids` (#9); VTC step added to interactive setup (#10); standalone DID-hosting deployment path + interactive setup guide (#11)

### Scenario-matrix era — late April–May 2026

- Initial scaffold: architecture diagrams + a 12-scenario matrix; scenario guides (S01 online, S05/S07 offline-VTA, S08), persona guide P01, tutorials T01/T02, component renames with compatibility rows. None of these files survive in the tree — they were absorbed by the two restructures.

See also: [[verifiable-trust-infrastructure]], [[verifiable-trust-agent]], [[openvtc]], [[affinidi-webvh-service]], [[didcomm]]
