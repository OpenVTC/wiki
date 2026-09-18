---
title: "Personhood Credential (PHC)"
type: concept
tags: [credentials, dtg, personhood, sybil, governance]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Personhood Credential (PHC)

A Personhood Credential is a [[membership-credential|Membership Credential (VMC)]] issued by a [[verifiable-trust-community|VTC]] whose governance enforces two guarantees:

1. **Real human personhood** — the holder is a genuine person
2. **Exactly one membership per person** — no one can hold multiple memberships

That's it. A PHC is structurally identical to any other VMC. There are no additional schema fields. What makes a VMC a PHC is the **governance and [[trust-registries|trust registry]]** of the issuing community, not the credential itself.

Since Working Draft 02 the spec is precise about *which* VMC: the PHC is the **community-issued grant**. A grant is a PHC whether or not the member has acknowledged it — the member may present an unacknowledged grant as evidence of their own membership (the presentation is itself their participation), and the acknowledgement gates only the community's ability to assert that membership to others. "Exactly one membership per person" is counted over grants and enforced by governance. See [[membership-credential]] for the pair.

## The Key Design Choice

The DTG specification (v1.0 WD02 — and WD01 and v0.3 before it) is emphatic about this: PHC status is "determined by governance and trust registries, not by credential structure." Issuers may optionally add `"PersonhoodCredential"` to the W3C type array as a **non-authoritative hint**, but this is not what makes it a PHC. The trust registry is the authoritative source.

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

WD02 adds a third threat now that the graph has [[delegation-credential|delegation]]: **personhood laundering**. Because a delegate's acts are attributed to the delegator, a verifier that cannot distinguish the two may credit an AI agent with its principal's personhood — or count several agents of one person as several people. Verifiers must treat an act under a VDC as the delegate acting in the delegator's name, never as the delegator in person, and communities whose governance rests on personhood should state whether delegated acts are recognised at all. An agent acting under an attenuated [[authority-credential|VAC]] is credited with nothing a PHC attests about its principal.

## How Personhood Is Verified

The exact mechanism is a policy question for each community. Options include:

- In-person verification at events
- Video call verification
- Existing identity document verification via an Identity Verification Provider (IDVP)
- Web of trust thresholds (e.g., N existing members vouch for you)

In the ecosystem the current shape is a **personhood ceremony over Trust Tasks**: [[openvtc|OpenVTC]] #257 runs it with a spoken 8-character Crockford match code, the [[verifiable-trust-infrastructure|VTI]] carries personhood over messaging with in-person vetting as evidence (#1085/#1086), and OpenVTC's [[peer-identity-vetting]] design names community vetters by a revocable role VEC. On the spec's `main` branch such evidence is exactly what a [[statement-credential|statement credential]] is for — an `isHuman`-style statement is weighed by the community when deciding whether a membership qualifies as a PHC; it never establishes personhood by itself.

## Lending Personhood to Relationship Proofs

A PHC's value extends beyond the membership edge itself: it can be carried forward into ZKP proofs of [[relationship-credential|VRCs]]. When two members of a PHC-issuing community have a VRC between them, the holder can construct a community-anchored ZKP showing:

1. Possession of the VRC
2. Possession of a VMC from the community
3. That the VRC counterparty also holds a VMC from the *same* community

Because that community's VMCs are PHCs, the resulting proof carries personhood assurance for both parties without revealing their underlying identifiers. This is one proof construction available to relationships inside a shared PHC-issuing community — not a universal requirement for VRCs, which can also exist directly between individuals outside any community context. WD02 notes that step 3 currently proves the community *attested* the counterparty's membership, not that the counterparty acknowledged it, and that under `pairwise` [[correlation-scope|scopes]] the proof must also establish common control of two identifiers — see [[zero-knowledge-proofs]].

See also: [[membership-credential]], [[trust-registries]], [[decentralized-trust-graph]], [[dtg-credentials-overview]], [[delegation-credential]], [[peer-identity-vetting]]
