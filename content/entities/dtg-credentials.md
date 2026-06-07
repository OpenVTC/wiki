---
title: "dtg-credentials — Trust Graph Credential Library"
type: entity
tags: [dtg, credentials, library, trust-over-ip, primary]
date-updated: 2026-06-07
repo: https://github.com/OpenVTC/dtg-credentials
---

# dtg-credentials

*Repo: [github.com/OpenVTC/dtg-credentials](https://github.com/OpenVTC/dtg-credentials)*

A Rust library implementing the [[decentralized-trust-graph|Decentralized Trust Graph]] credential types. It provides the data structures and signing/verification logic for the [[verifiable-credentials|Verifiable Credentials]] that form the edges of the trust graph.

## What It Implements

Version 0.3 of the DTG credential specification from the Trust over IP Foundation's DTG Working Group Credential Task Force. See [[dtg-credentials-overview|DTG Credential Types]] for the full taxonomy.

## Architecture

The library is compact — two source files and an example:

- **`lib.rs`** — Core types: `DTGCredential` wrapper, `DTGCommon` (W3C VC structure), `DTGCredentialType` enum, `CredentialSubject` variants (Basic, Endorsement, Witness, RCard), signing/verification methods
- **`create.rs`** — Builder methods for each credential type (`new_vmc`, `new_vrc`, `new_vic`, `new_vpc`, `new_vec`, `new_vwc`, `new_rcard`)

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

## Provenance

Originally developed under `LF-Decentralized-Trust-labs`, recently migrated to the `OpenVTC` GitHub organization. Being prepared for public release on crates.io.

## Recent Development

A dependency-driven point release picks up the upstream data-integrity / TDK 0.7 line. The recent [[dtg-credential-spec|DTG spec]] changes (bidirectional Edge Credentials in PR #31, ZKP construction split in PR #33) are not yet reflected in this implementation.

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
