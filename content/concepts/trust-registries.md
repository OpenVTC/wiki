---
title: "Trust Registries"
type: concept
tags: [trust-registry, governance, roles, policy]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf]
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

The DTG specification (v0.3) references trust registries as a core concept but explicitly marks their schema and APIs as out of scope. The exact implementation is left to individual communities and networks.

See also: [[personhood-credential]], [[verifiable-trust-community]], [[verifiable-trust-network]]
