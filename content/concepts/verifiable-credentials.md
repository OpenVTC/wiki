---
title: "Verifiable Credentials (VCs)"
type: concept
tags: [credentials, w3c, standards, trust]
date-updated: 2026-04-09
sources: [dtg-credentials, verifiable-trust-infrastructure, openvtc]
---

# Verifiable Credentials (VCs)

## What They Are

A Verifiable Credential is a digital statement made by one entity about another, signed cryptographically so anyone can verify who made the statement, that it hasn't been tampered with, and that it's still valid. Think of it as a digital version of a diploma, a badge, or a letter of recommendation — except anyone can check its authenticity without calling the issuer.

VCs are a W3C standard (the ecosystem supports both VC 1.1 and VC 2.0). A credential contains:

- **Issuer** — the DID of whoever made the claim
- **Subject** — the DID of whoever the claim is about
- **Claims** — the actual assertions (e.g., "this person is a member of community X")
- **Proof** — a cryptographic signature from the issuer
- **Validity period** — when the credential is valid from/until

## Why They Matter for OpenVTC

Verifiable Credentials are how trust is expressed in the OpenVTC ecosystem. Every trust relationship, every endorsement, every attestation of personhood is a VC. The [[decentralized-trust-graph|Decentralized Trust Graph]] is literally a graph of VCs — the nodes are [[decentralized-identifiers|DIDs]] and the edges are credentials.

The key insight is that VCs let trust be **portable and verifiable without the issuer's involvement**. Once someone issues you a credential, you hold it, you present it when you choose, and anyone can verify it by checking the issuer's public key. The issuer doesn't need to be online or even aware that you're using the credential.

## How Signing and Verification Work

The ecosystem uses **W3C Data Integrity Proofs** with the **EdDSA JCS 2022** suite:

1. The credential is canonicalized using JSON Canonicalization Scheme (JCS)
2. The canonical form is signed with Ed25519
3. The signature is embedded in the credential as a `proof` object
4. Verifiers canonicalize the credential the same way and check the signature against the issuer's public key (resolved from their DID)

The [[verifiable-trust-agent|VTA]] acts as a signing oracle — applications submit credentials to the VTA, and it signs them using keys that never leave its secure boundary.

## DTG Credential Types

The [[dtg-credentials-overview|Decentralized Trust Graph Credentials]] are a specific family of VCs designed for trust relationships. See that page for the full taxonomy, which includes [[personhood-credential|Personhood]], [[relationship-credential|Relationship]], [[endorsement-credential|Endorsement]], [[witness-credential|Witness]], and [[membership-credential|Membership]] credentials.

## Selective Disclosure

The [[affinidi-tdk|Affinidi TDK]] also supports **Selective Disclosure JWTs (SD-JWT)** per RFC 9901. This lets credential holders reveal only specific claims from a credential — for example, proving you're over 18 without revealing your exact birthdate. This is important for privacy-preserving trust relationships.

See also: [[dtg-credentials-overview]], [[decentralized-identifiers]], [[decentralized-trust-graph]]
