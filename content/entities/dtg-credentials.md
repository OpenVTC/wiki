---
title: "dtg-credentials — Trust Graph Credential Library"
type: entity
tags: [dtg, credentials, library, trust-over-ip, primary, cypress]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/dtg-credentials
---

# dtg-credentials

*Repo: [github.com/OpenVTC/dtg-credentials](https://github.com/OpenVTC/dtg-credentials)*

A Rust library implementing the [[decentralized-trust-graph|Decentralized Trust Graph]] credential types. It provides the data structures and signing/verification logic for the [[verifiable-credentials|Verifiable Credentials]] that form the edges of the trust graph.

## What It Implements

The [[dtg-credential-spec|DTG Core Credentials specification]] from the Trust over IP Foundation's DTG Working Group Credentials Task Force — **v1.0 Working Draft 01** since crate version 0.2.0 (August 2026; 0.1.x tracked the informal v0.3). See [[dtg-credentials-overview|DTG Credential Types]] for the full taxonomy.

## Architecture

The library is compact — two source files and an example:

- **`lib.rs`** — Core types: `DTGCredential` wrapper, `DTGCommon` (W3C VC structure, including the WD01 `taskContext` property), `DTGCredentialType` enum, `CredentialSubject` variants (Basic, Endorsement, Witness; RCard *deprecated*), signing/verification methods, VWC digest helpers (`digest_multibase()`, `verify_digest()`)
- **`create.rs`** — Builder methods for each credential type (`new_vmc`, `new_vrc`, `new_vic`, `new_vpc`, `new_vec`, `new_vwc`; `new_rcard` deprecated)

## Usage

```rust
// Create a Persona Credential
let credential = DTGCredential::new_vpc(issuer_did, subject_did, valid_from, valid_until);

// Sign it
credential.sign(&secret, None).await?;

// Verify it
credential.verify_proof_with_public_key(&public_key)?;
```

The library supports both W3C VC 1.1 and 2.0, handling field name differences (`issuanceDate`/`validFrom`, `expirationDate`/`validUntil`) transparently via serde deserialization.

## Dependencies

- `affinidi-data-integrity` — W3C Data Integrity proof creation/verification (EdDSA JCS 2022)
- `affinidi-secrets-resolver` — key management
- `serde` — JSON serialization with camelCase and untagged enum dispatch
- `serde_json_canonicalizer` (JCS / RFC 8785), `sha2`, `multibase` — VWC digest computation (since 0.2.0)

## Provenance

Originally developed under `LF-Decentralized-Trust-labs`, migrated to the `OpenVTC` GitHub organization in spring 2026. Published on crates.io since 0.1.1 (2026-03-29; 0.1.0 was never published). MSRV 1.95.

## Recent Development

After a quiet spring, the crate made its first semantic move in August 2026: **0.2.0 tracks the spec's v1.0 Working Draft 01** (see [[dtg-credential-spec]]) — and in doing so fixed a live interoperability bug. It is part of the coordinated **`Cypress`** release ([[coordinated-releases]]; the `Cypress` and `VTI-Cypress-RC-1` tags both point at the 0.2.0 HEAD; `Banyan` = `RC-0` = 0.1.3). The [[verifiable-trust-infrastructure|VTI]] (#916) and [[openvtc]] (#205) moved onto 0.2 the same day — VMC/VEC/VIC bytes are unchanged, so the bump was painless for them.

### v0.2.0 — 2026-08-10 — track DTG Core Credentials WD01 (#8, `feat!`; release notes #9)

- **`taskContext` added to `DTGCommon`** (+ accessors). This was a real bug, not just a schema catch-up: `DTGCommon` lacked the field and had no `deny_unknown_fields`, so serde silently *dropped* `taskContext` on deserialise — and because `sign()` serialises the credential, issuers signed a document missing the field while verifiers hashed a different document than the one that was signed.
- **BREAKING**: `new_vwc(issuer, subject, valid_from, valid_until, task_context: String, digest: Option<String>, witness_context)`; deserialising a `WitnessCredential` without `taskContext` fails with the new `DTGCredentialError::MissingTaskContext`; new `Canonicalization(String)` error.
- New VWC digest helpers `digest_multibase()` / `verify_digest()` — the digest covers the referenced VRC exactly as it stands, including its `proof`, over its JCS canonical form.
- `DTGCredentialType::RCard`, `CredentialSubject::RCard`, `CredentialSubjectRCard` and `new_rcard()` **deprecated** (not removed) — the relationship card left the spec for a planned VDS companion.
- **⚠ VWC digest divergence (flagged in the README/CHANGELOG, unresolved).** WD01 says the digest MUST be encoded as `sha256:` + lowercase hex; the crate encodes it as a multibase base58btc multihash (`z…`), following the W3C `digestMultibase` convention. Same SHA-256 over the same JCS bytes — only the string encoding differs — but string comparison fails both ways, so `verify_digest()` rejects spec-conformant VWCs and conformant verifiers reject crate-produced ones. To be raised with the DTGWG. A second, undeclared gap: the crate still treats `digest` as `Option` (written against the PR #7 state); spec PR #14 two days later made it REQUIRED, so a VWC built with `digest: None` is now non-conformant.
- History reconstructed: 0.1.2 and 0.1.3 had been published but never recorded; the async `sign()` change actually shipped in 0.1.1 (2026-03-29); placeholder dates replaced with crates.io dates; four rustdoc bare-URL warnings fixed.

### v0.1.3 — 2026-06-07 — data-integrity 0.7 / TDK 0.7

- `affinidi-data-integrity` 0.6 → 0.7
- `affinidi-tdk` 0.6 → 0.7 (dev-dep)
- `sign_and_verify` example migrated to the new TDK config builder (`TDKConfigBuilder::new()` → `TDKConfig::builder()`)
- MSRV bumped to 1.95.0

### v0.1.2 — 2026-04-30

- Bumped to `affinidi-data-integrity` 0.6 and migrated to its new API
- CODEOWNERS for `@OpenVTC/openvtc-maintainers`

### v0.1.1 and earlier — 2026-04 and prior

- Dependency updates: `affinidi-data-integrity` 0.4 → 0.5, `affinidi-tdk` 0.5 → 0.6
- `sign()` made async to align with upstream changes
- Repository URL migration from LF-Decentralized-Trust-labs to OpenVTC
- Crate publishing enablement

See also: [[dtg-credentials-overview]], [[decentralized-trust-graph]], [[verifiable-credentials]]
