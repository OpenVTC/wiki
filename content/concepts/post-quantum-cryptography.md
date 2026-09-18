---
title: "Post-Quantum Cryptography in the Stack"
type: concept
tags: [cryptography, post-quantum, ml-dsa, ml-kem, keys, data-integrity, tsp, security]
date-updated: 2026-09-18
sources: [affinidi-tdk, verifiable-trust-infrastructure, verifiable-trust-agent, didwebvh-rs]
---

# Post-Quantum Cryptography in the Stack

## Why a Trust Graph Cares Now

Every signature and every key agreement in this ecosystem today rests on elliptic curves — Ed25519 for signing, X25519 for encryption — and a sufficiently large quantum computer would break both. Nobody has one. The reason to act anyway is **harvest now, decrypt later**: traffic recorded today can be opened whenever the machine arrives, and a signature forgeable later undermines any record that relies on it. A [[decentralized-trust-graph|trust graph]] is exactly that kind of long-lived record. A [[membership-credential|membership]] or [[relationship-credential|relationship]] credential may be relied on for years; a [[did-webvh|did:webvh]] log is signed once and cannot be re-signed; a personhood decision recorded in 2026 should still be checkable in 2040. So the ecosystem's posture is *hybrid* — classical and post-quantum proofs side by side — because the migration will take years and both kinds of verifier will coexist throughout.

The algorithms are NIST's: **ML-DSA** (FIPS 204, the lattice signature scheme formerly Dilithium) in the 44 and 65 parameter sets, and **ML-KEM-768** (FIPS 203, formerly Kyber) for key encapsulation, always paired with X25519 as the hybrid `MLKEM768-X25519`.

## What Exists, Layer by Layer

**The TDK, since April 2026.** `affinidi-tdk-rs` v0.5.4 (2026-04-18) added post-quantum support to the crypto and Data Integrity crates behind a `post-quantum` umbrella feature (per-algorithm `ml-dsa` and `slh-dsa` sub-flags, all off by default): `KeyType::{MlDsa44, MlDsa65, MlDsa87, SlhDsaSha2_128s}` in `affinidi-crypto`, `Secret::generate_ml_dsa_*` in the secrets resolver, official multicodec code points, and the W3C `di-quantum-safe` cryptosuites **`mldsa44-jcs-2024`** and **`mldsa44-rdfc-2024`** (plus `slhdsa128-*`). Only ML-DSA-44 gets a Data Integrity suite because that is the only parameter set the W3C draft fully specifies; ML-DSA-65/87 have primitives but no suite. The scope was Data Integrity only — DIDComm, mdoc/COSE and JWT stayed classical, as they still do. The `sign_multi_hybrid` example already showed the migration pattern: one credential, an Ed25519 proof *and* an ML-DSA proof, so each kind of verifier accepts the one it understands.

**TSP Rev 3, September 2026.** The [[trust-spanning-protocol|TSP]] specification's Rev 3 defines a PQ profile (§8): hybrid `MLKEM768-X25519` HPKE and ML-DSA-65 signatures. `affinidi-tsp` 0.2.0 implements it behind a `pq` feature and opens the spec's `direct-hpke-base-pq` vector end to end — but only after four defects in the published appendix (truncated values, a 32-byte ML-KEM "key" that turned out to be a seed, a naming clash with X-Wing) were fixed upstream — otherwise "a hybrid KEM would have shipped validated by nothing but agreement with themselves". The cryptography is verified; the **VID model is not PQ-aware** (`ResolvedVid` keys are 32 bytes; an ML-DSA-65 verifying key is 1952), so nothing above the crate can use the path yet. The CESR code point `1AAQ` is provisional.

**VTI keys and templates, 2026-09-16 → 09-18.** The VTA's `KeyType` gained **`MlDsa44` and `MlDsa65`** (#1502) — two sets because two specs demand different ones: W3C suites exist for ML-DSA-44, TSP Rev 3 §8.1 mandates ML-DSA-65. Both **derive from the [[bip32-key-derivation|BIP-32]] chain** (#1505) with per-parameter-set domain separation, so the seed never equals the Ed25519 key at the same path, and a key record now **carries the algorithm it was minted with** (#1532) instead of a literal at every save site; `pnm keys create --type ml-dsa-*` shows which axis a key protects (#1535). DID templates declare which algorithms each key slot uses (#1530), the VTA accepts the **did-templates 3.0** task family alongside 2.0 (#1538), clients carry a PQ template (#1542), and a template can name a **third key slot** beyond the classical signing/key-agreement pair (#1554 — following the loader's earlier error message would have published a `PLACEHOLDER-NEVER-SUBSTITUTED` literal into a write-once did:webvh log).

**Hybrid credentials.** VTC verification reads a document carrying more than one proof (#1548, #1550), and the RC commit (#1553) has **the VTC sign with every key it holds** — one proof per key, each under its own cryptosuite. A single-key VTC emits byte-identical output, so nothing downstream changes until a second key exists; #1557 provisions a VTC from a v2 template that issues hybrid Ed25519 + ML-DSA credentials. See [[verifiable-credentials]].

**did:webvh.** [[didwebvh-rs]] exposes ML-DSA-44/65/87 and SLH-DSA suites for log entries and witness proofs behind an `experimental-pqc` feature, explicitly off-spec: did:webvh 1.0 does not standardise them.

## Built, Tested, Unreachable

The most instructive September finding was not cryptographic. Three times, PQ code existed and could not be reached:

- `affinidi-data-integrity` was pinned by VTI **without its `ml-dsa` feature**, so the signer fell back to `EddsaJcs2022` and failed with "key type MlDsa44 is not compatible" — every capability built above it led to a key that could not sign: "built, tested, and unreachable" (#1553). VTI now pins the feature on.
- ML-DSA secrets **could not be persisted** (TDK #797): the generator wrote an empty `privateKeyMultibase`, so a saved store lost the key on restart. Fixed via the `-priv-seed` codecs; SLH-DSA stays memory-only because FIPS 205 has no registered private-key multicodec.
- The Data Integrity crate's **ML-DSA tests had never compiled** (TDK #821): `default = []`, so ten unit tests never ran and one passed for the wrong reason.

## Status: On by Default, or Behind a Flag

| Layer | Status |
|---|---|
| VTA key types ML-DSA-44/65, BIP-32 derived, algorithm-carrying records | **On** (vta-keys 0.6, vta-sdk 0.42+) |
| did-templates 3.0, per-slot algorithms, third slot | **On** |
| VTC hybrid multi-proof issuance and verification | **On**; hybrid output only once a second key is held |
| TDK Data Integrity ML-DSA-44 suites | Behind `ml-dsa` in the TDK; **on** in VTI's pin |
| TSP Rev 3 `MLKEM768-X25519` + ML-DSA-65 | Behind `pq`; VID model not PQ-aware, so unused above the crate |
| didwebvh-rs PQ suites | Behind `experimental-pqc`, off-spec |
| DIDComm, mdoc/COSE, JWT, TEE attestation | Classical only |
| Internal (non-derived) PQ keys | Refused pending a decision on holding an unrecoverable PQ key |

See also: [[trust-spanning-protocol]], [[bip32-key-derivation]], [[verifiable-credentials]], [[verifiable-trust-agent]], [[affinidi-tdk]]
