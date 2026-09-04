---
title: "vta-browser-plugin — the VTA Wallet in the browser"
type: entity
tags: [browser, wallet, pnm, webauthn, passkeys, siopv2, login, secondary]
date-updated: 2026-09-04
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

### VTA management console — Aug 31–Sep 3 2026 (#153–#158)

Everything an operator could do *to* their [[verifiable-trust-agent|VTA]] — contexts, keys, ACL, approvals, policy, services — was reachable only from the `pnm` CLI on a laptop with a keyring. `@openvtc/pnm-core/admin` already covered the CLI's command tree; its doc comments were written for a console that didn't exist yet. #155 built that console into the wallet, on the Trust Context tree: the tree is a persistent left column (`ContextRecord.parent`/`basePath`), and the selection scopes thirteen panes — keys, DIDs, access, policy, transports, audit, app state, agent memory, credential issuance — to whatever context is chosen.

Two properties hold it to the wallet's own rule of holding no key material: the console composes typed documents with `admin/*` and hands them to the existing offscreen document to mint and sign (`RUNTIME_MANAGER_TASK` carries only `type`/`payload`), and it ships as its own bundle (`manager.js`, `codeSplitting: false`) so a CI guard can confine `admin/*` task URIs to that one file and ban them from every other wallet surface. #157 reached it from the popup panel that names the agent (previously options-page-only) — a tab rather than a pane, because a 400px popup that vanishes on blur is no place to administer a context from.

**Proof of presence** (`step-up.ts`, #157) gates the console's two irreversible controls, backup abort and reload-services, behind a fresh WebAuthn assertion. The module is explicit about what it is *not*: not an authorization the agent ever sees or the audit trail records (it's a gate on the console's own UI, stopping an unattended screen being used by whoever walks past); doesn't reuse the PRF unlock ceremony, so it returns `void` rather than key material; never consults cached unlock state, so a wallet unlocked hours ago doesn't leave the gate standing open. A dismissal and a timeout both surface as `cancelled` — indistinguishable by design, so a refusal can't be inferred by a caller.

**Credentials**: issuer-side issue/revoke got a real issued-credentials list (replacing a notice that there wasn't one, once the agent shipped a `list` task — trust-tasks-tf#337/#342, trust-tasks 0.16.6); the holder-side pane fetching what this agent holds was fixed to stop reporting "none" when `vault/credentials/query` just refuses an unconstrained search (filtering on `status` satisfies the rule with the narrowest query); viewing a credential is its own fetch (`credVaultGet`) rather than expanding the search's metadata-only rows, rendered under the clicked row instead of after the whole table.

**Agent naming and context DIDs**: the header now resolves the agent's name via `alsoKnownAs` instead of showing a raw `did:webvh:` string; `contextsUpdateDid` — present in `pnm-core`, surfaced nowhere — got its own panel, because the agent had been telling operators to reassign a DID via CLI before it could be deleted and offering no way to do it from the console; the DID itself is picked from a select scoped to the context's own DIDs rather than pasted (the obvious lister is typed on `Identity` and refused to compile against a keyless console, catching the right thing). Testing also surfaced a context-editor bug where `useState(record.name)` only ran on mount, so switching contexts in the tree left the previous context's name sitting in the edit form — a save would have silently renamed the wrong context; fixed with `key={record.id}`, which a new guard now enforces across the console's editors.

A CI guard (#157) separately refuses `vta/seeds/export-mnemonic` (and `list`/`rotate`) anywhere in `dist/`, no exception — unlike the `admin/*` guard, which permits `manager.js` because holding admin authority is the console's job; seed material is the one secret whose disclosure loses everything, and no browser context gets to ask for it. A related core fix (#158) closed a gap in the schema-restatement guard itself: it matched `export interface` only, so a schema type restated as `export type X = { … }` walked straight past it — how `PushRegistration` survived the sweep that added the guard undetected. Also in this window: every hardcoded task URI in `packages/core` now comes from the generated registry; a stale note referencing the long-gone `pnm-relay` repo was corrected; and `@openvtc/pnm-core` went to 0.7.0 (minor, not patch, because exported types changed — `AclSwapResult` had been typed to a reply shape the agent stopped sending).

- **May 2026 (~90 commits)** — scaffold, DIDComm stack, SIOPv2 login, `window.vtaWallet` provider, vault M1/M2, onboarding via ephemeral did:key → `acl/swap-key`, WebAuthn-PRF holder-secret encryption, multi-VTA, first npm publish under `@openvtc`.
- **June** — Trust Tasks 0.2 migration, pnm-core 0.2.0, Web Push wake-up (registering with the `vti-push-gateway`), camelCase wire, bearer caching / 401 retry.
- **July** — transport-agnostic trust tasks + `vti-tsp-js` (#75–#81); generic `requestTask` relay (#84); approver identity with a PRF-gated signing key and a single-browser biometric approver "Phase 2" (#90/#91); co-located approver relay (#92/#93); the **D8 remediation** batch from the cross-repo security review — bounded fetches (R1.2), approver-inbox backoff (R1.5), durably record inbound *before* mediator ack (R1.6, #101), parse error bodies before throwing (R3.7); Vite 8 / TS 7.
- **August** — consent robustness (#104–#113: step-up on a verified reason, approval legs checked against the enrolled-executor set, durable pending approvals, "consent window failure = denial"); pnm-core 0.3.0 → 0.4.0 (#114, #118); tsp-js 0.2.0 pure-TS HPKE (#116/#117); Web Store packaging, per-site permissions, wallet UI (#119); browser-readable agent-name resolution (#120); **standalone layered library + cookies removal (#121)**; R1.6 documented as held via vti-didcomm-js 0.6.2's hand-off-then-ack (#122, 2026-08-19).
- **Direction**: Chrome Web Store submission; extracting pnm-core to its own repo; migrating `vault/` onto generated types.

See also: [[verifiable-trust-agent]], [[vti-didcomm-js]], [[rp-sdk-js]], [[affinidi-webvh-service]], [[didcomm]], [[trust-spanning-protocol]]
