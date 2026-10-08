---
title: "rp-sdk-js — Relying Party SDK for VTA logins"
type: entity
tags: [relying-party, sdk, siopv2, login, javascript, security, secondary, eucalyptus]
date-updated: 2026-10-07
repo: https://github.com/OpenVTC/rp-sdk-js
---

# rp-sdk-js — `@openvtc/rp-sdk`

*Repo: [github.com/OpenVTC/rp-sdk-js](https://github.com/OpenVTC/rp-sdk-js)*

A server-side, framework-agnostic TypeScript SDK for **relying parties** (websites) that accept logins from the [[vta-browser-plugin|VTA Wallet browser plugin]]. It exists because the plugin's demo relying party originally accepted whatever `id_token` the wallet POSTed — and production sites copy-pasting the demo inherited the gap. The May 2026 cross-system auth security review (recorded in the [[verifiable-trust-infrastructure|VTI]]'s `auth-architecture` design note) flagged this as finding **H2**; `@openvtc/rp-sdk` is the fix, and the RP-side counterpart of that consolidation. Runtime dependencies are only `@noble/curves`, `@noble/hashes`, `@scure/base`.

## What It Verifies

`verifyIdToken({ idToken, audience, nonce, resolver })` pins `alg` to EdDSA, enforces the SIOPv2 rule `iss === sub`, requires an exact `aud` (the RP's DID), does a constant-time nonce match, checks `iat`/`exp` within a skew window, resolves the issuer DID and verifies the JWS against its Ed25519 authentication key — with a typed `IdTokenVerificationError.reason`. A bundled `KeyResolver` handles `did:key` in-process; a `DidResolver` interface covers did:peer:2 / did:webvh / did:web (e.g. by wrapping the TDK's resolver cache SDK). `establishSession` returns an HttpOnly / Secure / SameSite=Strict cookie descriptor.

Since #4 (2026-07-06) the RP side of the `confirm/{request,response}/0.1` Trust-Task consent protocol — build/sign a confirm request, verify the holder's response (`eddsa-jcs-2022` Data Integrity proof, `subject === issuer === signer`, challenge echo) — plus `jcsCanonicalize` (RFC 8785) with a cross-implementation fixture signed by pnm-core. Since #6 (2026-09-12) that verifier is hardened: passing `audience` now *requires* a matching `recipient`, `expiresAt` and an optional `maxAgeSecs` over `issuedAt` are enforced after the proof verifies, the challenge echo is compared in constant time, and canonicalization is bounded (`JCS_MAX_DEPTH` 100 / `JCS_MAX_BYTES` 1 MiB) so an attacker-shaped document surfaces as a typed `document_too_complex` rather than a stack overflow in the RP's request handler.

## Where It Fits

The picture shifted under this SDK during Eucalyptus. Of the wallet's three sign-in shapes, the **VTA-proxied** path (`proxyLogin` → `vault/proxy-login`) still yields the SIOPv2 `id_token` this SDK verifies, and the Trust-Task consent path yields a `confirm/response`. But the wallet's plain **`login`** no longer mints an `id_token` at all: since plugin #284 (2026-09-28) it signs in with `auth/challenge` → `auth/authenticate/0.2` as [[trust-tasks|Trust Tasks]] posted to the RP's `{baseUrl}/trust-tasks`, optionally binding a page-held session key — and **nothing in this repo verifies that document yet**. Note also that since `VTI-Dogwood` the wallet signs in as a **per-site persona** — a vault-held, VTA-minted DID (typically did:webvh) rather than the wallet's did:key holder — so a production RP needs a custom `DidResolver`, not just the bundled `KeyResolver`. Two relying parties inside the ecosystem chose not to use this SDK: [[affinidi-webvh-service|did-hosting-service]]'s login demo verifies in Rust inside its control plane, and the [[vtafarm-api|VTA Farm API]] (0.5.0, 2026-09-18) wrote its own Go SIOPv2 verifier, with did:webvh history and key rotation, for its linked-wallet login. rp-sdk is for *third-party* RPs outside the VTI stack.

## Versions at the coordinated releases

| Cypress | VTI-Dogwood | VTI-Dogwood-R1 | **VTI-Eucalyptus (2026-10-07)** |
|---------|-------------|----------------|------------------|
| 0.2.0 | 0.2.0 | 0.2.0 (same commit) | **0.2.0** (tag at 8594c2a, the #6 merge of 09-12; unreleased changes) |

## Recent Development

- **Eucalyptus (2026-09-18 → 10-07): no commits.** `VTI-Eucalyptus` was applied on 10-07 to 8594c2a — the same #6 merge the repo has sat on since 09-12 — so the SDK joined the fifth coordinated release unchanged ([[coordinated-releases]]). npm still carries **0.2.0 (06-07)**; the confirm protocol (#4) and its hardening (#6) remain under "Unreleased". The consequential change happened *next door*: the wallet's SIOPv2 `login` was replaced by the `auth/authenticate/0.2` Trust-Task sign-in (plugin #284), which leaves `verifyIdToken` serving the proxy-login path and leaves the new sign-in without an RP-side verifier in this package.
- **Dogwood and after (2026-08-30 → 09-12; #5, #6)** — `VTI-Dogwood` and `-R1` tag #5 (08-30), a dev-dependency refresh. Then **#6 (09-12), part of the cross-repo `sec-4045` egress/input-hardening review** that also touched [[vti-didcomm-js]] and the browser plugin: four fixes to `verifyConfirmResponse` (bounded JCS, mandatory audience binding when `audience` is passed, expiry / max-age checks, constant-time challenge compare). All additive for existing callers except that a caller passing `audience` against a response with no `recipient` now fails, which is the point. 55 tests.
- 0.1.0 (2026-05-24), 0.1.1 (05-28, metadata), **0.2.0 (06-07)** — dependency advisories, noble v2, removed a phantom `./express` export. #4 (07-06) added the confirm protocol.
- Roadmap: a 0.3.0 release carrying the confirm protocol; a verifier for the `auth/authenticate/0.2` response and its session-key binding; `requireStepUp()` (acr = aal2), `refreshProxy()`, Express / Fastify / Hono adapters, DIDComm packing helpers.

See also: [[vta-browser-plugin]], [[vti-didcomm-js]], [[vtafarm-api]], [[verifiable-trust-agent]], [[trust-tasks]], [[coordinated-releases]]
