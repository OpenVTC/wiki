---
title: "Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus"
type: concept
tags: [release, openvtc, vti, milestones, cypress, dogwood, eucalyptus]
date-updated: 2026-10-07
sources: [verifiable-trust-infrastructure, openvtc, dtg-credentials, affinidi-tdk, affinidi-webvh-service, didwebvh-rs, vti-setup, verifiable-git-infrastructure, vta-browser-plugin, vti-didcomm-js, rp-sdk-js]
---

# Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus

The OpenVTC ecosystem is now eighteen fast-moving repositories — the [[verifiable-trust-infrastructure|VTI]] alone merged more than 700 commits in the five weeks after Dogwood, and its crates are consumed by a dozen sibling repos. Individual crate versions tell you very little about whether *the stack as a whole* works together. The answer, since June 2026, is a **coordinated release**: a tree-named, alphabetical milestone tag applied across every participating repository at a moment when the whole stack has been exercised end to end. The tag is the thing the [[vti-setup]] guides pin to, the thing a newcomer should check out, and the thing the team means when it says "runs on Eucalyptus."

## The Sequence

| Release | Date | Repos tagged | What it marked |
|---------|------|--------------|----------------|
| **`openvtc-aspen`** | 2026-06-03/04 | VTI, did-hosting-service | *The credential loop closes.* The first cross-repo snapshot, named for OpenVTC; a VTA could hold credentials and a VTC could act on them, over DIDComm only |
| **`Banyan`** | 2026-06-22 | VTI, openvtc, dtg-credentials, vti-setup | *Credential-complete, auditable, multi-community.* OpenVTC's T1–T9 complete, reciprocal VMCs, BBS selective disclosure, the VTI's P0–P3 security campaign; a lightweight tag, no RCs |
| **`Cypress`** | 2026-08-17 | VTI, openvtc, dtg-credentials, TDK, did-hosting-service, VGI, browser plugin, vti-didcomm-js, rp-sdk-js (+ vti-setup docs pinned to it) | *Governed, multi-transport, fleet-manageable.* The first release with formal **release candidates** (`VTI-Cypress-RC-0` 07-30 → 08-02, `VTI-Cypress-RC-1` 08-10/11) and the first cut under the VTI's release-plz process; TSP became a selectable transport; VGI was extracted from OpenVTC |
| **`VTI-Dogwood`** | **2026-08-30** (browser plugin 08-31) | all nine of the above (+ vti-setup explore docs) | *Conformant and replay-safe.* The **silent release**: tag-only, no GitHub Release, no announcement. One RC (`VTI-Dogwood-RC-1`, 08-22 → 08-29). About making the wire honest rather than adding features — see below |
| **`VTI-Dogwood-R1`** | 2026-08-30 → 09-01 | the same nine | A **re-cut** of Dogwood carrying production fixes found within 48 hours of the tag; identical to Dogwood in five repos, a handful of fixes each in the VTI, TDK, openvtc and the browser plugin |
| **`VTI-Eucalyptus-RC-0`** | 2026-09-17 | VTI, openvtc, TDK, did-hosting-service | The only release candidate Eucalyptus had; the other repos joined at the final tag |
| **`VTI-Eucalyptus`** | **2026-10-07** | **eighteen repos** — the nine above plus `trustoverip/dtgwg-trust-tasks-tf`, `affinidi/affinidi-trust-registry-rs`, `decentralized-identity/didwebvh-rs`, `OpenVTC/predicate-credential-system`, `OpenVTC/vta-agent-memory`, `OpenVTC/vti-push-gateway`, `OpenVTC/vta-mobile-agent-ios`, `affinidi/affinidi-tsp-go`, `affinidi/affinidi-tsp-dart` | *Signed, proof-bound, and governed by more than one person.* The fifth and by far the largest release, published as a GitHub Release with a cross-repo version table on the day the project was presented at the Linux Plumbers Conference ([[kernel-web-of-trust]]) |

Each tag carries a one-line annotation (`VTI Dogwood`, `VTI Eucalyptus RC-0`, `VTI Eucalyptus`). Note what a coordinated release is **not**: not a semver bump (every crate keeps its own version), not a freeze (main moved on the next day), and not a CHANGELOG release in every repo (did-hosting-service has not bumped `did-hosting-server` since Cypress, yet carries every tag since). It is a coordination point. Since Dogwood the tag naming has settled on `VTI-<Tree>` / `VTI-<Tree>-RC-<n>` / `VTI-<Tree>-R<n>` across all repos, and six repos that had never carried a coordinated tag joined at Eucalyptus: the Trust Tasks framework and spec registry, didwebvh-rs, the Predicate Credential System, the agent-memory plugin, and the Go and Dart TSP ports.

## Eucalyptus: the largest release

Eucalyptus ran 36 days, from the Dogwood-R1 cut on 2026-09-01 to 2026-10-07. By the project's own release-arc report it landed **1,997 commits in 1,630 pull requests across 18 repositories by 16 authors, 203 of them marked breaking** — close to the 2,028 commits that Banyan, Cypress and Dogwood landed *together*. Where Dogwood was about making the wire honest, Eucalyptus was about closing the door on everything that was not signed:

- **The signed door.** Every call into the stack is now a signed Trust Task with a proof bound to its sender, over TSP, DIDComm or HTTPS, and the remaining REST management surfaces were removed: every VTC client call is a signed Trust Task (VTI #1840), the VTA's superseded REST routes are gone and pre-session authentication moved onto Trust Tasks (#1858), every DIDComm and TSP task needs a sender-bound document proof (#1739), and vta-sdk has one Trust Task surface (#1793). The mediator's legacy admin surface (TDK #901), did-hosting's control plane, edge and witness REST management (#225, #238) and the trust registry's `tr-admin/1.0` (#140) went the same way. See [[trust-tasks]].
- **TSP Rev 3, by default.** Rev 3 replaced Rev 2 in the TDK (#796) and is on by default in the VTA (#1622) and the mediator (#854); relationships persist and recover across restarts; cross-mediator sends are nested for metadata privacy; independent Go and Dart implementations landed the same day (2026-09-16) and ship in the tag. See [[trust-spanning-protocol]].
- **Governed by more than one person.** ACL capabilities are enforced and no principal can widen its own entry (#1738); VTC administration is role-based with custom roles (#1924); an unrestricted admin needs another admin's consent; consent-gated operations wait in an action list until the N-th approval (#1918).
- **Around that spine:** [[data-rooms|data rooms]] (built end to end in the first ten days), [[peer-identity-vetting]] with **hidden vetting** on the new Predicate Credential System, persona *faces* and *worlds* behind a context boundary (#1255), [[community-git-namespaces]] on GitHub and Forgejo with VTA-held commit signing (#1694; VGI #141, VTI #1957), DTG Credentials v1 (#1859 — role authority credentials, `vetted/1` and `witnessed/1` statements, `issuerScope`), an operable mediator (queue inspection, traffic monitor, runtime config, all over TSP), the SEC-4045 R2 hardening sweep, and [[post-quantum-cryptography|ML-DSA keys]] with a post-quantum TSP package in Dart.

### Breaking changes an integrator will notice

| Change | Where |
|---|---|
| One Trust Task surface in vta-sdk; `protocol_message_transport` is gone | VTI #1793 |
| Every VTC client call is a signed Trust Task | VTI #1840 |
| VTA REST routes retired; pre-session auth moves to Trust Tasks | VTI #1858 |
| Every DIDComm and TSP task needs a document proof bound to the sender | VTI #1739 |
| TSP on by default in the VTA | VTI #1622 |
| TSP Rev 3 replaces Rev 2 | TDK #796 |
| Mediator legacy admin removed; administration is Trust Tasks only | TDK #901 |
| Control plane, edge and witness REST management deleted | did-hosting #225, #238 |
| `tr-admin/1.0` removed; registry writes authenticated and audited | trust registry #140 |
| VAC and VDC are no longer bearer credentials; v1 context conformance | dtg-credentials #21, #26, #33 |
| VTC administration is role-based | VTI #1924 |
| Legacy resource format removed from `verify-trust` | VGI #119 |

## Dogwood: the silent release

Dogwood was deliberately unannounced. Looking at what changed between Cypress and Dogwood explains why: almost none of it is user-visible, and almost all of it is the kind of work that makes the *next* features possible.

- **The wire became honest.** The VTI ran a Trust-Task conformance sweep — real handler responses validated against the published schemas — and drove the VTC's schema drift from 33 to 0 in two days, then enforced Trust-Task framework 0.5.0 at the dispatch spine (`recipient`, `proof`, audience and `issuedAt` checked per spec). Every client now has an identity and signs; any DID that names a key may sign. The browser wallet discovered the consequence the hard way: with spec checks on, 93 of 141 task types required a proof and none of its calls carried one, so it now signs every outbound Trust Task at the channel.
- **The membership edge finally closed.** The member→community half of the VMC pair had *never actually landed* in OpenVTC. dtg-credentials 0.3.0 → 0.5.0, OpenVTC #259–#267 and the VTI's half-edge / complete-edge distinction fixed it; the Dogwood tag in the VTI sits on the commit that draws the membership edge on the graph.
- **Identity and secrets stopped being fragile.** OpenVTC's Linux secrets had lived in the RAM-only kernel keyring and vanished on reboot; pairwise identifiers became the default for relationships; VGI moved the commit's identity claim into a `Signed-by-DID:` trailer; the TDK gained did:webs and did:scid resolution.
- **Retries, idempotency, replay and freshness** got first-class treatment across the VTA, and dependencies moved a long way (trust-tasks-rs 0.9 → 0.17, vta-sdk 0.25 → 0.32) — the reason every downstream repo needed the same tag.

## Why Dogwood-R1 exists

| Repo | What R1 adds over Dogwood |
|------|---------------------------|
| [[affinidi-tdk\|TDK]] | Blind cross-mediator relay refused every peer-relayed message, so **no federated delivery worked**; the forwarding-abandonment report was plaintext; TSP forwarding failed when the next hop is a mediator DID (#748–#751) |
| [[openvtc\|OpenVTC]] | TSP routed sends passed the *peer's* mediator as the first hop, so every cross-mediator join failed (#273); a phantom "setting saved" (#274) |
| [[vta-browser-plugin\|browser wallet]] | One wallet-wide inbox meant **every agent but one silently lost its consent prompts** (#148–#151); granted-notices parsed at the wrong envelope shape (#153); a third consent prompt for an approved payload (#154) |
| [[verifiable-trust-infrastructure\|VTI]] | One release PR (#1218): device operations scoped to the caller's contexts, typed errors across the Trust-Task boundary, provisioning checks authorization before minting |
| did-hosting-service, dtg-credentials, VGI, vti-didcomm-js, rp-sdk-js | Identical commit to Dogwood |

## What Each Release Snapshots

| Repo | Cypress | `VTI-Dogwood-R1` | `VTI-Eucalyptus-RC-0` | **`VTI-Eucalyptus`** |
|------|---------|------------------|-----------------------|----------------------|
| [[verifiable-trust-infrastructure\|VTI]] vta-service / vta-sdk / pnm-cli / cnm-cli / vtc-service | 0.17.0 / 0.25.0 / 0.12.6 / 0.11.22 / 0.11.58 | 0.23.4 / 0.32.3 / 0.14.3 / 0.13.3 / 0.11.58 | 0.33.0 / 0.42.1 / 0.17.2 / 0.16.3 / 0.11.58 | **0.56.0 / 0.64.2 / 0.36.0 / 0.30.0** / 0.11.58 (unbumped, unpublished) |
| [[openvtc\|OpenVTC]] | 0.3.1 | 0.3.1 | 0.3.1 | **0.5.0** |
| [[dtg-credentials]] | 0.2.0 (WD01) | 0.5.0 | 0.9.1 on main | **0.13.0** (v1 context) |
| [[affinidi-tdk\|TDK]] mediator / affinidi-tsp | 0.18.19 / 0.1.14 | 0.20.6 / 0.1.15 | 0.26.2 / 0.2.1 | **0.37.0 / 0.2.2** |
| [[affinidi-webvh-service\|did-hosting-service]] server | 0.8.3 | 0.8.3 | 0.8.3 | 0.8.3 (changed substantially, not bumped) |
| `affinidi-trust-registry-rs` trust-registry | — | 0.14.0 | — | **0.23.0** (first coordinated tag) |
| `dtgwg-trust-tasks-tf` trust-tasks-rs | 0.9 | 0.17.3 | 0.21.3 | **0.27.7** (first coordinated tag; 95 releases in the window) |
| [[verifiable-git-infrastructure\|VGI]] did-git-sign | 0.4.5 | 0.4.7 | 0.4.12 on main | **0.18.2** |
| [[vta-browser-plugin\|browser wallet]] pnm-core / vti-tsp-js (extension) | 0.4.0 / 0.2.0 | 0.6.0 / 0.2.0 | 0.9.1 / 0.3.0 on main | **0.9.1 / 0.3.0** (pnm-extension 0.2.0, root package 0.1.2; npm unchanged since 09-07) |
| [[vti-didcomm-js]] | 0.6.2 | 0.7.0 | 0.10.1 on main | **0.12.0** |
| [[rp-sdk-js]] | 0.2.0 | 0.2.0 | 0.2.0 | 0.2.0 (hardening on main, unpublished) |
| [[didwebvh-rs]] | 0.6.0 | 0.6.1 | 0.7.0 | **0.8.0** (first coordinated tag) |
| `predicate-credential-system` | — | — | — | **0.1.0** (new; born 2026-09-24) |
| `vta-agent-memory` | — | — | — | 0.3.0 (first coordinated tag) |
| `affinidi-tsp-go` / `affinidi-tsp-dart` | — | — | — | 0.1.0 / 0.1.1 (new) |
| [[vti-setup]] explore stream | `git checkout Cypress` | `git checkout VTI-Dogwood` (VTA 0.23.2 / mediator 0.20.2 / DHD 0.8.3 / VTC 0.11.58) | not re-pinned | **still `VTI-Dogwood`**; developer guides re-verified at VTA 0.39.0 / mediator 0.28.36 on 09-23 |

The full per-crate tables live on each entity page. The [[keyring-wallet|Keyring phone wallet]] is not in the tag set — it is a Berkman Klein Center project, not an OpenVTC one — but it pins the same Trust Tasks release (trust-tasks 0.27.7, 2026-10-07), the VTA release the Farm actually runs (vta-service 0.55.0, one behind the tag), mediator 0.37.0 and OpenVTC 0.4.0 as its interop counterpart — and it is checked against upstream's own Rust verifiers in its CI rather than against itself.

## Why It Matters

- **For operators and newcomers**: the latest tag is the answer to "which versions go together?" — and Eucalyptus is the first since Cypress to come with a GitHub Release that spells the answer out. The vti-setup explore walkthrough and the `download.firstperson.dev/<component>/latest/` binaries were still pinned to Dogwood at the time of writing. (The managed [[vtafarm|VTA Farm]] is the exception: it offers whatever GHCR image tags exist, newest first, rather than pinning a coordinated release.)
- **For the team**: the RC process forces the cross-repo dependency graph into shape. Cypress is where the VTI dropped its `[patch.crates-io]` self-pin; Dogwood is where every downstream repo absorbed trust-tasks 0.17 and vta-sdk 0.32; Eucalyptus is where the whole stack moved to TSP Rev 3 and signed-only Trust Tasks at once — and where the spec registry itself joined the tag.
- **For the wiki**: the tags are the reference points the entity activity logs are organized around; each entity page notes its own versions at each tag.

The next tree name after Eucalyptus has not been chosen.

See also: [[overview]], [[verifiable-trust-infrastructure]], [[openvtc]], [[vti-setup]], [[kernel-web-of-trust]], [[trust-tasks]]
