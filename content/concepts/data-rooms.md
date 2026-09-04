---
title: "Data Rooms — shared spaces a room, not a host, governs"
type: concept
tags: [vta, dtg, data-rooms, mls, privacy, audit]
date-updated: 2026-09-04
sources: [verifiable-trust-infrastructure]
---

# Data Rooms — shared spaces a room, not a host, governs

A **data room** is a shared space whose access is governed by credentials the room *itself* issues — not by anything the storage host holds. That single property, called invariant I5 in the design note, is what the rest of the model is built around: a room has no member list anywhere in its hosting layer. Authorization is a presentation — a chain of DTG credentials rooted in the room's own [[decentralized-trust-graph|DTG]] membership grant — verified against the room's identifier, and nothing else. Landed in `verifiable-trust-infrastructure` PRs [#1237](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1237)–[#1248](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1248) as the `vti-rooms` crate, a `room-host` binary, and the `rooms/*` Trust Task family (schemas in `dtgwg-trust-tasks-tf#346`).

It matters because the alternative — a host that keeps a roster and checks it — quietly becomes part of the room's membership definition: the room can no longer move to another host without reissuing every credential, and a room whose contents a host cannot read acquires a member list the host *can* read. A data room is designed to be portable and to fail closed instead.

## Visibility tiers

Fixed at room creation and immutable for the room's life (a downgrade cannot un-see cleartext already stored; an upgrade would protect only what came after while presenting as though it protected everything):

| | `Open` | `Attributed` | `Private` |
|---|---|---|---|
| Record content | cleartext | sealed | sealed |
| Which member acted | visible | visible | unlinkable proof |
| Owner | visible | visible | visible |

The owner — the DID that controls the room's identifier and issues every credential in it — stays visible on every tier, because someone has to be answerable for a room existing (quota, abuse, the lifecycle notice below), even when its contents are opaque to the host.

## Group custody: so a key-holder still has the group tomorrow

`Attributed` and `Private` rooms seal records under a group key that the host never sees ([#1248](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1248)). The group itself is [Messaging Layer Security (MLS, RFC 9420)](https://datatracker.ietf.org/doc/html/rfc9420) — chosen over a hand-rolled "one symmetric key per epoch, sealed to each member" scheme because MLS gives two properties a long-lived room cannot do without: **post-compromise security** (a stolen member key stops working at the next commit, rather than reading every future epoch until someone notices) and **O(log n) membership change** (fan-out is O(n) with a hand-rolled scheme — fine for five members, wrong for a roster-sized room).

The mapping onto MLS's own roles: the DTG is MLS's Authentication Service, a room's host is the Delivery Service — trusted only for availability, never for confidentiality — an MLS epoch is the room epoch the host stores (translated 0-based to 1-based at the boundary), and a commit is a membership change. One leaf per *member* (their VTA), not per device: devices and agents hang off a member through the [presentation-oracle pattern](#the-presentation-oracle-so-an-agent-never-holds-its-humans-credentials) below rather than joining the group themselves, sidestepping MLS's multi-device complexity.

"Group custody" ([#1248](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1248)) is the durability half of this: `rooms/keys/open` opens a record under its epoch's storage key, and an agent that lost its group state between the welcome and the read has nothing left to open with. So a `GroupSnapshot` persists the OpenMLS storage provider's *entire* key-value store (not a hand-picked serialization of "the group" — OpenMLS's own state, signature keypair and pending key packages live under keys OpenMLS owns, and reaching in to extract "just the group" would mean reimplementing its layout and re-breaking on every library upgrade). Restore fails outright rather than returning a half-built group, because a group that loaded its store but not its signer looks usable and fails at the worst possible moment — the first read or the first commit. The blob is group secrets: whoever holds it can decrypt everything the group could, up to its epoch, so it lives at the same protection level as the VTA's key store and credential vault.

Storage keys themselves are derived from MLS's exporter secret under a room-specific label — never from the group's own message keys — so that a change to how records are sealed cannot weaken the group's messaging, or the reverse. `epoch_authenticator` is exposed and anchored in the room's witnessed DID log, because a host acting as Delivery Service could otherwise fork the group (show different members different commit histories) without members able to detect it by comparing through the host — the host is exactly what they'd be comparing through.

## The presentation oracle: so an agent never holds its human's credentials

Data rooms rest on **attenuation**: a member equips their agent with strictly less standing than they hold themselves — in practice, a credential chain one link longer, conferring one action, for four hours, bound to one host, and nothing mints one by hand. `rooms/keys/present` ([#1247](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1247), gated on the `RoomPresent` capability registered in `dtgwg-trust-tasks-tf#351`) is a VTA oracle that mints exactly that attenuated presentation on an agent's request — so a member never has to choose between handing an agent their own credentials (defeating the point of attenuation) or hand-minting one (which nobody does).

Four properties a caller cannot obtain by asking, each closing a path back to a credential hand-off: a presentation wider than the principal holds is refused by `attenuate` itself; a presentation is scoped to exactly one action, never "everything"; a presentation is bound to the DID the transport actually authenticated, never one named in the request payload, so a leaf minted for one agent is worthless even if another agent obtains it; and the four-hour lifetime is a constant, not a request parameter — an oracle that would grant a year-long presentation on request would just be handing back the standing credential it exists not to hand over. It is gated on `RoomPresent`, deliberately separate from the general `Sign` capability: being allowed to ask for a scoped, audience-bound presentation is not the same authority as being allowed to sign anything with the principal's key.

## Audit without learning who

Every room operation — including reads, since on shared material a read log ("who has seen it") is often more interesting to an incident review than a write log ("what it contains") — is now audited ([#1244](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1244)), matching every other consequential surface a VTC exposes. The property that took the real design work: on a `Private` room, the host must not write the acting member's DID into that audit trail, because that single line would hand the host the exact membership it was built never to learn. `AuditActor` therefore has no constructor that takes a DID unconditionally — on disclosing tiers it carries the verified subject, on `Private` it carries only `Member` (true, and the most the host may honestly say, since it did verify *some* chain), and this is decided once in `vti_rooms::audit` rather than left to each host's call sites to get right or wrong independently. A `room-host` writes the trail to its own operator's tracing pipeline rather than to a hash-chained keyspace, deliberately: it is a delivery service with no business growing a second community-service audit chain.

## The lifecycle (design note §9), with the host never deciding

`Live → Lapsed → Dormant → Reclaimable`, each state undone by a single renewal until the last ([#1242](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1242)). `Lapsed` is read-only — nothing destroyed or even hidden, writes simply stop. The state is **computed from `epoch_expires_at`, never stored**: there is no code path where a host decides a room is dormant, which is what makes "the host never decides" structural rather than a promise. That matters most on a `Private` or `Attributed` room, where the host cannot read the content and so is the worst-placed party to judge whether inactivity means worthlessness — the design note originally said read activity should count toward liveness, and the implementation deliberately diverges: counting reads would make the lifecycle depend on the one signal a host can see, the exact correlation the tiers exist to deny. Retention runs from the lapse (not from the dormancy notice), and reclamation never happens before the grace-period notice — erring late destroys nothing; erring early destroys a room somebody would have renewed.

## Curation: a member's authority to say what a room's contents are worth

`Action::Curate` ([#1245](https://github.com/OpenVTC/verifiable-trust-infrastructure/pull/1245)) lets a member retract or deprecate a record without touching its bytes on a sealed tier the host cannot read anyway. Retraction is a tombstone, not an erasure — the key, version and epoch stay so incremental sync converges and the audit chain holds, and a purge is a separate, higher-trust act. Curate is deliberately not implied by write: deciding what a room's shared knowledge is worth is a different grant from being able to add to it, so an agent presentation that confers read alone cannot demote a record a person wrote.

## How it fits with the DTG credential model

Rooms don't introduce a new credential family so much as a new *authorization pattern* over the existing one. A room's owner issues its own [[membership-credential|VMC]]/invitation/authority credentials — see [[dtg-credentials-overview]] for the underlying types — and `rooms/*` operations are authorized by verifying that chain against the room's DID, via a `ChainVerifier` (`vti-rooms-dtg`, built on the [[dtg-credentials|dtg-credentials]] library) rather than by consulting any roster. Two independent checks matter and neither substitutes for the other: each credential's proof must verify against its own `verificationMethod`, and the *chain* must actually reach the room's authority — checking only the first is why a well-formed but unrelated credential would otherwise look valid. The [[verifiable-trust-agent|VTA]] hosts the presentation oracle and group custody because it already holds the principal's keys and is already inside their trust boundary; a `room-host` deliberately is not part of the VTA, so that the process guarding a master seed is never also the thing terminating presentations from arbitrary DIDs.

See also: [[dtg-credentials-overview]], [[verifiable-trust-agent]], [[decentralized-trust-graph]], [[verifiable-trust-infrastructure]], [[zero-knowledge-proofs]]
