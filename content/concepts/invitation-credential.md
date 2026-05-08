---
title: "Invitation Credential (VIC)"
type: concept
tags: [credentials, dtg, invitation, onboarding]
date-updated: 2026-04-09
sources: [dtg-credential-spec]
---

# Invitation Credential (VIC)

A Verifiable Invitation Credential authorizes the onboarding of a new member into a [[verifiable-trust-community|VTC]] or [[verifiable-trust-network|VTN]]. It's the bootstrap mechanism for bringing new participants into the [[decentralized-trust-graph|trust graph]].

## Who Can Invite

The issuer of a VIC depends on community policy:

- **For VTC membership**: the VTC's [[did-types|C-DID]], or an authorized member's M-DID (if the community allows member-initiated invitations)
- **For VTN membership**: the VTN's C-DID, or a member VTC's C-DID

This flexibility lets communities choose between centralized invitation (only the community itself can invite) and decentralized invitation (existing members can bring in new people).

## Role in the Ecosystem

VICs are [[credential-categories|Invitation Credentials]] — they bootstrap new participants but don't create persistent graph structure. Once the invitee completes onboarding and receives a [[membership-credential|Membership Credential (VMC)]], the invitation has served its purpose.

The [[verifiable-trust-agent|VTA/PEP]] processes invitation credentials during the onboarding flow.

See also: [[membership-credential]], [[credential-categories]], [[verifiable-trust-community]], [[verifiable-trust-network]]
