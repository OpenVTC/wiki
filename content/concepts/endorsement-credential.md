---
title: "Endorsement Credential (VEC)"
type: concept
tags: [credentials, dtg, endorsement, skills]
date-updated: 2026-04-09
sources: [dtg-credentials]
---

# Endorsement Credential (VEC)

A Verifiable Endorsement Credential lets one participant vouch for another's skills, competencies, or attributes. Unlike a [[relationship-credential|Relationship Credential]] (which says "I know this person"), an endorsement says "I can attest to this person's ability in X."

## What It Contains

Beyond the standard VC fields, an endorsement includes:
- **Endorsement type** — e.g., `SkillEndorsement`
- **Competency description** — what skill or attribute is being endorsed
- **Competency level** — optional proficiency rating

## Use in the Trust Graph

Endorsements add qualitative depth to the [[decentralized-trust-graph|Decentralized Trust Graph]]. A VRC tells you two people are connected; an endorsement tells you *what* one trusts the other to do. For the Know Your Developer use case, endorsements are how technical competence gets verified — not by a certification authority, but by peers who've worked with you.

See also: [[dtg-credentials-overview]], [[relationship-credential]], [[decentralized-trust-graph]]
