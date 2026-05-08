---
title: "BIP-32 Key Derivation"
type: concept
tags: [cryptography, keys, bip32, bip39]
date-updated: 2026-04-09
sources: [verifiable-trust-infrastructure, openvtc]
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

The ecosystem derives three types of keys from this tree:

- **Ed25519** — for signing credentials, DID operations, and authentication
- **X25519** — for key agreement (DIDComm encryption)
- **P-256 (ECDSA)** — for compatibility with systems requiring NIST curves

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

See also: [[verifiable-trust-agent]], [[decentralized-identifiers]]
