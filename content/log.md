---
title: "Wiki Log"
type: log
date-updated: 2026-09-04
---

# Wiki Log

A record of major wiki updates: new sources ingested, significant concept and entity additions, and meaningful structural changes.

---

## [2026-09-04] Dogwood refresh — data rooms, TEE fixes, TSP Rev 3, and a respin

**Dogwood is out, and it already needed a respin.** `VTI-Dogwood` tagged 2026-08-30; a TSP multi-hop mediator relay bug (a blind-relay hop misread as a session mismatch, a malformed forwarding-abandonment problem report, a next-hop lookup that didn't follow a hop named by DID) was found and fixed across [[verifiable-trust-infrastructure|VTI]], [[openvtc|OpenVTC]] and the [[affinidi-tdk|TDK]] within two days, and re-tagged `VTI-Dogwood-R1` on 2026-09-01. [[coordinated-releases]] now documents both tags and a per-repo "What Dogwood Snapshots" table (vta-service 0.23.4, OpenVTC 0.3.1, dtg-credentials 0.5.0, TDK mediator 0.20.6, VGI 0.4.7); did-hosting-service's crates stayed byte-identical to Cypress despite 12 commits landing since.

**Data rooms, end to end.** A new concept page, **[[data-rooms]]**, covers the biggest single feature of the cycle (VTI [#1237](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1237)–[#1248](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1248)): shared spaces authorized purely by credentials the room itself issues, with no member roster held by whoever stores the ciphertext (invariant I5). MLS (RFC 9420) provides group custody with post-compromise security and O(log n) membership change; a VTA-hosted presentation oracle mints agents a scoped, four-hour, audience-bound credential instead of handing over standing keys; audit on private rooms records `Member` rather than a DID, so the trail can't leak what the room exists to hide; and a lifecycle (`Live → Lapsed → Dormant → Reclaimable`) is computed from timestamps rather than a host's judgment call. A new `room-host` binary and `vti-rooms`/`vti-rooms-dtg` crates carry it.

**VTA: backup spec debt, and the TEE fixes behind Dogwood-R1.** Specing `vta/backup/*` and `reload-services` for conformance (VTI #1239) surfaced three operations that had been succeeding with no audit trail at all — including a `reload-services` restart whose `audit!` call had never actually reached the sink. Separately, `vta-tee` 0.2.2 and a rebuilt `vta-enclave-proxy` v0.1.1 fix an intermittent vsock `ENOTCONN` on enclave boot and a Mode B carve-out returning the wrong status code (VTI #1003); the golden EIF is now pinned to `VTI-Dogwood-R1`. Both are covered on [[verifiable-trust-agent]] and [[verifiable-trust-infrastructure]].

**Client-side: a management console, a relationship-privacy default, and an auth unification.** [[vta-browser-plugin]] gained a full VTA management console in the wallet — contexts, keys, ACL, policy, credentials — gated by a proof-of-presence WebAuthn check on its two irreversible controls. [[openvtc]] made pairwise relationship DIDs the default (and says explicitly what that default doesn't yet buy) and moved the Relationship Credential itself onto the relationship DID rather than the persona — both breaking changes — alongside a sweep ("r14") that pulled every blocking network call off the TUI's single UI thread. [[affinidi-webvh-service]] unified authentication onto one Trust-Task code path across HTTPS, DIDComm and TSP, retiring a legacy Type URI whose silent divergence had been quietly breaking VTA-wallet login on one binding.

**TSP Rev 3.** The upstream protocol picked up a wire-breaking revision: a new CESR envelope format, messages that are now all-confidential or all-signed-only (never mixed), HPKE-Base as the default cipher (Rev 2's HPKE-Auth is dropped) with a post-quantum X25519MLKEM768 option, thread IDs as self-referencing digests, and routed relationship *forming* — letting two parties establish a relationship through an intermediary for the first time. Covered on [[trust-spanning-protocol]].

[[index]] gained the [[data-rooms]] entry and now reads Dogwood as the current release.

---

## [2026-08-19] July–August refresh — the Cypress release, the spec moves house, five new sources

**Cypress is out.** On 2026-08-17 the ecosystem cut **`Cypress`**, its third coordinated, cross-project release and the first to go through formal release candidates — tagged across [[verifiable-trust-infrastructure|VTI]] (vta-service 0.17 / vta-sdk 0.25), [[openvtc|OpenVTC]] (v0.3.0 → 0.3.1), [[dtg-credentials]] (0.2.0), the [[affinidi-tdk|Affinidi TDK]] (mediator 0.18.19), [[affinidi-webvh-service|did-hosting-service]] (0.8.x) and [[verifiable-git-infrastructure|VGI]] (0.4.5), with the [[vti-setup]] guides re-verified and pinned to it. A new page, **[[coordinated-releases]]**, explains the Aspen → Banyan → Cypress convention and lists exactly which versions go together.

**The spec has a new home — and a first formal draft.** The DTG credential spec left the task-force repo for **`trustoverip/dtgwg-cred-spec`** and became *DTG Core Credentials v1.0, Working Draft 01* under the ToIP/JDF process. [[dtg-credential-spec]] is repointed and rewritten. Substantive changes, all reflected across the concept pages: three functional categories instead of four (the relationship card leaves for a companion *Verifiable Data Structures* spec), four DID types instead of five (W-DID dropped), a new **`taskContext`** binding (new page: **[[trust-task-context-binding]]**), and a [[witness-credential|Witness Credential]] that must now name the exchange and carry a required digest of the specific VRC it attests — `sha256:` + hex over JCS, one VWC per direction — changes driven by a wallet implementer's feedback. A ~50-term glossary arrived with it, including a VTA vocabulary the wiki now gives a home: **[[vta-topology]]** (personal/community × local/cloud VTAs, VTA networks, PNM, PNV, VTSP). [[dtg-credentials]] 0.2.0 tracks WD01 — fixing a real silent-drop bug on the way — but flags an unresolved digest-encoding divergence from the spec.

**Five new sources.** [[verifiable-git-infrastructure]] (VGI) — `did-git-sign` extracted from OpenVTC plus a `verify-trust` GitHub Action that checks every PR commit against a VTC Trust Registry, fail-closed: Know Your Developer as a required CI check. And the **web-login family**: [[vta-browser-plugin]] (the VTA Wallet — passkeys ↔ VTA DIDs, three login shapes, in-browser consent approver, heading for the Chrome Web Store), [[rp-sdk-js]] (relying-party verification), [[vti-didcomm-js]] (browser DIDComm). The iOS authenticator, push gateway, a sampling placeholder and the org's governance repo are mentioned where relevant without pages.

**Convergence across the stack.** The VTI's 340-commit month folded every wire operation onto canonical Trust-Task URIs (legacy REST routes now sign-posted with usage metrics gating deletion), collapsed three approval mechanisms into one runtime-manageable model with a break-glass, decomposed `vta-service` into eleven crates, moved to release-plz, made TSP *selectable* (a VTA can now run TSP-only), and added ISO mdoc, non-extractable keys, hardened non-TEE mode and Nitro tenant config over vsock. The TDK shipped a **reliable messaging delivery layer** (durable outbox, delivery evidence, ack-after-handoff), **agent names** (`example.com/@alice`, verified through `alsoKnownAs`), authcrypt-by-default, and DIDComm v1 for Aries/Credo interop. OpenVTC v0.3.0 made the join ceremony robust to asynchronous delivery (stored-mail pickup, status polling) and added agent names, TSP joins, and a Capabilities panel. did-hosting-service shipped 0.8.0 (transport as a negotiable property), `/@name` resolution, and a clean cut onto registry URIs — and, correcting an earlier wiki claim, did *not* remove its legacy `/api/acl` yet. [[didwebvh-rs]] reached 0.6.0.

**Deployment.** [[vti-setup]] now pins to Cypress, its developer walkthroughs are rewritten for the current TUI (no-persona setup, join by DID or agent name, TSP), the VTA Farm is open self-signup — and **Kubernetes deployment instructions are coming soon alongside the VTA Farm**, so that deploying a VTA for an individual gets easier whichever way you go.

[[overview]] rewritten for August 2026 (Cypress as the headline); [[index]] restructured with a Releases section and the seven new pages; `sources.md` extended.

---

## [2026-07-06] June–July refresh — multi-community lands, TSP goes first-class, new vti-setup source

Another record month across the ecosystem (289 commits in VTI, 193 in the TDK, 80 in OpenVTC), refreshed across all entity activity logs.

**New source: [[vti-setup]]** — github.com/OpenVTC/vti-setup joins as a secondary entity: persona-organized setup guides (developer / community manager / sysop) for standing up the full VTI stack, from a throwaway "explore" sandbox to a hardened systemd + TOML-recipe "deploy" path, with tested, version-pinned walkthroughs.

**Multi-community is done** — [[openvtc]] executed its entire T1–T9 multi-community plan in one month, capped by the `Banyan` milestone tag: one VTA account, many persona-backed memberships, a real [[invitation-credential|VIC]] join flow (vault storage, subject-linkage proof, verdict-model admission), reciprocal member VMCs, and a Ctrl+K community switcher. [[invitation-credential]] gained an Implementation Status section — it's the first credential type to go spec → working code end-to-end.

**TSP goes first-class** — in a coordinated push across three repos, the ToIP Trust Spanning Protocol graduated from experimental to supported and the official transport preference flipped to **TSP > DIDComm > REST**: the [[affinidi-tdk|TDK]]'s mediator became dual-protocol (same endpoint, same websocket, TSP↔DIDComm bridging, cross-mediator federation, ToIP reference interop), the [[verifiable-trust-infrastructure|VTI]] shipped TSP as a first-class managed service, and [[affinidi-webvh-service|did-hosting-service]] added it as a third transport binding under its "everything is a trust task" model. The [[trust-spanning-protocol]] concept page was rewritten accordingly.

**VTI hardening + new surfaces** — [[verifiable-trust-infrastructure]] documents the P0–P3 security campaign (TEE anti-rollback, storage AAD binding, audit hash chains, OpenAPI 3.1 specs, fuzzing), four new crates (`vta-mcp`, `vtc-client`, `vti-secrets`, `vti-fuzz`), crates.io trusted publishing, and two new product thrusts: **personal AI agents** (the VTA as trust anchor under agent runtimes, MCP bridge included) and **enterprise fleet management**. The mobile approver now cryptographically signs denials as well as approvals.

**Elsewhere** — [[didwebvh-rs]] shipped 0.5.5/0.5.6 (fuzzing infrastructure + caller-settable `versionTime`); [[affinidi-webvh-service]] hardened step-up to holder-self-signs (the VTA is no longer a trusted third party there); and the [[dtg-credential-spec]] has scaffolding on a branch for its first formal ToIP Working Draft via Spec-Up-T.

[[overview]] Layers 3 and 5 and "Where Things Are Heading" rewritten for July 2026; [[index]] updated.

---

## [2026-06-07] Ecosystem refresh — multi-community pivot, mobile holder, BBS, did-hosting-service rename

Entity activity logs refreshed for the May–June 2026 cycle — the largest single push in the VTI workspace's history (~530 commits) and a comparable surge in the surrounding repos.

**OpenVTC** — [[openvtc]] now reflects the multi-community pivot: v0.2.1 (nine CLI security/hardening fixes, plus retirement of the `openvtc-service` and `robotic-maintainers` crates whose roles are now covered by the TUI's own DIDComm session and the in-tree mediator harness), followed by a DRAFT v5 design spec (D1–D17), a T1 active-identity API sketch, and an additive T1 implementation slice in `openvtc-core` (`Account` / `PersonaRecord` / `CommunityRecord` / `IdentityRegistry`).

**VTI** — [[verifiable-trust-infrastructure]] now documents the new `vta-mobile-core` (UniFFI engine behind the Authenticator + PNM mobile apps, v0.3.0) and `vti-webauthn` crates; the BBS-2023 end-to-end credential exchange (VTA receive + present, VTC join verifier); DCQL / OpenID4VP `vp_token` verification on both sides; TRQP issuer-trust + status-list verification wired into the join evidence; the four hierarchical-context slices; Trust Tasks 0.2 dual-accept; the documentation restructure into a five-chapter book. [[verifiable-trust-agent]] keeps a focused, VTA-relevant subset.

**did-hosting-service** — [[affinidi-webvh-service]] reflects the v0.7.0 rename (`affinidi-webvh-service` → `did-hosting-service`), multi-domain hosting with `DomainScope` ACL, multi-method (`did:webvh` + `did:web`) via a `DidMethod` trait, a separate `did-hosting-client` companion crate, Trust Tasks 0.2 ACL, and the VTA-proxied SIOP login + visualisation flow (M2B.4).

**TDK** — [[affinidi-tdk]] gained sections for the new `affinidi-bbs` crate (BBS signatures, blind BBS, per-verifier pseudonym), W3C `vc-di-bbs` document-level selective disclosure in `affinidi-data-integrity` 0.7, JOSE centralisation via a new `affinidi-crypto::jose` module that DIDComm 0.15 is rewired onto, DCQL + OpenID4VCI key-binding in the OpenID4VC family.

**didwebvh-rs** — [[didwebvh-rs]] picked up v0.5.3 (a 15-patch cross-implementation security audit covering authorisation, SSRF, witness threshold, path traversal, and percent-encoding) and v0.5.4 (witness-ID serialisation fixes for spec compliance + `affinidi-data-integrity` 0.7).

**DTG Credentials** — [[dtg-credentials]] released v0.1.3 picking up `affinidi-data-integrity` / `affinidi-tdk` 0.7.

[[overview]] was refreshed to reflect the new state; [[index]] date-updated; root log appended.

---

## [2026-05-08] Structural: Sources folded into Entities

`wiki/sources/` has been deleted. Each of the seven source-summary pages was either merged into its entity counterpart (the six project sources) or promoted to a new spec entity ([[dtg-credential-spec]], from the ToIP DTGWG spec source). Two entity files were renamed in the same pass to align filenames with their upstream repos: `entities/openvtc-cli.md` → `entities/openvtc.md` and `entities/dtg-credentials-repo.md` → `entities/dtg-credentials.md`. Each entity page now carries a `repo:` URL in its frontmatter and owns both the project's conceptual structure and its `Recent Development` activity log. The VTI / VTA case kept both entities: VTI carries the canonical workspace activity log; VTA keeps a focused, VTA-relevant subset and points back to VTI for full release notes.

The motivation was maintenance burden: in practice the parallel "Recent Activity" / "Recent Development" sections were drifting out of sync (didwebvh-rs's entity had been at v0.4.1 while its source was at v0.5.2), and every wiki update was producing two near-identical writeups. With consolidation, every project / spec has one canonical page. `CLAUDE.md` was updated to drop the `source-summary` page type, restate the Ingest workflow on entities, and note `repo:` as the canonical provenance field. ~24 cross-references (`[[sources/...]]` links and concept-page `sources:` frontmatter) were redirected.

---

## [2026-05-08] New concept page: Zero-Knowledge Proofs in the DTG

DTG spec PR #33 (merged 2026-05-08) replaced the single VRC ZKP subsection with two distinct constructions: a **pairwise ZKP** anchored to the VRC (available between any two VRC holders, no shared community required) and a **community-anchored ZKP** anchored to the VMC (the three-part proof requiring same C-DID). The spec Overview was rewritten to clarify that DTG credentials SHOULD use ZKP presentation when privacy is desired, and Privacy Considerations gained a "ZKPs by default" guidance.

A new concept page [[zero-knowledge-proofs]] was created to give the pairwise/community-anchored distinction a single home and to capture the broader "ZKPs by default" framing. Pages updated to link in: [[relationship-credential]] (its old "Community-Anchored ZKP Proofs" section was replaced with a broader "ZKP Presentation" section covering both constructions), [[membership-credential]] (added a Community-Anchored ZKP subsection), [[persona-credential]] (added a Relationship to Pairwise ZKPs section showing the Banksy Maneuver as one application), [[dtg-credentials-overview]], [[credential-categories]], [[overview]], [[index]], and [[dtg-credential-spec]].

The earlier-anticipated bidirectional-Edge-Credentials PR (#31) also merged on 2026-04-30; the source page note was updated from "pending" to "merged."

Alongside these conceptual changes, source summaries and entity pages were refreshed to capture substantial code activity since 2026-04-30:

- **VTI** released v0.5.0 `sealed-bootstrap` (HPKE-sealed transfers throughout, runtime-mutable DIDComm protocol surface, six new operator commands); runtime service management P0–P5 merged on `main`
- **OpenVTC** released v0.2.0 (workspace consolidation, full TUI main menu, DIDComm service integration, R-DID generation across both backends, substantial folded-in security pass)
- **WebVH service** released v0.6.0 (web-based ACL invites, VTA template, offline bootstrap, plus a substantial cross-service refresh-handler / TOCTOU / registry-proxy security pass)
- **TDK** shipped tdk-common 0.6, mediator 0.14.0 with a new `mediator-setup` wizard, and published `affinidi-messaging-test-mediator` as a standalone crate

---

## [2026-04-30] Edge Credentials reframed as bidirectional

In anticipation of a pending PR on the [[dtg-credential-spec|dtgwg-cred-tf]] `bidirectional` branch, both Edge Credentials have been reframed across the wiki. Previously the spec described **VMCs as creating nodes** and **VRCs as creating directed edges**. The updated framing treats both as edges between *existing* entities (nodes), each verified through a **bi-directional pair**. Nodes are entities (people, devices, agents, communities), not credentials.

Pages updated: [[decentralized-trust-graph]], [[membership-credential]], [[relationship-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[verifiable-trust-network]], [[overview]], [[index]], and the [[dtg-credential-spec|spec source summary]].

Alongside this conceptual update, source summaries and the overview were refreshed to capture recent code activity (April 2026): VTI v0.4.x with a production-grade DIDComm service, OpenVTC v0.1.5 security hardening, dtg-credentials v0.1.2 API migration, post-quantum cryptography support in the Affinidi TDK, WebVH service v0.5.0 with DIDComm control plane, and didwebvh-rs reaching v0.5.x with 1.0 spec compliance.

---

## [2026-04-13] AI agent framing added across core concepts

Updated [[overview]], [[first-person-network]], [[personhood-credential]], and [[verifiable-trust-community]] to reflect AI agent impersonation as a named threat alongside Sybil attacks. Elevated humanness/personhood framing; added ZKPs to The Big Picture.

---

## [2026-04-09] New source ingested: trustoverip/dtgwg-cred-tf (DTG spec v0.3)

Added the authoritative DTG credential specification as a primary source. Created 7 new concept pages: [[credential-categories]], [[did-types]], [[trust-registries]], [[verifiable-trust-network]], [[witnessed-vrc-exchange]], [[persona-credential]], [[invitation-credential]]. Updated 10+ existing pages to align with the spec, including a full rewrite of [[decentralized-trust-graph]].

Key findings: PHC is a governance-layer property (not credential structure); VRCs are directional; VTNs sit above VTCs in a federation hierarchy; trust registries are authoritative for roles and policies.

---

## [2026-04-09] Initial wiki created from 6 source repos

Generated the wiki from scratch across 6 repositories:

- **Primary:** OpenVTC/verifiable-trust-infrastructure, OpenVTC/openvtc, OpenVTC/dtg-credentials
- **Secondary:** affinidi/affinidi-tdk-rs, affinidi/affinidi-webvh-service, decentralized-identity/didwebvh-rs

Created 24 pages: 1 overview, 12 concept pages, 7 entity pages, 6 source summaries, 1 index.

The wiki is organized around the "First Person Network" / "Know Your Developer" vision, with the ecosystem spanning key management (VTA), messaging/resolution (TDK), DID hosting (WebVH), trust credentials (DTG), and user tooling (OpenVTC).
