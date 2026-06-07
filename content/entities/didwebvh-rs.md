---
title: "didwebvh-rs — did:webvh Rust Implementation"
type: entity
tags: [didwebvh, did, library, dif, secondary]
date-updated: 2026-06-07
repo: https://github.com/decentralized-identity/didwebvh-rs
---

# didwebvh-rs

*Repo: [github.com/decentralized-identity/didwebvh-rs](https://github.com/decentralized-identity/didwebvh-rs)*

A Rust library providing the reference implementation of the [[did-webvh|did:webvh]] DID method, conforming to the v1.0 specification from the Decentralized Identity Foundation (DIF). Currently at version 0.5.4.

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
- **WASM-friendly** — resolution-only builds work in WebAssembly environments
- **Feature flags** — TLS backend selection (`rustls`, `native-tls`), optional `ssi` crate integration, CLI flows
- **Embeddable CLI** — interactive terminal flows for third-party applications to integrate did:webvh operations

## Role in the Ecosystem

This is a foundational building block. The [[affinidi-tdk|Affinidi TDK]] uses it for DID resolution, the [[affinidi-webvh-service]] builds hosting infrastructure on top of it, and the [[verifiable-trust-agent|VTA]] uses it for DID management. Any component that creates, resolves, or verifies a did:webvh identifier depends on this library.

## Recent Development

After a quiet patch in late April / early May, the library shipped two consecutive releases that closed an external security-audit list and then a spec-compliance issue.

### v0.5.4 — 2026-06-07 — witness IDs as `did:key` + dep refresh

- Closes [#42](https://github.com/decentralized-identity/didwebvh-rs/issues/42). Pre-existing logs from spec-compliant implementations continue to resolve unchanged; no public-API breakage.
- **Witness `id` is now serialized as a `did:key`** per didwebvh 1.0 §"Witnesses". A `Witness` built from a bare multibase key (`z6Mk…`) used to serialize the raw key, producing non-spec logs (the test-suite `witness-threshold` / `witness-update` vectors showed `"id":"z6Mk…"` instead of `"id":"did:key:z6Mk…"`). `Witness` now canonicalises its `id` on both serialise and deserialise. Canonicalisation is a no-op on an already-`did:key` id, so spec-compliant logs round-trip byte-for-byte and their `entryHash` still verifies. `Witnesses::validate()` dedupes on the canonical form; a new `Witness::new()` constructor applies the same normalisation.
- `affinidi-data-integrity` 0.6 → 0.7; transitive trees pruned (`reqwest`, `hyper 0.14`, `rustls 0.21`, `bitflags 1.x`).

### v0.5.3 — 2026-05-24 — security: 15 patches from cross-implementation audit

Closes [#39](https://github.com/decentralized-identity/didwebvh-rs/issues/39), a cross-implementation review across the four open-source `did:webvh` resolvers. No public-API breakage; consumers on `0.5.x` should upgrade. MSRV 1.94.0 → 1.95.0.

- **Mismatched `did:key` body/fragment in log-entry proof authorization.** `check_signing_key_authorized()` only compared the proof `verificationMethod`'s *fragment* against `updateKeys`, while signature verification decoded the public key from the *body*. An attacker could set `verificationMethod = "did:key:<attacker-mb>#<authorized-mb>"` — fragment matched an authorised key so authorisation passed, signature verified against the attacker's key. Allowed anyone to forge arbitrary log entries for any `did:webvh` DID. Now requires exactly `did:key:{mb}#{mb}` where `{mb}` is an authorised multibase, so authorised key and verification key are guaranteed identical.
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

See also: [[did-webvh]], [[affinidi-webvh-service]], [[affinidi-tdk]]
