---
title: "Personhood Credential (PHC)"
type: concept
tags: [credentials, dtg, personhood, sybil, governance]
date-updated: 2026-04-30
sources: [dtg-credential-spec, dtg-credentials, openvtc]
---

# Personhood Credential (PHC)

A Personhood Credential is a [[membership-credential|Membership Credential (VMC)]] issued by a [[verifiable-trust-community|VTC]] whose governance enforces two guarantees:

1. **Real human personhood** — the holder is a genuine person
2. **Exactly one membership per person** — no one can hold multiple memberships

That's it. A PHC is structurally identical to any other VMC. There are no additional schema fields. What makes a VMC a PHC is the **governance and [[trust-registries|trust registry]]** of the issuing community, not the credential itself.

## The Key Design Choice

The DTG specification (v0.3) is emphatic about this: PHC status is "determined by governance and trust registries, not by credential structure." Issuers may optionally add `"PersonhoodCredential"` to the W3C type array as a **non-authoritative hint**, but this is not what makes it a PHC. The trust registry is the authoritative source.

This means the same credential format works across communities with very different personhood verification standards. One community might require in-person verification; another might accept video calls; a third might use web-of-trust thresholds. The credential structure is the same — the governance differs.

In the [[dtg-credentials|dtg-credentials]] Rust library, the optional type hint looks like:

```json
{
  "type": ["VerifiableCredential", "DTGCredential", "MembershipCredential", "PersonhoodCredential"]
}
```

## Why It Exists

Without personhood enforcement, the [[decentralized-trust-graph|trust graph]] is vulnerable to two related threats:

- **Sybil attacks** — one person creating many fake identities to inflate their apparent trustworthiness
- **AI agent impersonation** — an AI system participating as if it were a real person, accumulating credentials and relationships that carry a false implication of human judgment behind them

PHCs are the defense at the community level: the community's governance ensures each membership belongs to a verified, unique human.

## How Personhood Is Verified

The exact mechanism is a policy question for each community. Options include:

- In-person verification at events
- Video call verification
- Existing identity document verification via an Identity Verification Provider (IDVP)
- Web of trust thresholds (e.g., N existing members vouch for you)

## Lending Personhood to Relationship Proofs

A PHC's value extends beyond the membership edge itself: it can be carried forward into ZKP proofs of [[relationship-credential|VRCs]]. When two members of a PHC-issuing community have a VRC between them, the holder can construct a community-anchored ZKP showing:

1. Possession of the VRC
2. Possession of a VMC from the community
3. That the VRC counterparty also holds a VMC from the *same* community

Because that community's VMCs are PHCs, the resulting proof carries personhood assurance for both parties without revealing their underlying DIDs. This is one proof construction available to relationships inside a shared PHC-issuing community — not a universal requirement for VRCs, which can also exist directly between individuals outside any community context.

See also: [[membership-credential]], [[trust-registries]], [[decentralized-trust-graph]], [[dtg-credentials-overview]]
