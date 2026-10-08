---
title: "Trust Registries"
type: concept
tags: [trust-registry, governance, roles, policy, trqp, consent, eucalyptus]
date-updated: 2026-10-07
sources: [dtg-credential-spec, verifiable-git-infrastructure, verifiable-trust-infrastructure, affinidi-tdk, openvtc]
---

# Trust Registries

## What They Are

A Trust Registry is the authoritative source for governance within a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. It maps [[decentralized-identifiers|DIDs]] to roles, determines acceptable issuers, defines policies, and handles revocations.

Critically, trust registries are what determine whether a [[membership-credential|Membership Credential]] qualifies as a [[personhood-credential|Personhood Credential]] — it's the governance layer, not the credential structure, that enforces personhood guarantees.

## What They Do

Trust registries manage:
- **Role assignments** — who is an initiator, trust anchor, member, identity verification provider (IDVP), etc.
- **Issuer policies** — which DIDs are authorized to issue which credential types
- **Personhood enforcement** — which VTCs enforce real human personhood and one-membership-per-person rules
- **Revocation** — which credentials are still valid
- **Policy definitions** — community-specific trust policies and thresholds

## Why They Matter

The DTG credential system is deliberately governance-agnostic at the credential level — a [[personhood-credential|PHC]] is structurally identical to any other VMC. The trust registry is where governance decisions live. This separation means:

- The same credential format works across communities with different governance models
- Personhood guarantees can vary by community (different verification standards)
- Policy changes don't require re-issuing credentials
- Verifiers check the trust registry to determine what level of assurance a credential provides

## Current Status

The DTG specification references trust registries as a core concept but explicitly marks their schema and APIs as out of scope; its glossary names the community roles a registry records — *initiator*, *community trust anchor (CTA)*, VTC/VTN trust anchors, and *identity verification providers* — and notes that a Verifiable Trust Service Provider may operate registries on a community's behalf. In practice the ecosystem queries registries with **TRQP v2.0** (ToIP Trust Registry Query Protocol) — e.g. [[verifiable-git-infrastructure|VGI]]'s CI check asks `(entity, authority, action = git.commit.sign, resource = <forge>/<owner>/<repo>)` — reaching the registry by DID over TSP, DIDComm or HTTPS. The exact implementation is left to individual communities and networks.

## As of Eucalyptus: Authenticated Writes, Signed Replies, Consent

The reference registry, **`affinidi-trust-registry-rs`**, is at **0.23.0** in the `VTI-Eucalyptus` tag (2026-10-07), and the September–October work made it a party that can be held to account rather than a lookup table:

- **The write side became Trust Tasks, and the old admin protocol went.** Release 0.20.0 (#140, 2026-09-25) **removed the DIDComm `tr-admin/1.0` protocol**. Every write is now a signed `registry/*` Trust Task — `registry/record/put/0.1`, `registry/record/delete`, and an admin-only `registry/record/query` — **authenticated**, **bound to the writer's authority** (a VTC can write only records under its own `authority_id`; the binding also covers the older `git-trust/grant|revoke` family), treated as operational messages, and **audited**, refusals included. Since #142 the registry **signs every reply** with its operational key, so a VTC or a CI check can tell a registry's answer from a mediator's or a forger's. Relationship management for TSP Rev 3 arrived in 0.18.0, and registry queries over TSP are tested (#145); the registry generates its own Ed25519/X25519 identity, and a private registry fails closed if its access-list mode is refused.
- **Three ways to ask.** Unsigned TRQP REST (`POST /authorization`, `/recognition`) for verifiers that only need a yes or no; TRQP over DIDComm (`trqp/1.0`); and the signed `registry/*` tasks over TSP, DIDComm or HTTPS. The `trql-client` crate is how the VTC and VGI's `verify-trust` reach it (the "TRQL" in the name is only a crate name; the protocol is TRQP). The VTC's `docs/03-vtc/trust-registry.md` documents which transport was chosen and why, with a health check that warns when a registry advertises TSP with no DIDComm fallback or no messaging transport at all.
- **What a VTC publishes, and who consented.** A community publishes a member only if that member **consented** — `registryConsent` on `vtc/join-requests/submit` (VTI #1691, 2026-09-23); an administrator can withdraw a member's consent but never grant it (#1962); approval does not consent for them. [[openvtc|OpenVTC]] had hard-coded that flag to `false`, so nobody who joined through it could ever be published; since #439 (2026-10-05) every join stops on a *Trust registry* page as its last step, says what publishing means — a public record that this identity is a member — and sends whatever the person ticked. Beyond membership, a VTC now publishes **repository rights**: one TRQP authorization record per live `git.commit.sign` right in a bound [[community-git-namespaces|git namespace]] (explicit, or implied by `own`, `maintain` or `ns.admin`), with `impliedBy` in its context and never the granter or reason, reconciled against the registry every fifteen minutes. The registry's `git.commit.sign` capability is what `verify-trust` asks about, so the whole Know Your Developer chain — vetted admission, namespace right, CI check — runs through this one record type.

See also: [[personhood-credential]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[community-git-namespaces]], [[verifiable-git-infrastructure]]
