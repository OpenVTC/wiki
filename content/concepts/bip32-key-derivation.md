---
title: "BIP-32 Key Derivation"
type: concept
tags: [cryptography, keys, bip32, bip39, post-quantum, did-webs, keri]
date-updated: 2026-11-28
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

A third note cuts the other way: "recoverable from the mnemonic" is not the same as "exportable". Since September 2026 any key can be marked **`exportable: false`** so it can only ever be *used* through the signing oracle, never read out (#1401, #1407), and the misnamed, unspecced, global-admin-gated `seeds/export-mnemonic` was retired in favor of **`keys/export-secret`**, which exports one named key and respects that flag (#1404). The seed still backs everything up; an operator simply no longer has a blanket way to pull key material out of a running VTA.

As of the `VTI-Eucalyptus` release (2026-10-07) that rule has a worked example and a sharper edge. `key-export` is its own capability on an agent's ACL entry rather than a side effect of admin (VTI #1619, #1715; the [[vta-browser-plugin|browser wallet]] grants it per holder, #282–#285), and the first consumer that used to *need* it no longer does: `did-git-sign` had exported the Ed25519 seed on every commit, and now asks the VTA to sign the commit's digest in place through `keys/sign-sshsig/0.1` (#1957), with a credential narrowed to exactly that — see [[community-git-namespaces]]. The mnemonic layer itself moved to `bip39` 3.0 (#1826) with no change to derivation.

## Pre-rotated and role keys (Fig, November 2026)

The Fig release (2026-11-27) gave the derivation tree a new kind of tenant. A **did:webs** identifier is backed by a KERI key event log, and KERI's defining move is *pre-rotation*: each event commits to the digest of the **next** key before that key is ever used, so a thief who takes today's key still cannot rotate the identifier away from its owner. In the [[verifiable-trust-agent|VTA]] both the current signing key and its pre-rotated successor are **derived from the seed under the context's base path**, like every other key (VTI #2561–#2564, `docs/02-vta/did-webs.md`). Derivation and pre-rotation fit each other well: the successor already exists, deterministically, without being stored anywhere it could leak, and a VTA restored from its mnemonic can still produce the key its log has committed to.

A VTA's *own* identity can now be a **key-role** did:webs (VTI #2679), and there the tree is used to keep jobs apart: an attestation key and an operational key, each **on its own path** and each designated for its role, plus an **independently derived X25519 messaging key** — never the X25519 key converted from the signing key, so a compromise of one does not hand over the other. The key event log's own key sits in no verification relationship at all. This is the per-role separation the key-roles design (`docs/05-design-notes/key-roles.md`) argues for: for each role it asks what a stolen copy would let an attacker do, for how long and how the damage is undone, and concludes that keys which fail, rotate and are custodied differently should not be one key. The design's levels 2 and 3, with a recovery key held outside the VTA, were still at the planning stage at the tag.

Two Fig changes are about keys the tree should **not** hold. A TEE VTA's first-boot claim used to mint the claimant's admin key inside the enclave and seal it back; it now enrolls the DID the claimant brought, because a client generates its own key and its private key never leaves it (VTI #1987, #2182). And **external-account secrets** — credentials for cloud and third-party accounts the VTA acts for — are not derived at all: they are wrapped and kept in a keyspace excluded from backup, so a portable, password-protected backup is never a way to take one (VTI #2016). Members may now hold P-256 and secp256k1 keys of their own (VTI #2021); those are the member's keys, not branches of the community's tree.

See also: [[verifiable-trust-agent]], [[decentralized-identifiers]], [[post-quantum-cryptography]]
