---
title: "rp-sdk-js — Relying Party SDK for VTA logins"
type: entity
tags: [relying-party, sdk, siopv2, login, javascript, secondary]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/rp-sdk-js
---

# rp-sdk-js — `@openvtc/rp-sdk`

*Repo: [github.com/OpenVTC/rp-sdk-js](https://github.com/OpenVTC/rp-sdk-js)*

A server-side, framework-agnostic TypeScript SDK for **relying parties** (websites) that accept logins from the [[vta-browser-plugin|VTA Wallet browser plugin]] (`window.vtaWallet.login`). It exists because the plugin's demo relying party originally accepted whatever `id_token` the wallet POSTed — and production sites copy-pasting the demo inherited the gap. The May 2026 cross-system auth security review (recorded in the [[verifiable-trust-infrastructure|VTI]]'s `auth-architecture` design note) flagged this as finding **H2**; `@openvtc/rp-sdk` is the fix, and the RP-side counterpart of that consolidation. Runtime dependencies are only `@noble/curves`, `@noble/hashes`, `@scure/base`.

## What It Verifies

`verifyIdToken({ idToken, audience, nonce, resolver })` pins `alg` to EdDSA, enforces the SIOPv2 rule `iss === sub`, requires an exact `aud` (the RP's DID), does a constant-time nonce match, checks `iat`/`exp` within a skew window, resolves the issuer DID and verifies the JWS against its Ed25519 authentication key — with a typed `IdTokenVerificationError.reason`. A bundled `KeyResolver` handles `did:key` in-process; a `DidResolver` interface covers did:peer:2 / did:webvh / did:web (e.g. by wrapping the TDK's resolver cache SDK). `establishSession` returns an HttpOnly / Secure / SameSite=Strict cookie descriptor.

Since #4 (2026-07-06, unreleased): the RP side of the `confirm/{request,response}/0.1` Trust-Task consent protocol — build/sign a confirm request, verify the holder's response (`eddsa-jcs-2022` Data Integrity proof, `subject === issuer === signer`, challenge echo) — plus `jcsCanonicalize` (RFC 8785) with a cross-implementation fixture signed by pnm-core.

## Where It Fits

Both wallet login shapes produce the same SIOPv2 `id_token` and verify identically: the **self-issued** path (holder did:key) and the **VTA-proxied** path (`vault/proxy-login`, a VTA-held key — typically a did:webvh, so a custom resolver is needed). [[affinidi-webvh-service|did-hosting-service]]'s own M2B.4 login demo does this verification in Rust inside its control plane; rp-sdk is for *third-party* RPs outside the VTI stack.

## Recent Development

- 0.1.0 (2026-05-24), 0.1.1 (05-28, metadata), **0.2.0 (06-07)** — dependency advisories, noble v2, removed a phantom `./express` export. #4 (07-06) added the confirm protocol (unreleased). Quiet since July.
- Roadmap: `requireStepUp()` (acr = aal2), `refreshProxy()`, Express / Fastify / Hono adapters, DIDComm packing helpers.

See also: [[vta-browser-plugin]], [[vti-didcomm-js]], [[verifiable-trust-agent]]
