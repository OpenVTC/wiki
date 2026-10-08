---
title: "The Kernel Web of Trust — Linux ID, Prague, and the Maintainer Pilot"
type: concept
tags: [linux-kernel, web-of-trust, pgp, know-your-developer, vetting, personhood, linux-id, plumbers]
date-updated: 2026-10-07
sources: [openvtc, verifiable-trust-infrastructure, verifiable-git-infrastructure, keyring-wallet]
---

# The Kernel Web of Trust — Linux ID, Prague, and the Maintainer Pilot

## Why the Kernel Is the Worked Example

Every design document in this ecosystem that talks about admission, vetting or commit signing reaches for the same example: the Linux kernel's maintainers. That is not an accident of taste. The kernel is the one large open-source community that has *always* vetted who its contributors are, and it has done so for twenty years with a tool everyone agrees is showing its age — the **PGP web of trust**. A kernel.org account needs a PGP key signed by two existing account holders who have met you or worked with you; inclusion in the `pgpkeys.git` keyring needs a trust path to Linus Torvalds (reported at most five hops); key-signing parties are coordinated through a public YAML file of names and coordinates; and the whole graph of who signed whom is archived in public. It works, and its pain points are exactly the ones a decentralized trust graph was designed to remove: a public social graph, in-person bias and geographic exclusion, no written identity standard, affiliation handled by hand (the October 2024 maintainer removals), and decay — when GnuPG 2.4 dropped SHA-1 signatures the kernel's strong set shrank from 358 keys to 94.

The XZ Utils compromise of early 2024 turned this from a maintenance burden into a security question. An attacker spent years building a legitimate contributor history before inserting a backdoor, and no verification system caught it. The question the kernel community began asking in 2025 was not "is this key valid?" but **"is this a real, identifiable person whom other real people vouch for, and can we check that without building a central identity database?"** That is the Know Your Developer problem the [[first-person-network]] exists to answer, and the kernel became its pilot.

## Linux ID

The initiative acquired a name in February 2026. At the LF Decentralized Trust Member Summit (2026-02-26) Daniela Barbosa and Hart Montgomery of LF Decentralized Trust, Glenn Gore of Affinidi and kernel maintainer Greg Kroah-Hartman described **Linux ID**: cryptographic "proofs of personhood" built on W3C Decentralized Identifiers and Verifiable Credentials rather than key-signing ceremonies — credentials that assert "this person is a real individual", "this person is employed by company X", "this maintainer has met this person and recognizes them as a kernel maintainer" — exchanged over relationship-specific encrypted channels, with existing PGP infrastructure imported during a parallel testing phase. Kroah-Hartman said the discussion would move to the Linux Plumbers Conference and the Kernel Summit over the coming year.

Three LFDT Labs were announced to carry it: **DTG Credentials** ([[dtg-credentials]]), the **Verifiable Trust Infrastructure** ([[verifiable-trust-infrastructure]]) and **OpenVTC** ([[openvtc]]), which Drummond Reed's progress report of 2026-03-05 described as "intended to package these components into an easy-to-deploy VTC in a box for open source projects". That report set the date everything since has been built toward: *"The goal is for the kernel project instance to be ready for maintainers to review at the Linux Kernel Maintainer Summit October 8 in Prague."* Affinidi's companion essay ("The Linux Kernel Trusts Your Code. Should It Trust You?", 2026-03-09) made the security argument plainly: the approach does not eliminate attacks, it *raises their cost*, because an attacker must now compromise several independent, verifiable trust histories at once.

## What Replaces What

The OpenVTC vetting design (`docs/design/vetting-process.md`) opens with a side-by-side table of the kernel model and its replacement. Condensed:

| Kernel today | OpenVTC |
|---|---|
| Identity is a PGP key with a recommended two-year expiry | A persona DID ([[did-webvh]]) whose keys live in a [[verifiable-trust-agent\|VTA]], with pre-rotation and witnesses |
| A vouch is a key signature from someone who met you or worked with you | A **Vetting Statement** — a [[statement-credential]] under the `vetted/1` predicate — issued by an eligible vetter after a session in person or on video ([[peer-identity-vetting]]) |
| Account gate: two signatures from account holders, reviewed by the helpdesk | `minStatements` from distinct eligible vetters, decided automatically by policy, with `refer` for edge cases |
| Keyring gate: a trust path to Linus of at most five hops | Vetter eligibility tiers plus **vetting depth** from the founding anchors — one line of Rego in the [[trust-registries\|community's policy]] |
| Key-signing parties announced in a public YAML of names and coordinates | An opt-in vetter directory with coarse region only; tickets and QR codes at events; a video method |
| The signing graph is public (`lore.kernel.org/keys`, published trust-path SVGs) | Evidence is held privately by the community; lineage is never published; **hidden vetting** proves "k distinct vetters" in zero knowledge without naming any of them ([[zero-knowledge-proofs]]) |
| Decay when a signature algorithm is retired | Admission-time evaluation is recorded; membership does not depend on old statements staying valid |
| Maintainer roles are `MAINTAINERS` file entries; signed tags required by Linus | VTC roles (`maintainer`, `reviewer`, custom roles) and `git.commit.sign` rights published to the trust registry, enforced by [[verifiable-git-infrastructure\|did-git-sign and verify-trust]] over a [[community-git-namespaces\|community git namespace]] |

Two design choices are worth calling out because they are *not* obvious. First, the identity standard is deliberately left where the kernel already has it: each vetter decides what documentation, if any, they accept. Government ID is key-signing-party custom, not written kernel policy, and the design did not want to be stricter than the community it serves. Second, migration is a feature, not an afterthought: the `cnm` operator CLI gained a `vetting bootstrap-pgp` command that reads an OpenPGP keyring, walks the web of trust from named root fingerprints to a maximum depth, and names the resulting developers as vetters — so an existing strong set becomes the founding vetter population rather than being thrown away.

## Prague, October 2026

The date was met. The vetting design's V0 — the "walking skeleton" of applicant and vetter journeys — had a target of **2026-10-05**, "Prague, ahead of the Kernel Maintainer Summit on 8 Oct", and the week unfolded as three events in the Prague Congress Centre:

- **2026-10-06 — mini-summit.** LF Decentralized Trust hosted *Decentralized Trust for Open Source Maintainers: From the Linux Kernel to the Broader OSS Ecosystem*, a half-day co-located with Open Source Summit Europe, on "how open source projects can know that critical contributors and maintainers are real, trusted participants without creating centralized identity databases or compromising privacy", built around the ToIP Decentralized Trust Graph Working Group's work on verifiable trust communities, relationship credentials, proof of personhood and maintainer verification.
- **2026-10-07 — Linux Plumbers Conference.** In the LPC Refereed Track, Hart Montgomery (Linux Foundation), Drummond Reed (First Person Cooperative) and Glenn Gore (Affinidi) presented *Cryptographic Proofs of Personhood: Solving the Kernel Web of Trust Problem in a Privacy-Preserving Manner* — the project's first presentation to the kernel developers themselves. The abstract framed the kernel.org PGP web of trust as outdated, proposed proofs of personhood as "a decentralized, private reputation system" with capabilities the web of trust cannot offer, and promised a working demonstration on LFDT open-source software. The same day the ecosystem tagged its fifth coordinated release, **Eucalyptus**, across eighteen repositories ([[coordinated-releases]]).
- **2026-10-08 — Linux Kernel Maintainer Summit.** The invitation-only gathering of about thirty core maintainers that the March progress report named as the review point for the kernel instance.

What was on the table by then, as shipping software rather than slides:

- **Vetted admission, end to end**, in three clients: the [[openvtc|OpenVTC TUI]] (0.5.0, 2026-10-05/06: applicant and vetter journeys, tickets and QR codes, the Vetting Card and spoken match code, the vetter's desk), the [[keyring-wallet|Keyring phone wallet]] from Harvard's Berkman Klein Center (the same full flow on iOS and Android, both sides), and the community's own `cnm` CLI and admin console (vetter grants, requirements, the PGP bootstrap). The VTC counts statements under a published criterion — the worked example throughout is literally `"id": "kernel-developer"`: two vetters, at least one in person.
- **Hidden vetting.** The design's "V2" item — prove that *k* distinct eligible vetters vouched for you without revealing which — was pulled forward onto the new **Predicate Credential System** (`OpenVTC/predicate-credential-system`, born 2026-09-24, in the Eucalyptus tag set), as an opt-in per-community mode. It is a research artifact, unaudited and off by default, but it is the concrete answer to the word *privacy-preserving* in the talk's title.
- **Signed commits with the key in the agent.** `did-git-sign` now has the VTA sign commits so the key never leaves it, a project's CI checks every commit against the community's trust registry, and a community can govern the GitHub or Forgejo namespace itself — PR-open gates, required approvals, separation of duties, break-glass ([[community-git-namespaces]]). The kernel's `MAINTAINERS`-plus-signed-tags practice has a direct counterpart.
- **One shape for every identity check.** Since DTG Credentials v1 the community's *own* identity check is also a `vetted/1` statement, issued under the community's DID; OpenVTC keeps it and can offer it to other communities as [[personhood-credential|personhood]] evidence. Recognition of another community's *vetting* proper — so that a developer vetted by kernel maintainers need not be re-vetted elsewhere — remains a V2 item.

## What Is Not Done

The vetting design is explicit about its phases, and Prague marks V0, not the end. **V1 — "operable at kernel scale"** — adds the vetter directory and events, VTA-side tickets and push notifications, lineage and cascade review when a vetter is removed, concern reports, moderator notifications, vetter velocity caps and per-DID rate limits, and the PGP bridge for developers who keep signing with PGP. **V2** holds the assurance and privacy items: identity-document credentials as a statement substitute, zero-knowledge predicate claims in production, uniqueness pseudonyms ("one human, one membership"), affiliation attestations, and cross-community recognition of vetting. Several of these are in motion, none is closed. And the kernel's own decision — whether and how to adopt any of this — belongs to its maintainers; the ecosystem's job through October was to give them something real to review.

See also: [[peer-identity-vetting]], [[first-person-network]], [[verifiable-trust-community]], [[verifiable-git-infrastructure]], [[community-git-namespaces]], [[openvtc]], [[keyring-wallet]], [[coordinated-releases]]
