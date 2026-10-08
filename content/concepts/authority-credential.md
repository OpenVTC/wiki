---
title: "Authority Credential (VAC)"
type: concept
tags: [credentials, dtg, authority, attenuation, agents, data-rooms, roles, spec]
date-updated: 2026-10-07
sources: [dtg-credential-spec, dtg-credentials, verifiable-trust-infrastructure, openvtc]
---

# Authority Credential (VAC)

The Verifiable Authority Credential is the first DTG credential that **confers** something rather than **attests** something. Added in Working Draft 02 of the [[dtg-credential-spec|spec]] (PR #29, 2026-09-07) and hardened in the drafts that followed (#39, #40, #41, now part of Working Draft 0.6.0), it answers one question: *may this party do this thing, here, as itself?* Since the Eucalyptus release it is also how a [[verifiable-trust-community|VTC]] says what role a member holds.

## Why it exists

The WD01 catalog had six credentials and none conferred permission, so implementations packed "may write" — and "is a vetter" — into an [[endorsement-credential|endorsement]]. The spec calls that a category error: an endorsement is a statement *about* a party, which a verifier weighs for itself; an authority credential is a statement *to* a verifier — the party governing the scope has already decided. Conflating them "leaves verifiers to infer permission from adjectives."

A VAC therefore does none of the things the other credentials do to the graph: it neither forms an edge, nor attaches a claim to a node, nor bootstraps a node into a community. It states what a party may do within a scope some node governs.

## What it contains

- `type` includes `AuthorityCredential`; `issuer` is the party governing the scope (a VTC, VTN, a shared resource or service, or a holder attenuating what it holds); `credentialSubject.id` is the party receiving authority
- `issuerScope` — REQUIRED ([[correlation-scope]]): `public` where the issuer is the governing party, the holder's own declaration on an attenuated VAC
- `authority.scope` — the DID or URI the authority applies to; exact match unless the governing party publishes a containment rule
- `authority.actions` — permitted actions from a vocabulary the governing party defines. MUST NOT be empty (empty confers *nothing*), and no action implies another — `"admin"` does not grant `"write"` unless both are listed. The vocabulary is deliberately local: `"write"` from one governing party has no defined relation to `"write"` from another
- `authority.parent` — for an attenuated VAC, the **digest** of the VAC it was narrowed from
- `authority.maxAttenuation` — how far a chain may extend below this VAC; `0` forbids attenuation
- `validUntil` REQUIRED; `credentialStatus` CONDITIONAL on the governing party's freshness window

## Attenuation: equipping an agent with less than you hold

A holder MAY issue a further VAC conferring a **subset** of what they hold, without the governing party — which is what lets a person equip an AI agent with four hours of read-only access to one room instead of lending it their own standing authority. An attenuated VAC MUST set `issuer` to the parent's `credentialSubject.id` (only the party a VAC was issued to may attenuate it), carry `authority.parent` as the parent's digest, and never add an action, widen scope, outlive its parent, or raise `maxAttenuation` above one less than its parent's.

Three rules make this safe:

- **Verifiers walk the whole chain** back to a VAC issued by the governing party and reject any link that widens, whose issuer is not its parent's subject, or that lies further below an ancestor than that ancestor's `maxAttenuation` permits. A verifier that checks only the presented credential "has verified nothing" — anyone can mint a perfectly valid VAC naming any scope.
- **The holder presents the chain; the verifier never fetches it.** `parent` is a digest, so there is nothing to fetch: verification cannot depend on network availability, cannot be induced to hit an address of the holder's choosing, and signals nothing to whoever hosts an identifier. Because the digest excludes `proof`, re-signing a parent leaves its children intact while re-issuing it with different claims orphans them.
- **Depth is bounded at 8** as a denial-of-service bound; `maxAttenuation` is a separate *policy* limit, and a chain must satisfy both. Attenuation is otherwise permitted by default — the opposite of the [[delegation-credential|VDC]]'s opt-in re-delegation — because forbidding it does not stop a holder equipping an agent; it makes them lend their key instead.

## Not a bearer credential

WD02 shipped with an OPTIONAL `audience`, and a VAC without one was by omission a bearer token. The current draft fixes this as the VDC already had: a verifier MUST NOT accept a party as holding a VAC's authority unless it **demonstrates control of the presented VAC's `credentialSubject.id`** at the time of the request. Only the leaf's subject demonstrates anything; the parties above are not in the loop, which is the point of attenuation. With that rule `audience` could only repeat the subject or be unsatisfiable, so it was **removed** — where a presentation may be *sent* is a trust-task question. The stakes exceed the VDC's: a captured presentation is a captured *chain*.

## Withdrawal

A VAC is withdrawn by expiry or by its issuer's revocation — nothing else, because nothing about the subject's current standing is consulted at verification. Expiry is primary (`validUntil` REQUIRED, kept short); `credentialStatus` covers what expiry cannot, is CONDITIONAL on the governing party's freshness window, and MUST be checked on every chain link that carries it. **Revocation cascades**: revoking a VAC withdraws everything attenuated from it, so a governing party withdraws derivations it never saw. The trade is stated plainly: a chain with no status cannot show that an ancestor was revoked, so exposure is bounded by the shortest `validUntil` in the chain.

## What a VAC is not

- **Not delegation.** A VAC authorizes acting *in one's own name*, never on behalf of another — that is the [[delegation-credential|VDC]]. The test for an agent is *whose name is the act in?* An agent that acts as itself gets an attenuated VAC; one whose acts should be attributed to its principal gets a VDC. A VDC never supplies authority; a VAC is what satisfies the permission check a VDC defers.
- **Not membership.** A VAC MUST NOT be read as evidence of membership, nor a [[membership-credential|VMC]] as evidence of authority. Where a verifier needs both in a [[zero-knowledge-proofs|ZK presentation]] with the subject withheld, the presentation MUST prove the two credentials share a subject — else two parties pool one's membership with the other's authority. A governing party MAY also require an attenuated VAC's subject to independently qualify.
- **Not a statement.** The reverse of the first point above: a `role:vetter` action in a VAC is a decision the community has made; a "vetter" string in an endorsement would be reputation a verifier had to interpret.

## Role VACs in the VTC (Eucalyptus)

Until September 2026 the [[verifiable-trust-infrastructure|VTI]] and [[openvtc|OpenVTC]] named community roles — including the vetters of [[peer-identity-vetting]] — with a revocable `CommunityRole` endorsement. VTI #1859 (2026-09-30) and OpenVTC #397 (2026-10-01) replaced that with **role VACs**, exactly the correction the spec asked for. On admission the community issues the member two credentials, a VMC and a role `AuthorityCredential` with `issuerScope: public`, `authority.scope` the community's DID, `authority.actions: ["role:<role>"]` and `maxAttenuation: 0` — a role is not something a member passes on. The action is `role:` plus the ACL role's wire name (`role:admin`, `role:moderator`, `role:issuer`, `role:member`, `role:custom:<name>`), so a recognizing community maps it back exactly; the vetter grant is the bare `role:vetter` the vetting specifications name. Both credentials are **delivered as separate `credential-exchange/issue/0.1` Trust Tasks**, in either order, retried for up to 24 hours — a client that waits only for the answer to its join submit ends the join with no credentials — and re-minted on role change, renewal and DID rotation. A cross-community recognition policy now reads `input.foreign_vac` where it read `foreign_vec`; the `VerdictWith` member is `roleVac`. OpenVTC's `CredentialKind::Role` classifies conformant role VACs, shows the roles a credential confers, and sets aside pre-v1 role endorsements on load until the community re-issues them (press `R`, `vtc/members/renew/0.1`, #398). In the VTA rooms surfaces a room's root VAC is `public` and every attenuation a member issues to a presentation leaf is `directed`.

## In the data room

The VAC is the permission model of [[data-rooms]]: a room is a DTG node with its own DID that admits a member by [[invitation-credential|VIC]], forms the membership edge by VMC pair, and issues **VACs for `read` / `write` / `curate` / `admin`** one level down. A member's VTA then attenuates an hours-scoped, read-only VAC for the member's agent, and the room's verifier walks the chain back to itself.

## Implementation status

[[dtg-credentials]] tracks the VAC closely: 0.6.0 (2026-09-03) added `new_vac`, `attenuate` and `authority::verify_chain` (depth 8, bearer-side resolution, empty `actions` refused); 0.7.0 made `parent` a digest and `validUntil` required; 0.8.0 requires the leaf to grant to the *presenter* and removed `audience`; **0.12.0** (2026-09-30) adds `issuerScope` to every constructor, implements `maxAttenuation` end to end (`with_max_attenuation`, enforced per link and per ancestor in `verify_chain`; before this a spec-conformant VAC carrying it did not parse at all), and adds `new_community_role_vac(community, member, role, from, until)` plus `role_action` / `ROLE_ACTION_PREFIX`, the replacement for role endorsements. Still not implemented: status resolution and the revocation cascade — `credentialStatus` is settable since 0.9.0 but never resolved by the crate; the VTC resolves status through its own bitstring lists.

See also: [[delegation-credential]], [[credential-categories]], [[dtg-credentials-overview]], [[data-rooms]], [[endorsement-credential]], [[peer-identity-vetting]]
