---
title: "vta-browser-plugin — the VTA Wallet in the browser"
type: entity
tags: [browser, wallet, pnm, webauthn, passkeys, siopv2, login, secondary]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/vta-browser-plugin
---

# vta-browser-plugin — the VTA Wallet in the browser

*Repo: [github.com/OpenVTC/vta-browser-plugin](https://github.com/OpenVTC/vta-browser-plugin) — npm scope `@openvtc/pnm-*`*

Passkeys solve *local* authentication; DIDs solve *global* identity; neither alone lets a person log into a third-party website **as the controller of their VTA-held DID**. The browser plugin is the bridge: it proves control of a DID hosted in a remote [[verifiable-trust-agent|VTA]] by performing a passkey ceremony in the browser — no DID private key ever leaves the VTA, and no long-lived bearer token sits in browser storage. Its first milestone (May 2026) enrolled a passkey as an `authentication` verification method in the VTA's [[did-webvh|did:webvh]] document, so any relying party can verify a WebAuthn assertion by DID resolution alone.

Since then it has grown into the **VTA Wallet**: the browser-resident *Personal Network Manager* (see [[vta-topology]]) that holds holder identities, keeps a persistent mediator inbound session, and renders **consent / step-up approvals** for VTA-gated operations — the in-browser sibling of the iOS mobile agent.

## Components

npm-workspaces monorepo (Node ≥ 24):

| Package | Version | Role |
|---------|---------|------|
| **`@openvtc/pnm-core`** | 0.4.0 | The library: WebAuthn ceremony + COSE→Multikey, DID verification-method builder, a `VtaTransport` interface with REST and DIDComm implementations, `WalletSession.bootstrap()` (mint/load a did:key → did:peer:2 holder, coordinate-mediation/2.0 enrolment, pickup/3.0 live delivery), SIOPv2 self-issued `id_token`, RP login + step-up, vault, provisioning, Trust Tasks, inbound handling (persist-before-ack, reconnect scheduler). Since #121 (Aug 2026) a standalone, strictly layered library with operator surfaces `/admin` (acl/keys/policy), `/did-hosting` (23 `did-management/*` tasks against [[affinidi-webvh-service|did-hosting-service]]) and `/vtc` (apply / track / hold / leave), built on generated `@openvtc/trust-tasks` 0.9 bindings — heading for its own repo as a general-purpose VTA client library. |
| **`@openvtc/pnm-extension`** | 0.2.0 | MV3 Chrome extension (popup, options, offscreen inbound session, consent windows). Injects `window.vtaWallet` into *granted* origins: `login`, `loginDidcomm`, `proxyLogin`, `signTrustTask`, `requestTask`, `stepUpVta`, `vaultList`, `apiGet/apiPost`, `mediatorStatus`. Optional host permissions only, no static content scripts, no `cookies` permission (CI-asserted). Chrome Web Store packaging since #119. |
| **`@openvtc/vti-tsp-js`** | 0.2.0 | Pure-TypeScript [[trust-spanning-protocol|TSP]], byte-compatible with `affinidi-tsp`: HPKE / Ed25519 / X25519 via @noble (no WASM, runs in React Native), CESR framing, Direct / Nested / Routed modes; RFC 9180 vectors in CI. |
| `@openvtc/pnm-pwa`, `pnm-demo-rp`, `pnm-reviewer-demo` | 0.2.0 / 0.1.0 | A Vite + React wallet PWA, a demo relying party, and a Web Store reviewer bootstrap. |

## How the Web Login Family Fits Together

```
web page ──window.vtaWallet.login / proxyLogin / requestTask──▶ extension
   extension ──▶ @openvtc/pnm-core (SIOPv2, Trust-Task envelopes, VtaTransport)
      ──▶ @openvtc/vti-didcomm-js  (authcrypt + routing/2.0 forward + mediator WS)   ─┐
      ──▶ @openvtc/vti-tsp-js      (TSP frames)                                      ─┼──▶ VTA
      ──▶ REST (bootstrap only)                                                       ─┘
RP server ──▶ @openvtc/rp-sdk verifies the id_token / confirm response by resolving the holder DID
```

Transport preference is TSP > DIDComm > REST (July 2026). DIDComm goes through [[vti-didcomm-js]] (pinned `^0.6.2` as a *correctness floor*): inner authcrypt holder→VTA, wrapped in `routing/2.0/forward`, outer anoncrypt to the mediator over WSS. Three login shapes: **self-issued SIOPv2** (`login` — the wallet self-issues an EdDSA `id_token` with its did:key holder, nonce from the RP's `/auth/challenge`, wrapped in an `auth/authenticate/0.1` Trust-Task envelope; the RP verifies with [[rp-sdk-js]]); **VTA-proxied login** (`proxyLogin` — `vault/proxy-login/0.1`, the VTA mints the `id_token` with a vault-held key so the long-term key never leaves the VTA); **DIDComm login** to a did-hosting relying party (`loginDidcomm`). The early "VTA performs the password login and the wallet injects the cookie jar" variant was removed in #121.

## Recent Development

- **May 2026 (~90 commits)** — scaffold, DIDComm stack, SIOPv2 login, `window.vtaWallet` provider, vault M1/M2, onboarding via ephemeral did:key → `acl/swap-key`, WebAuthn-PRF holder-secret encryption, multi-VTA, first npm publish under `@openvtc`.
- **June** — Trust Tasks 0.2 migration, pnm-core 0.2.0, Web Push wake-up (registering with the `vti-push-gateway`), camelCase wire, bearer caching / 401 retry.
- **July** — transport-agnostic trust tasks + `vti-tsp-js` (#75–#81); generic `requestTask` relay (#84); approver identity with a PRF-gated signing key and a single-browser biometric approver "Phase 2" (#90/#91); co-located approver relay (#92/#93); the **D8 remediation** batch from the cross-repo security review — bounded fetches (R1.2), approver-inbox backoff (R1.5), durably record inbound *before* mediator ack (R1.6, #101), parse error bodies before throwing (R3.7); Vite 8 / TS 7.
- **August** — consent robustness (#104–#113: step-up on a verified reason, approval legs checked against the enrolled-executor set, durable pending approvals, "consent window failure = denial"); pnm-core 0.3.0 → 0.4.0 (#114, #118); tsp-js 0.2.0 pure-TS HPKE (#116/#117); Web Store packaging, per-site permissions, wallet UI (#119); browser-readable agent-name resolution (#120); **standalone layered library + cookies removal (#121)**; R1.6 documented as held via vti-didcomm-js 0.6.2's hand-off-then-ack (#122, 2026-08-19).
- **Direction**: Chrome Web Store submission; extracting pnm-core to its own repo; migrating `vault/` onto generated types.

See also: [[verifiable-trust-agent]], [[vti-didcomm-js]], [[rp-sdk-js]], [[affinidi-webvh-service]], [[didcomm]], [[trust-spanning-protocol]]
