---
title: "Coordinated Releases — Aspen, Banyan, Cypress"
type: concept
tags: [release, openvtc, vti, milestones, cypress]
date-updated: 2026-08-19
sources: [verifiable-trust-infrastructure, openvtc, dtg-credentials, affinidi-tdk, affinidi-webvh-service, vti-setup, verifiable-git-infrastructure]
---

# Coordinated Releases — Aspen, Banyan, Cypress

The OpenVTC ecosystem is a dozen fast-moving repositories — the [[verifiable-trust-infrastructure|VTI]] alone has merged 300+ PRs a month through mid-2026, and its crates are consumed by eight sibling repos. Individual crate versions tell you very little about whether *the stack as a whole* works together. The answer, since June 2026, is a **coordinated release**: a tree-named, alphabetical milestone tag applied across every participating repository at a moment when the whole stack has been exercised end to end. The tag is the thing the [[vti-setup]] guides pin to, the thing a newcomer should check out, and the thing the team means when it says "runs on Cypress."

## The Sequence

| Release | Date | Repos tagged | What it marked |
|---------|------|--------------|----------------|
| **`openvtc-aspen`** | 2026-06-03/04 | VTI, did-hosting-service | The first cross-repo snapshot, named for OpenVTC; preceded the multi-community work |
| **`Banyan`** | 2026-06-22 | VTI, openvtc, dtg-credentials, vti-setup | The multi-community milestone — OpenVTC's T1–T9 complete, reciprocal VMCs, the VTI's P0–P3 security campaign; a lightweight tag, no RCs |
| **`Cypress`** | **2026-08-17** | VTI, openvtc, dtg-credentials, TDK, did-hosting-service, VGI (+ vti-setup docs pinned to it) | The first release with formal **release candidates** (`VTI-Cypress-RC-0` 2026-07-30 → 08-02, `VTI-Cypress-RC-1` 2026-08-10/11) and the first cut as a crates.io-published snapshot under the VTI's new release-plz process |

Each tag carries the same one-line description: *"Coordinated OpenVTC release — a known-good, cross-project snapshot of all OpenVTC projects. Tagged at the main-branch HEAD on <date>."* Note what it is **not**: not a semver bump (every crate keeps its own version), not a freeze (main moved on the next day), and not a CHANGELOG release in every repo (did-hosting-service's Cypress tag sits on work its CHANGELOG still lists as *Unreleased*). It is a coordination point.

## What Cypress Snapshots

| Repo | At the `Cypress` tag |
|------|----------------------|
| [[verifiable-trust-infrastructure\|VTI]] | vta-service **0.17.0**, vta-sdk **0.25.0**, vtc-service 0.11.58, vti-common 0.12.1, vti-secrets 0.1.14, pnm-cli 0.12.6, cnm-cli 0.11.22, vtc-client 0.3.7, vta-mobile-core 0.6.18, vta-enclave 0.7.7, vta-mcp 0.1.5 (+ the eleven subsystem crates — full table on the entity page) |
| [[openvtc\|OpenVTC]] | workspace **0.3.1** (two commits past the **v0.3.0** release of 2026-08-15), trust-tasks 0.9 / vta-sdk 0.25 / did-git-sign 0.4.5 |
| [[dtg-credentials]] | **0.2.0** — tracks the DTG Core Credentials spec v1.0 WD01 |
| [[affinidi-tdk\|Affinidi TDK]] | mediator **0.18.19**, messaging-sdk **0.19.8**, messaging-delivery 0.1.14, didcomm-v1 0.2.0, tdk-common 0.6.7, cache-server 0.9.10, agent-names 0.1.3, `affinidi-tdk` 0.8.5 |
| [[affinidi-webvh-service\|did-hosting-service]] | server / daemon / watcher / witness **0.8.3**, control **0.8.8**, common 0.8.6, client 0.1.2, webvh-ui 1.1.0 |
| [[verifiable-git-infrastructure\|VGI]] | all crates **0.4.5** |
| Shared stack | trust-tasks-rs **0.9**, affinidi-did-common 0.4, [[didwebvh-rs]] 0.6.0, curve25519-dalek 5 |
| [[vti-setup]] | guides re-verified against the above; explore source checkouts `git checkout Cypress`; pre-built binaries under `download.firstperson.dev/<component>/latest/` |

## Why It Matters

- **For operators and newcomers**: Cypress is the answer to "which versions go together?" — the vti-setup walkthroughs, the VTA Farm, and the `latest` download aliases all track it.
- **For the team**: the RC process forced the cross-repo dependency graph into shape — the run-up to Cypress is where the VTI dropped its `[patch.crates-io] vta-sdk` self-pin, OpenVTC and VGI converged on "one vta-sdk in the binary," and the TDK pinned the mediator to vta-sdk 0.25.
- **For the wiki**: the tags are the reference points the entity activity logs are organised around; each entity page notes its own Cypress versions.

The next release will presumably take the next tree name in the alphabet.

See also: [[overview]], [[verifiable-trust-infrastructure]], [[openvtc]], [[vti-setup]]
