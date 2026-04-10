---
title: "Membership Credential (VMC)"
type: concept
tags: [credentials, dtg, membership, community, personhood, edge]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf, dtg-credentials]
---

# Membership Credential (VMC)

A Verifiable Membership Credential establishes a **node** in the [[decentralized-trust-graph|Decentralized Trust Graph]]. It proves that an entity belongs to a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]].

VMCs are [[credential-categories|Edge Credentials]] — they create graph structure. The issuer is a [[did-types|C-DID]] (the community's DID); the subject is an [[did-types|M-DID]] (a member's DID) or another C-DID (when a VTN grants membership to a VTC).

## Dual Purpose

VMCs serve two functions:

1. **Community membership** — proving you belong to a specific community, enabling community-level policies (who can endorse, what trust thresholds apply)
2. **Personhood attestation** — when the issuing community's governance enforces real human personhood and one-membership-per-person rules, the VMC qualifies as a [[personhood-credential|Personhood Credential (PHC)]]

Whether a VMC is a PHC is determined by the community's [[trust-registries|trust registry]], not by any structural difference in the credential. See [[personhood-credential]] for details.

## VTN Membership

VMCs also express the relationship between [[verifiable-trust-network|VTNs]] and VTCs. A VTN issues a VMC to a VTC's C-DID, proving the community is a recognized member of the network. This enables hierarchical trust structures.

See also: [[personhood-credential]], [[trust-registries]], [[verifiable-trust-community]], [[verifiable-trust-network]], [[credential-categories]]
