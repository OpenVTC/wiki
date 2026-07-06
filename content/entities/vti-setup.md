---
title: "vti-setup — VTI Setup Guides"
type: entity
tags: [vti, setup, deployment, documentation, guides, secondary]
date-updated: 2026-07-06
repo: https://github.com/OpenVTC/vti-setup
---

# vti-setup — VTI Setup Guides

*Repo: [github.com/OpenVTC/vti-setup](https://github.com/OpenVTC/vti-setup)*

vti-setup is the operational companion to the ecosystem's code repos: tested, version-pinned walkthroughs (plus curl-able bootstrap scripts) for standing up the full [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]] — the [[verifiable-trust-agent|VTA]], the DIDComm mediator, DID hosting, and the VTC service — and for the things people do on top of it: joining communities and running one.

Where the code repos answer "what is this component?", vti-setup answers "how do I actually run this, in all its glory?" It's a documentation-only repo — no application code, just guides and three bash bootstrap scripts — but every walkthrough carries a "Verified with" version matrix (e.g. VTA 0.9.6 / Mediator 0.16.2 / DID Hosting Daemon 0.7.0 / VTC 0.9.3) and a "Tested on" platform line, and the dominant maintenance theme is keeping the guides verified against the fast-moving upstream binaries.

## Organized by Persona, Not by Service

The repo's core design choice: guides are grouped by **who you are**, each persona folder led by a README that acts as that persona's journey index.

### `developer/` — participating in communities

The individual-user path: stand up a **Personal VTA** → install and bind the [[openvtc|OpenVTC TUI]] (minting your Persona DID) → join a community (mint an M-DID, collect two vouching [[relationship-credential|VRCs]], submit a join request over [[didcomm|DIDComm]], receive your [[membership-credential|VMC]] and role VEC).

The Personal VTA guide offers two paths:
- **Path A — VTA Farm** (vtafarm.firstperson.dev) — a managed, passkey-signup hosted option; the recommended streamlined default
- **Path B — self-hosted** — your own host, your own [[did-webvh|did:webvh]] log, your own mediator wiring ("the hard way")

### `community-manager/` — running a VTC

The VTC-operator path: bootstrap the community, author join/role policies (`join.rego`), manage the ACL / [[trust-registries|trust registry]], run the manual-review queue. Today mostly explicit roadmap stubs — tracked plans, not abandoned drafts.

### `sysop/` — running the infrastructure

The deepest section, split (June 2026) into two independent end-to-end streams:

- **`explore/`** — the learning stream. A throwaway single VM, everything as root, all toolchains installed, each component set up through its interactive TUI wizard, with loud "no real keys here" warnings. Walks through the full chain — `vta setup`, mediator, DID Hosting Daemon, VTC — threading cross-step values (VTA mnemonic, DIDs, sealed-bundle SHA-256 digests) via "save this ID" tables.
- **`deploy/`** — the hardened production stream. Two-stage bootstrap (`bootstrap-user.sh` creates a `vti` operator and hardens sshd; `setup-deploy.sh` creates nologin per-service system users, sandboxed systemd units, nginx + certbot, pre-built binaries only), then **automated TOML-recipe provisioning** — the recipes produce the same end state as the interactive wizards, with cross-service handoffs passing through a shared `vti-exchange` group directory.

Both streams use the **offline sealed-bundle bootstrap over DIDComm** — the same HPKE-sealed flow used when the VTA is air-gapped — even when all services share a host. The deploy stream also offers a DID-hosting topology choice: **standard** (single `did-hosting-daemon` on one `dids` subdomain) or **standalone** (control + server + witness + watcher as four separate services, for independent read scaling or firewalling the admin plane), selected with a `--standalone` flag. Kubernetes (RKE2 + Rancher reference) and AWS EC2 TEE targets are work-in-progress stubs.

## What It Wires Together

| Component | Upstream |
|-----------|----------|
| VTA (key store: BIP-39 seed, DIDs, contexts, ACL) | [[verifiable-trust-infrastructure]] |
| DID Host (`dids.` subdomain) | [[affinidi-webvh-service|did-hosting-service]] |
| DIDComm v2 mediator | [[affinidi-tdk]] (`affinidi-messaging-mediator`) |
| VTC service (community policy layer) | [[verifiable-trust-infrastructure]] |
| OpenVTC TUI | [[openvtc]] |
| Valkey | mediator storage backend (loopback-only, AOF persistence) |
| nginx + certbot, ufw | TLS on four subdomains (`vta`, `mediator`, `vtc`, `dids`), firewall |

## Recent Development

The repo is young (~22 PRs since the initial scaffold on 2026-04-28) and has already been restructured twice — a sign the team is converging on how to *teach* the stack, not just build it.

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
