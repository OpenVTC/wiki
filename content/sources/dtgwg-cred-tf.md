---
title: "Source: dtgwg-cred-tf"
type: source-summary
tags: [source, primary, dtg, spec, trust-over-ip]
date-updated: 2026-04-09
repo: https://github.com/trustoverip/dtgwg-cred-tf
---

# Source: dtgwg-cred-tf

**Repo**: [trustoverip/dtgwg-cred-tf](https://github.com/trustoverip/dtgwg-cred-tf)
**Type**: Primary (authoritative specification)
**Format**: Prose specifications in Markdown (no code)

## Summary

The Trust over IP Foundation's DTG Working Group Credential Task Force specification repo. Contains the authoritative specification for Decentralized Trust Graph credentials (v0.3, early draft), a use cases catalog, and the Witnessed VRC Exchange protocol (v0.2).

This is the definitive source for DTG credential semantics, overriding implementation-level interpretations.

## Contents

- **`dtg.md`** — Core specification: credential type hierarchy, DID taxonomy, credential subjects, W3C VC v1.1/v2.0 support, personhood definition, trust registry references
- **`use_cases.md`** — Structured use cases: identity/sybil resistance, social capital, competence/reputation, persona management, advanced composite proofs
- **`witnessed_vrc_flow.md`** — Five-phase Witnessed Session-Based VRC Exchange protocol (v0.2)
- **`README.md`** — Index linking to spec, external documents (First Person Project Whitepaper, VTC Bootstrapping Process, DTG Glossary)

## Key Wiki Pages Generated/Updated

- [[credential-categories]] — The four functional categories (Edge, Invitation, Annotation, VDS)
- [[did-types]] — The formal DID taxonomy (C-DID, M-DID, R-DID, P-DID, W-DID)
- [[trust-registries]] — Governance layer that determines PHC status and policies
- [[verifiable-trust-network]] — VTN concept (VTN → VTC hierarchy)
- [[witnessed-vrc-exchange]] — The five-phase witnessed exchange protocol
- [[persona-credential]] — VPC and the "Banksy Maneuver"
- [[invitation-credential]] — VIC with issuer policy details
- Updated: [[personhood-credential]], [[membership-credential]], [[relationship-credential]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], and others

## Recent Activity

Most recent commits: January 14, 2026 (v0.3 alignment with new VTC glossary and bootstrapping document). No commits since. The spec remains an "early draft" at v0.3.
