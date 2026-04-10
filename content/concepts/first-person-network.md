---
title: "The First Person Network"
type: concept
tags: [first-person, vision, protocol, identity]
date-updated: 2026-04-09
sources: [openvtc, verifiable-trust-infrastructure, dtg-credentials]
---

# The First Person Network

## The Vision

The First Person Network is the overarching vision that the OpenVTC ecosystem implements. Described in the [First Person Project white paper](https://firstperson.network/white-paper), it proposes a world where digital identity is **asserted by you, not assigned to you**.

The name is deliberate:
- **First person** — "I am" rather than "they say I am"
- You create your own identity ([[decentralized-identifiers|DID]])
- You host it on the domain of your choice
- You build trust through real relationships, not institutional endorsements
- No organization can revoke your identity or gatekeep your participation

## How It Differs from Existing Models

| Model | Who controls identity? | How is trust established? |
|-------|----------------------|-------------------------|
| **Centralized** (Google, Facebook) | The platform | The platform vouches for you |
| **Federated** (OAuth, SAML) | Identity providers | An IdP vouches for you |
| **Self-sovereign** (general SSI) | You | Varies — often still requires institutional issuers |
| **First Person** | You | Peer-to-peer relationships, collectively verifiable |

The key distinction from general self-sovereign identity (SSI) is the emphasis on **peer-to-peer trust building**. Many SSI systems still rely on institutional credential issuers (governments, universities, employers). The First Person model builds trust from individual relationships up — your trust graph is the sum of your genuine connections.

## The Protocol

The First Person Protocol defines how participants:

1. Create and host their Persona DID (using [[did-webvh]])
2. Establish private communication channels ([[didcomm]])
3. Exchange [[personhood-credential|Personhood Credentials]] and [[relationship-credential|Relationship Credentials]]
4. Build and traverse the [[decentralized-trust-graph|Decentralized Trust Graph]]
5. Form [[verifiable-trust-community|Verifiable Trust Communities]]

## Infrastructure

The First Person Network is supported by shared infrastructure:

- A public [[didcomm|DIDComm mediator]] at `fpp.storm.ws` operated by the Linux Foundation
- A community DID for the Linux Foundation organization
- The `m/26'` BIP-32 derivation path reserved for First Person Network keys
- JSON-LD contexts at `https://firstperson.network/credentials/dtg/v1`

## The Know Your Developer Problem

The initial application focus is **Know Your Developer** — establishing verifiable developer identities in the open-source ecosystem. The problem is real: how do you know that a contributor is who they claim to be? That their commit history is genuine? That they're not a sock puppet or a compromised account?

The First Person Network answers this by letting developers build verifiable trust graphs through their real professional relationships. Instead of trusting a GitHub account, you can verify a chain of peer attestations, endorsements, and witness proofs.

See also: [[decentralized-trust-graph]], [[verifiable-trust-community]], [[openvtc-cli]]
