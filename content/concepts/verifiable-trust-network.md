---
title: "Verifiable Trust Networks (VTNs)"
type: concept
tags: [vtn, network, community, hierarchy, trust]
date-updated: 2026-09-18
sources: [dtg-credential-spec]
---

# Verifiable Trust Networks (VTNs)

## What They Are

A Verifiable Trust Network is a higher-level grouping above [[verifiable-trust-community|Verifiable Trust Communities (VTCs)]]. If a VTC is like a club or professional association, a VTN is like a federation of clubs — an umbrella organization that coordinates multiple communities under shared governance.

VTNs have their own [[decentralized-identifiers|DIDs]], just like VTCs — necessarily declared with a `public` [[correlation-scope]] (the old "C-DID" label was retired in Working Draft 02). The hierarchy works like this:

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

A VTN's relationship with each member VTC is expressed as a bi-directional pair of [[membership-credential|Membership Credentials (VMCs)]] — a grant issued by the VTN to the VTC, and an acknowledgement issued by the VTC back to the VTN carrying a digest of the grant. This is the same credential type used for individual membership in a VTC; because both ends are communities, the issuer/subject rules cannot tell the directions apart, so the presence of `digestMultibase` is the discriminator (WD02).

This means the [[decentralized-trust-graph|Decentralized Trust Graph]] supports hierarchical community structures: a VTN contains VTCs, and VTCs contain individual members.

## Invitations

For [[invitation-credential|Invitation Credentials (VICs)]], VTNs can authorize onboarding at multiple levels:
- A VTN's C-DID can invite a VTC to join the network
- A member VTC's C-DID can invite another VTC on behalf of the network

## Why VTNs Matter

VTNs enable trust to scale beyond individual communities. If two people belong to different VTCs within the same VTN, trust paths can traverse the network structure — the VTN's governance provides a shared trust anchor. This is particularly relevant for large ecosystems like the [[first-person-network|First Person Network]], where many independent communities need to interoperate.

## Edge Verifiability: the VTN as one anchor set among many (WD02)

Working Draft 01's glossary said a VRC was "only verifiable as a DTG edge in the context of a specific VTN" if both peers used M-DIDs, both had signed the VRC, and their VTCs were VTN trust anchors. Two implementations reported that this contradicted the body and that one condition — both peers signing one credential — could not be satisfied by any credential. WD02 (spec PR #26) replaced it with a normative **Edge Verifiability** section that defines the property **relative to a verifier**: an edge credential is verifiable as a DTG edge *by a given verifier* when its proof verifies and the verifier can establish that its issuer's membership in a VTC **in the anchor set that verifier accepts** is complete — by disclosure of the VMC pair or by a community-anchored [[zero-knowledge-proofs|ZKP]]. A VTN is the *common* case of such an anchor set, but no VTN need exist, and an edge whose halves trace to VTCs in different VTNs (or none) is still an edge to any verifier whose anchor set includes both. The same credential may be an edge to one verifier and not another, and neither is wrong. This is the per-verifier phrasing the ZKP task force's reference circuits already use.

## Vocabulary

The [[dtg-credential-spec|spec]] gives the VTN its own glossary entries: a **VTN trust anchor** is a VTC that anchors a VTN; **VTN members** are VTCs; the **VTN invitation credential** is the [[invitation-credential|VIC]]'s second functional variant, issued to a prospective member VTC's identifier; and [[trust-registries|trust registries]] are where VTN anchors are discovered. The First Person Network is the canonical example of a VTN.

See also: [[verifiable-trust-community]], [[membership-credential]], [[decentralized-trust-graph]], [[invitation-credential]]
