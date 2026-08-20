---
title: "VTA Topology — personal, community, local, cloud"
type: concept
tags: [vta, dtg, topology, pnm, spec, architecture]
date-updated: 2026-08-19
sources: [dtg-credential-spec, verifiable-trust-infrastructure, vta-browser-plugin, vti-setup]
---

# VTA Topology — personal, community, local, cloud

The [[dtg-credential-spec|DTG Core Credentials spec]] (v1.0 Working Draft 01, July 2026) imported a vocabulary for *where agents live and whom they represent* that had previously existed only in the external DTG Glossary. It matters because the spec's trust graph is not abstract: every [[decentralized-trust-graph|DTG node]] "is always identified by at least one DTG verifiable identifier and can be interacted with via a VTA." This page gives the terms one home and maps them onto the software that exists.

## Two Axes

A [[verifiable-trust-agent|Verifiable Trust Agent (VTA)]] is a digital agent that represents a DTG node; its network endpoint is discoverable via the node's identifier. The spec classifies VTAs along two independent axes:

**By what it represents**
- **Personal VTA** — represents a *person*.
- **Community VTA** — represents a [[verifiable-trust-community|Verifiable Trust Community]].

**By where it runs**
- **Local VTA** — on an edge device: phone, laptop, smart TV, car. A single-person user agent.
- **Cloud VTA** — server-based and highly available, so it can route private-channel messages while your phone is off. "Similar to webmail" for an individual; for a VTC, typically controlled by the Personal Network Managers or VTA networks of the community's members.

## Networks of Agents

One node is often served by several agents acting together — a **VTA network**:
- A **personal VTA network** might be a PNM app on your phone, a PNM on your laptop, and a cloud VTA hosted by a provider.
- A **community VTA network** is multiple community members — typically the **community trust anchors** — each running their own personal VTA networks on the community's behalf.

## The Personal Trio: PNM, PNV, Personal Trust Network

- **Personal Network Manager (PNM)** — the user agent that serves as a person's VTA for managing their trust relationships and trust tasks across communities and networks. May be local or cloud. "Also sometimes called a *VTA client*"; a VTA client may also serve as a **Community Network Manager (CNM)**.
- **Personal Network Vault (PNV)** — the person's digital vault/wallet for DTG credentials and signing keys, under their exclusive control, possibly delegated to a VTA.
- **Personal trust network** — the set of a person's DTG edges, managed through their PNM.

## Providers

A **Verifiable Trust Service Provider (VTSP)** provisions local VTAs, hosts cloud VTAs, operates [[trust-registries|trust registries]], and provides routing, queuing and notifications — and by serving many identifiers behind shared endpoints it enables *herd privacy*.

## Mapping to the Software

| Spec term | In the ecosystem today |
|-----------|------------------------|
| Cloud personal VTA | `vta-service` ([[verifiable-trust-infrastructure]]) — self-hosted per [[vti-setup]], or managed on the **VTA Farm** (vtafarm.firstperson.dev, open signup since July 2026; Kubernetes deployment docs coming) |
| Local personal VTA / PNM | the `pnm` CLI; the Authenticator + PNM mobile apps on `vta-mobile-core` (e.g. the iOS `vta-mobile-agent`); the [[vta-browser-plugin|VTA Wallet browser plugin]] (`@openvtc/pnm-core`) |
| Personal Network Vault | the VTA's credential vault (`vta-vault`) and key store (`vta-keys`), presented through the PNM surfaces |
| Community VTA / CNM | `vtc-service` + the `cnm` CLI and admin UI; [[openvtc]] acts as the member-side client |
| VTSP | the project's own hosted stack (VTA Farm, mediator, DID hosting) — and, by design, any operator who stands up [[vti-setup]]'s sysop stream |
| VTA network endpoint | the `#tsp` / `#didcomm` / `#rest` services in the DID document (capability discovery is DID-document-driven; TSP preferred) |

## Why the Vocabulary Matters

The split clarifies several design choices that otherwise look arbitrary: why the VTA is an *always-on* service rather than a wallet app (a cloud VTA has to be reachable when the phone isn't); why the mobile apps and the browser plugin are *thin* (they are PNMs over a VTA, not VTAs themselves); why a community's keys are held by people's agents acting together rather than by one server (a community VTA network); and why a **witness** in a [[witness-credential|VWC]] can be "a VTA acting according to VTC policy" rather than only a person.

See also: [[verifiable-trust-agent]], [[verifiable-trust-community]], [[decentralized-trust-graph]], [[did-types]], [[first-person-network]]
