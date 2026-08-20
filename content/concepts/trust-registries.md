---
title: "Trust Registries"
type: concept
tags: [trust-registry, governance, roles, policy]
date-updated: 2026-08-19
sources: [dtg-credential-spec, verifiable-git-infrastructure, verifiable-trust-infrastructure]
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

The DTG specification (v1.0 WD01) references trust registries as a core concept but explicitly marks their schema and APIs as out of scope; its glossary now also names the community roles a registry records — *initiator*, *community trust anchor (CTA)*, VTC/VTN trust anchors, and *identity verification providers* — and notes that a Verifiable Trust Service Provider may operate registries on a community's behalf. In practice the ecosystem queries registries with **TRQP** (ToIP Trust Registry Query Protocol) — e.g. [[verifiable-git-infrastructure|VGI]]'s CI check asks `(entity, authority, action = git.commit.sign, resource = repo)` — reaching the registry by DID over TSP or DIDComm. The exact implementation is left to individual communities and networks.

See also: [[personhood-credential]], [[verifiable-trust-community]], [[verifiable-trust-network]]
