---
title: "BIP-32 Key Derivation"
type: concept
tags: [cryptography, keys, bip32, bip39, post-quantum]
date-updated: 2026-09-18
sources: [verifiable-trust-infrastructure, verifiable-trust-agent, openvtc]
---

# BIP-32 Key Derivation

## What It Is

BIP-32 (Bitcoin Improvement Proposal 32) defines a method for deriving a tree of cryptographic keys from a single seed. Combined with BIP-39 (which generates that seed from a 24 word mnemonic phrase), it means **one backup phrase protects your entire identity**.

This is the key management strategy used throughout the OpenVTC ecosystem. Instead of managing separate keys for your persona, your DID updates, each relationship, and each application — all of these derive deterministically from one master seed.

## How It Works

Starting from a mnemonic phrase:

```
horse staple battery ... (24 words)
     ↓ BIP-39
  Master Seed (512 bits)
     ↓ BIP-32
  Key Tree
```

The key tree uses **derivation paths** — hierarchical addresses that identify each key's purpose. The OpenVTC ecosystem uses the `m/26'` path (registered for First Person Network):

```
m/26'                          ← Root for First Person Network
  └── m/26'/context'/          ← Application context
        └── m/26'/context'/n'  ← Individual key within context
```

## Key Types

The ecosystem derives four kinds of key from this tree:

- **Ed25519** — for signing credentials, DID operations, and authentication
- **X25519** — for key agreement (DIDComm and TSP encryption)
- **P-256 (ECDSA)** — for compatibility with systems requiring NIST curves
- **ML-DSA-44 / ML-DSA-65** — [[post-quantum-cryptography|post-quantum]] signing keys, since September 2026 (VTI #1505). FIPS 204 key generation takes a 32-byte seed, so the chain can produce one — but the obvious implementation (hand the SLIP-0010 output straight to the key constructor, as Ed25519 does) would make the ML-DSA seed *equal* the Ed25519 private key at the same path, so compromising either yields the other. The derivation therefore follows P-256's construction: HMAC-SHA512 over the derived key and chain code under a **per-parameter-set label**, so ML-DSA-44 and ML-DSA-65 at the same path are independent of each other and of the classical key. The `-priv-seed` multicodecs are what let such a key be written down and re-derived. Every key record now carries the algorithm it was minted with (#1532).

DID templates declare which algorithm each key slot uses, and since the **did-templates 3.0** task family a template may name a **third slot** — a post-quantum signing key beside the classical signing / key-agreement pair — which is the shape a hybrid-credential issuer needs (#1530, #1538, #1554).

## How OpenVTC Uses Derivation Paths

The [[openvtc|OpenVTC CLI]] defines specific paths:

| Path | Purpose |
|------|---------|
| `m/1'/0'/` | Persona keys (primary identity) |
| `m/2'/1'/` | WebVH management keys (DID document updates) |
| `m/3'/1'/1'/N` | Relationship keys (one per relationship) |

The [[verifiable-trust-agent|VTA]] generalizes this with **Application Contexts** — named sub-trees (e.g., "vta", "mediator", "my-app") that each get their own derivation branch. This keeps keys for different applications isolated while still deriving from the same seed.

## Why This Matters

1. **Simple backup** — one mnemonic phrase backs up everything
2. **Deterministic recovery** — given the same seed and derivation paths, you get the same keys every time
3. **Key isolation** — compromising one derived key doesn't compromise others
4. **Unlimited keys** — you can derive as many keys as you need without additional backup burden

## Security Considerations

The seed is the crown jewel. In the OpenVTC ecosystem, it can be stored in:

- **OS keyring** (macOS Keychain, Linux secret service, Windows Credential Manager) — the default
- **Hardware token** (Nitrokey, YubiKey via OpenPGP card protocol)
- **Cloud KMS** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault)
- **Hardware enclave** (AWS Nitro) — for VTA deployments where keys must never touch unprotected memory

The [[verifiable-trust-agent|VTA]] adds another layer: it acts as a signing oracle, so applications never see the keys at all — they submit payloads and get signatures back.

## The Exceptions (August–September 2026)

Derivation from one seed is the rule, but the [[verifiable-trust-agent|VTA]] now deliberately holds two kinds of key *outside* the tree: **non-extractable internal signing keys** — generated from a CSPRNG with no derivation path, stored in their own keyspace that is excluded from backup, never exportable (admin is not a bypass), and forbidden as did:webvh update keys — for cases where "this key can never leave this VTA" matters more than "this key can be recovered from the mnemonic"; and **imported** Ed25519 keys, for a deterministic did:key that must match a key created elsewhere. The derivation code itself also moved in-tree (SLIP-0010, dropping the `ed25519-dalek-bip32` dependency) when the workspace moved to curve25519-dalek 5. Post-quantum *internal* keys are refused for now: whether a VTA should hold an unrecoverable ML-DSA key is a decision not yet taken.

A third note cuts the other way: "recoverable from the mnemonic" is not the same as "exportable". Since September 2026 any key can be marked **`exportable: false`** so it can only ever be *used* through the signing oracle, never read out (#1401, #1407), and the misnamed, unspecced, global-admin-gated `seeds/export-mnemonic` was retired in favour of **`keys/export-secret`**, which exports one named key and respects that flag (#1404). The seed still backs everything up; an operator simply no longer has a blanket way to pull key material out of a running VTA.

See also: [[verifiable-trust-agent]], [[decentralized-identifiers]], [[post-quantum-cryptography]]
