---
title: "Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus"
type: concept
tags: [release, openvtc, vti, milestones, cypress, dogwood, eucalyptus]
date-updated: 2026-09-18
sources: [verifiable-trust-infrastructure, openvtc, dtg-credentials, affinidi-tdk, affinidi-webvh-service, vti-setup, verifiable-git-infrastructure, vta-browser-plugin, vti-didcomm-js, rp-sdk-js]
---

# Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus

The OpenVTC ecosystem is a dozen fast-moving repositories — the [[verifiable-trust-infrastructure|VTI]] alone merged more than 500 commits in the single month after Cypress, and its crates are consumed by eight sibling repos. Individual crate versions tell you very little about whether *the stack as a whole* works together. The answer, since June 2026, is a **coordinated release**: a tree-named, alphabetical milestone tag applied across every participating repository at a moment when the whole stack has been exercised end to end. The tag is the thing the [[vti-setup]] guides pin to, the thing a newcomer should check out, and the thing the team means when it says "runs on Dogwood."

## The Sequence

| Release | Date | Repos tagged | What it marked |
|---------|------|--------------|----------------|
| **`openvtc-aspen`** | 2026-06-03/04 | VTI, did-hosting-service | The first cross-repo snapshot, named for OpenVTC; preceded the multi-community work |
| **`Banyan`** | 2026-06-22 | VTI, openvtc, dtg-credentials, vti-setup | The multi-community milestone — OpenVTC's T1–T9 complete, reciprocal VMCs, the VTI's P0–P3 security campaign; a lightweight tag, no RCs |
| **`Cypress`** | 2026-08-17 | VTI, openvtc, dtg-credentials, TDK, did-hosting-service, VGI, browser plugin, vti-didcomm-js, rp-sdk-js (+ vti-setup docs pinned to it) | The first release with formal **release candidates** (`VTI-Cypress-RC-0` 2026-07-30 → 08-02, `VTI-Cypress-RC-1` 2026-08-10/11) and the first cut as a crates.io-published snapshot under the VTI's new release-plz process |
| **`VTI-Dogwood`** | **2026-08-30** (browser plugin 08-31) | all nine of the above (+ vti-setup explore docs pinned to it) | The **silent release**: tag-only, no GitHub Release, no announcement. One RC (`VTI-Dogwood-RC-1`, 2026-08-22 → 08-29). The Cypress → Dogwood window was about making the wire honest rather than adding features — see below |
| **`VTI-Dogwood-R1`** | 2026-08-30 → 09-01 | the same nine | A **re-cut** of Dogwood carrying production fixes found in the days after the tag. In five repos R1 is the identical commit; in the VTI, TDK, openvtc and browser plugin it adds a handful of fixes each (details below) |
| **`VTI-Eucalyptus-RC-0`** | 2026-09-17 | VTI, openvtc, TDK, did-hosting-service (so far) | **In flight.** The first release candidate of the next release: TSP Rev 3, data rooms, post-quantum keys, the persona store, the SEC-4045 hardening sweep |

Each tag carries a one-line annotation (`VTI Dogwood`, `VTI Dogwood R1`, `VTI Eucalyptus RC-0`). Note what a coordinated release is **not**: not a semver bump (every crate keeps its own version), not a freeze (main moved on the next day), and not a CHANGELOG release in every repo (did-hosting-service has not bumped a single crate version since Cypress, yet carries all three new tags). It is a coordination point. Since Dogwood, the tag naming has settled on the `VTI-<Tree>` / `VTI-<Tree>-RC-<n>` / `VTI-<Tree>-R<n>` convention across all repos.

## Dogwood: the silent release

Dogwood was deliberately unannounced. Looking at what changed between Cypress and Dogwood explains why: almost none of it is user-visible, and almost all of it is the kind of work that makes the *next* features possible.

- **The wire became honest.** The VTI ran a Trust-Task conformance sweep — real handler responses validated against the published schemas — and drove the VTC's schema drift from 33 to 0 in two days, then enforced Trust-Task framework 0.5.0 at the dispatch spine (`recipient`, `proof`, audience and `issuedAt` checked per spec). Every client now has an identity and signs; any DID that names a key may sign (previously did:key only, which had locked provisioned did:webvh integrations out of every proof-requiring task). The browser wallet discovered the consequence the hard way: with spec checks on, 93 of 141 task types required a proof and none of its calls carried one, so it now signs every outbound Trust Task at the channel.
- **The membership edge finally closed.** The member→community half of the VMC pair had *never actually landed* in OpenVTC — VMCs had no `id` field and the VTC's rejection was being dropped as uncorrelated. dtg-credentials 0.3.0 → 0.5.0 (three breaking releases in two days), OpenVTC #259–#267 and the VTI's half-edge / complete-edge distinction fixed it; the Dogwood tag in the VTI sits on the commit that draws the membership edge on the graph.
- **Identity and secrets stopped being fragile.** OpenVTC's Linux secrets had lived in the RAM-only kernel keyring and vanished on reboot; pairwise R-DIDs became the default and VRCs are issued under them; VGI moved the commit's identity claim out of `user.email` and into a `Signed-by-DID:` trailer; the TDK gained did:webs and did:scid resolution.
- **Retries, idempotency, replay and freshness** got first-class treatment across the VTA (`idempotencyKey` dedup, `ReplayGuard`, `FreshnessPolicy`, error messages that no longer act as a probing oracle).
- **Dependencies moved a long way**: trust-tasks-rs 0.9 → 0.17, affinidi-tdk 0.8 → 0.10, vta-sdk 0.25 → 0.32 — the reason every downstream repo needed the same tag.

## Why Dogwood-R1 exists

The R1 tags are the answer to the same question in each repo: what broke in production within 48 hours of Dogwood?

| Repo | What R1 adds over Dogwood |
|------|---------------------------|
| [[affinidi-tdk\|TDK]] | Blind cross-mediator relay refused every peer-relayed message as a session mismatch, so **no federated delivery worked**; the forwarding-abandonment problem report was plaintext (discarded by authcrypt-only clients); TSP forwarding failed when the next hop's endpoint is a mediator DID (#748–#751) |
| [[openvtc\|OpenVTC]] | TSP routed sends passed the *peer's* mediator as the first hop — only our own mediator can unwrap the outer layer, so every cross-mediator join failed with a 404 from our own side (#273); a phantom "setting saved" in Settings (#274) |
| [[vta-browser-plugin\|browser wallet]] | The wallet had one wallet-wide inbox, so a multi-VTA operator found that **every agent but one silently lost its consent prompts** (#148–#151); granted-notices parsed at the wrong envelope shape so approvals never auto-published (#153); a third consent prompt for an already-approved payload (#154) |
| [[verifiable-trust-infrastructure\|VTI]] | One release PR (#1218): device list/disable/wipe scoped to the caller's contexts, typed not-found/conflict/gone across the Trust-Task boundary, provisioning checks authorization before minting, uniffi 0.32 / tdk 0.11 / mdoc 0.3 |
| did-hosting-service, dtg-credentials, VGI, vti-didcomm-js, rp-sdk-js | Identical commit to Dogwood |

## What Dogwood Snapshots

| Repo | Cypress | `VTI-Dogwood` | `VTI-Dogwood-R1` | `VTI-Eucalyptus-RC-0` |
|------|---------|---------------|------------------|-----------------------|
| [[verifiable-trust-infrastructure\|VTI]] vta-service / vta-sdk / pnm-cli / cnm-cli / vtc-client | 0.17.0 / 0.25.0 / 0.12.6 / 0.11.22 / 0.3.7 | **0.23.3 / 0.32.2** / 0.14.2 / 0.13.2 / 0.5.1 | 0.23.4 / 0.32.3 / 0.14.3 / 0.13.3 / 0.5.1 | **0.33.0 / 0.42.1** / 0.17.2 / 0.16.3 / 0.6.8 (+ vta-persona 0.3.9, vti-rooms 0.2.9) |
| [[openvtc\|OpenVTC]] workspace (vta-sdk / dtg-credentials it builds against) | 0.3.1 (0.25 / 0.2.0) | 0.3.1 (0.32.2 / 0.5.0) | 0.3.1 (0.32.2 / 0.5.0) | 0.3.1 (0.42.1 / 0.9.1) |
| [[dtg-credentials]] | 0.2.0 (WD01) | **0.5.0** | 0.5.0 | 0.9.1 on main (WD02) — not yet tagged |
| [[affinidi-tdk\|TDK]] mediator / messaging-sdk / didcomm-service / affinidi-tsp / facade | 0.18.19 / 0.19.8 / 0.3.26 / 0.1.14 / 0.8.5 | **0.20.3 / 0.21.0** / 0.5.0 / 0.1.14 / 0.10.0 | 0.20.6 / 0.21.1 / 0.5.1 / 0.1.15 / 0.11.0 | **0.26.2 / 0.26.7** / 0.11.0 / **0.2.1** / 0.16.0 |
| [[affinidi-webvh-service\|did-hosting-service]] server / daemon / control | 0.8.3 / 0.8.3 / 0.8.8 | unchanged | unchanged | unchanged (consumes trust-tasks 0.21 / vta-sdk 0.41) |
| [[verifiable-git-infrastructure\|VGI]] | 0.4.5 | **0.4.7** (RC-1 = 0.4.6) | 0.4.7 | 0.4.12 on main — not yet tagged |
| [[vta-browser-plugin\|browser wallet]] pnm-core / vti-tsp-js | 0.4.0 / 0.2.0 | **0.6.0** / 0.2.0 | 0.6.0 / 0.2.0 | 0.9.1 / 0.3.0 on main — not yet tagged |
| [[vti-didcomm-js]] | 0.6.2 | **0.7.0** | 0.7.0 | 0.10.1 on main — not yet tagged |
| [[rp-sdk-js]] | 0.2.0 | 0.2.0 | 0.2.0 | 0.2.0 (unreleased hardening on main) |
| Shared stack | trust-tasks-rs 0.9, [[didwebvh-rs]] 0.6.0 | trust-tasks-rs **0.17**, didwebvh-rs 0.6.0 | same | trust-tasks-rs **0.21.3**, didwebvh-rs **0.7.0** |
| [[vti-setup]] explore stream | `git checkout Cypress`; VTA 0.17.0 / mediator 0.18.19 / DHD 0.8.3 / VTC 0.11.58 | `git checkout VTI-Dogwood`; VTA 0.23.2 / mediator 0.20.2 / DHD 0.8.3 / VTC 0.11.58 | same | not yet re-pinned |

The full per-crate tables live on each entity page.

## Eucalyptus, so far

`VTI-Eucalyptus-RC-0` was tagged on 2026-09-17 in the VTI, OpenVTC, the TDK and did-hosting-service. It is the opposite of Dogwood in character — the largest feature window the ecosystem has had:

- **TSP Rev 3** as a flag day across the TDK, VTI, did-hosting and OpenVTC (with the browser stack dual-reading Rev 2) — see [[trust-spanning-protocol]].
- **[[data-rooms|Data rooms]]** — credential-governed, MLS-encrypted shared spaces with their own DIDs, four new VTI crates and a `room-host` binary.
- **[[post-quantum-cryptography|Post-quantum keys]]** in the VTA (ML-DSA-44/65, BIP-32-derived, did-templates 3.0) and hybrid multi-proof credentials from the VTC.
- **The persona store** (`vta-persona`, the VTA's fourth holder store) and OpenVTC's *My Identity* pane; the start of [[peer-identity-vetting]].
- **Spec Working Draft 02** of the [[dtg-credential-spec|DTG Core Credentials]] and dtg-credentials 0.9.1 — [[correlation-scope]] replacing the DID-type taxonomy, [[authority-credential|Authority]] and [[delegation-credential|Delegation]] credentials, `digestMultibase`.
- **The SEC-4045 hardening sweep** (2026-09-10 → 09-12) across every repo: public-hosts-only DID resolution, egress guards in the mediator and the browser DIDComm stack, hash-chained VTA audit log, SHA-pinned CI, secrets never in environment overrides.

## Why It Matters

- **For operators and newcomers**: the latest tag is the answer to "which versions go together?" — the vti-setup explore walkthrough and the `download.firstperson.dev/<component>/latest/` binaries track **Dogwood**. (The managed [[vtafarm|VTA Farm]] is the exception: it offers whatever GHCR image tags exist, newest first, rather than pinning a coordinated release.)
- **For the team**: the RC process forces the cross-repo dependency graph into shape. Cypress is where the VTI dropped its `[patch.crates-io]` self-pin; Dogwood is where every downstream repo absorbed trust-tasks 0.17 and vta-sdk 0.32; the Eucalyptus run-up is where OpenVTC deleted its last 22 `[patch.crates-io]` entries and the whole stack moved to TSP Rev 3 at once.
- **For the wiki**: the tags are the reference points the entity activity logs are organised around; each entity page notes its own versions at each tag.

The next tree name after Eucalyptus has not been chosen.

See also: [[overview]], [[verifiable-trust-infrastructure]], [[openvtc]], [[vti-setup]]
