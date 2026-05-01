---
title: "DID Types in the DTG"
type: concept
tags: [did, taxonomy, identity, dtg]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf, openvtc]
---

# DID Types in the DTG

The [[decentralized-trust-graph|Decentralized Trust Graph]] uses a taxonomy of [[decentralized-identifiers|DID]] types, each serving a specific role. Understanding these types is key to understanding how identity and privacy work in the ecosystem.

## The Taxonomy

| DID Type | Full Name | Who/What It Identifies | Typical DID Method |
|----------|-----------|----------------------|-------------------|
| **C-DID** | Community DID | A [[verifiable-trust-community\|VTC]] or [[verifiable-trust-network\|VTN]] | [[did-webvh\|did:webvh]] |
| **M-DID** | Member DID | An individual member within a community | [[did-webvh\|did:webvh]] |
| **R-DID** | Relationship DID | A specific relationship between two individuals | did:peer |
| **P-DID** | Persona DID | A persona identity linked to a relationship | [[did-webvh\|did:webvh]] |
| **W-DID** | Witness DID | A witness attesting to a relationship | [[did-webvh\|did:webvh]] |

## Privacy Through DID Separation

The separation of DID types is a deliberate privacy design. The spec requires that **each entity MUST generate a new, unique R-DID for every single entity they connect with**, even within the same community. This means:

- Your M-DID identifies you within a community but isn't exposed in individual relationships
- Each R-DID is unique to one relationship, so counterparties can't correlate your connections
- P-DIDs let you selectively reveal personal information to specific relationships
- W-DIDs keep witness identity separate from their other roles

## How They Map to Credentials

| Credential | Issuer DID | Subject DID |
|-----------|-----------|------------|
| [[membership-credential\|VMC]] | C-DID (community) | M-DID (member) or C-DID (for VTN→VTC) |
| [[relationship-credential\|VRC]] | R-DID or M-DID | R-DID or M-DID (counterparty) |
| [[invitation-credential\|VIC]] | C-DID or authorized M-DID | Invitee's DID |
| [[persona-credential\|VPC]] | P-DID | Counterparty's DID |
| [[endorsement-credential\|VEC]] | Endorser's DID | Endorsee's DID |
| [[witness-credential\|VWC]] | W-DID | Witnessed party's DID |

## BIP-32 Derivation

In the [[openvtc-cli|OpenVTC]] implementation, all these DIDs derive from a single seed via [[bip32-key-derivation|BIP-32 derivation]]:

| Path | DID Type |
|------|----------|
| `m/1'/0'/` | Persona keys (P-DID) |
| `m/2'/1'/` | WebVH management keys |
| `m/3'/1'/1'/N` | Relationship keys (R-DIDs, one per relationship) |

See also: [[decentralized-identifiers]], [[decentralized-trust-graph]], [[bip32-key-derivation]]
