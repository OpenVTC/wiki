---
title: "Peer Identity Vetting"
type: concept
tags: [vetting, personhood, admission, community, governance, endorsement, trust-tasks]
date-updated: 2026-09-18
sources: [openvtc, verifiable-trust-infrastructure, verifiable-trust-agent, dtg-credentials]
---

# Peer Identity Vetting

## Why: People Are the Root of Personhood

A [[verifiable-trust-community|community]] that admits anyone on request is only as trustworthy as its weakest signup form. The communities this ecosystem is built for — the Linux kernel's maintainers are the worked example — have always solved that the same way: **existing members check who you are before you get in.** The kernel does it with a PGP web of trust: a key signed by two or three account holders who met you, a trust path to Linus, key-signing parties. It works, and its pain points are known — a public list of names and coordinates, a published graph of who vouched for whom, in-person bias, and a strong set that shrank from 358 to 94 keys when GnuPG dropped SHA-1 signatures.

Peer identity vetting is the ecosystem's replacement for that model. Its premise is that the *human* root of [[personhood-credential|personhood]] is not a document check by a machine but **admission by people who checked you** — and that this can be made into evidence a community can count, under rules it publishes, without publishing who vouched for whom.

## How It Works

An **applicant** who wants to join a vetting community, from [[openvtc]] alone:

1. reads the community's **vetting requirements** from its join manifest before disclosing anything — how many statements, by which methods (`inPerson`, `video`, `priorAcquaintance`), which claims, how fresh, how independent;
2. builds a signed **Vetting Card** from one of their persona *faces* (a profile over their attribute pool), bound to the DID they will join with;
3. reaches a **vetter** — a member the community has named — by presenting a **ticket** the vetter issued (an 8-character Crockford code or a QR), the anti-spam gate: a wrong code gets no answer;
4. sits a **vetting session**, in person or on video. Both screens derive the same spoken **match code** from the session document, under the domain tag `vetting-session-match/v1`; reading it aloud proves the person in the room is driving the client that controls the join DID. The vetter checks the card against whatever documentation *they* accept, and issues back a **Vetting Statement** — a DTG [[endorsement-credential|Endorsement Credential]] of type `IdentityVetting`, bound to the session by [[trust-task-context-binding|`taskContext`]];
5. repeats until the checklist fills, then submits the statements in one presentation. The VTC verifies them, counts distinct vetters *by member record* (independence must be shown by evidence, not by DID), evaluates governance policy and admits, asks for more, refers to a moderator, or denies.

Vetters are named by a revocable **`CommunityRole: vetter`** credential the community issues, with a status list and a validity of up to two years. Every acceptance carries it as an `eligibilityVp`, so the applicant knows *before* the session that the statement will count — and the [[trust-registries|role]] is a policy input, not a graph computation: eligibility rules can look at tenure, roles and **depth** from the founding anchors, so the kernel's "trust path ≤ 5 hops" becomes one line of Rego. Depth and lineage are recorded privately and never published.

## What It Relates To

- **[[personhood-credential|Personhood]].** Vetting grew out of the personhood work. In August 2026 VTI let a community vet a member in person and have it count as personhood evidence (#1085 — a community acting as its own identity-verification provider, with no new credential type) and moved the personhood ceremony onto messaging with its challenge finally *signed* (#1086); OpenVTC's #257 gave that ceremony its spoken eight-character match code. Peer vetting reuses the same construction under its own domain tag, so the two ceremonies never read out the same code.
- **[[membership-credential|Membership]].** Vetting is a *way of joining*, not a step before it: OpenVTC offers every way in — [[invitation-credential|invitation]], vetting, open request — and an admitted application ends in the ordinary VMC grant, the reciprocal VMC, and any role credentials. After admission the kernel payoff is `git-trust/grant` and [[verifiable-git-infrastructure|signed commits]] checked in CI.
- **[[trust-registries|Roles and policy]].** The vetter role, the statement type, the admission criteria and the eligibility rules are all community governance, evaluated by the VTC's policy engine; there are no defaults in the SDK.

## Status

The design is OpenVTC's `docs/design/vetting-process.md` (**DRAFT v3**, V0 targeted for **2026-10-05**); most of the protocol lives in the ToIP Trust Task specifications, and every wire type is generated from them. VTI landed the server half on 2026-09-11 (#1425–#1432, #1439): wire types and crypto, requirements in the manifest, statements counted in the join decision, the vetter role credential, a vetter registry with automatic grants, admin-UI panels and a `cnm` **PGP web-of-trust bootstrap** for migrating an existing strong set. OpenVTC shipped **V0** across #292–#343: the core and a **Vetting** page (Applications and the Vetting desk), cards read from a persona face, tickets and QR, the vetter directory and profile, an end-to-end ceremony over a real mediator, and join offers that list every way in. Out of scope for V0: zero-knowledge k-of-n proofs over hidden vetters, automated document verification, and Sybil-proof uniqueness across different join DIDs.

See also: [[verifiable-trust-community]], [[personhood-credential]], [[dtg-credentials-overview]], [[openvtc]], [[verifiable-trust-infrastructure]]
