---
title: "DIDComm — DID-based Secure Messaging"
type: concept
tags: [didcomm, messaging, encryption, communication, mediators, federation, security]
date-updated: 2026-10-07
sources: [affinidi-tdk, verifiable-trust-infrastructure, openvtc, vti-didcomm-js, vta-browser-plugin, keyring-wallet]
---

# DIDComm — DID-based Secure Messaging

## What It Is

DIDComm (DID Communication) is a protocol for secure, private messaging between parties identified by [[decentralized-identifiers|DIDs]]. It is one of the two communication carriers of the OpenVTC ecosystem — how participants exchange relationship requests, credentials, and protocol messages — alongside the [[trust-spanning-protocol|Trust Spanning Protocol]], which the stack now prefers when both ends can speak it.

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

1. The sender looks up the recipient's DID Document to find their messaging endpoint (usually a mediator's DID — the ecosystem publishes the mediator's DID, not its URL, so a user's document is not coupled to a hostname) and vets that endpoint against its egress policy before dialling it
2. The sender encrypts the message using the recipient's public key (authcrypt — authenticated encryption; anoncrypt-only envelopes are refused by default)
3. The encrypted message is wrapped in a `routing/2.0` forward envelope addressed to the mediator by DID
4. The mediator live-streams it if the recipient is connected at that instant, otherwise stores it until the recipient collects it (message-pickup 3.0) — and, if the recipient is homed on another mediator, relays it there
5. The recipient decrypts the message using their private key and acknowledges it only after durably handing it off

The [[openvtc|OpenVTC]] TUI keeps one listener per persona on the TDK's reliable delivery layer (the separate `openvtc-service` daemon was retired in mid-2026), processing protocol requests like relationship proposals and VRC exchanges as they arrive.

## Mediators

A mediator is a relay service that holds encrypted messages for recipients who aren't always online. The [[affinidi-tdk|Affinidi TDK]] provides a mediator implementation with production features like circuit breakers, per-IP and per-DID rate limiting, graceful shutdown and an `explicit_allow` ACL mode that gates authentication itself.

Mediators see message metadata (who is sending to whom, when, message size) but cannot read message content. For stronger metadata privacy the ecosystem's answer is not a DIDComm feature but TSP's nested routing (see below).

### Reliability and pickup (mid-2026)

Two things changed about how the ecosystem *uses* mediators in mid-2026. First, **reliability became explicit**: the TDK's `affinidi-messaging-delivery` layer gives senders a durable outbox with delivery evidence and receivers an ack-only-after-durable-handoff rule, fixing a class of silently lost messages (a send that returned `Ok` with no socket; a message deleted at the mediator before the handler ran). A mediator live-streams only to a recipient connected *at that instant* and otherwise stores the message — so clients now also **collect stored mail on every connect** (message-pickup 3.0) rather than waiting to be pushed; OpenVTC v0.3.0 is the visible result. Second, **authentication tightened**: the TDK's SDK rejects unauthenticated (anoncrypt-only) envelopes by default and enforces `from == skid`.

### The addressing contract: DID-addressed, no keylist

A question from a downstream transport binding prompted the mediator to write down what it had only ever implied (`docs/mediation-and-routing.md`, September 2026): **DIDComm v2 on this mediator is DID-addressed and has no keylist.** A `routing/2.0` forward names its next hop as a DID; the mediator hashes that DID, finds the account, and delivers — there is no verkey, no routing key and nothing a keylist could populate. A v2 client registers nothing before it can receive; the mediator creates the account itself on first forward or on authentication. This is why `coordinate-mediation` is deliberately *not* in the advertised protocol set, and a test (`coordinate_mediation_is_not_advertised`) makes adding it a visible decision. The keylist exists only for **DIDComm v1** (Aries RFC 0019), which the mediator learned in August 2026 for interop with Aries/Credo-lineage wallets — a v1 envelope carries no DID, so `coordinate-mediation/1.0` keylist-update is how a wallet manufactures a stable identifier the mediator can route to. What *does* gate reachability is the ACL: `RECEIVE_MESSAGES`, `RECEIVE_FORWARDED`, and `local_direct_delivery_allowed`.

### One refusal to rule them out: `delivery.refused`

Since mediator 0.25.0 (the TSP Rev 3 release) **every refused delivery answers the same way** — `delivery.refused`, "Message not accepted for delivery", HTTP 403 — over DIDComm and TSP alike. Five earlier problem codes were retired because each told an unauthenticated sender something it had no business learning: whether a DID has an account here and, if so, which ACL rule turned it away. Distinguishing them was a probing oracle. The real reason is still logged against the session for operators.

### Multi-mediator federation

"Multi-mediator" means two different things and only one is federation: a *cluster* is several mediator processes sharing one Redis, one DID and one account store; a *federation* is several **independent** mediators, each with its own DID, accounts and operator, relaying to each other so a user homed on mediator A can reach a user homed on mediator B. Federation had worked on paper since June 2026 and failed in production at Dogwood — with the default `RelayMode::Blind` a mediator refused *every* relayed message as a session mismatch, and the problem report it sent when abandoning a forward went out as bare plaintext that every authcrypt-only client discards — because it had never been written down. `docs/multi-mediator.md` (September 2026) now documents the two hop shapes (a *double forward* arrives at B as a forward and needs `RECEIVE_FORWARDED`; `send_to`'s *single forward* arrives as direct delivery and needs `local_direct_delivery_allowed`), how the sending mediator classifies a next hop as local, remote or indirect-by-DID (only one hop of indirection is followed; publish the mediator's DID, not its URL, in a user's service entry), **blind vs rewrap relay** (rewrap hides the original sender's key id from the wire and lets B identify and allow-list the relaying peer, but both sides must run it), the four accounts one cross-mediator delivery consults — including the non-obvious one, that the *peer mediator's* DID needs an account with `RECEIVE_FORWARDED` — and a symptom-to-cause table. "The shipped default grants neither forwarded bit, so it is not a federation configuration."

Two gaps that document exposed were then closed: an **inter-mediator relay over WebSocket** (0.22.2) that admits an anonymous relay hop only when the operator opted in and only for a socket offering the `relay-ack` subprotocol, answering each frame with a **`RelayAck`** carrying the mediator error code on refusal — a problem report cannot be packed to a relay session, which has no DID — with a bounded one-hour lifetime and raw-TSP mode forced off; and management Trust Tasks answered over TSP as well as DIDComm (0.22.3), so a TSP-only client can administer its own ACL.

### Egress policy: `affinidi-net-guard` and `net-guard`

Much of what a messaging client dials is named by data someone else controls: a mediator's REST, auth and WebSocket URLs come out of *its* DID document, a VTA's base URL is copied from one at onboarding, a `did:web` value names the host its document is fetched from, and an HTTP server names its own redirect target. Left unchecked, each is a server-side request forgery aimed at loopback, a private network or a cloud-metadata endpoint. The cross-repo **SEC-4045** review (September 2026) closed this in both language stacks:

- **`affinidi-net-guard`** (TDK, ADR 0006) — a leaf crate with no `affinidi-*` dependency, so [[didwebvh-rs]] and external clients can use it. `EgressPolicy::vet` checks scheme, userinfo, port, allow-list, special-use names (`localhost`, `*.local`, `*.internal`, `*.home.arpa`, single-label names) and literal addresses; a `GuardedResolver` refuses any DNS answer in non-routable space and pins the connection to the vetted addresses (closing DNS rebinding); and a `GuardedClient` disables proxies, follows no redirects and caps bodies — because `reqwest` never consults a custom resolver for an IP-literal host, and a proxy bypasses the resolver entirely. It now sits under the mediator's forwarding client, with a TLS-validation hard gate in release builds. Companion: **public-hosts-only DID resolution** by default for did:web and did:webvh, with one `HostPolicy::AllowPrivate` setting for local stacks.
- **`net-guard`** in [[vti-didcomm-js]] 0.8.0 — the browser has no DNS API and cannot inspect a redirect, so "which hosts may this client ever dial" is decided by literal before the fetch: `assertSafeEndpoint`, `guardedFetch`, a typed `BlockedEndpointError`, and a `netPolicy { allowInsecure, allowPrivate, allowHosts }` threaded through mediator resolution, auth, the WebSocket session, VTA REST auth and did:webvh resolution (which since 0.9.0 the library fetches itself, through the guard, and checks *before* an inbound frame's `skid` is resolved). 0.10.1 added single-label hosts and decimal/hex IP spellings. The [[vta-browser-plugin]] and [[openvtc]]'s `health` command use the same posture: mediator endpoints from DID documents are **host-restricted**, and the remaining browser gap — a public name resolving to a private address — waits on a pinned `allowHosts` list.

## DIDComm Authentication in VTI

The [[verifiable-trust-agent|VTA]] uses DIDComm for its authentication flow:

1. A client sends a DIDComm-encrypted challenge request
2. The VTA responds with a signed challenge
3. The client proves DID ownership by responding to the challenge
4. The VTA issues a short-lived JWT session token

This provides strong, decentralized authentication without passwords, API keys, or OAuth providers.

## DIDComm and TSP: Two Carriers, Not a Bridge

The [[affinidi-tdk|Affinidi TDK]] mediator also carries the [[trust-spanning-protocol|Trust Spanning Protocol]], and since mid-2026 the ecosystem's transport preference is **TSP > DIDComm > REST**. Through the Rev 2 era the mediator could *bridge* — re-pack a TSP message as DIDComm and back — so a TSP-only sender could reach a DIDComm-only recipient. **TSP Rev 3 (September 2026) removed the bridge**: Rev 3's ESSR signature makes a bridge "by construction a point where the message is decrypted and re-signed by someone who is not the sender", so it is unimplementable as specified. DIDComm and TSP are now **separate carriers on the same mediator**: same endpoint, same per-DID WebSocket, sniffed apart at ingress, federated across mediators by their own rules (a TSP routed hop is signed by the previous mediator and sealed to the next, so it needs no blind/rewrap choice) — but both ends of any one conversation must be on one protocol, chosen from what the peer's DID document advertises.

In practice that gives DIDComm three standing jobs: the protocol-message surface on the shared socket (TSP carries Trust Tasks; the split is deliberate), the fallback for any peer that does not advertise `TSPTransport`, and interop with the Aries/Credo world over DIDComm v1. A VTA can run TSP-only, and the stated long-term direction is to deprecate DIDComm — but nothing on that road is scheduled.

## As of Eucalyptus — Sender-Bound, Proof-Bound

The `VTI-Eucalyptus` release (2026-10-07) did not change what DIDComm is for, but it closed the last ways a DIDComm message could be *less* authenticated than the Trust Task inside it:

- **`from` is bound to the sender key.** An authcrypt envelope names a sender DID in `from` and a sender key in `skid`; nothing had forced them to agree. The TDK's `affinidi-messaging-didcomm` now binds the sender key id to the key actually used for decryption (#894, 2026-09-25 — new `*_bound` unpack APIs, `SenderKeyBinding` and `SignerKeyBinding` errors, and the key-only unpack paths refuse authcrypt); [[vti-didcomm-js]] 0.12.0 refuses an authcrypt message whose `from` is not the DID of its `skid` (`SenderMismatchError`), returns a `senderDid` from `unpack`, and hands its `MediatorSession` consumers a `VerifiedSender`; the VTA checks the same thing (VTI #1732) and the browser wallet threads the verified sender into task consent (#278).
- **Every Trust Task carries a document proof bound to its sender.** A DIDComm or TSP envelope proves who *sent* a message; it does not prove who *authored the document*, and the two can differ whenever a mediator, bridge or relay sits in between. Since VTI #1739 (2026-09-26) every DIDComm and TSP Trust Task reaching a VTA or VTC needs a Data Integrity proof on the document bound to the sender, and a Trust Task over DIDComm rides only the published binding envelope — a message typed as the task URI is refused (#1687; openvtc #372 followed on the client side, prompted by Keyring). This is the "signed, proof-bound" half of the release's one-line summary, and it is why the remaining REST management surfaces could be removed: an HTTPS `POST /v1/trust-tasks` carries the same signed document as a DIDComm one.
- **The mediator is a Trust-Task counterparty.** The TDK mediator now checks every Trust Task it receives, runs each once and *signs* its responses (#846–#849), and its operator functions — statistics, queue status, message list, get, delete and purge, config patch and reload, a per-account traffic monitor — are Trust Tasks (#850–#853 and later) driven by a new `mediator-console` TUI and a headless `mediator-admin`. Mediator 0.31.0 (#901, 2026-09-27) **removed the legacy administration**: the DIDComm `mediator/1.0` admin, account and ACL-management protocols, the REST `/admin/status`, `/purge/{folder}` and `/queue/status` routes, and the `security.legacy_admin_protocols` setting with them. vti-didcomm-js learned to treat the mediator as a Trust-Task counterparty in the same window (#26). At the tag the mediator is 0.37.0 and the messaging SDK 0.33.2.
- **Keyring speaks both versions through Credo.** The [[keyring-wallet|Keyring]] phone wallet runs on a credo-ts 0.7.1 snapshot that carries the DIDComm v2 pull request, and selects a carriage per Trust Task: DIDComm v1 (binding `didcomm-v1/0.2`, the Aries-lineage path through its own mediator), DIDComm v2 (binding `didcomm/0.2`, behind a developer flag that also turns on out-of-band 2.0 on `did:peer:2`), or TSP. For the VTA/VTC leg it talks to an Affinidi mediator the way every other client does — challenge, JWT, WebSocket, pickup 3.0 and `routing/2.0` forward — with its own transport rather than bundling vti-didcomm-js, and every document it asks over either carrier is signed.

See also: [[verifiable-trust-agent]], [[affinidi-tdk]], [[trust-spanning-protocol]], [[vti-didcomm-js]], [[vta-browser-plugin]]
