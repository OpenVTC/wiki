---
title: "Persona Credential (VPC)"
type: concept
tags: [credentials, dtg, persona, privacy]
date-updated: 2026-04-09
sources: [dtgwg-cred-tf, dtg-credentials]
---

# Persona Credential (VPC)

A Verifiable Persona Credential links a [[did-types|P-DID (Persona DID)]] to an existing relationship. It lets you selectively reveal a persona identity — potentially a pseudonymous one — to a specific counterparty.

## How It Works

The VPC is an [[credential-categories|Annotation Credential]] — it doesn't create new graph structure but attaches persona information to an existing relationship. The issuer is the P-DID itself, and the subject is the counterparty's DID.

This means: "I am revealing to you that this persona identity belongs to the same person you already have a relationship with."

## The "Banksy Maneuver"

The spec highlights a use case called the "Banksy Maneuver" — proving that you control a pseudonymous identity to a specific person, without revealing it to anyone else. For example, a developer known by their real name could prove to a trusted contact that they also control a well-known pseudonymous open-source identity, without publicly linking the two.

This is enabled by the DID separation in the [[did-types|DID taxonomy]]: your P-DID is distinct from your M-DID and R-DIDs, so linking them is a deliberate, selective act.

See also: [[did-types]], [[credential-categories]], [[dtg-credentials-overview]]
