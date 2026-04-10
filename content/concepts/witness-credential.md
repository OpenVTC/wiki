---
title: "Witness Credential (VWC)"
type: concept
tags: [credentials, dtg, witness, attestation]
date-updated: 2026-04-09
sources: [dtg-credentials]
---

# Witness Credential (VWC)

A Verifiable Witness Credential is a third-party attestation that adds credibility to claims in the [[decentralized-trust-graph|Decentralized Trust Graph]]. A witness says "I observed that this relationship/event/interaction is genuine."

## What Makes Witnesses Powerful

Two-party claims (like [[relationship-credential|VRCs]]) are only as trustworthy as the two parties involved. A witness adds an independent third-party perspective. This is especially valuable for:

- **In-person verification** — "I met these two people at a conference and can confirm they know each other"
- **Event attestation** — "I witnessed this transaction/interaction at this event"
- **Sybil resistance** — it's hard to fake a witness who was physically present

## What It Contains

Beyond standard VC fields, a witness credential includes:
- **Verification method** — how the witness verified (e.g., "in-person-proximity", "video-call")
- **Witness context** — event name, session ID, location
- **Cryptographic digest binding** — optional hash tying the attestation to specific evidence
- **Relationship reference** — which relationship or claim is being witnessed

## Role in Trust Assessment

When traversing the trust graph, witnessed relationships carry more weight than unwitnessed ones. A relationship with an in-person witness attestation from a well-known conference is significantly stronger than a purely online claim. Communities can encode this into their [[verifiable-trust-community|trust policies]].

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[decentralized-trust-graph]]
