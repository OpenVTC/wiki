---
title: "vti-setup — VTI Setup Guides"
type: entity
tags: [vti, setup, deployment, documentation, guides, secondary, cypress, dogwood, kubernetes, supply-chain]
date-updated: 2026-10-07
repo: https://github.com/OpenVTC/vti-setup
---

# vti-setup — VTI Setup Guides

*Repo: [github.com/OpenVTC/vti-setup](https://github.com/OpenVTC/vti-setup)*

vti-setup is the operational companion to the ecosystem's code repos: tested, version-pinned walkthroughs (plus a bootstrap script) for standing up the full [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]] — the [[verifiable-trust-agent|VTA]], the mediator, DID hosting, and the VTC service — and for the things people do on top of it: joining communities and running one.

Where the code repos answer "what is this component?", vti-setup answers "how do I actually run this?" It's a documentation-first repo — guides, one bash bootstrap script, and a lint CI (shellcheck, a remote-exec guard, markdownlint) — but every walkthrough carries a "Verified with" version matrix and a "Tested on" platform line, and the dominant maintenance theme is keeping the guides verified against the fast-moving upstream binaries. Two version sets live in the repo today. The sysop explore stream is still pinned to the coordinated **`VTI-Dogwood`** release ([[coordinated-releases]]): VTA 0.23.2 / Mediator 0.20.2 / DID Hosting Daemon 0.8.3 / VTC 0.11.58; it was *not* re-pinned to `VTI-Eucalyptus` (2026-10-07), and the repo carries no Eucalyptus tag — its only tags are `Banyan` (June) and `archive/sysop-deploy`. The developer guides, by contrast, were re-verified on 09-23 (#44) against a *newer* stack than the explore pin: VTA **0.39.0** / Mediator **0.28.36** / DHD 0.8.3 — roughly the Eucalyptus-era Farm — so a developer following Path A today meets a newer VTA than a sysop following the explore walkthrough builds.

## Organized by Persona, Not by Service

The repo's core design choice: guides are grouped by **who you are**, each persona folder led by a README that acts as that persona's journey index. The top-level README's Components diagram was redrawn in September (#39) around the two agents a developer actually meets: *their* Personal VTA driven by OpenVTC on one side, the *community's* VTA with the VTC service and VTC Admin UI on the other, meeting only through the shared Mediator and DID Host — TSP on every transport edge beside REST and DIDComm, the sealed bundles labeled as carrying context, DID and keys, and the third-party app and CNM CLI dropped.

### `developer/` — participating in communities

The individual-user path: stand up a **Personal VTA** → install and bind the [[openvtc|OpenVTC TUI]] → join a community. Rewritten for Cypress (#26) and refreshed again on 09-23 (#44) against VTA 0.39.0 / Mediator 0.28.36.

The Personal VTA guide offers two paths:
- **Path A — VTA Farm** (vtafarm.firstperson.dev) — a managed VTA on a Kubernetes cluster run by the project; since July 2026 **open self-signup** (no invitation needed), passkey-based. The recommended default for individuals. The `pnm` binary (firstperson.dev downloads) checks your VTA, mediator, and DIDComm/TSP trust pings with `pnm health`. The Farm itself is open source as [[vtafarm]] (the web front-end), [[vtafarm-api]] and [[vtafarm-k8s]] — this guide is the *user's* view of it. (The Farm has since grown a "Connect with Keyring" phone path and a Trust-Task sign-in; the guide still describes the PNM paste-the-temp-DID flow only.)
- **Path B — self-hosted** — your own host, your own [[did-webvh|did:webvh]] log, your own mediator wiring ("the hard way"). Since #36 the guide says which PNM build you get: the sysop guide installs the keyring-free **`pnm-server`** build (secrets in plaintext config, right for a headless server); to drive that VTA from a workstation instead, install the default build, which keeps secrets in the OS keyring. Either way the binary is called `pnm`.

The OpenVTC guide reflects the current TUI: a setup wizard that **mints no persona**; you authorize the TUI against your VTA with `pnm contexts create --id openvtc … --admin-expires 1h --admin-holder` — the new `--admin-holder` flag is what lets OpenVTC manage your own identity (attributes, profiles, disclosures), which sits above any single context; without it the **My Identity** panel's tabs are refused — and it opens a [[trust-spanning-protocol|TSP]] or [[didcomm|DIDComm]] session, whichever the VTA advertises. The wizard now ticks off each bootstrap check, offers hardware-token setup (NitroKey / YubiKey) when the build carries it, and detects a context already holding an OpenVTC account (recover, go back, or add a second account). The joining guide dropped the "M-DID" vocabulary for **persona** throughout: creating a persona (from **My Identity**, `n`) is now *optional* — if you have none when you join, OpenVTC mints one and puts the community in "a context of its own" — and worth doing first only when the community will send you an [[invitation-credential|invitation credential]], since a VIC is bound to a persona DID. Join by the community's **DID or agent name** (`community.example.com/@acme`), and a community that vets its members or asks applicants about themselves shows what would be sent before anything leaves. Since #46 the two-VRC peer-vouching policy from the [[dtg-credential-spec|spec]] is presented as *one example of a policy a community could adopt*, not the planned default: join policy is written by each community, and nobody has decided what the first one will use (refs issue #30).

### `community-manager/` — running a VTC

The VTC-operator path: bootstrap the community, author join/role policies, manage the ACL / [[trust-registries|trust registry]], run the manual-review queue. Still explicit roadmap stubs ("_To be documented_"); the README points at the explore walkthrough's VTC step (install URL + claim code → passkey → `/admin` dashboard) and, since #38, at the deploy stream for a farm-hosted VTC.

### `sysop/` — running the infrastructure

Two streams, both now documented:

- **`explore/`** — the learning stream. A throwaway single VM (`scripts/setup-explore.sh`: Ubuntu, Valkey, ufw, Rust, nginx + certbot, four vhosts), everything as root, each component set up through its interactive wizard, with loud "no real keys here" warnings. Walks the full chain — `vta setup` (selecting REST, DIDComm **and TSP**, a seed-storage backend, the hardened encrypted store, automatic mediator ACL provisioning), mediator (TSP + DIDComm), DID Hosting Daemon (transport "Both DIDComm and TSP"; then registered with the VTA via `pnm did-mgmt servers add`, #24), VTC (transports TSP & DIDComm, trust-registry DID, `admin-ui` feature, #23; its DID published via the daemon under the WebVH path `vtc`) — threading cross-step values via "save this ID" tables. Source builds `git checkout VTI-Dogwood` in VTI, the TDK and did-hosting-service (#35); pre-built binaries come from `download.firstperson.dev/<component>/latest/` (tracking the newest tagged release) or `/main/` (labeled *unverified*), with PNM taken from the `pnm-server/` path. **The setup script is fetched from `main` again** (#45): Step 3 has you `curl -O` it from `raw.githubusercontent.com/OpenVTC/vti-setup/main/…`, read it (`less`), and only then `sudo bash setup-explore.sh <domain>`. Downloading to a file rather than piping into bash stays, and the script is still one `main()` called on its last line so a truncated download runs nothing — but the SHA-256 pin, the GitHub Release and the provenance attestation that #37 introduced are gone (see below for why).
- **`deploy/`** — the hardened production stream, which **is the VTA Farm**. Since #38 (09-18) the README is no longer a placeholder but an index page: what a farm is (every user in their own Kubernetes namespace, every VTA master seed in **HashiCorp Vault**, TLS at the ingress from a cert-manager wildcard certificate, VTAs provisioned from a browser with a passkey); a table mapping each explore walkthrough step to the Kubernetes Job the farm runs for it (`vta setup --from`, the `vta import-did --role admin` Job after *you* run `pnm setup`, the three-Job mediator and DID-host sealed-bundle hand-offs, `vtc setup --from`, a Deployment per component); the three repos to read in order — [[vtafarm-k8s]] (OpenTofu stacks and runbooks), [[vtafarm-api]] (the Go provisioning API) and [[vtafarm]] (the React portal); the five OpenTofu layers (k3s management cluster → Rancher → an RKE2 farm cluster → cert-manager, Longhorn and the two Vaults → the two Helm charts); prerequisites (a Hetzner project and Object Storage bucket, a Cloudflare-hosted zone, a `did:key` for the API registered with DID hosting as a Service role); and where the day-two runbooks live. The pre-Cypress systemd deploy docs remain preserved under the tag **`archive/sysop-deploy`** (09-15).

Both streams use the **offline sealed-bundle bootstrap over DIDComm** — the same HPKE-sealed flow used when the VTA is air-gapped — even when all services share a host; a farm's **VTA Only** session (a developer's Personal VTA) skips it by attaching to the farm's shared mediator and DID host.

## What It Wires Together

| Component | Upstream |
|-----------|----------|
| VTA (key store: BIP-39 seed, DIDs, contexts, ACL) + `pnm` client (`pnm-server` build on the explore host) | [[verifiable-trust-infrastructure]] |
| DID Host (`dids.` subdomain) | [[affinidi-webvh-service\|did-hosting-service]] |
| Mediator (DIDComm v2 + TSP) + `mediator-setup` | [[affinidi-tdk]] |
| VTC service (community policy layer, admin UI) | [[verifiable-trust-infrastructure]] |
| OpenVTC TUI | [[openvtc]] |
| Managed Personal VTA (Path A) / the deploy stream | [[vtafarm]] / [[vtafarm-api]] / [[vtafarm-k8s]] |
| Valkey | mediator storage backend (loopback-only, AOF persistence) |
| nginx + certbot, ufw | TLS on four subdomains (`vta`, `mediator`, `vtc`, `dids`), firewall |
| Pre-built binaries | `download.firstperson.dev` (`/latest/` = newest tagged release, `/main/` = main-branch builds) — **no checksums or signatures published**; the guide says so and confines them to throwaway hosts |
| `setup-explore.sh` | fetched from this repo's `main`, downloaded to a file and read before it is run as root |

## Recent Development

The repo is young (~46 PRs since the initial scaffold on 2026-04-28) and has been restructured three times — a sign the team is converging on how to *teach* the stack, not just build it. September added a supply-chain pass and then, two weeks later, took most of it back out again on the grounds that it bought nothing.

### Deploy stream documented, developer path re-verified, release flow dropped — 2026-09-18 → 09-23 (#38, #39, #42, #44, #45, #46)

- **The deploy stream is the VTA Farm** (#38, 09-18): `sysop/deploy/README.md` rewritten from a stub into the index page described above, and every page that had pointed at the deploy stream as "planned" or "not yet documented" — the top-level and sysop READMEs, the explore pages, the community-manager README, the developer Personal VTA guide — updated, with a VTA Farm row in the components table. This closes the loose end the wiki carried for months: the Kubernetes + Vault deployment vti-setup promised exists, and vti-setup now says where.
- **Components diagram redrawn** (#39, 09-21) around a developer VTA and a community VTA, TSP on every edge, CNM gone, a VTC row in the component table.
- **Developer path refreshed** (#44, 09-23): all three guides re-verified at **VTA 0.39.0 / Mediator 0.28.36 / DHD 0.8.3** (from Cypress's 0.17.0 / 0.18.19) and rewritten to the current OpenVTC TUI — `--admin-holder`, the **My Identity** panel, optional personas, "Who should this community know you as?", the context-already-in-use page, hardware-token setup, the vetting / "tell us about yourself" page before a join request leaves. The Farm account prerequisite was dropped (self-signup makes it a step, not a prerequisite). One wrinkle to know about: `02-openvtc-tui.md`'s matrix puts **0.11.58** in the *OpenVTC* column while `03-joining-a-community.md` keeps OpenVTC at 0.3.1 and VTC at 0.11.58 — the TUI table appears to have taken the VTC's version by mistake.
- **Lint CI finished** (#42, 09-23, mitchuski): two `developer/01` links written with a leading `/` resolved against github.com and 404'd — including the first link the developer journey asks you to follow; and `markdownlint-cli2`, documented as the lint step since #37, now actually runs in `lint.yml`.
- **Release flow dropped** (#45, 09-23): #37 had operators download `setup-explore.sh` from a tagged GitHub Release, check it against a SHA-256 pinned in the guide, and verify a build-provenance attestation. The pin, the release assets and the attestation all come from github.com over TLS and are all controlled by whoever can write to the repository, so together they added little over fetching the script from the repository itself — while adding a pin-before-tag process, a `gh` 2.49+ requirement Ubuntu 26.04 does not meet, and a failure that actually happened: **`v1.0.0` was pinned but never tagged, so Step 3 had 404'd since it landed** (issue #40; last cycle's "tag not yet visible on the remote" loose end, resolved by deleting the mechanism). `RELEASING.md` and `release.yml` are gone; `guard-remote-exec.sh` still refuses `curl | sh` patterns but no longer refuses fetches from `main`.
- **Two-VRC is an example** (#46, 09-23): the joining guide and the community-manager README had described "two existing members vouch via VRCs" as the current or planned initial-days policy; it is now one example a community could adopt (refs #30).
- Not done: the explore stream is still on `VTI-Dogwood` (no Eucalyptus re-pin, no `VTI-Eucalyptus` tag here); `community-manager/01-bootstrap-vtc.md` is still a stub; the TUI matrix's OpenVTC version needs a look.

### Dogwood pin + trust the script you run as root — August–September 2026 (#35–#37, `archive/sysop-deploy`)

- **Explore stream re-pointed at `VTI-Dogwood`** (#35, 08-30): the three source checkouts (VTI, affinidi-tdk-rs, affinidi-webvh-service) move from `Cypress` to `VTI-Dogwood`, and the walkthrough's matrix becomes VTA **0.23.2** / Mediator **0.20.2** / DHD 0.8.3 / VTC 0.11.58. Dogwood was a tag-only, "silent" release, so this is the one place its version set is written down for operators.
- **Non-interactive, keyring-free** (#36, 08-30, closes #34): every apt call through an `apt_get()` helper that sets `DEBIAN_FRONTEND=noninteractive` / `NEEDRESTART_MODE=a` *on the command line* (sudo's `env_reset` strips exported variables); the explore host installs the **`pnm-server`** build, with the from-source build gaining `--features "config-session,tsp"` to match.
- **Verify everything the script runs and downloads** (#37, Glenn Gore, 09-12): the whole script is one `main()` called on its last line under `set -euo pipefail`; domain and email validated before anything runs; Rust from Ubuntu's signed `rustup` package with a SHA-256-pinned `rustup-init 1.29.1` fallback; Node.js only at the optional DID Hosting UI build step; **Docker gone**. First CI (`lint.yml`: shellcheck + the remote-exec guard), Dependabot with a 7-day cooldown, and the release pipeline (`release.yml`, `RELEASING.md`, a SHA-256 pin in the guide) that #45 later removed. The guide states plainly that `download.firstperson.dev` publishes no checksums.
- **`archive/sysop-deploy`** (09-15, tagged by vthwang): preserves the pre-Cypress systemd deploy stream at its last commit, "before replacement with placeholder" — the prelude to #38.

### Cypress pass — July–August 2026 (#23–#33)

- **Cypress release docs** (#25): every guide re-verified and pinned to the `Cypress` tag (VTA 0.17.0 / mediator 0.18.19 / DHD 0.8.3 / VTC 0.11.58 / OpenVTC 0.3.1); download host moved from `fpp.ic3.dev` to `download.firstperson.dev` with `/latest/` and `/main/` aliases; the `cnm` binary dropped. **The entire deploy stream was retired** (`sysop/deploy/01–04`, `kubernetes.md`, `local-dev.md`, `aws-ec2.md`, `bootstrap-user.sh`, `setup-deploy.sh`, −2,249 lines) in favor of the planned Kubernetes + Vault deploy stream.
- **Developer walkthroughs rewritten** (#26): Personal VTA (VTA Farm now open self-signup; `pnm health`), OpenVTC TUI (no-persona setup, `pnm contexts create` authorization, TSP-or-DIDComm session), joining a community (persona from the dashboard, join by DID or agent name, VIC paste or open request, admin approval).
- Explore source checkouts moved from `VTI-Cypress-RC-1` to the final `Cypress` tag (#33). Two upstream-driven steps from Danube Tech (Markus Sabadello): `admin-ui` feature on `vtc-service` install (#23); register the DID Hosting Daemon's DID with the VTA (#24).
- Issues worth knowing: #28 (a cross-mediator join request doesn't reach the VTC admin panel — multi-mediator explicitly out of scope for now), #30 (the two-member VRC approval workflow — now addressed in the docs by #46); #27 (Pending-after-approval, fixed by OpenVTC 0.3.1), #29, #31, #32 closed.

### Explore/deploy split + verification sweep — June 2026

- Sysop docs split into the **explore** and **deploy** streams (PR #13); explore stream refreshed with numbered journey files (#14). Mediator storage backend switched to **Valkey** (#15); mediator CORS moved into the provisioning recipe (#19). **VTA Farm path** added to the Personal VTA guide (#17). Verification sweep against current binaries (#18, #20 — the `Banyan`-tagged commit, 06-22 — #21, #22).

### Personas restructure — 2026-05-29

- Repo reorganized around the three personas (PR #8); `webvh` subdomain renamed to `dids` (#9); VTC step added to interactive setup (#10); standalone DID-hosting deployment path + interactive setup guide (#11).

### Scenario-matrix era — late April–May 2026

- Initial scaffold: architecture diagrams + a 12-scenario matrix; scenario guides, persona guide P01, tutorials T01/T02. None of these files survive in the tree.

See also: [[verifiable-trust-infrastructure]], [[verifiable-trust-agent]], [[openvtc]], [[affinidi-webvh-service]], [[didcomm]], [[vtafarm]], [[vtafarm-api]], [[vtafarm-k8s]], [[coordinated-releases]]
