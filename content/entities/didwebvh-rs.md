---
title: "didwebvh-rs — did:webvh Rust Implementation"
type: entity
tags: [didwebvh, did, library, dif, secondary]
date-updated: 2026-10-07
repo: https://github.com/decentralized-identity/didwebvh-rs
---

# didwebvh-rs

*Repo: [github.com/decentralized-identity/didwebvh-rs](https://github.com/decentralized-identity/didwebvh-rs)*

A Rust library providing the reference implementation of the [[did-webvh|did:webvh]] DID method, conforming to the v1.0 specification from the Decentralized Identity Foundation (DIF). Currently at version **0.8.0** (2026-10-01), a no-behavior-change release whose only purpose is to carry `affinidi-data-integrity` 0.8 (and so `affinidi-bbs` 0.4) through this crate's public API. The last behavioral release is **0.7.0** (September 2026), which made resolution *public-hosts-only by default* — a breaking change for local stacks.

| Coordinated release ([[coordinated-releases]]) | Cypress (08-17) | VTI-Dogwood / R1 (08-30 / 09-01) | VTI-Eucalyptus-RC-0 (09-17) | VTI-Eucalyptus (10-07) |
|---|---|---|---|---|
| didwebvh-rs consumed by the [[affinidi-tdk\|TDK]] resolver | 0.6 (0.6.0) | 0.6 (0.6.1) | 0.7 (0.7.0) | **0.8 (0.8.0)** |
| didwebvh-rs declared by [[affinidi-webvh-service\|did-hosting-service]] | 0.6 | 0.6 | 0.6 (lockfile also 0.7 via vta-sdk) | 0.7 |

This repository carries no coordinated tags of its own; the row above is read off the consumers' manifests at each tag.

## What It Provides

The full DID lifecycle for did:webvh:
- **Creation** — generate new DIDs with SCIDs and initial history entries
- **Resolution** — fetch and validate DID documents with full history verification
- **Update** — append new entries to the verifiable history log
- **Key rotation** — rotate keys with pre-rotation support
- **Deactivation** — properly deactivate a DID
- **Domain migration** — move a DID to a new domain while preserving identity
- **Witness management** — add, remove, and validate witness proofs
- **did:web export** — generate did:web-compatible documents

## Architecture

Key design features:
- **Pluggable signing** — a `Signer` trait lets callers provide their own signing backend (HSM, KMS, cloud) so private keys never enter the library
- **Host policy on resolution** (0.7.0) — because the DID itself names the host to fetch from, `resolve()` refuses non-public hosts by default (`HostPolicy::PublicOnly`): special-use names (`localhost`, `*.local`, `*.internal`, `home.arpa`, single-label) are blocked before any request, and on native targets the default client refuses any name whose DNS answers include a loopback/private/link-local/CGNAT/metadata address, pins the connection to the checked addresses, follows no redirects and ignores system proxies. `HostPolicy::AllowPrivate` opts back in for local testing; `ResolveOptions::with_http_client()` lets a caller supply its own client (and take over the connect-time checks)
- **WASM-friendly** — resolution-only builds work in WebAssembly environments (only the name checks of the host policy apply there — DNS is not observable in a browser)
- **Feature flags** — TLS backend selection (`rustls`, `native-tls`), optional `ssi` crate integration, CLI flows
- **Embeddable CLI** — interactive terminal flows for third-party applications to integrate did:webvh operations
- **Public dependency on `affinidi-data-integrity`** — the `Signer` trait, `DataIntegrityProof` and `CryptoSuite` types appear throughout the API (`create_log_entry`, `update_document`, `rotate_keys`, `deactivate`, `LogEntry1_0`, `WitnessProof`, `WitnessVerifyOptions`), so a data-integrity major-line move is a breaking release here too — the reason 0.8.0 exists
- **Deactivation is reported, not refused** — a log that ends in a clean deactivation still resolves `Ok` with the final document, and the deactivation is flagged only in `MetaData::deactivated`. Consumers that want a retired DID to stop authenticating must read that flag; both the [[affinidi-tdk|TDK]] resolver (#907) and [[affinidi-webvh-service|did-hosting-service]] (#252) learned this the hard way in late September 2026

## Role in the Ecosystem

This is a foundational building block. The [[affinidi-tdk|Affinidi TDK]] uses it for DID resolution, the [[affinidi-webvh-service]] builds hosting infrastructure on top of it, and the [[verifiable-trust-agent|VTA]] uses it for DID management. Any component that creates, resolves, or verifies a did:webvh identifier depends on this library.

Where consumers stand at the `VTI-Eucalyptus` tag (2026-10-07): the TDK's `affinidi-did-resolver-cache-sdk` 0.8.41, `cache-server` 0.9.15 and `did-scid` 0.3.0 are on **0.8** (TDK #917, "step 3a of the 0.8 wave"), as is `vta-sdk` ≥ 0.61; did-hosting-service declares **0.7** (its #251 moved `didwebvh-rs` 0.6 → 0.7 together with the rest of its VTA / Trust Tasks / messaging set) and reads the signer's own log through it for its deactivation check; the trust-tasks-rs 0.26+ line (`trust-tasks-proof`, dtgwg-trust-tasks-tf) is on data-integrity 0.8 and therefore compatible with 0.8 only. The two lines coexist in a lockfile without conflict, because this crate's types do not cross between them.

## Recent Development

The library is in maintenance-and-hardening mode: after the security-audit and spec-compliance releases of May–June and the June fuzzing infrastructure, July 2026 brought a parse-time spec fix (0.5.7) and a pre-release audit sweep promoted to **0.6.0** for its small breaking API changes. The August–September 2026 window (four PRs, #51–#54) added a spec-conformance fix (**0.6.1**) and one genuinely breaking security release (**0.7.0**, host policy) — the latter driven by the ecosystem-wide SSRF review (SEC-4045) that also produced the TDK's `affinidi-net-guard` crate and ADR 0006, whose stated design constraint is that the guard must be consumable *by this crate* (hence no `affinidi-*` dependencies). The 2026-09-18 → 10-07 window was the quietest in months — a single PR (#55) — and that one is a dependency move rather than a feature: **0.8.0** exists because `affinidi-data-integrity` 0.8.0 exists, and that exists because the TDK had published 0.7.14 as a patch while changing a public type (see [[affinidi-tdk]]). There is no 0.7.x patch line: 0.7.0 is the only 0.7 release (#54's yanked-`wnaf` bump shipped inside it). Hosting-side, did-hosting-service's edge servers still re-verify synced logs only structurally, for the reason recorded in August — "an edge re-running it would reject logs an older didwebvh-rs accepted" — although since #213 the edge *does* verify each synced log's proof chain and strict extension of the held log.

Tag housekeeping worth knowing: the `v0.6.0` git tag was only pushed on 2026-08-28 (the commit is from 07-19), `v0.6.1` / `v0.7.0` were both tagged on 09-11, and as of 2026-10-07 **there is no `v0.8.0` git tag** — the tag list ends at `v0.7.0` while `Cargo.toml` and the CHANGELOG say 0.8.0 and the TDK consumes it from crates.io.

### v0.8.0 — 2026-10-01 — `affinidi-data-integrity` 0.8 (#55)

**Why.** `affinidi-data-integrity` 0.7.14 had moved to `affinidi-bbs` 0.4 as a *patch*, on the claim that no BBS type was in its public API; the claim was wrong (fourteen functions take `affinidi_bbs::{PublicKey, SecretKey, Signature, Proof}`), and downstream code on `^0.7` with `affinidi-bbs` 0.3 stopped compiling. The TDK re-released the same code as **0.8.0** (its #916) and every crate that re-exports data-integrity types had to follow. This crate is one of them, so it moved a minor.

- **Breaking**: requires `affinidi-data-integrity` 0.8 (and so `affinidi-bbs` 0.4). The `Signer` re-exported from `prelude`, the `&dyn Signer` taken by `create_log_entry` / `update_document` / `rotate_keys` / `deactivate`, the `DataIntegrityProof`s in `LogEntry1_0`, `LogEntry1_0Pre` and `WitnessProof`, and the `CryptoSuite`s in `WitnessVerifyOptions` are all now the 0.8 types; a signer or proof built against 0.7 is a different type. **No behavior change.**
- **Maintenance**: test assertions rewritten (`assert_ne!(x, "")` for `assert!(!x.is_empty())`) for the `clippy::assert_is_empty` lint new in Rust 1.99, which was failing the `-D warnings` clippy job on `stable`.
- **Downstream**: TDK `did-scid` 0.3.0 (its `DIDSCIDError` wraps this crate's error, so breaking) and `cache-sdk` 0.8.41 / `cache-server` 0.9.15 (patch — neither exposes the type) took it the same day (#917); the `affinidi-tdk` facade briefly pinned `did-scid` 0.2.8 from crates.io (0.21.1) so there would be "one breaking tdk release, not two", then moved in 0.22.0.

### v0.7.0 — 2026-09-11 — resolution host policy + injectable HTTP client (#53, #54)

**Why.** A did:webvh DID chooses the host its log is fetched from, so a resolver that fetches "whatever the name resolves to" is an SSRF primitive: `did:webvh:{SCID}:localhost%3A<port>` was fetched over plain `http://`, and any other name from any address it resolved to — including cloud-metadata and RFC 1918 space. 0.5.3 had already blocked IP *literals* and redirects; 0.7.0 closes the *name* half.

- **Breaking**: `DIDWebVHState::resolve()` contacts public hosts only by default (`HostPolicy::PublicOnly`, new `DIDWebVHError::BlockedHost`); the default native client ignores `HTTP(S)_PROXY` (a proxy resolves the name itself, outside the resolver's checks); `ResolveOptions` gains public fields `host_policy` and `http_client` (struct literals need `..Default::default()`). The `ssi`-feature resolver is public-only too.
- **Added**: `host_policy::HostPolicy { PublicOnly, AllowPrivate }`; `guarded_dns_resolver()` / `guarded_dns_resolver_with(inner)` for installing the DNS guard on a caller-built client; `WebVHURL::get_fetch_url(file, policy)` — the policy-checked URL, host canonicalised (percent-decoding, IDNA, case, trailing dot) before checking; `examples/resolve.rs --allow-private-hosts`. Every fetch (`did.jsonl`, `did-witness.json`, eager and deferred) goes through `get_fetch_url()`; under `AllowPrivate` only `localhost` / `*.localhost` use `http://`.
- **Unchanged, now documented as such**: `get_http_url()` / `get_http_whois_url()` / `get_http_files_url()` render URLs for display and the implicit `#files` / `#whois` services and apply no policy.
- **Migration**: local dev/tests → `ResolveOptions::default().with_host_policy(HostPolicy::AllowPrivate)`; trusted private deployments → `AllowPrivate`; proxied environments → pass an `http_client` built with the proxy (name checks still apply). #54 bumped a yanked `wnaf` 0.14.0 → 0.14.1.
- **Downstream effect**: the TDK's `cache-sdk` 0.8.37 exposes one `DIDCacheConfigBuilder::with_host_policy` covering did:web *and* did:webvh; `cache-server` 0.9.13 notes that a deployment reaching did:webvh hosts only through a proxy can no longer resolve them.

### v0.6.1 — 2026-08-29 — the log entry that *activates* pre-rotation may set `updateKeys` (#52)

`Parameters::validate()` gated the "every `updateKeys` key must hash into the previous entry's `nextKeyHashes`" rule on the *current* entry's `pre_rotation_active` — which the entry's own new `nextKeyHashes` had just flipped on — rather than the previous entry's. Since a not-yet-pre-rotating predecessor commits no hashes, the activating entry was unsatisfiable, blocking the ordinary operator flow of turning pre-rotation on as part of a document edit that also rotates `updateKeys`. didwebvh 1.0 defines the trigger as the *previous* entry's commitment (verification step 7; update step 7; "in any DID log entry"), and `verify_log_entry()` / `check_signing_key()` already keyed on the previous entry — so a chain written this way would *resolve* but this crate could not *produce* one. Steady-state and deactivation rules unchanged. #51 refreshed the lockfile onto the published TDK line (data-integrity 0.7.10, crypto 0.2.8, did-common 0.4.2, secrets-resolver 0.5.10) and added an audit ignore for RUSTSEC-2026-0235 (`rkyv` via `rust_decimal`, unreachable).

### v0.6.0 — 2026-07-19 — `affinidi-did-common` 0.4 + pre-release audit fixes (#50)

Originally planned as 0.5.8, promoted to a minor because of breaking changes. MSRV stays 1.95.0 (README badge corrected).

- **Breaking**: `DIDWebVHError`, `URLType`, `LogEntryValidationStatus` are now `#[non_exhaustive]` (downstream `match`es need a `_ =>` arm); the whole-crate `affinidi_secrets_resolver` re-export (deprecated since 0.5.0) is removed.
- **Fixed**: the `update_did()` migrate path silently dropped `portable` (a shared `apply_param_overrides` now); a successor-version check overflow on `versionId == u32::MAX` (debug panic / release wrap to 0 that would let a chain restart numbering — attacker-reachable via `verify_log_entry`) is now a `ValidationError`; a CLI update-flow panic on empty `active_update_keys`.
- **Deps**: `affinidi-did-common` 0.3 → **0.4** (the release that adds typed `alsoKnownAs` — the foundation of ecosystem-wide *agent names*; this crate had to ship before did-common 0.4 could propagate, per TDK ADR 0003); `affinidi-data-integrity` pinned 0.7.7 to avoid two did-common copies.
- **Tests**: 22 `ignore` doctests → `no_run` (24/24 compile); the `witness-update` interop vector un-ignored and **inverted to assert rejection** — a self-lowered witness threshold must be judged against the then-active witnesses (a security-motivated divergence to be raised with the didwebvh-test-suite); interop suite 13/13.

### v0.5.7 — 2026-07-10 — reject IP-literal hosts at parse time (#49, closes #47)

`WebVHURL::parse_did_url()` tested the still-percent-encoded host, so `127%2E0%2E0%2E1` passed as a domain; host parsing now goes through `url::Host::parse` (percent-decodes, IDNA), which also rejects alternate IPv4 spellings (`2130706433`, `0x7f.0.0.1`, `127.1`, `0177.0.0.1`) and illegal hosts up front. Not a resolver vulnerability — the post-normalisation `reject_ip_host()` already blocked fetches — but the spec requires `invalidDid` at parse time (fixes the `negative-pct-encoded-ip-host` test-suite vector). Lockfile refresh cleared RUSTSEC-2026-0204 (crossbeam-epoch); clippy clean on Rust 1.97.

### v0.5.6 — 2026-06-29 — caller-settable `versionTime` on create/update

- `CreateDIDConfig` / `UpdateDIDConfig` gain an optional `version_time` (default keeps `now()`). Motivation: `versionTime` serialises at second granularity and must be strictly increasing, so an automated back-to-back create-then-update — e.g. a [[verifiable-trust-agent|VTA]] provisioning flow — produced same-second entries that made the DID unresolvable. Callers can now backdate/space entries; a real-world integration bug found by the hosting-service side (PR #48).

### v0.5.5 — 2026-06-14 — feature-gated `Arbitrary` + structure-aware fuzz harness

- New off-by-default `arbitrary` feature: `Arbitrary` impls across the public log-entry and parameters types, making the structural proof path (shape enforcement, did:key resolution, cryptosuite gating) fuzz-reachable without valid signatures (PR #46, closes #44).
- New workspace-detached `fuzz/` crate with cargo-fuzz targets (parameters_validate, logentry_deserialize, chain_validate, proof_verify); ~6M smoke executions, no crashes; weekly fuzz CI.
- New public API beyond fuzzing: `DIDWebVHState::from_log_entries()` — a filesystem-free way to validate an in-memory chain.
- Why it matters: this is the crate that verifies did:webvh log chains for the whole ecosystem, and the `arbitrary` feature is what enabled the structure-aware fuzz target in [[affinidi-webvh-service|did-hosting-service]] the same day — a coordinated cross-repo fuzzing push.

### v0.5.4 — 2026-06-07 — witness IDs as `did:key` + dep refresh

- Closes [#42](https://github.com/decentralized-identity/didwebvh-rs/issues/42). Pre-existing logs from spec-compliant implementations continue to resolve unchanged; no public-API breakage.
- **Witness `id` is now serialized as a `did:key`** per didwebvh 1.0 §"Witnesses". A `Witness` built from a bare multibase key (`z6Mk…`) used to serialize the raw key, producing non-spec logs (the test-suite `witness-threshold` / `witness-update` vectors showed `"id":"z6Mk…"` instead of `"id":"did:key:z6Mk…"`). `Witness` now canonicalizes its `id` on both serialize and deserialize. Canonicalization is a no-op on an already-`did:key` id, so spec-compliant logs round-trip byte-for-byte and their `entryHash` still verifies. `Witnesses::validate()` dedupes on the canonical form; a new `Witness::new()` constructor applies the same normalisation.
- `affinidi-data-integrity` 0.6 → 0.7; transitive trees pruned (`reqwest`, `hyper 0.14`, `rustls 0.21`, `bitflags 1.x`).

### v0.5.3 — 2026-05-24 — security: 15 patches from cross-implementation audit

Closes [#39](https://github.com/decentralized-identity/didwebvh-rs/issues/39), a cross-implementation review across the four open-source `did:webvh` resolvers. No public-API breakage; consumers on `0.5.x` should upgrade. MSRV 1.94.0 → 1.95.0.

- **Mismatched `did:key` body/fragment in log-entry proof authorization.** `check_signing_key_authorized()` only compared the proof `verificationMethod`'s *fragment* against `updateKeys`, while signature verification decoded the public key from the *body*. An attacker could set `verificationMethod = "did:key:<attacker-mb>#<authorized-mb>"` — fragment matched an authorized key so authorization passed, signature verified against the attacker's key. Allowed anyone to forge arbitrary log entries for any `did:webvh` DID. Now requires exactly `did:key:{mb}#{mb}` where `{mb}` is an authorized multibase, so authorized key and verification key are guaranteed identical.
- **Disable HTTP redirects in DID resolution** (SSRF). `reqwest` followed up to 10 redirects by default. A malicious host serving a `did:webvh` DID could 302-redirect the `did.jsonl` / `did-witness.json` fetch to an internal address (cloud metadata endpoint, localhost, RFC1918), bypassing `WebVHURL::parse_did_url()`'s IP-address rejection. Native client now sets `redirect(Policy::none())`. WASM path unchanged (governed by browser fetch/CORS).
- **Reject duplicate witness IDs** (threshold bypass). `Witnesses::validate()` checked count vs threshold but not duplicates; `WitnessProofCollection::validate_log_entry()` counts once per listed witness, so a controller could declare `threshold: 3, witnesses: [W1, W1, W1]` and meet threshold with one cooperating witness.
- **Reject path-traversal segments in DID → HTTP URL conversion.** `did:webvh:<scid>:example.com:..:..:other` resolved to `https://example.com/../../other/did.jsonl`. `.`, `..`, empty segments, and segments containing `/` are now rejected.
- **Lowercase `%3a` host:port split fix.** The parser only split on literal `%3A`, so `127.0.0.1%3a8080` left `domain = "127.0.0.1%3a8080"`, which failed `IpAddr` parsing and slipped past `reject_ip_address()`.
- Plus ten more (percent-decode before traversal check, re-check host after `Url::parse` to block percent-encoded IP bypass, etc.) — all input-validation hardening; pre-existing logs unaffected.

### v0.5.2 — 2026-04-29

- Implicit service ID spec compliance fix
- PQC example improvements

### v0.5.1 — 2026-04-29

- didwebvh 1.0 spec-compliance patch

### v0.5.0 — 2026-04-18 — major release rollup

- Embeddable interactive CLI flows for third-party apps
- In-memory log verification (`resolve_log()`)
- HTTP response size limits for resolution safety
- `Signer` trait replacing direct `Secret` usage
- Convenience APIs (`update_document()`, `rotate_keys()`, `deactivate()`)
- Cache serialization (`save_state` / `load_state`)
- Wiremock-based tests replacing live network tests
- Criterion benchmarks

### v0.4.2 — 2026-04-14

- Removed yanked core2/multihash transitive dependency

See also: [[did-webvh]], [[affinidi-webvh-service]], [[affinidi-tdk]], [[coordinated-releases]]
