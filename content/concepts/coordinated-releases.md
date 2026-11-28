---
title: "Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus, Fig"
type: concept
tags: [release, openvtc, vti, milestones, cypress, dogwood, eucalyptus, fig]
date-updated: 2026-11-28
sources: [verifiable-trust-infrastructure, openvtc, dtg-credentials, affinidi-tdk, affinidi-webvh-service, didwebvh-rs, vti-setup, verifiable-git-infrastructure, vta-browser-plugin, vti-didcomm-js, rp-sdk-js, vtn-service]
---

# Coordinated Releases — Aspen, Banyan, Cypress, Dogwood, Eucalyptus, Fig

The OpenVTC ecosystem is now twenty fast-moving repositories — the [[verifiable-trust-infrastructure|VTI]] alone merged nearly 700 commits in the seven weeks after Eucalyptus, and its crates are consumed by more than a dozen sibling repos. Individual crate versions tell you very little about whether *the stack as a whole* works together. The answer, since June 2026, is a **coordinated release**: a tree-named, alphabetical milestone tag applied across every participating repository at a moment when the whole stack has been exercised end to end. The tag is the thing the [[vti-setup]] guides pin to, the thing a newcomer should check out, and the thing the team means when it says "runs on Fig."

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
| **`VTI-Fig-RC-0`** | 2026-11-24/25 | twenty repos (below) | The first candidate cut by the new release-branch tooling: `release/fig` was cut from `nightly` on 11-24 |
| **`VTI-Fig`** | **2026-11-27** | **twenty repos** — the Eucalyptus set minus [[rp-sdk-js]], plus `OpenVTC/verifiable-trust-network` ([[vtn-service]], new), `affinidi/affinidi-messaging-mediator` (the mediator, split out of the TDK) and `affinidi/affinidi-keri-rs` (first coordinated tag) | *One generation, four languages, a network of communities.* The sixth release, and the first to be supported on its own branch |

Each tag carries a one-line annotation (`VTI Dogwood`, `VTI Eucalyptus RC-0`, `VTI Eucalyptus`). Note what a coordinated release is **not**: not a semver bump (every crate keeps its own version), not a freeze (main moved on the next day), and not a CHANGELOG release in every repo (did-hosting-service has not bumped `did-hosting-server` since Cypress, yet carries every tag since). It is a coordination point. Since Dogwood the tag naming has settled on `VTI-<Tree>` / `VTI-<Tree>-RC-<n>` / `VTI-<Tree>-R<n>` across all repos, six repos that had never carried a coordinated tag joined at Eucalyptus (the Trust Tasks framework and spec registry, didwebvh-rs, the Predicate Credential System, the agent-memory plugin, and the Go and Dart TSP ports), and three more joined at Fig: the new Verifiable Trust Network, the mediator in its new home, and the KERI library. rp-sdk-js, unchanged in substance since its October sign-in work, carries no Fig tag.

## Fig: one generation, four languages, a network of communities

Fig ran 49 days, from Eucalyptus GA on 2026-10-07 to `VTI-Fig-RC-0` on 2026-11-25 (GA followed on 11-27). By the project's release-arc report it landed **2,218 commits in 2,061 pull requests across 20 repositories by 23 authors, 328 of them marked breaking** — larger than Eucalyptus on every measure. The release's own summary: *"Every repository moved to the affinidi-tdk 0.50 generation, with exactly one copy of each shared crate, and TSP reached 1.0 in the Rust, JavaScript, Go and Dart SDKs. did:webs became an identity a VTA, a VTC or a member can hold, with KERI v2 underneath. Communities gained boards, elections, member badges and data rooms that work as conversations. The Verifiable Trust Network joined the release, so communities can federate."*

- **One generation, one copy.** Every Rust workspace that depends on the TDK ends on affinidi-tdk 0.50, messaging-sdk 0.51, data-integrity 0.9 and trust-tasks-rs 0.41+; at RC-0 no lock file holds two versions of any affinidi, trust-tasks, vta or vti crate (seven were doubled at Eucalyptus). The last step landed in the final ten days (VTI #2741, #2796, #2797).
- **TSP 1.0 in four languages.** TSP 1.0 replaced the Rev 3 draft in the Rust TDK on 2026-10-22 (TDK #967), reaching the Trust Tasks binding, the browser wallet's tsp-js and the mediator the same day; Go and Dart followed on 11-23. Every implementation now refuses the earlier drafts and requires the sender's VID. See [[trust-spanning-protocol]].
- **did:webs as an identity.** A VTA can be a did:webs from first boot, a VTC can take one as its DID and a member can rotate onto one, on affinidi-keri's KERI v2; native did:scid identities arrived alongside. See [[did-types]] and [[decentralized-identifiers]].
- **Communities you live in.** Boards and elections ([[community-governance]]), member badges and a richer directory ([[verifiable-trust-community]]), and [[data-rooms]] that work as conversations.
- **Networks of communities.** The [[verifiable-trust-network|Verifiable Trust Network]] — created on 2026-11-02 and tagged three weeks later — lets communities federate: nested networks, a federated directory, `vtn/*` Trust Tasks and a third manager CLI, `nnm`, beside `pnm` and `cnm`. See [[vtn-service]].
- **The mediator moves out** of the TDK into its own repository (TDK #949) and cut fifteen release lines there, 0.42 to 0.56. See [[affinidi-tdk]].
- **Hardening.** Step-up approval now verifies the user (VTI #2793); credential queries answer the same way whether or not anything matches (#2813); ten repositories took `url` 2.5.9 for RUSTSEC-2026-0592; CI pins image digests (#2709).

### Release branches arrive

Fig is the first release to go through the process written down in the VTI's `RELEASES.md`. `main` publishes crates continuously; a `nightly` branch tracks the newest commit on which **every** CI job passed; a named release is **cut from `nightly`** onto its own `release/<name>` branch, stabilized through RCs, and patched there (`VTI-Fig-R1`, …) for as long as it is supported. A release branch takes fixes, security changes and docs — never a feature, and never a breaking change to a published crate (`cargo semver-checks --release-type patch` refuses one) — and it **owns its crates' compatibility lines**, so `main` may not publish into them. The newest two GA releases are supported, about ten to twelve weeks each at the 4–6 week cadence; Eucalyptus was given its branch after the fact. At Fig's GA the schedule reads: **Fig supported (N)**, **Eucalyptus supported (N-1)**, Dogwood and earlier end of life, and the next tree, **Ginkgo**, due between 2026-12-25 and 2027-01-08. (The schedule table *at the `VTI-Fig` tag itself* still lists Fig as "TBD"; `main` was corrected after the cut.) The project publishes no container or enclave images: operators build their own from the tag.

Between RC-0 and GA only two repos moved materially: the Trust Tasks framework (29 commits — TSP binding 0.3 requiring TSP 1.0, the `hcp/*` family carrying the Human Context Protocol as Trust Tasks, and trust-tasks-rs 0.41.5 → 0.43.0) and the browser wallet (7 commits).

### Breaking changes an integrator will notice

| Change | Where |
|---|---|
| TSP 1.0 replaces Rev 3; the sender VID is mandatory in confidential payloads | TDK #967 |
| The JS, Go and Dart SDKs refuse the Rev 2 and Rev 3 drafts | tsp-js #374, Go, Dart #4 |
| The mediator moved to `affinidi/affinidi-messaging-mediator` | TDK #949 |
| affinidi-tdk 0.50, messaging-sdk 0.51 and trust-tasks-rs 0.41 across the SDK boundary | VTI #2796, #2797 |
| affinidi-crypto 0.4, did-common 0.5, resolver-traits 0.2, did-web 0.2, cache-sdk 0.9 | TDK #1174 |
| sd-jwt-vc removed; openid4vci pinned to draft 13 | TDK #1156 |
| The unverified step-up approval-token signer is removed | VTI #2793 |
| Step-ups are answered with `approve-response/0.7`; 0.4 and 0.6 no longer served | VTI #2346 |
| The VTC serves only the current version of each rooms, directory and admin task | VTI #2308, #2310 |
| The VTC talks to networks over `vtn/*` Trust Tasks | VTI #2422 |
| `new_vmc` and `new_community_role_vac` take an issuer scope; a salt under v1/v2 is refused | dtg-credentials #50 |
| The KERI controller writes v2 events by default; thresholds are hex | affinidi-keri 0.6 |

## Eucalyptus: signed, proof-bound, governed

Eucalyptus ran 36 days, from the Dogwood-R1 cut on 2026-09-01 to 2026-10-07. By the project's own release-arc report it landed **1,997 commits in 1,630 pull requests across 18 repositories by 16 authors, 203 of them marked breaking** — close to the 2,028 commits that Banyan, Cypress and Dogwood landed *together*. Where Dogwood was about making the wire honest, Eucalyptus was about closing the door on everything that was not signed:

- **The signed door.** Every call into the stack is now a signed Trust Task with a proof bound to its sender, over TSP, DIDComm or HTTPS, and the remaining REST management surfaces were removed: every VTC client call is a signed Trust Task (VTI #1840), the VTA's superseded REST routes are gone and pre-session authentication moved onto Trust Tasks (#1858), every DIDComm and TSP task needs a sender-bound document proof (#1739), and vta-sdk has one Trust Task surface (#1793). The mediator's legacy admin surface (TDK #901), did-hosting's control plane, edge and witness REST management (#225, #238) and the trust registry's `tr-admin/1.0` (#140) went the same way. See [[trust-tasks]].
- **TSP Rev 3, by default.** Rev 3 replaced Rev 2 in the TDK (#796) and is on by default in the VTA (#1622) and the mediator (#854); relationships persist and recover across restarts; cross-mediator sends are nested for metadata privacy; independent Go and Dart implementations landed the same day (2026-09-16) and ship in the tag. See [[trust-spanning-protocol]].
- **Governed by more than one person.** ACL capabilities are enforced and no principal can widen its own entry (#1738); VTC administration is role-based with custom roles (#1924); an unrestricted admin needs another admin's consent; consent-gated operations wait in an action list until the N-th approval (#1918).
- **Around that spine:** [[data-rooms|data rooms]] (built end to end in the first ten days), [[peer-identity-vetting]] with **hidden vetting** on the new Predicate Credential System, persona *faces* and *worlds* behind a context boundary (#1255), [[community-git-namespaces]] on GitHub and Forgejo with VTA-held commit signing (#1694; VGI #141, VTI #1957), DTG Credentials v1 (#1859 — role authority credentials, `vetted/1` and `witnessed/1` statements, `issuerScope`), an operable mediator (queue inspection, traffic monitor, runtime config, all over TSP), the SEC-4045 R2 hardening sweep, and [[post-quantum-cryptography|ML-DSA keys]] with a post-quantum TSP package in Dart.

### Eucalyptus breaking changes

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

| Repo | `VTI-Dogwood-R1` | `VTI-Eucalyptus` | **`VTI-Fig`** |
|------|------------------|------------------|---------------|
| [[verifiable-trust-infrastructure\|VTI]] vta-service / vta-sdk / pnm-cli / cnm-cli / vtc-service | 0.23.4 / 0.32.3 / 0.14.3 / 0.13.3 / 0.11.58 | 0.56.0 / 0.64.2 / 0.36.0 / 0.30.0 / 0.11.58 (unpublished) | **0.87.2 / 0.94.2 / 0.66.2 / 0.60.2 / 0.35.2** (vtc-service published; 40 crates in the release's bill of materials) |
| [[openvtc\|OpenVTC]] | 0.3.1 | 0.5.0 | **0.9.0** |
| [[dtg-credentials]] | 0.5.0 | 0.13.0 (v1 context) | **0.16.0** (Working Draft 0.7.0) |
| [[affinidi-tdk\|TDK]] affinidi-tdk / messaging-sdk / affinidi-tsp | — / — / 0.1.15 | 0.23.0 / 0.33.2 / 0.2.2 | **0.50.0 / 0.51.0 / 0.5.0** (TSP 1.0) |
| Mediator (in the TDK until Eucalyptus; `affinidi-messaging-mediator` since) | 0.20.6 | 0.37.0 | **0.56.0** (first tag in its own repo) |
| [[affinidi-webvh-service\|did-hosting-service]] server | 0.8.3 | 0.8.3 | **0.12.0** |
| `affinidi-trust-registry-rs` trust-registry | 0.14.0 | 0.23.0 | **0.32.0** |
| `dtgwg-trust-tasks-tf` trust-tasks-rs | 0.17.3 | 0.27.7 | **0.43.0** (0.41.5 at RC-0) |
| `affinidi-keri-rs` affinidi-keri | — | 0.4.0 (untagged) | **0.8.1** (first coordinated tag; KERI v2) |
| [[vtn-service\|verifiable-trust-network]] vtn-service / nnm-cli | — | — | **0.1.0 / 0.1.0** (new; born 2026-11-02) |
| [[verifiable-git-infrastructure\|VGI]] workspace | 0.4.7 | 0.18.2 | **0.37.0** |
| [[vta-browser-plugin\|browser wallet]] pnm-core / vti-tsp-js | 0.6.0 / 0.2.0 | 0.9.1 / 0.3.0 | 0.9.1 / **0.4.0** |
| [[vti-didcomm-js]] | 0.7.0 | 0.12.0 | **0.16.1** |
| [[rp-sdk-js]] | 0.2.0 | 0.2.0 | not in the tag set (0.3.1 on npm) |
| [[didwebvh-rs]] | 0.6.1 | 0.8.0 | **0.8.3** |
| `predicate-credential-system` | — | 0.1.0 | **0.1.1** (security-only maintenance release; the VTI still pins 0.1.0, and main moved on to PCreds on Jali 0.3) |
| `vta-agent-memory` | — | 0.3.0 | **0.8.2** |
| `affinidi-tsp-go` / `affinidi-tsp-dart` | — | 0.1.0 / 0.1.1 | **0.2.0 / 0.2.3** (TSP 1.0) |
| `vti-push-gateway`, `vta-mobile-agent-ios` | tagged | tagged | tagged (did:webs and did:scid parties) |
| [[vti-setup]] guides | explore stream on `VTI-Dogwood` | explore re-pinned to `VTI-Eucalyptus` on 10-12 (VTA 0.50.0 / Mediator 0.37.0) | **every guide verified on `VTI-Fig`** by automated runs (11-28): VTA 0.87.2 / PNM 0.66.2 / Mediator 0.56.0 / DID Hosting 0.12.0 / Trust Registry 0.32.0 / VTC 0.35.2 / OpenVTC 0.9.0; source builds `git checkout VTI-Fig` |

The full per-crate tables live on each entity page; Cypress and earlier columns are on the entity pages too. The [[keyring-wallet|Keyring phone wallet]] is not in the tag set — it is a Berkman Klein Center project, not an OpenVTC one. At Eucalyptus it pinned the same Trust Tasks release (trust-tasks 0.27.7, 2026-10-07), the VTA release the Farm actually runs (vta-service 0.55.0, one behind the tag), mediator 0.37.0 and OpenVTC 0.4.0 as its interop counterpart — and it is checked against upstream's own Rust verifiers in its CI rather than against itself.

## Why It Matters

- **For operators and newcomers**: the latest tag is the answer to "which versions go together?", and since Eucalyptus each one comes with a GitHub Release that spells the answer out; since Fig the answer also has a support window and a patch branch. Since Fig the [[vti-setup]] guides follow the same rule: every page is re-run by automation on each release, its "Verified with" table names the release, and the `download.firstperson.dev/<component>/latest/` binaries serve `VTI-Fig` (dated nightlies are an opt-in that may be ahead of the guides). (The managed [[vtafarm|VTA Farm]] is the exception: it offers whatever GHCR image tags exist, newest first, rather than pinning a coordinated release.)
- **For the team**: the RC process forces the cross-repo dependency graph into shape. Cypress is where the VTI dropped its `[patch.crates-io]` self-pin; Dogwood is where every downstream repo absorbed trust-tasks 0.17 and vta-sdk 0.32; Eucalyptus is where the whole stack moved to TSP Rev 3 and signed-only Trust Tasks at once — and where the spec registry itself joined the tag; Fig is where every repo converged on a single copy of every shared crate.
- **For the wiki**: the tags are the reference points the entity activity logs are organized around; each entity page notes its own versions at each tag.

The next release is **Ginkgo**, scheduled for GA between 2026-12-25 and 2027-01-08.

See also: [[overview]], [[verifiable-trust-infrastructure]], [[openvtc]], [[vti-setup]], [[kernel-web-of-trust]], [[trust-tasks]], [[vtn-service]], [[community-governance]]
