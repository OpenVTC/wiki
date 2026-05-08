---
title: "Persona Credential (VPC)"
type: concept
tags: [credentials, dtg, persona, privacy, zkp]
date-updated: 2026-05-08
sources: [dtg-credential-spec, dtg-credentials]
---

# Persona Credential (VPC)

A Verifiable Persona Credential links a [[did-types|P-DID (Persona DID)]] to an existing relationship. It lets you selectively reveal a persona identity — potentially a pseudonymous one — to a specific counterparty.

## How It Works

The VPC is an [[credential-categories|Annotation Credential]] — it doesn't create new graph structure but attaches persona information to an existing relationship. The issuer is the P-DID itself, and the subject is the counterparty's DID.

This means: "I am revealing to you that this persona identity belongs to the same person you already have a relationship with."

## The "Banksy Maneuver"

The spec highlights a use case called the "Banksy Maneuver" — proving that you control a pseudonymous identity to a specific person, without revealing it to anyone else. For example, a developer known by their real name could prove to a trusted contact that they also control a well-known pseudonymous open-source identity, without publicly linking the two.

This is enabled by the DID separation in the [[did-types|DID taxonomy]]: your P-DID is distinct from your M-DID and R-DIDs, so linking them is a deliberate, selective act.

## Relationship to Pairwise ZKPs

The Banksy Maneuver is one application of the broader **pairwise ZKP** construction the DTG spec defines on the [[relationship-credential|VRC]] (§5.1). That construction lets a VRC holder selectively disclose chosen attributes — most usefully, the parties' P-DIDs — while hiding the underlying R-DIDs that constitute the private pairwise channel. The VPC is what makes the disclosed P-DID *meaningful* to a counterparty as a persona link, layered on top of the cryptographic primitive provided by the pairwise ZKP. See [[zero-knowledge-proofs]] for the broader framing.

See also: [[zero-knowledge-proofs]], [[did-types]], [[credential-categories]], [[dtg-credentials-overview]]
