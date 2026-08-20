---
title: "DID Types in the DTG"
type: concept
tags: [did, taxonomy, identity, dtg]
date-updated: 2026-08-19
sources: [dtg-credential-spec, openvtc]
---

# DID Types in the DTG

The [[decentralized-trust-graph|Decentralized Trust Graph]] uses a taxonomy of [[decentralized-identifiers|DID]] types, each serving a specific role. Understanding these types is key to understanding how identity and privacy work in the ecosystem.

Since Working Draft 01 of the [[dtg-credential-spec|spec]] (July 2026) the official list is **four**: the earlier **W-DID** (Witness DID) was dropped — a witness acts under an M-DID or as a VTA applying community policy. The spec frames these as *DTG verifiable identifiers (VIDs)*: this version uses DIDs exclusively, but future versions may admit other ToIP VIDs such as X.509 or KERI AIDs. Every DTG node is identified by at least one DTG VID and reached through a [[vta-topology|VTA]].

## The Taxonomy

| DID Type | Full Name | Who/What It Identifies | Typical DID Method |
|----------|-----------|----------------------|-------------------|
| **C-DID** | Community DID | A [[verifiable-trust-community\|VTC]] or [[verifiable-trust-network\|VTN]] | [[did-webvh\|did:webvh]] |
| **M-DID** | Member DID | An individual member within a community | [[did-webvh\|did:webvh]] |
| **R-DID** | Relationship DID | A specific relationship between two individuals | did:peer |
| **P-DID** | Persona DID | A persona identity linked to a relationship | [[did-webvh\|did:webvh]] |

## Privacy Through DID Separation

The separation of DID types is a deliberate privacy design. The spec requires that **each entity MUST generate a new, unique R-DID for every single entity they connect with**, even within the same community. This means:

- Your M-DID identifies you within a community but isn't exposed in individual relationships
- Each R-DID is unique to one relationship, so counterparties can't correlate your connections
- P-DIDs let you selectively reveal personal information to specific relationships
- Witnesses attest under an existing identity — an M-DID, or a VTA acting under community policy — rather than a dedicated type

## How They Map to Credentials

| Credential | Issuer DID | Subject DID |
|-----------|-----------|------------|
| [[membership-credential\|VMC]] | C-DID (community) | M-DID (member) or C-DID (for VTN→VTC) |
| [[relationship-credential\|VRC]] | R-DID or M-DID | R-DID or M-DID (counterparty) |
| [[invitation-credential\|VIC]] | C-DID or authorized M-DID | Invitee's DID |
| [[persona-credential\|VPC]] | P-DID | Counterparty's DID |
| [[endorsement-credential\|VEC]] | Endorser's DID | Endorsee's DID |
| [[witness-credential\|VWC]] | M-DID, or the DID of a VTA acting under VTC policy | Issuer of the attested VRC (the observed party) |

## BIP-32 Derivation

In the [[openvtc|OpenVTC]] implementation, all these DIDs derive from a single seed via [[bip32-key-derivation|BIP-32 derivation]]:

| Path | DID Type |
|------|----------|
| `m/1'/0'/` | Persona keys (P-DID) |
| `m/2'/1'/` | WebVH management keys |
| `m/3'/1'/1'/N` | Relationship keys (R-DIDs, one per relationship) |

See also: [[decentralized-identifiers]], [[decentralized-trust-graph]], [[bip32-key-derivation]]
