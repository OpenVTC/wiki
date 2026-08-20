---
title: "DIDComm — DID-based Secure Messaging"
type: concept
tags: [didcomm, messaging, encryption, communication]
date-updated: 2026-08-19
sources: [affinidi-tdk, verifiable-trust-infrastructure, openvtc]
---

# DIDComm — DID-based Secure Messaging

## What It Is

DIDComm (DID Communication) is a protocol for secure, private messaging between parties identified by [[decentralized-identifiers|DIDs]]. It's the communication layer of the OpenVTC ecosystem — how participants exchange relationship requests, credentials, and protocol messages.

The ecosystem uses **DIDComm v2**, which provides:

- **End-to-end encryption** — messages are encrypted from sender's DID keys to recipient's DID keys
- **Authentication** — the sender's identity is cryptographically proven
- **Routing** — messages can be relayed through mediators without the mediator reading the content
- **Protocol independence** — works over HTTP, WebSocket, Bluetooth, or any transport

## Why Not Just Use HTTPS?

HTTPS encrypts the transport, but the server can read your messages. DIDComm encrypts the *message itself* — even the mediator relaying your message can't read it. This is critical for a system where trust relationships are private and no central server should have visibility into who trusts whom.

DIDComm also decouples identity from infrastructure. With HTTPS, you need to know the recipient's server URL. With DIDComm, you only need their DID — the DID document tells you how to reach them, and mediators handle the routing.

## How It Works in OpenVTC

When two OpenVTC users interact:

1. The sender looks up the recipient's DID Document to find their messaging endpoint (usually a mediator)
2. The sender encrypts the message using the recipient's public key (authcrypt — authenticated encryption)
3. The encrypted message is wrapped in a forward envelope for the mediator
4. The mediator holds the message until the recipient polls for it
5. The recipient decrypts the message using their private key

The [[openvtc|OpenVTC service]] runs a background daemon that polls a mediator for incoming messages, processing protocol requests like relationship proposals and VRC exchanges.

## Mediators

A mediator is a relay service that holds encrypted messages for recipients who aren't always online. The [[affinidi-tdk|Affinidi TDK]] provides a mediator implementation with production features like circuit breakers, rate limiting, and graceful shutdown.

Mediators see message metadata (who is sending to whom, when, message size) but cannot read message content. For stronger privacy, future versions may support onion routing or mix networks.

Two things changed about how the ecosystem *uses* mediators in mid-2026. First, **reliability became explicit**: the TDK's `affinidi-messaging-delivery` layer gives senders a durable outbox with delivery evidence and receivers an ack-only-after-durable-handoff rule, fixing a class of silently lost messages (a send that returned `Ok` with no socket; a message deleted at the mediator before the handler ran). A mediator live-streams only to a recipient connected *at that instant* and otherwise stores the message — so clients now also **collect stored mail on every connect** (message-pickup 3.0) rather than waiting to be pushed; OpenVTC v0.3.0 is the visible result. Second, **authentication tightened**: the TDK's SDK now rejects unauthenticated (anoncrypt-only) envelopes by default and the mediator's `explicit_allow` ACL mode gates authentication itself. The mediator also learned **DIDComm v1** (forward, coordinate-mediation, pickup) in August 2026 for interop with Aries/Credo-lineage wallets.

## DIDComm Authentication in VTI

The [[verifiable-trust-agent|VTA]] uses DIDComm for its authentication flow:

1. A client sends a DIDComm-encrypted challenge request
2. The VTA responds with a signed challenge
3. The client proves DID ownership by responding to the challenge
4. The VTA issues a short-lived JWT session token

This provides strong, decentralized authentication without passwords, API keys, or OAuth providers.

## Trust Spanning Protocol (TSP)

The [[affinidi-tdk|Affinidi TDK]] also implements the **Trust Spanning Protocol (TSP)** — a newer, leaner alternative to DIDComm for certain use cases. TSP uses HPKE-Auth encryption and CESR binary encoding, offering a simpler protocol with strong security guarantees. It's specified by the Trust Over IP Foundation and may complement or partially replace DIDComm in future iterations of the ecosystem.

See also: [[verifiable-trust-agent]], [[affinidi-tdk]], [[trust-spanning-protocol]]
