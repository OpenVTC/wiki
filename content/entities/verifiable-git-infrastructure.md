---
title: "Verifiable Git Infrastructure (VGI) — commit trust for DIDs"
type: entity
tags: [vgi, git, signing, ci, trust-registry, know-your-developer, secondary, cypress]
date-updated: 2026-08-19
repo: https://github.com/OpenVTC/verifiable-git-infrastructure
---

# Verifiable Git Infrastructure (VGI)

*Repo: [github.com/OpenVTC/verifiable-git-infrastructure](https://github.com/OpenVTC/verifiable-git-infrastructure)*

VGI is the **git layer** of the OpenVTC stack — "the git-layer sibling of [[verifiable-trust-infrastructure]]" — and the most direct realisation so far of the **Know Your Developer** problem the whole ecosystem was started to solve (see [[first-person-network]]). It lets a contributor sign git commits with a key held in their [[verifiable-trust-agent|VTA]], and lets a project's CI ask a community's [[trust-registries|Trust Registry]] whether that DID is authorised to sign for this repository *right now*. The README's slogan: **"VGI verifies, the VTC decides."**

## Why It Exists

Conventional git signing (GPG, SSH keys) binds a commit to a *key*, not to an identity that anyone governs. Onboarding or revoking a contributor means editing allowed-signers files in every repo, and nothing ties the key to a real, accountable person — exactly the gap a sock-puppet or a compromised account slips through. VGI moves the policy out of the repo and into the community: the signing key lives in a VTA (never on the laptop), the commit names its signer by DID, and authorisation is a live Trust Registry query scoped to the repo. Take a contributor out of the registry and their next commit fails CI everywhere at once.

It is deliberately *not* a generic git-signing library: you need a VTA to sign and a registry to verify against.

## Components

Rust workspace (edition 2024, MSRV 1.95), all crates at **0.4.5** (the `Cypress` release, [[coordinated-releases]]):

| Crate | Role |
|-------|------|
| **vgi-core** | Dependency-light primitives: SSH-signature (`PROTOCOL.sshsig`) encoder, git commit-object handling, Ed25519 key extraction from DID documents. No network, keyring, or VTA. |
| **did-git-sign** | The signer, installed as git's `gpg.ssh.program`. `did-git-sign init --vta-did …` resolves the VTA, mints a temporary admin did:key, prints the `pnm contexts create …` command for the operator to authorise, then sets `gpg.format=ssh`, `commit.gpgsign=true` and — load-bearing — `user.email = <DID#key-id>`, the only place a commit names its signer. Refuses to sign when the committer DID and the selected key disagree; writes every attempt to an audit log. Key selection: `DID_GIT_SIGN_KEY` env → `did-git-sign.key` git config → config file (git `includeIf hasconfig:remote.*.url` recommended for people in several communities). |
| **verify-trust** | The CI verifier binary. Depends on vgi-core, a DID resolver ([[affinidi-tdk]]), `trql-client` (TRQP query client) and `vta-sdk` with only the `agent-names` feature for display names. Never opens a VTA session or keyring. |

### The GitHub Action

`.github/actions/verify-trust` (composite) downloads a prebuilt `verify-trust` (Linux x64, macOS arm64/x64, Windows x64 — no Rust toolchain on the runner) and runs it over a commit range. For every commit: it must carry a `gpgsig`; the committer must be a DID; that DID must resolve and publish the Ed25519 key that signed; the signature must verify; and the registry must hold a grant for the TRQP tuple `(entity = DID, authority = VTC DID, action = git.commit.sign, resource = owner/repo)`. Inputs of note: `registry-did` (the endpoint is *discovered* from the registry's DID document, preferring TSP → DIDComm → HTTPS), `vtc-did`, `resource` (defaults to the repo — it alone scopes a signer), `fallback-resource` (an org-wide grant), `exempt-keyring` (an armoured PGP keyring so GitHub's own `web-flow` merge/squash key can pass — committed as `.github/trusted-platform-keys.asc`), `max-signers` (bounds the DID resolutions a PR can force), `resolve-agent-names`. Verdicts `trusted` / `exempt` pass; `unsigned`, `noSignerDid`, `unresolvedSigner`, `unknownKey`, `badSignature`, `unauthorized`, `registryUnavailable` fail — **fails closed at every layer, including registry outage**. The docs insist the check be a *required* status check.

## Relationship to OpenVTC

`did-git-sign` was born inside [[openvtc]] — auto-configured by its setup wizard since v0.1.6, per-repo persona selection under multi-community (T8) — and the verify side landed there first too (openvtc #152 verify-trust, #154 PGP exemption keyring + Action packaging, #155 org-fallback grants + committed web-flow keyring, July 2026). VGI was then extracted with history (first commit 2026-07-18) and openvtc #159 dropped the vendored crate to consume the published one (0.4.5 at Cypress), pinning the Action for its own dogfooding CI (#160). A standing obligation is recorded in both repos: VGI's `vta-sdk` line must track OpenVTC's, or two `vta-sdk` copies land in the OpenVTC binary.

## Recent Development

- **v0.1.1 — 2026-07-18** — workspace import, release pipeline, download-based Action, crates.io trusted publishing, per-crate READMEs. **v0.1.2 — 07-25** — signers reported by agent name.
- **v0.4.0 — 2026-07-26** — three breaking PRs (#12–#14): derive the signer set from the commits themselves and drop the `.did-signers` file; discover the registry endpoint from its DID and name the VTC; write `user.email` as the signing DID with a sign-time guard. **v0.4.1** (same day) — security hardening: atomic `allowed_signers` writes, host parsing before any cleartext-to-loopback decision, a triage record under `docs/security/`.
- **v0.4.2 → v0.4.5 — 2026-08-10 → 08-17** — dependency lockstep with the VTA stack: trust-tasks-rs 0.4, vta-sdk 0.23 / 0.24 / 0.25, trql-client 0.13 → 0.14 (collapsing three trust-tasks copies). v0.4.5 is the `Cypress` snapshot; the repo also carries the shared `VTI-Cypress-RC-*` tags.
- **Direction**: stay in lockstep with vta-sdk; verify-trust currently only *constructs* HTTPS transport to the registry even though discovery prefers TSP/DIDComm.

See also: [[openvtc]], [[verifiable-trust-agent]], [[trust-registries]], [[verifiable-trust-community]], [[first-person-network]]
