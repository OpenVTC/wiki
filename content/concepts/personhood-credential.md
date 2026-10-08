---
title: "Personhood Credential (PHC)"
type: concept
tags: [credentials, dtg, personhood, sybil, governance, vetting]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, openvtc, verifiable-trust-infrastructure]
---

# Personhood Credential (PHC)

A Personhood Credential is a [[membership-credential|Membership Credential (VMC)]] issued by a [[verifiable-trust-community|VTC]] whose governance enforces two guarantees:

1. **Real human personhood** — the holder is a genuine person
2. **Exactly one membership per person** — no one can hold multiple memberships

That's it. A PHC is structurally identical to any other VMC. There are no additional schema fields. What makes a VMC a PHC is the **governance and [[trust-registries|trust registry]]** of the issuing community, not the credential itself.

Since Working Draft 02 the spec is precise about *which* VMC: the PHC is the **community-issued grant**. A grant is a PHC whether or not the member has acknowledged it — the member may present an unacknowledged grant as evidence of their own membership (the presentation is itself their participation), and the acknowledgement gates only the community's ability to assert that membership to others. "Exactly one membership per person" is counted over grants and enforced by governance. See [[membership-credential]] for the pair.

## The Key Design Choice

The DTG specification (Working Draft 0.6.0 — and every draft before it) is emphatic about this: PHC status is "determined by governance and trust registries, not by credential structure." Issuers may optionally add `"PersonhoodCredential"` to the W3C type array as a **non-authoritative hint**, but this is not what makes it a PHC. The trust registry is the authoritative source. The hint is the one case where a DTG credential may carry a second subtype-looking string: [[dtg-credentials]] 0.12 accepts `PersonhoodCredential` only beside `MembershipCredential`.

This means the same credential format works across communities with very different personhood verification standards. One community might require in-person verification; another might accept video calls; a third might use web-of-trust thresholds. The credential structure is the same — the governance differs. A VTC publishes what its governance requires on its unauthenticated public profile (`personhood.realHuman`, `singleMembership`, `acceptedIdvps`, `governanceFrameworkUrl`).

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

WD02 adds a third threat now that the graph has [[delegation-credential|delegation]]: **personhood laundering**. Because a delegate's acts are attributed to the delegator, a verifier that cannot distinguish the two may credit an AI agent with its principal's personhood — or count several agents of one person as several people. Verifiers must treat an act under a VDC as the delegate acting in the delegator's name, never as the delegator in person, and communities whose governance rests on personhood should state whether delegated acts are recognized at all. An agent acting under an attenuated [[authority-credential|VAC]] is credited with nothing a PHC attests about its principal.

## How Personhood Is Verified

The exact mechanism is a policy question for each community. Options include:

- In-person verification at events
- Video call verification
- Existing identity document verification via an Identity Verification Provider (IDVP)
- Web of trust thresholds (e.g., N existing members vouch for you)

The spec's model for all of these is the [[statement-credential|statement]]: evidence a community weighs when deciding whether a membership qualifies as a PHC, which never establishes personhood by itself — the type-level bound says a VSC MUST NOT be treated as conferring "a governed status such as personhood." In the ecosystem the evidence now has two concrete shapes, both `StatementCredential`s under registry predicates since VTI #1859 and OpenVTC #397/#408 (Eucalyptus):

- **`witnessed/1`** — a witness statement from a personhood ceremony or witnessed exchange, with the witnessed credential's digest at `object.digestMultibase`. [[openvtc|OpenVTC]] #257 runs the ceremony over Trust Tasks with a spoken 8-character Crockford match code; the [[verifiable-trust-infrastructure|VTI]] carries personhood over messaging with in-person vetting as evidence (#1085/#1086).
- **`vetted/1`** — a record of an identity check. Two issuers count: an eligible **member vetter**, whose statements the community counts toward admission ([[peer-identity-vetting]]; vetters are now named by a `role:vetter` [[authority-credential|VAC]], not an endorsement), and **the community itself**, recording its own identity check — an administrator meets the person, satisfies themselves that the DID presented is theirs, and the community issues a `vetted/1` statement about the member under its own DID, with `object.value.community` naming the community and `taskContext`/`taskDigestMultibase` citing the issue request. The VTC's default personhood policy accepts that statement as a second evidence shape, presented by the member over a single-use challenge; the issuer comparison is what tells the community's own check from a vetter's. (An earlier Eucalyptus build issued this check as a plain `IdentityVerificationCredential`; it no longer does, and custom policies written against it match nothing.) OpenVTC #408 keeps the community's own `vetted/1` as `CredentialKind::CommunityVetting` and **offers it as personhood evidence** like any stored membership credential — it does not activate a membership, and a vetter's `vetted/1`, or one about another community, is of no known kind to the client.

Every identity check in the graph therefore has one shape, whoever made it, and a verifier accepts it only because its governance configured the predicate.

## Lending Personhood to Relationship Proofs

A PHC's value extends beyond the membership edge itself: it can be carried forward into ZKP proofs of [[relationship-credential|VRCs]]. When two members of a PHC-issuing community have a VRC between them, the holder can construct a community-anchored ZKP showing:

1. Possession of the VRC
2. Possession of a VMC from the community
3. That the VRC counterparty also holds a VMC from the *same* community

Because that community's VMCs are PHCs, the resulting proof carries personhood assurance for both parties without revealing their underlying identifiers. This is one proof construction available to relationships inside a shared PHC-issuing community — not a universal requirement for VRCs, which can also exist directly between individuals outside any community context. The spec notes that step 3 currently proves the community *attested* the counterparty's membership, not that the counterparty acknowledged it, and that under `pairwise` [[correlation-scope|scopes]] the proof must also establish common control of two identifiers — see [[zero-knowledge-proofs]], which also covers the **Predicate Credential System**, the zero-knowledge threshold-vouching scheme OpenVTC's hidden vetting uses to count distinct vetters without naming them.

See also: [[membership-credential]], [[trust-registries]], [[decentralized-trust-graph]], [[dtg-credentials-overview]], [[delegation-credential]], [[peer-identity-vetting]], [[statement-credential]]
