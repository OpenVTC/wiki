---
title: "Authority Credential (VAC)"
type: concept
tags: [credentials, dtg, authority, attenuation, agents, data-rooms, spec]
date-updated: 2026-09-18
sources: [dtg-credential-spec, dtg-credentials, verifiable-trust-infrastructure]
---

# Authority Credential (VAC)

The Verifiable Authority Credential is the first DTG credential that **confers** something rather than **attests** something. Added in Working Draft 02 of the [[dtg-credential-spec|spec]] (PR #29, 2026-09-07) and hardened on `main` days later (#39, #40, #41), it answers one question: *may this party do this thing, here, as itself?*

## Why it exists

The WD01 catalogue had six credentials and none conferred permission, so implementations packed "may write" into a [[endorsement-credential|VEC]]. The spec calls that a category error: an endorsement is a statement *about* a party, which a verifier weighs for itself; an authority credential is a statement *to* a verifier — the party governing the scope has already decided. Conflating them "leaves verifiers to infer permission from adjectives."

A VAC therefore stands **outside** the functional [[credential-categories|categories]]: it neither forms a graph edge nor annotates one. It states what a party may do within a scope some node governs.

## What it contains

- `type` includes `AuthorityCredential`; `issuer` is the party governing the scope (a VTC, VTN, a shared resource or service, or a holder attenuating what it holds); `credentialSubject.id` is the party receiving authority
- `authority.scope` — the DID or URI the authority applies to; exact match unless the governing party publishes a containment rule
- `authority.actions` — permitted actions from a vocabulary the governing party defines. MUST NOT be empty (empty confers *nothing*), and no action implies another — `"admin"` does not grant `"write"` unless both are listed. The vocabulary is deliberately local: `"write"` from one governing party has no defined relation to `"write"` from another
- `authority.parent` — for an attenuated VAC, the **digest** of the VAC it was narrowed from
- `authority.maxAttenuation` *(main, #40)* — how far a chain may extend below this VAC; `0` forbids attenuation
- `validUntil` REQUIRED; `credentialStatus` CONDITIONAL *(main, #39)*

## Attenuation: equipping an agent with less than you hold

A holder MAY issue a further VAC conferring a **subset** of what they hold, without the governing party — which is what lets a person equip an AI agent with four hours of read-only access to one room instead of lending it their own standing authority. An attenuated VAC MUST set `issuer` to the parent's `credentialSubject.id` (only the party a VAC was issued to may attenuate it), carry `authority.parent` as the parent's digest, and never add an action, widen scope, or outlive its parent.

Three rules make this safe:

- **Verifiers walk the whole chain** back to a VAC issued by the governing party and reject any link that widens or whose issuer is not its parent's subject. A verifier that checks only the presented credential "has verified nothing" — anyone can mint a perfectly valid VAC naming any scope.
- **The holder presents the chain; the verifier never fetches it.** `parent` is a digest, so there is nothing to fetch: verification cannot depend on network availability, cannot be induced to hit an address of the holder's choosing, and signals nothing to whoever hosts an identifier. Because the digest excludes `proof`, re-signing a parent leaves its children intact while re-issuing it with different claims orphans them.
- **Depth is bounded at 8** as a denial-of-service bound. On `main`, `maxAttenuation` adds a *policy* limit for sensitive actions. Attenuation is otherwise permitted by default — the opposite of the [[delegation-credential|VDC]]'s opt-in re-delegation — because forbidding it does not stop a holder equipping an agent; it makes them lend their key instead.

## Not a bearer credential (`main`, #41)

WD02 shipped with an OPTIONAL `audience`, and a VAC without one was by omission a bearer token. `main` fixes this as the VDC already had: a verifier MUST NOT accept a party as holding a VAC's authority unless it **demonstrates control of the presented VAC's `credentialSubject.id`** at the time of the request. Only the leaf's subject demonstrates anything; the parties above are not in the loop, which is the point of attenuation. With that rule `audience` could only repeat the subject or be unsatisfiable, so it was **removed** — where a presentation may be *sent* is a trust-task question. The stakes exceed the VDC's: a captured presentation is a captured *chain*.

## Withdrawal (`main`, #39)

A VAC is withdrawn by expiry or by its issuer's revocation — nothing else, because nothing about the subject's current standing is consulted at verification. Expiry is primary (`validUntil` REQUIRED, kept short); `credentialStatus` covers what expiry cannot, is CONDITIONAL on the governing party's freshness window, and MUST be checked on every chain link that carries it. **Revocation cascades**: revoking a VAC withdraws everything attenuated from it, so a governing party withdraws derivations it never saw. The trade is stated plainly: a chain with no status cannot show that an ancestor was revoked, so exposure is bounded by the shortest `validUntil` in the chain.

## What a VAC is not

- **Not delegation.** A VAC authorizes acting *in one's own name*, never on behalf of another — that is the [[delegation-credential|VDC]]. The test for an agent is *whose name is the act in?* An agent that acts as itself gets an attenuated VAC; one whose acts should be attributed to its principal gets a VDC. A VDC never supplies authority; a VAC is what satisfies the permission check a VDC defers.
- **Not membership.** A VAC MUST NOT be read as evidence of membership, nor a [[membership-credential|VMC]] as evidence of authority. Where a verifier needs both in a [[zero-knowledge-proofs|ZK presentation]] with the subject withheld, the presentation MUST prove the two credentials share a subject — else two parties pool one's membership with the other's authority. On `main` a governing party MAY also require an attenuated VAC's subject to independently qualify.

## In the data room

The VAC is the permission model of [[data-rooms]]: a room is a DTG node with its own DID that admits a member by [[invitation-credential|VIC]], forms the membership edge by VMC pair, and issues **VACs for `read` / `write` / `curate` / `admin`** one level down. A member's VTA then attenuates an hours-scoped, read-only VAC for the member's agent, and the room's verifier walks the chain back to itself.

## Implementation status

[[dtg-credentials]] tracks the VAC closely: 0.6.0 (2026-09-03) added `new_vac`, `attenuate` and `authority::verify_chain` (seven rules, depth 8, bearer-side resolution, empty `actions` refused) against the then-open spec PR; 0.7.0 made `parent` a digest and `validUntil` required (WD02); 0.8.0 requires the leaf to grant to the *presenter* and removed `audience` (spec #41) — both known consumers, including `vti-rooms-dtg`, had already patched that gap by hand. Not yet implemented: `maxAttenuation` (#40) and status resolution / revocation cascade (#39); `credentialStatus` is settable since 0.9.0 but never resolved.

See also: [[delegation-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[data-rooms]], [[endorsement-credential]]
