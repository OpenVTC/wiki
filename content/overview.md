---
title: "OpenVTC Ecosystem Overview"
type: overview
tags: [openvtc, vti, trust-graph, decentralized-identity, first-person-network]
date-updated: 2026-04-09
sources: [verifiable-trust-infrastructure, openvtc, dtg-credentials, affinidi-tdk-rs, affinidi-webvh-service, didwebvh-rs]
---

# OpenVTC Ecosystem Overview

## The Problem

How do you know the person you're dealing with online is who they say they are?

Today, most digital identity is delegated — you prove who you are by showing that some authority (Google, your employer, a government) vouches for you. This works, but it creates dependencies on centralized gatekeepers, locks your identity to their platforms, and breaks down in contexts where no single authority is trusted by all parties.

The OpenVTC ecosystem takes a different approach: **first-person identity**. Instead of asking "who does an authority say you are?", it asks "who do the people around you say you are?" Trust isn't granted by a central authority — it's built from the ground up through real relationships between real people, expressed as cryptographically verifiable credentials.

## The Big Picture

The ecosystem is a stack of open-source projects that together enable **Verifiable Trust Communities (VTCs)** — groups of people and organizations who establish and verify trust relationships without relying on a central authority. The system is built on W3C open standards for [[decentralized-identifiers|Decentralized Identifiers (DIDs)]] and [[verifiable-credentials|Verifiable Credentials (VCs)]].

Here's how the pieces fit together, from bottom to top:

### Layer 1: Identity Infrastructure

At the foundation, every participant needs a cryptographically secure identity — a [[decentralized-identifiers|DID]]. The ecosystem uses [[did-webvh|did:webvh]], a DID method that gives you a portable, self-certifying identifier with a verifiable history of changes. You host your DID document on your own domain or a domain controlled by the provider of your choice, and anyone can verify its entire history of updates, key rotations, and witness attestations.

The [[didwebvh-rs]] library provides the Rust implementation of this DID method, and the [[affinidi-webvh-service]] runs the infrastructure for hosting and resolving these DIDs at scale.

### Layer 2: Key Management and Signing

Your DID is backed by cryptographic keys, but managing keys securely is hard. The [[verifiable-trust-agent|Verifiable Trust Agent (VTA)]] solves this — it's an always-on service that manages your keys, signs things on your behalf, and can run inside hardware-isolated enclaves so your key material never touches an unprotected environment.

The VTA is the heart of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure (VTI)]]. It acts as a **signing oracle**: applications ask it to sign credentials, DID updates, or messages, and it handles the cryptography. All keys derive from a single seed phrase using [[bip32-key-derivation|BIP-32 derivation]], so backing up one mnemonic protects everything.

### Layer 3: Secure Communication

Participants communicate via [[didcomm|DIDComm v2]] — end-to-end encrypted messaging where the encryption is tied to your DID. Messages are routed through mediators, so participants don't need to know each other's IP addresses. The [[affinidi-tdk|Affinidi Trust Development Kit]] provides the messaging infrastructure, including a mediator service and support for the newer [[trust-spanning-protocol|Trust Spanning Protocol (TSP)]].

### Layer 4: Trust Credentials

Trust relationships are expressed as [[dtg-credentials-overview|Decentralized Trust Graph (DTG) Credentials]] — a family of Verifiable Credentials defined by the Trust over IP Foundation (spec v0.3). These fall into [[credential-categories|four functional categories]], with the foundational credentials being:

- **[[membership-credential|Membership Credentials]]** — proof of membership in a community that attests to you're being a real, unique person within that community
- **[[relationship-credential|Relationship Credentials]]** — directed trust attestations between two people (two VRCs, one each direction, form a complete edge)
- **[[endorsement-credential|Endorsement Credentials]]**, **[[witness-credential|Witness Credentials]]**, and **[[persona-credential|Persona Credentials]]** — annotations that strengthen existing relationships with skill endorsements, third-party attestations, and persona linking

These credentials form the [[decentralized-trust-graph|Decentralized Trust Graph]] — a web of verifiable claims that lets anyone trace trust paths between participants. Communities can federate into [[verifiable-trust-network|Verifiable Trust Networks (VTNs)]], and [[trust-registries|trust registries]] govern policy at each level.

### Layer 5: The User Experience

[[openvtc-cli|OpenVTC]] is the command-line tool (and TUI) that ties it all together for end users. It walks you through creating your identity, establishing trust relationships with others, and participating in trust communities. Behind the scenes, it orchestrates the VTA, DIDComm messaging, and credential issuance — but from the user's perspective, it's as simple as: set up your identity, connect with people you know, and build your trust network.

## The First Person Network

The ecosystem implements the **First Person Protocol**, described in the [First Person Project white paper](https://firstperson.network/white-paper). The vision is a world where your digital identity belongs to you, your trust relationships are verifiable by anyone, and no single organization can revoke your identity or gatekeep your participation.

The name "first person" is deliberate — this is identity asserted by *you*, not about you by someone else. You create your own DID, you host it on the domain of your choice, and the trust graph is built from mutual attestations between peers.

## Where Things Are Heading

As of April 2026, the ecosystem is in active early development with clear momentum toward production readiness:

- The **VTI/VTA** recently added hardware enclave support (AWS Nitro), a signing oracle, and an SDK integration module — making it consumable by third-party services
- The **WebVH service** just shipped v0.1.0 with production hardening, DIDComm authentication, and cold-start bootstrap tooling
- **OpenVTC** is at v0.1.x with a working CLI and TUI, focused on security fixes and developer experience
- **DTG Credentials** recently migrated to the OpenVTC organization and is being prepared for public release on crates.io
- The **TDK** is restructuring toward production readiness with TSP support, mediator hardening, and pluggable signing

The direction of travel is toward a fully self-contained, publicly deployable trust infrastructure that any community can adopt.

## Reading This Wiki

This wiki is organized into:

- **[[index|Index]]** — catalog of all pages
- **Concepts** — explanations of key ideas ([[decentralized-identifiers]], [[verifiable-credentials]], [[decentralized-trust-graph]], etc.)
- **Entities** — the projects and components ([[verifiable-trust-agent]], [[openvtc-cli]], [[affinidi-webvh-service]], etc.)
- **Sources** — summaries of each source repository

Start with the concepts if you want to understand the "why." Start with the entities if you want to understand the "what." The pages are heavily cross-linked — follow the threads that interest you.
