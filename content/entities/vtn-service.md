---
title: "Verifiable Trust Network (VTN service)"
type: entity
tags: [vtn, network, federation, community, trust-tasks, directory, trust-registry, primary]
date-updated: 2026-11-28
repo: https://github.com/OpenVTC/verifiable-trust-network
---

# Verifiable Trust Network (VTN service)

*Repo: [github.com/OpenVTC/verifiable-trust-network](https://github.com/OpenVTC/verifiable-trust-network)*

The VTN service is the ecosystem's third kind of node. A [[verifiable-trust-agent|VTA]] holds one principal's keys, and a [[verifiable-trust-community|VTC]] admits people one at a time. A **Verifiable Trust Network** curates whole communities, along with other networks, so that they can be found and jointly recognized. This repository turns the [[verifiable-trust-network|VTN concept]] from a glossary entry in the [[dtg-credential-spec|DTG spec]] into running software. It was created on 2026-11-02 and shipped in the [[coordinated-releases|`VTI-Fig`]] tag set three and a half weeks later.

## Why a network service

The VTI specification's VTN chapter (`dtgwg-vti-spec/spec/11a-vtn.md`, requirements VTI-VTN-001…063) puts the problem simply: *a VTC is a club, and a VTN is the association the clubs are listed in.* Without a network layer, a relying party that wants to know about many communities has to keep its own list, and a community that wants to be found is found only by people who already know about it. Pairwise recognition between communities doesn't scale (*n* communities means *n²* relationships), and the registry rules deliberately refuse to make recognition transitive. A network is the other way to scale: one curated set, with an owner who is accountable for it. It makes discovery cheap without making trust transitive.

The spec then fences that role in tightly, and the service is built so it *cannot* step outside it:

- **Listing is one-sided.** Anyone can create a network and list anyone, but every entry must say whether the listed party has acknowledged it. An unacknowledged listing must never be described as membership (VTN-010…013).
- **Listing is not recognition.** Trusting a network never implies trusting what it lists, unless a relying party adopts an explicit, named policy (VTN-022/023).
- **Nesting never flattens.** A network of networks always shows the path, and each hop keeps its own owner and acknowledgement state (VTN-030…033).
- **A network grants nothing.** It creates no trust contexts, derives no keys, holds no people, and removing a community from a network takes nothing away from that community's members (VTN-060…063).

Whether a VTN is a distinct node type or a VTC running in a "curation role" is still open at the working group (the spec's D9). The design document records OpenVTC's answer, decided on 2026-11-02: a **distinct service**. Its member list, directory, groups and messaging all behave differently from a VTC's, and a binary with no code paths for holding people or minting member state is the easiest way to guarantee that a network never does either.

## The worked example

The design is built around a **World Health Network** (WHN). WHN lists national networks (Health-AU, Health-NZ), which list state networks, which in turn list hospitals' communities (St Vincent's, Westmead, Alfred Health). Médecins Sans Frontières is a direct member. Some entries are acknowledged and some are only listed, and Health-AU and Health-NZ recognize each other laterally. A search for St Vincent's from WHN comes back with its whole three-hop path, each hop with its own acknowledgement state. An "all admins" broadcast from WHN reaches every hospital's admin group without WHN learning who anyone is. The service's integration tests run exactly this topology over real HTTP, including a cycle back to WHN that is caught as a duplicate.

## Components

| Component | What it is |
|---|---|
| **`vtn-service`** | The `vtn` binary. It holds the network's VTA-provisioned identity (`vtn setup` asks the VTA to mint a `did:webvh` from the `vtn-host` DID template; keys are kept in any `vti-secrets` backend, from the OS keyring to Vault, AWS, GCP, Azure or Kubernetes), a fjall store, the `vtn/*` Trust Task API, W3C Bitstring Status Lists, the landing page, and the trust-registry projection. |
| **`nnm-cli`** | The `nnm` binary, the **Network Network Manager**. It's the operator's CLI for a network, the way `pnm` is for a person and `cnm` for a community, so it completes the **PNM / CNM / NNM** trio (see [[vta-topology]]). It holds the operator's admin key and signs every request with it. It covers listings, invitations, suspension and removal, roles and groups, broadcasts and the outbox, memberships in parent networks, the graph, the audit log, and `nnm verify` / `nnm registry`, which anyone can run without an admin key. |
| **`vti-vtn`** (in [[verifiable-trust-infrastructure\|VTI]]) | The protocol crate: credentials, status checking, groups, room passes and the `vtn/*` client. It started in this repo as `vtn-core` / `vtn-client` and moved into the VTI workspace on 11-03/04 (VTI #2398, #2413), so the community side and the network side share one implementation. Published on crates.io (0.18.0 at the time of writing). |
| **`vti-specs-vtn`** (in VTI) | Wire types generated from the `vtn/*` 0.1 specifications on trusttasks.org ([[trust-tasks]]). |

The VTN workspace itself is at **0.1.0**. `vtn-service` and `nnm-cli` are not published to crates.io, so operators build them from the tag.

## What It Does

### Three independent relationships

The design separates three questions, because every warning in the spec is about one of them being mistaken for another. Each relationship is a [[dtg-credentials-overview|DTG credential]] with its own status:

| Question | Sides | Evidence |
|---|---|---|
| **Listing:** does the network list X? | one (the network) | A [[statement-credential\|Statement Credential]] under the registered predicate `registry.trustoverip.org/dtg/vsc/lists/1`, whose value names the node type (VTC or VTN) and the governance framework |
| **Membership:** have X and the network agreed that X is a member? | two | A [[membership-credential\|VMC]] pair: the network's grant and X's acknowledgement, which carries the grant's digest |
| **Repudiation:** does X reject the listing? | one (X) | A Statement Credential under `…/repudiates/1`. The listing stays published next to it (VTN-012). |

Membership follows a careful order. The network first publishes the grant's claims **unsigned**. The listed party signs an acknowledgement over their digest, and only then does the network sign the grant. This satisfies both the DTG rule (the grant comes before the acknowledgement, bound by digest) and VTN-013 (no membership credential exists until the party agrees). An entry moves through `listed` → `acknowledged`, and from there to `suspended`, `removed`, `repudiated` or `departed`. Each network action is reflected in the network's own revocation and suspension status lists. The `lists/1` and `repudiates/1` predicates were registered in `dtgwg-vsc-registry` (#33) after the working group agreed on them in discussion #82. Group-related predicates still live in an OpenVTC namespace.

### Networks of networks

A network joins a parent that lists it (`nnm memberships join <url>`), sending the parent `vtn/*` tasks signed by its own identity. It can later leave or repudiate. The DTG spec caught up in the same window: Working Draft 0.7.0's [[membership-credential|VMC]] section now explicitly allows a VTN's members to be VTCs **or** VTNs, and keeps nested membership per-hop (spec PR #83, merged 2026-11-24).

### Roles, groups and cascading broadcast

This is the network's main new capability. A network defines **roles** (for example `admins`), and members register a group for each role. A role can be `required`, in which case admission waits until the member has registered a group for it, so the network can always reach every member's admins. A broadcast to a role goes out as a signed Trust Task, one hop at a time. A member community receives it as `vtc/networks/deliver` and passes it to its group's members. A member network receives it as `vtn/relay/deliver` and relays it into its own members' groups. Each hop expands only its own groups, so **rosters never leave their owner**. Each hop also appends a signed provenance step, a global message id and a hop limit catch overlaps and loops, and receipts flow back up the chain. Failed deliveries wait in a durable outbox with exponential backoff.

### Network rooms

A network can open a [[data-rooms|data room]] for a role. A person in any group registered for that role, whether directly or through member networks, presents the chain of evidence (their group membership plus each level's signed registration and acceptance). In return they get a short-lived **room pass**, a VAC scoped to the room. The cascade is evaluated when someone is admitted and never cached as a roster.

### Directory, federated search and the trust graph

The landing page at `/` shows the network's profile, member counts and a searchable directory. Visibility is `public`, `members` or `admins`. **Federated search** reaches into member networks' signed indexes, and every hit keeps its path. A member index that is restricted or unreachable is reported as *indeterminate*, never as "not present". The **Trust graph** tab draws the [[decentralized-trust-graph|DTG graph]] straight from the credentials, one edge per credential, and member networks expand in place. People never appear in it, because a network has none. For a restricted directory, a member community, member network or administrator signs in from a wallet through `auth/oob/*`, approving the page's own key for a few hours. There's no session or cookie.

### Anyone can check

Membership is meant to be verified rather than taken on the network's word. The landing page's **Check membership** and **Verify** tabs, and `nnm verify <url> <did>`, check every signature themselves, in the browser for the page. Since 11-23 that includes [[decentralized-identifiers|did:webs]] signers, using the did:webs resolver from [[vti-didcomm-js]]. Every answer the service gives carries the network's own proof (VTI #2439).

### Trust-registry projection

With `[registry]` configured, the network publishes one TRQP record per acknowledged member to a [[trust-registries|trust registry]]: `(party, network, member, vtn)`. That lets any existing TRQP client ask "is X in network N?". The records are written as signed `registry/record/*` Trust Tasks over the network's own DIDComm session, and the network's DID document carries a `TrustRegistry` referral that says where to ask. Listed-but-unacknowledged parties are published only under `lists`, never `member`.

### The API is Trust Tasks

Every operation is one of 33 `vtn/*` 0.1 [[trust-tasks|Trust Tasks]] at `POST /v1/trust-tasks`, signed by its caller and answered with the network's signature. There's no sign-in for API callers, and the REST API that existed for the first two days was removed (11-04). Only things fetched by URL stay plain `GET`s: the landing page, `/.well-known/vtn`, status lists, the signed index, credential fetch and the health probes. As the design puts it, *a Trust Task answer is never evidence of a relationship; the credentials it carries are.*

## Dependencies & relationships

- **[[verifiable-trust-infrastructure]]**: provides the protocol crate (`vti-vtn`), generated specs, `vti-common` storage, `vti-secrets`, `vti-oob-server` and the shared Trust Task server. The **community side** lives in `vtc-service`: a VTC receives a listing and acknowledges or repudiates it, joins a network from the console's Networks page or `cnm networks` (#2458), can **preview** a network before joining (`vtc/networks/preview/0.1`, #2464), talks to networks only over `vtn/*` tasks (#2422, a breaking change listed in the Fig release notes), and receives broadcasts as `vtc/networks/deliver` (#2450).
- **[[verifiable-trust-agent]]**: the network's identity and keys are VTA-provisioned (VTI-VTN-001).
- **[[dtg-credentials]] / [[dtg-credential-spec]]**: every relationship is a DTG credential. `dtgwg-vti-spec` holds the normative VTN chapter.
- **[[trust-registries]]**: membership is projected there.
- **[[vti-didcomm-js]]**: did:webs verification on the landing page.

## Recent Development

### Fig — 2026-11-02 → 11-25 (0.1.0; 55 non-merge commits, PRs #1–#48)

- **11-02 (creation day):** initial workspace, plus nested networks, roles and cascading broadcast, federated directory search, the trust-graph view, wallet sign-in, durable broadcast delivery and network room passes. In one day this covered the network side of all four phases of the design's delivery plan.
- **11-03/04:** listings and repudiations moved to the registered DTG predicates (breaking: interim listings had to be re-issued). `vtn-core` / `vtn-client` were replaced by VTI's `vti-vtn`. The API became `vtn/*` Trust Tasks and REST was removed. Browser sign-in moved to `auth/oob/*`, and health probes were added.
- **11-05/06:** the network's proof is verified on every answer, broadcasts reach communities as `vtc/networks/deliver`, `nnm invite` links into a community's console, the landing page was redesigned, third-party verification was added (Check membership, Verify, `nnm verify`), and membership is projected to a trust registry over DIDComm with relayed `vtn/registry/check` / `status` for DIDComm-only registries. Signatures are now verified in the browser.
- **11-23 → 11-25:** private-CA trust for status-list fetches (#38), did:webs always resolved (#39) and verified in the browser (#40), and an advisory fix (#48).
- **Tags:** `VTI-Fig-RC-0` (11-24) and `VTI-Fig` (ce69602, 11-25). The repo is one of the twenty in the Fig tag set and the only one new to it. The release arc, measured to RC-0, credits it with 54 commits, two of them breaking.

### Not yet built

The README and `docs/assumptions.md` (A1–A23) list what's still to come:

- **VTI roles and approvals:** a network's admins are plain DIDs listed in config. The owner, curator, broadcaster and auditor roles and step-up approvals (VTN-004/005) are still to come, as are delegated admin keys.
- **TSP/DIDComm** carriage for Trust Tasks and broadcast delivery (HTTPS today).
- **Recognition** credentials: VRC-evidenced recognition between networks and communities, which the design sketches, isn't implemented.
- **Post-quantum second proof:** only the Ed25519 key signs, unlike the VTC.
- **Authenticated `GET`:** in a restricted network, the index and credentials can only be read through signed tasks, so a parent's federated search reports such a member as indeterminate.
- **The shared community kernel:** the `vti-community-core` crate that VTC and VTN would share (design phase 0) hasn't been extracted.
- **The working-group questions:** D9 and several of the spec gaps the design raised are still open.

See also: [[verifiable-trust-network]], [[verifiable-trust-community]], [[vta-topology]], [[trust-tasks]]
