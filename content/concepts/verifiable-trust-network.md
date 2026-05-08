---
title: "Verifiable Trust Networks (VTNs)"
type: concept
tags: [vtn, network, community, hierarchy, trust]
date-updated: 2026-04-30
sources: [dtg-credential-spec]
---

# Verifiable Trust Networks (VTNs)

## What They Are

A Verifiable Trust Network is a higher-level grouping above [[verifiable-trust-community|Verifiable Trust Communities (VTCs)]]. If a VTC is like a club or professional association, a VTN is like a federation of clubs — an umbrella organization that coordinates multiple communities under shared governance.

VTNs have their own [[decentralized-identifiers|C-DIDs]] (Community DIDs), just like VTCs. The hierarchy works like this:

```
VTN (Verifiable Trust Network)
├── VTC (Verifiable Trust Community)
│   ├── Member (person/device/agent)
│   ├── Member
│   └── ...
├── VTC
│   ├── Member
│   └── ...
└── ...
```

## How Membership Works

A VTN's relationship with each member VTC is expressed as a bi-directional pair of [[membership-credential|Membership Credentials (VMCs)]] — one issued by the VTN to the VTC, one issued by the VTC back to the VTN. This is the same credential type used for individual membership in a VTC, but the subject is a C-DID (the community's DID) rather than an M-DID (a person's DID).

This means the [[decentralized-trust-graph|Decentralized Trust Graph]] supports hierarchical community structures: a VTN contains VTCs, and VTCs contain individual members.

## Invitations

For [[invitation-credential|Invitation Credentials (VICs)]], VTNs can authorize onboarding at multiple levels:
- A VTN's C-DID can invite a VTC to join the network
- A member VTC's C-DID can invite another VTC on behalf of the network

## Why VTNs Matter

VTNs enable trust to scale beyond individual communities. If two people belong to different VTCs within the same VTN, trust paths can traverse the network structure — the VTN's governance provides a shared trust anchor. This is particularly relevant for large ecosystems like the [[first-person-network|First Person Network]], where many independent communities need to interoperate.

See also: [[verifiable-trust-community]], [[membership-credential]], [[decentralized-trust-graph]]
