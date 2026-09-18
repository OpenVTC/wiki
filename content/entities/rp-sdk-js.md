---
title: "rp-sdk-js — Relying Party SDK for VTA logins"
type: entity
tags: [relying-party, sdk, siopv2, login, javascript, security, secondary]
date-updated: 2026-09-18
repo: https://github.com/OpenVTC/rp-sdk-js
---

# rp-sdk-js — `@openvtc/rp-sdk`

*Repo: [github.com/OpenVTC/rp-sdk-js](https://github.com/OpenVTC/rp-sdk-js)*

A server-side, framework-agnostic TypeScript SDK for **relying parties** (websites) that accept logins from the [[vta-browser-plugin|VTA Wallet browser plugin]] (`window.vtaWallet.login`). It exists because the plugin's demo relying party originally accepted whatever `id_token` the wallet POSTed — and production sites copy-pasting the demo inherited the gap. The May 2026 cross-system auth security review (recorded in the [[verifiable-trust-infrastructure|VTI]]'s `auth-architecture` design note) flagged this as finding **H2**; `@openvtc/rp-sdk` is the fix, and the RP-side counterpart of that consolidation. Runtime dependencies are only `@noble/curves`, `@noble/hashes`, `@scure/base`.

## What It Verifies

`verifyIdToken({ idToken, audience, nonce, resolver })` pins `alg` to EdDSA, enforces the SIOPv2 rule `iss === sub`, requires an exact `aud` (the RP's DID), does a constant-time nonce match, checks `iat`/`exp` within a skew window, resolves the issuer DID and verifies the JWS against its Ed25519 authentication key — with a typed `IdTokenVerificationError.reason`. A bundled `KeyResolver` handles `did:key` in-process; a `DidResolver` interface covers did:peer:2 / did:webvh / did:web (e.g. by wrapping the TDK's resolver cache SDK). `establishSession` returns an HttpOnly / Secure / SameSite=Strict cookie descriptor.

Since #4 (2026-07-06) the RP side of the `confirm/{request,response}/0.1` Trust-Task consent protocol — build/sign a confirm request, verify the holder's response (`eddsa-jcs-2022` Data Integrity proof, `subject === issuer === signer`, challenge echo) — plus `jcsCanonicalize` (RFC 8785) with a cross-implementation fixture signed by pnm-core. Since #6 (2026-09-12) that verifier is hardened: passing `audience` now *requires* a matching `recipient` (a response bound to no RP could be re-presented to another), `expiresAt` and an optional `maxAgeSecs` over `issuedAt` are enforced after the proof verifies, the challenge echo is compared in constant time, and canonicalization is bounded (`JCS_MAX_DEPTH` 100 / `JCS_MAX_BYTES` 1 MiB) so an attacker-shaped document surfaces as a typed `document_too_complex` rather than a stack overflow in the RP's request handler.

## Where It Fits

All three wallet login shapes produce something this SDK verifies by resolving a DID: the **self-issued** SIOPv2 path and the **VTA-proxied** path (`vault/proxy-login`) both yield the same `id_token`, and the Trust-Task consent path yields a `confirm/response`. Note that since `VTI-Dogwood` the wallet signs in as a **per-site persona** by default — a vault-held, VTA-minted DID (typically did:webvh) rather than the wallet's did:key holder — so a production RP needs a custom `DidResolver`, not just the bundled `KeyResolver`. [[affinidi-webvh-service|did-hosting-service]]'s own login demo does this verification in Rust inside its control plane; rp-sdk is for *third-party* RPs outside the VTI stack.

## Versions at the coordinated releases

| Cypress | VTI-Dogwood | VTI-Dogwood-R1 | main (2026-09-18) |
|---------|-------------|----------------|-------------------|
| 0.2.0 | 0.2.0 | 0.2.0 (same commit) | 0.2.0 (unreleased changes) |

## Recent Development

- **Dogwood and after (2026-08-30 → 09-12; #5, #6)** — two commits, one of them consequential. `VTI-Dogwood` and `-R1` tag #5 (08-30), a dev-dependency refresh (nanoid, postcss); Dogwood-RC-1 pointed at the same commit as Cypress. Then **#6 (09-12), part of the cross-repo `sec-4045` egress/input-hardening review** that also touched [[vti-didcomm-js]] and the browser plugin: four fixes to `verifyConfirmResponse` (bounded JCS, mandatory audience binding when `audience` is passed, expiry / max-age checks, constant-time challenge compare — see above). All additive for existing callers except that a caller passing `audience` against a response with no `recipient` now fails, which is the point. 55 tests. **Nothing since 0.2.0 has been published to npm**: the confirm protocol (#4) and its hardening (#6) both sit under "Unreleased" in the CHANGELOG.
- 0.1.0 (2026-05-24), 0.1.1 (05-28, metadata), **0.2.0 (06-07)** — dependency advisories, noble v2, removed a phantom `./express` export. #4 (07-06) added the confirm protocol.
- Roadmap: a 0.3.0 release carrying the confirm protocol; `requireStepUp()` (acr = aal2), `refreshProxy()`, Express / Fastify / Hono adapters, DIDComm packing helpers. `VTI-Eucalyptus-RC-0` (2026-09-17) is not yet tagged here.

See also: [[vta-browser-plugin]], [[vti-didcomm-js]], [[verifiable-trust-agent]], [[coordinated-releases]]
