---
title: "Trust Registries"
type: concept
tags: [trust-registry, governance, roles, policy, trqp, consent, did-scid, eucalyptus, fig]
date-updated: 2026-11-28
sources: [dtg-credential-spec, verifiable-git-infrastructure, verifiable-trust-infrastructure, affinidi-tdk, openvtc, vtafarm-api]
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

## As of Fig: Durable, Replicated, and Written by Networks Too

At `VTI-Fig` (2026-11-27) the reference registry is at **0.32.0**, nine minors past Eucalyptus. The release-arc summarizes it as *"did:scid administrators, durable message dedup, replica-shared capabilities, headless setup at a VTA"*. After Eucalyptus made the registry accountable, Fig made it **operable**: it can run as several replicas, survive restarts without forgetting what it has done, and be stood up by a VTA without a person at a console.

- **Release branches, like the rest of the stack.** Lines `release/0.27` to `0.32` were cut from a `nightly` branch between 2026-10-19 and 11-24 (#154, #157). The support policy is N and N-1, and the schedule is generated from the tags (#304).
- **Set up from a VTA (#162, 2026-10-21).** `trust-registry setup` uses the same two-phase, headless provisioning the VTA Farm already used for the VTC, mediator and did-hosting daemon. An ephemeral setup key asks the VTA for a short-lived admin grant, and a template drives the rest. The Farm uses it in its full stack, where the registry is now optional per tenant ([[vtafarm]], [[vtafarm-api]]).
- **did:scid parties (#163).** Administrators, authorities, issuers and the registry's own identity can be `did:scid:vh:1`, matched by DID rather than by the `?src=` locator. Setup can create one (see [[decentralized-identifiers]]).
- **Records with validity windows (#168).** A record may carry `validFrom` and `validUntil`. Every recognition and authorization query is judged *as of* `context.time` (or now) on every surface, and outside the window the answer is false with a reason. This is what lets a verifier ask "was this issuer authorized *when it signed*?". The registry also serves the lowerCamelCase `registry/*` 0.2 versions, and `trql-client` asks in 0.2 and falls back to 0.1 (#169).
- **"Runs once" survives a restart and a second replica.** Durable message-id stores on Redis, DynamoDB and fjall hold each claim as a lease, so a replayed or redelivered write is refused across restarts and replicas (#299). Capability enablement is shared across replicas with compare-and-swap (#307).
- **A hardening pass, 2026-11-12 → 11-15 (#273–#297).**
  - *Writes.* Capability tasks count as writes unless declared reads, and registry-level writes act under the registry's own DID (#273). Audit entries record the document digest and the approving key (#285).
  - *Who gets an answer.* DIDComm answers only an authenticated sender (#285). TSP and DIDComm acknowledge a message only after handling it (#288, #295).
  - *One answer.* Every surface takes one TRQP answer decision, with honest HTTP errors (#297), and the server reports its real dependency health (#294).
  - *The client.* `trql-client` requires HTTPS, connects only to public addresses, follows no redirects, caps reply size and accepts a reply only from the registry it addressed (#280, #281). The separate `trqp` crate is no longer published (#293).

**Who writes to it.** A VTC still publishes consenting members and repository rights. Two new kinds of writer appeared in this cycle:
- **[[verifiable-trust-network|Networks]].** A VTN projects its membership into a registry as TRQP `member` records, under the network's DID as authority, written as signed `registry/record/*` Trust Tasks over the network's own DIDComm session. Its DID document's `TrustRegistry` referral says where to ask.
- **Badge groups.** A community publishes its badge groups there (VTI #2491; see [[verifiable-trust-community]]).

The registry is therefore becoming the place where *community* facts, not only member facts, can be checked by anyone without asking the community itself.

See also: [[personhood-credential]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[community-git-namespaces]], [[verifiable-git-infrastructure]]
