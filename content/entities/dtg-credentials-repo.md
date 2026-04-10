---
title: "dtg-credentials — Trust Graph Credential Library"
type: entity
tags: [dtg, credentials, library, trust-over-ip]
date-updated: 2026-04-09
sources: [dtg-credentials]
---

# dtg-credentials

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

- CODEOWNERS for `@OpenVTC/openvtc-maintainers`
- Dependency updates (affinidi-data-integrity 0.4→0.5, affinidi-tdk 0.5→0.6)
- `sign()` made async to align with upstream changes
- Repository URL migration from LF-Decentralized-Trust-labs to OpenVTC
- Crate publishing enablement

See also: [[dtg-credentials-overview]], [[decentralized-trust-graph]], [[verifiable-credentials]]
