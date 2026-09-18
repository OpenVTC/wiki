---
title: "Delegation Credential (VDC)"
type: concept
tags: [credentials, dtg, delegation, agents, edge, spec]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials]
---

# Delegation Credential (VDC)

The Verifiable Delegation Credential attests that one entity (the **delegator**) has appointed another (the **delegate**) to act **in the delegator's name**, for a bounded set of acts, for a limited period, revocably. It is the third [[credential-categories|Edge Credential]], added in Working Draft 02 of the [[dtg-credential-spec|spec]] (PR #19, 2026-09-06), and the credential that lets the graph say "this agent may act for this person — within these bounds."

## Why it exists

The spec's glossary had assumed delegation for months — a persona is controlled by "the person it identifies (or their delegate)" — and AI agents are first-class DTG nodes. But every WD01 credential *attests* that something is true; none *establishes* that one party may stand in for another. Establishing representation needs verification steps that evaluating a claim does not: scope containment, chain resolution, invocation binding, timely revocation. A distinct type string forces a verifier onto that path.

## Delegation is not authority

The line the spec draws hardest, and the one that decides which credential to reach for:

| Question | Credential | The act is attributed to |
|---|---|---|
| May this party do this thing, *as itself*? | [[authority-credential|VAC]] | the party itself |
| May this party act *in another's name*? | **VDC** | the entity it stands in for |

Neither implies the other. A service with access to a mailbox may read it as itself; it has not been appointed to send mail in the owner's name. A delegate appointed to correspond in someone's name holds that appointment whether or not it has a mailbox — and without one, gets nowhere. Guardianship, succession and similar mandates are *not* expressed by a VDC.

**A VDC moves the permission question; it does not answer it.** When a delegate presents a VDC, the verifier does not ask what the *delegate* may do. It substitutes the delegator and asks what it would have asked of the delegator directly. Three independent checks: (1) may this party act in that name — the VDC; (2) may the *delegator* do this — membership, governance, an IDVC, a VAC, the verifier's own policy; (3) must the delegate independently qualify — a governance call. Reach is the **intersection** of (1) and (2), never the union. Nothing the delegator holds is copied to the delegate; withdrawing the delegator's own permission stops every delegate at once without revoking a single VDC.

## What it contains

- `type` includes `DelegationCredential`; `issuer` is the delegator (a person, device, agent, a VTC delegating to a service, or a persona identifier); `credentialSubject.id` is the delegate
- `delegation.scope` — the acts, as opaque strings from the governing VTC/VTN vocabulary, compared by exact equality; REQUIRED and non-empty on a grant
- `delegation.parent` — digest of the VDC this one derives from; absent means a **root delegation**
- `delegation.maxDepth` — further re-delegations permitted; absent or `0` prohibits it. **Single-hop is the default**; a value above `0` is the delegator's only way to authorise re-delegation
- `delegation.accepts` — on the acceptance only: digest of the grant being accepted
- `validUntil` REQUIRED; `credentialStatus` CONDITIONAL

## Grant plus acceptance = one edge

Like a [[membership-credential|VMC]] pair, a delegation is two credentials. The **grant** (no `accepts`) is the delegator stating the appointment; the **acceptance** (with `accepts`, issued by the delegate to the delegator, carrying no scope of its own) is the delegate taking on the appointment and the accountability of acting in another's name. **The acceptance is REQUIRED**: a grant alone establishes what the delegator appointed, not what the delegate agreed to, and a delegator cannot forge the countersignature — nor can a party holding only the delegate's key manufacture appointments. The edge is directional, and a VDC neither requires nor implies a [[relationship-credential|VRC]] between the parties.

The grant is a credential; the **invocation** — "the delegate is acting in the delegator's name, now, to do this" — is meaningful only inside its exchange and is a Trust Task artifact, per the spec's [[trust-task-context-binding|credential-or-artifact test]].

## Chains, invocation, revocation

Where a VDC carries `parent`, the verifier evaluates the whole chain: every link valid on its own; each `scope` a subset of its parent's; no `validUntil` later than the parent's; depth bounded by every ancestor's `maxDepth`; a root issued by the principal the verifier intends to deal with. Presenting a derived VDC discloses the whole ancestry, principal included — one more reason single-hop is the default and chain validity is a candidate [[zero-knowledge-proofs|ZK predicate]].

**Invocation Binding: a VDC is not a bearer token.** A verifier MUST NOT accept a party as acting in the delegator's name unless it demonstrates control of `credentialSubject.id` at the time of the request; how that is carried belongs to the Trust Task Protocols spec.

**Revocation prefers expiry.** A verifier must establish that an appointment is in force *without contacting the delegator*: either a `validUntil` short enough that expiry bounds exposure, with withdrawal by declining to re-issue, or a `credentialStatus` it can check. Status is REQUIRED only where validity exceeds the governing freshness window, because a status lookup is a live correlation surface — whoever hosts the list learns which verifier checked which credential, and when.

## Personhood laundering

A [[personhood-credential|PHC]] says its holder is one real person. Because a delegate's acts are attributed to the delegator, a verifier that cannot tell the two apart may credit an agent with its principal's personhood — or count several agents of one person as several people. Verifiers must treat an act under a VDC as *the delegate acting in the delegator's name*, never as the delegator in person, and communities whose governance rests on personhood should say whether delegated acts count at all.

## Implementation status

[[dtg-credentials]] 0.6.0 shipped `new_vdc` as little more than a type string. 0.7.0 (WD02) made it real: `DelegationGrant`, `new_delegate_vdc` (the acceptance, from the grant's wire form), `accepts()`, opt-in `redelegate`, and `delegation::verify_chain`, which returns the principal and appointed acts — deliberately not whether the act is permitted. 0.9.1 added Invocation Binding (the leaf must appoint the *presenter*); 0.10.0 (on `main`) replaced `new_delegate_vdc` with `new_delegate_vdc_for`, which refuses a grant that does not name the party answering it. `credentialStatus` is settable but never resolved. In the [[data-rooms|data-room]] example a member appoints a service by VDC alongside an agent equipped by attenuated VAC — "the same member, two credentials, and a verifier that can always tell which it was shown."

See also: [[authority-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[personhood-credential]], [[trust-task-context-binding]]
