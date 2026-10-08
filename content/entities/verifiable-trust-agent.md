---
title: "Verifiable Trust Agent (VTA)"
type: entity
tags: [vta, vti, key-management, signing-oracle, infrastructure, primary, mobile, tsp, mdoc, post-quantum, audit, dogwood, eucalyptus, trust-tasks, key-custody]
date-updated: 2026-10-07
---

# Verifiable Trust Agent (VTA)

*Part of [github.com/OpenVTC/verifiable-trust-infrastructure](https://github.com/OpenVTC/verifiable-trust-infrastructure)*

The Verifiable Trust Agent is the central service of the [[verifiable-trust-infrastructure|Verifiable Trust Infrastructure]]. It's an always-on key management and signing service that handles the hardest part of decentralized identity: keeping cryptographic keys secure while making them usable.

## What It Does

The VTA is a **signing oracle** — applications send it data to sign, and it returns signatures. The private keys never leave the VTA's security boundary. This means applications that need to issue [[verifiable-credentials|credentials]], update [[decentralized-identifiers|DIDs]], or send authenticated [[didcomm|DIDComm messages]] don't need to manage keys themselves.

Key capabilities:
- **Key generation and derivation** — keys derive from a single BIP-39 seed via [[bip32-key-derivation|BIP-32]] (Ed25519, X25519, P-256, and since September 2026 **ML-DSA-44 / ML-DSA-65 post-quantum keys**, each record carrying the algorithm it was minted with); the VTA can also hold **non-extractable internal keys** (no derivation path, never exported, excluded from backup), **imported** Ed25519 keys for deterministic did:keys, and any key can be marked `exportable: false` so it can only ever be *used*. Since October 2026 **key custody is a stated rule set** (`vta-keys/src/custody.rs`, `docs/05-design-notes/key-custody.md`): a context's key derives from that context's base and no other, only a super-admin may choose a derivation path, `m/26'/9'` is the sign-only delegated-identity subtree, seed state is instance-wide, and the rules are checked at *use* so a planted record is inert
- **Signing oracle** — sign payloads on behalf of applications without exposing keys, behind a three-gate authorization model (caller context scope → resource-bound `signable_keys` policy → unscoped keys super-admin-only), narrowable per actor with `allowedKeys` and gated by the `sign` capability on every transport; opaque payloads are **domain-separated** so a signature obtained for one purpose cannot verify as something else, and every use leaves an audit row. **`keys/sign-sshsig`** (October 2026) signs a git commit as an SSHSIG statement in a named namespace — the VTA builds the `PROTOCOL.sshsig` signed data itself under a constrained `sign-sshsig` capability — so `did-git-sign` no longer exports a key per commit
- **Key material never leaves over a hop-by-hop channel** — `keys/export-secret`, `vta/contexts/secrets`, backup export and the TEE mnemonic window all require the `key-export` capability and a channel confidential to the two parties (DIDComm, TSP or the on-host CLI); private keys are not released over REST or the HTTPS binding at all, and the audit row is written durably *before* the material is returned
- **DID management** — create and manage [[did-webvh|did:webvh]], did:key and did:peer identifiers from templates (did-templates 2.0 and 3.0, the latter declaring which algorithms each key slot uses), including human-readable **agent names** (`example.com/@alice`) claimed in `alsoKnownAs`; minting needs the `KeyMint` capability rather than admin; `webvh/dids/create/1.1` *tells* a client its DID is `serverless` (exists only until the caller serves the first log entry); key rotation rotates each verification method in place with its own algorithm; deleting a DID or a context subtree cascades, refuses or revokes across everything that referenced it — including the hosted copies on did:webvh servers — after a preview of the whole set
- **Four holder stores** — the **secrets vault**; the **credential vault** (receive, store, verify and present W3C Data Integrity, BBS, SD-JWT and ISO mdoc credentials over DIDComm/TSP credential-exchange and OID4VP); versioned, namespaced **application state** (`vta/app-state/*`); and the **persona store** (`persona/*` — the holder's own attributes, the *faces* projected over them, the *worlds* that arrange them, disclosure history, behind a one-way boundary a context cannot read across; since Eucalyptus a face is composed in the context that asks for it, has named slots, can be worn without naming a persona DID, retired, and bound until a date). Plus per-context **agent memory** with separate read/write grants
- **Session management** — DID-keyed sessions; EdDSA JWTs for sessions, with pre-session auth (`auth/challenge`, `authenticate`, `refresh`) itself served as Trust Tasks on `/trust-tasks`; every authenticated client carries an identity, signs what it sends, and verifies the signed reply; **refresh-token reuse is detected** (a replayed token revokes the session it belongs to, with a 30-second grace for a client whose rotation response was lost) and a superseded refresh token is retired when its DID logs in again; session and consent operations are scoped to the caller's authority
- **Access control** — role-based ACL (Super Admin → Admin → Initiator → Application → Reader → Monitor) with context scope, per-entry **capabilities that narrow within a role** (`key-export`, `key-mint`, `sign`, `sign-sshsig`, `persona-holder`, `MemoryRead`/`MemoryWrite`, …), and least-privilege approvers ("may approve" ≠ "may act"). **No principal can widen its own entry and no grant may exceed its granter** (VTI-ACL-052/053); `acl/swap-key` copies an entry exactly and only moves the subject
- **Approvals** — one runtime-manageable approvals model (`pnm approvals`) driven by Rego policy rules: step-up, task-execution consent pushed to approver devices (signed, and verified on-device) or answered from `pnm consent`, and an offline break-glass; once a subject has enrolled a step-up passkey, only that passkey counts
- **Backup and restore** — **a backup is the whole agent** (`vta-backup-v2`): every backed-up keyspace, encrypted with Argon2id + AES-256-GCM (15-character minimum password), written owner-only, staged on import and applied on re-exec, and **portable between plain, hardened and Nitro-enclave VTAs** in every pairing; internal keys' records come back, their material never does; a DIDComm/TSP-only VTA backs up over chunked Trust Tasks
- **Audit logging** — a **hash-chained, verifiable** log with its own audit key; actors and DID-shaped targets are kept under a keyed hash so an erasure can null the plaintext while the chain still verifies; failed audit writes are reported, never swallowed; every custody or scope refusal is audited `denied` and logged with `security_alert = true`
- **Rate limiting** — three per-IP limiters (`auth`, `did-log`, `backup-blob`), tunable at runtime, with attributable 429s; `X-Forwarded-For` is honored only from explicit **trusted-proxy CIDRs**, walking the chain past every declared proxy

## Architecture

The VTA is built with Axum (Rust async web framework). Every operation is a **Trust Task** — a versioned JSON document with a canonical `trusttasks.org/spec/*` URI — and since the Eucalyptus release (October 2026) **every remote operation is a signed Trust Task, full stop**: the same document arrives over three bindings, and nothing else is served.

1. **[[trust-spanning-protocol|TSP]]** — preferred, at **Rev 3**, and **on by default** since #1622 (the setup wizard checks the mediator actually carries `TSPTransport` before minting): a VTA forms and persists §7.2.2 relationships with its peers, re-invites a stale one alongside the request, re-forms them after a silent drop, nests cross-mediator sends and replies so its own mediator never learns the recipient, and can run TSP-only
2. **[[didcomm|DIDComm v2]]** — encrypted messages via a mediator (the interop fallback); a Trust Task rides the `trusttasks.org/binding/didcomm/0.1/envelope` *only* — the old protocol-message surface typed as a task URI was removed in #1739/#1793
3. **HTTPS** — the Trust-Task HTTPS binding at `POST /trust-tasks`; the ~56 REST routes that had been marked superseded were deleted in #1858, and pre-session auth moved onto the same door. What remains as REST is a machine-checked `REST_EXCEPTIONS` table: the passkey verification-method routes (a browser driving a WebAuthn ceremony holds no DID key to sign with), `POST /bootstrap/request`, the backup blob, `openapi.json`, the TEE mnemonic window and `/metrics`

All inbound paths converge on one **dispatch spine** that enforces what each Trust-Task spec declares for itself — `recipient`, `proof`, audience binding, `issuedAt` within a ten-minute acceptance window (advertised over `trust-task-discovery/0.3`), a replay guard whose record lives exactly as long as that window, and idempotency-key deduplication so a retried request whose reply was lost cannot mint a second DID. Over DIDComm and TSP the document must carry a Data Integrity proof that verifies as its `issuer`, **and that issuer must be the transport's sender** — the transport alone authorizes nothing (#1739); a proof's key is checked against the relationship its `proofPurpose` names (#1752); the DID documents this relies on come from one bounded cache per node with a 60-second TTL and one re-resolution before a verification fails. A small set of **public tasks** (`PUBLIC_URIS`: attestation status/report, `vta/health/details`) may be sent with no identity and are machine-checked to be proof-optional and read-only. All *outbound* Trust Tasks go through one transport seam that picks TSP > DIDComm > HTTPS from what the peer advertises and the sender can actually do, and through a **durable push engine** that escalates on missing delivery evidence and re-issues a document as a new attempt once it outlives the acceptance window. **Every response, errors included, is signed with the VTA's operational key under `proofPurpose: authentication`**, and every client — SDK, mobile engine, CLIs — verifies it. Storage uses fjall, an embedded LSM key-value store, with AES-GCM at-rest encryption (TEE-derived keys in enclave mode; the `[hardened]` mode for non-TEE deployments since August 2026; operator-tunable memory settings since #1803). Since July 2026 the service is a thin "spine" over twelve subsystem crates (`vta-keys`, `vta-vault`, `vta-policy`, `vta-webvh`, `vta-tee`, `vta-backup`, `vta-persona`, …) — see [[verifiable-trust-infrastructure|Components]]. The whole surface is declared an implementation of the normative ToIP [VTI specification](https://trustoverip.github.io/dtgwg-vti-spec/), and the window's commits cite its requirement ids (`VTI-KEY-106`, `VTI-ACL-052`, `VTI-OPS-021`, …) in their titles.

### Application Contexts — now hierarchical

A key architectural concept is **Application Contexts** — logical namespaces that group keys and DIDs. Each context (e.g., "vta", "mediator", "my-app") gets its own BIP-32 derivation sub-tree, isolating keys between applications while deriving from the same master seed.

As of May 2026 contexts are **hierarchical**: a context ID *is* its `/`-separated path (max depth 8, e.g. `myorg/finance/payments`), with ancestry-aware ACL — parent-admin authority covers the entire subtree, so a top-level admin can authorise sub-context creation without per-context grants. Subtree delete supports cascade / refuse modes. See [[verifiable-trust-infrastructure|hierarchical contexts on the workspace entity]] for the slice-by-slice history.

### The VTA Seal

After initial bootstrap (via an interactive setup wizard, or `vta setup --from <file>` for scripted provisioning), the VTA "seals" itself — offline CLI commands that write are disabled (`vta tsp-relationships list` and the like still read), and all management must go through signed Trust Tasks over HTTPS, DIDComm or TSP. This prevents unauthorized local access.

## Deployment Models

### Local Development
```bash
cargo run --package vta-service --features setup -- setup  # Interactive setup
cargo run --package vta-service                             # Start the server
```

On macOS a VTA can run as a **LaunchAgent** under launchd (`deploy/macos/org.openvtc.vta.plist`, `docs/02-vta/macos-launchd.md`, October 2026) — an agent rather than a daemon because the default keyring backend is the login Keychain. Fjall's block cache, write buffer and journal are tunable (`[fjall]` / `STORAGE_FJALL_*`) so a containerized VTA stays inside a pod's memory limit.

### Hardware Enclave (AWS Nitro)
The VTA can run inside an AWS Nitro Enclave — a hardware-isolated virtual machine where not even the host operating system can access the VTA's memory. In this mode:

- Keys are unsealed via AWS KMS, pinned to the enclave's attestation (PCR0 + PCR8)
- Communication happens over vsock (virtual socket) rather than network
- Since August 2026 tenant config is **not baked into the enclave image**: one image / one PCR0 per fleet, the config envelope is delivered over vsock at boot and its digest is anchored in the attestation (`POST /attestation/config-report`)
- An 8-layer defense-in-depth security model protects key material; TEE anti-rollback via an external CAS counter; a KMS re-initialisation needs explicit `allow_kms_reinit` authorization whatever the failure class (September 2026)
- An enclave proxy handles external routing (it now resolves `nitro-cli` by absolute path with a scrubbed environment)
- An operator connecting `pnm` to a TEE VTA anchors the bootstrap **by DID and a pinned PCR0**, never by a guessed URL
- The attestation reads (`vta/attestation/{status,report,config-report}/0.1`) are **public Trust Tasks** over any transport since October 2026 — a verifier asks before it trusts the VTA, and the nonce bound into the evidence makes the report its own
- A backup taken on any kind of VTA restores into an enclave (and out of one): the restore reserves the DID's anti-rollback counter and re-baselines the integrity manifest at exactly that version, so a replayed stage is refused

A plain non-TEE container image (with `[hardened]` at-rest encryption) also exists since August 2026, and the personal-use path is a managed VTA on the **VTA Farm** — see [[vti-setup]], [[vtafarm]].

### Seed Storage Backends
The master seed can be stored in:
- OS keyring (default for development)
- AWS Secrets Manager / GCP Secret Manager / Azure Key Vault — seed reads are now **cached**, so KMS decrypt traffic scales with time rather than with request volume (a production VTA at ~22 req/s had been billing ~58M KMS requests a month)
- KMS (for enclave mode)
- Config file (not recommended for production)

## SDK Integration

Third-party services integrate with the VTA via the `vta-sdk` crate (0.25 at `Cypress`, 0.32 at `VTI-Dogwood`, 0.42 at `VTI-Eucalyptus-RC-0`, **0.64.2 at `VTI-Eucalyptus`**, 2026-10-07 — consumed by [[openvtc]], [[affinidi-webvh-service|did-hosting-service]], the [[affinidi-tdk|TDK]] mediator, [[verifiable-git-infrastructure|VGI]], [[vtafarm]], and the [[vta-browser-plugin]]'s generated type bindings):

```rust
// Simplified integration pattern
use vta_sdk::integration;

let vta = integration::startup(&config).await?;
let signature = vta.sign(payload).await?;
```

The SDK handles authentication, token refresh, secret caching, and offline fallback. Since Dogwood a client is constructed *with* its identity (`VtaClient::authenticated(url, identity, token)`), signs every Trust Task it sends, verifies the signed reply, holds one idempotency key across the attempts of an operation (`VtaClient::idempotent`), vets a DID-advertised endpoint before sending a token to it, and re-forms a dropped TSP relationship on a reply timeout. Wire types are generated from the published Trust-Task specs and are `#[non_exhaustive]`, so adding a field is no longer a semver break. Since Eucalyptus the client has **one Trust Task surface** — there is no protocol-message leg and no `rpc` — a proof is verified against the relationship its `proofPurpose` names (`PurposeVmResolver`), `PUBLIC_URIS` names the tasks a caller may send with no identity, `vta_sdk::task_consent` builds and verifies consent decisions, and `VtaClient::sign_sshsig` signs a git commit. This is the recommended way for services in the ecosystem (like the [[affinidi-webvh-service]]) to interact with the VTA.

## Recent Development

Per-release detail lives on the workspace entity — see [[verifiable-trust-infrastructure|the workspace entity]] for the full activity log. VTA-relevant highlights, reverse chronological:

### Eucalyptus — 2026-09-18 → 10-07 — one signed door, custody rules, TSP by default

The **`VTI-Eucalyptus`** tag (2026-10-07; `vta-service` **0.56.0** / `vta-sdk` **0.64.2** / `pnm-cli` **0.36.0**, up from 0.34.0 / 0.43.0 / 0.17.3 at the 09-18 interim — the jumps are the release guard's doing, not a rewrite) closes the arc RC-0 opened. For the agent itself the final window was about the *door* rather than the *stores*: every remote operation became a signed Trust Task over TSP, DIDComm or HTTPS, the REST routes went away, a document's own proof became the only authority, and a review of who could reach the seed closed four custody holes. Full detail, PR by PR, is on [[verifiable-trust-infrastructure|the workspace entity]]; what changed for the VTA:

- **The REST surface is gone (09-27 → 10-01).** Health, restore status, session revoke and the wrapping key (#1790), attestation reads as *public* Trust Tasks (#1776), service management (#1782), `provision/integration` as one task over any transport (#1785), the DID-hosting service reached with Trust Tasks only — the REST client and DID-auth handshake deleted, `vta-webvh` is the store only (#1789), the legacy backup and webvh surfaces removed (#1783), `/cache` and `/acl/swap` removed (#1786), and then **#1858 (breaking): ~56 superseded REST routes deleted, pre-session auth on `/trust-tasks`**. The SDK has **one Trust Task surface** — `protocol_message_transport` and `rpc` are gone (#1793, breaking); the mobile engine, cnm, pnm and vta-mcp were already Trust-Task-only. `pnm` is usable from a script (#1753, breaking); `pnm` context ids are paths and `--parent` is gone (#1848, breaking).
- **A document's proof is the authority (09-26).** Every DIDComm and TSP Trust Task needs a proof that verifies as its `issuer`, and the issuer must be the sender (#1739, breaking); the sender-authorized protocol-message arms — key/seed/context/ACL/audit/config management, backup, `did-management/1.0/*`, step-up approve-request — are removed. Every response is signed with the **operational key under `authentication`** (#1740, VTI-KEY-106); a proof's key is verified against its `proofPurpose` (#1752, breaking); an approver's decision needs `assertionMethod` (#1757); `vta-mobile-core` signs every request under `authentication` and **verifies every reply, errors included** (#1744 — the app side is `vta-mobile-agent-ios`). One bounded DID cache per node, 60 s TTL (#1737); authcrypt `skid`/`apu` bound to the key used (#1732); a resolver failure told apart from a bad proof on the caller side (#1748); a signed REST sign-in must name the service that receives it (#1646).
- **Key custody (09-21 → 09-26).** FTL-29904 — a context-scoped admin could rotate the instance seed — turned out to be one of four holes with one shape: gates asked about the caller's role, never the path or key it named (#1715, breaking; `key-custody.md`). The sweep that followed scoped sessions and consent grants (#1717), step-up approval, audit verify, policy reads and device management (#1720); applied `key-export` and `sign` on every transport — **private keys never over REST/HTTPS** (#1733, #1743, breaking); `key-export` is its own capability and minting needs `KeyMint` (#1619); `contexts/secrets` requires `KeyExport` (#1634); **no principal widens its own entry, no grant exceeds its granter**, `swap-key` copies exactly (#1738, breaking); **refresh-token reuse detection** (#1650) and superseded-token retirement on re-login (#1683); no derived `Debug` over secrets, held by a census (#1711); `persona-holder` granted, never inherited (#1673); webvh keys rotated in place with their own algorithms (#1734, breaking); a deactivated did:webvh no longer resolves (#1881, the public `SEC-4045` thread).
- **A backup is the whole agent (09-22).** `vta-backup-v2` walks every `BACKED_UP` keyspace — ten had never been exported — stages the import, commits the seed, re-execs, and **restores between plain, hardened and Nitro VTAs** in all eight pairings; a TEE restore had never actually taken effect (#1655, breaking; `docs/02-vta/backup-restore.md`). `pnm vta mnemonic open` decrypts a sealed mnemonic bundle locally (#1878).
- **TSP by default, and a push engine (09-21 → 10-06).** `tsp` is a default feature of vta-service and vta-enclave and setup checks the mediator carries it (#1622, breaking); a minted DID advertises TSP when the mediator can route it (#1665); device pushes ride the shared **durable push engine** (#1767) that re-issues a document as a new attempt past the acceptance window (#1799) and advertises that window over discovery 0.3 (#1817); an idle relationship is re-invited alongside the request after the browser wallet timed out at 30 s (#1816); `vta tsp-relationships {list,reset,delete}` offline (#1812); relationships and replies with peers on *another* mediator (#1873, #1880, #1894); rate-limited TSP replies retried (#1906); the **inbox watch** notices a receive leg that stopped delivering and reconnects it (#1978, #1979, breaking).
- **Git commit signing.** **`keys/sign-sshsig/0.1`** (#1957): the VTA builds the SSHSIG signed data itself and signs under a constrained `sign-sshsig` capability, so `did-git-sign` stops exporting the persona's key on every commit — the domain-separated oracle had made that the only way. Consumed by [[verifiable-git-infrastructure]].
- **Persona: faces composed where they are asked for (09-21 → 09-23).** Nine breaking `feat(persona)!` commits implementing `persona-context-first.md`: entry slots (#1605), pinned values kept through an edit (#1606), **compose a face in the context that asks for it** and promote a local value (#1623), retire/reinstate and bindings that end on their own (#1628), where a face may be worn (#1635), derived provenance (#1639), credential-backed values failing closed (#1653), **wear a face without naming a persona DID** (#1654), and **worlds** with a narrow `attribute/get` (#1690); `pnm persona` reaches worlds and the claim-type registry (#1663). `vta-persona` 0.3.9 → 0.17.0.
- **Operator surface.** `webvh/dids/create/1.1` states `serverless` (#1886, breaking); a context delete previews its whole subtree and deletes hosted DIDs off their servers (#1576, #1577, breaking); `contexts/update-did/1.1` clears a context's DID (#1828); fjall memory tuning for pods (#1803); a VTA as a **macOS LaunchAgent** (#1704); `pnm vta qr` (#1700); `pnm messaging grant` and `pnm messaging console` as a VTA-managed DID (#1686, #1626); `pnm consent` answers this VTA's consent requests (#1761); trusted-proxy CIDRs replace the XFF flag (#1562, breaking config); a boot warning when approval rules exist but enforcement is off (#1633); the holder grant hint names `persona-holder` (#1885); mediator ACL provisioned during DIDComm enable and update (#1843).

### Dogwood and the Eucalyptus RC — August–September 2026

The VTA went through two milestone tags in a month ([[coordinated-releases]]). **`VTI-Dogwood`** (2026-08-30; `vta-service` 0.23.3 / `vta-sdk` 0.32.2; re-cut as **`VTI-Dogwood-R1`** on 09-01 at 0.23.4 / 0.32.3 with five "say the right thing" fixes) was deliberately silent — no GitHub Release — because its content is invisible to a user and essential to anyone building on the VTA: the wire became *honest*. **`VTI-Eucalyptus-RC-0`** (2026-09-17; 0.33.0 / 0.42.1; HEAD 0.34.0 / 0.43.0 the next day) is the loud one — post-quantum keys, TSP Rev 3, a hash-chained audit log, and the VTA becoming the holder's whole agent.

- **Dogwood: the wire is honest.** The dispatch spine enforces what each spec declares — `recipient`, `proof`, audience, `issuedAt` (#1146), framework-0.5.0 freshness and replay bounds (#1117, #1126/#1127) — and error messages stop being a probing oracle (#1130). Retries are safe: keyed Trust Tasks dedup on an `idempotencyKey` held across attempts (#1011/#1012; `retry-and-idempotency.md`). Every client has an identity and signs (#1147), and **any DID that names a key may sign** — the `did:key`-only restriction that had locked provisioned did:webvh integrations out of all 210 proof-requiring tasks is gone (#1193). Task coverage measured at 102 of 109 specs (#1151); three response-shape defects found by validating real responses (#1114). A third store, **application state** (#1051); `vta/services` as a task family superseding twenty REST routes (#1017); canonical capability discovery (#1042); DID deletion cascade with dry-run (#1198/#1199).
- **Signed responses, verified replies.** Both services sign success responses (#1335) and `VtaClient` verifies every reply (#1341); the phone verifies the consent prompt, not just the step-up one (#1324).
- **Post-quantum.** `KeyType::{MlDsa44, MlDsa65}` (#1502) derived from the BIP-32 chain (#1505); key records carry their algorithm (#1532); templates declare per-slot algorithms and a third key slot (#1530, #1554); did-templates 3.0 accepted alongside 2.0 (#1538); `pnm keys create` for a PQ key (#1535). Hybrid (multi-proof) credential issuance and verification landed on the VTC side (#1548–#1557).
- **TSP Rev 3.** Flag-day adoption (#1512); Trust Tasks in the TSP binding envelope (#1478); relationships persisted (#1531), formed before sends and pings, answered (#1525) and re-formed after silent drops on client and server (#1544, #1549); **one outbound path** for every Trust Task chosen from the peer's advertisement (#1474, #1483); cross-mediator sends nested for metadata privacy (#1559); the transport seam selects by the sender's *live* capability, fixing the post-Dogwood VTC-setup regression (#1560).
- **Security sprint (09-10 → 09-12).** Hash-chained audit log with its own non-derived key and a verifier (#1419–#1421), failed audit writes reported and the signing oracle audited (#1443); **domain-separated opaque signing** (#1417); `exportable` keys and `keys/export-secret` replacing `seeds/export-mnemonic` (#1401, #1404, #1407); DID-advertised endpoints vetted and tokens bound to origin (#1436); did:webvh resolution refused to non-public hosts (#1448); `/auth/challenge` no longer discloses enrolment (#1405); backups written 0600 (#1438); CI actions SHA-pinned (#1440).
- **Authorization surface.** ACL capabilities enforced and settable (#1279/#1280); `persona-holder` (#1286) and `whoami` reporting capabilities (#1298); `MemoryRead`/`MemoryWrite` (#1234) with `pnm memory` (#1222); runtime-tunable, attributable rate limits with `did.jsonl` on its own bucket (#1510, #1519); cached seed reads (#1290).
- **The holder's whole agent.** `vta-persona` — attributes, profiles, bindings, disclosure history, `release: stepUp` on disclosure, a deployment-declared claim-type registry (#1255 → #1342); the VTA as a **data-room** member — it mints the credentials that make a room joinable, seals records, joins, keeps up, opens what it holds, and calls a room's host on its principal's behalf (#1326, #1329, #1332, #1250); `vta-mcp` gains a local operation guard, per-call logging and a proper doc (#1101, `docs/02-vta/vta-mcp.md`).
- **TEE / ops.** `allow_kms_reinit` fail-closed (#1249); pnm anchors TEE bootstrap by DID + pinned PCR0 (#1454); `nitro-cli` by absolute path (#1441); chunked Trust-Task backup for DIDComm/TSP-only VTAs (#1522); `vta-mobile-core` on uniffi 0.32 and Rev 3 sealing.

### Cypress + convergence — July–August 2026

The VTA shipped in the coordinated **`Cypress`** release ([[coordinated-releases]], 2026-08-17) as `vta-service` 0.17.0 / `vta-sdk` 0.25.0 — the first release cut through formal RCs and the new release-plz process. The month's VTA-relevant themes:

- **Every operation is a canonical Trust Task.** ACL, keys, config/provisioning, audit, webvh and credential-exchange surfaces all folded onto published `trusttasks.org/spec/*` URIs; payloads emit canonical lowerCamelCase (#1000, breaking); Trust Tasks ride the HTTPS binding on REST too (#1001); every superseded REST route is sign-posted with its successor and a usage metric (#1007). See [[verifiable-trust-infrastructure|Trust-Task canonicalization]].
- **TSP is selectable, and DIDComm is optional.** `TransportChoice` with `Auto` = TSP > DIDComm > REST actually implemented (#797); a VTA can speak TSP without DIDComm (#937); TSP offered in the setup wizard and advertised at mint (#933/#934, #959).
- **One approvals model.** Step-up floors and config consent rules retired; Rego rules are the only trigger, manageable at runtime with `pnm approvals`, enforced on REST and webvh routes, with an offline break-glass (#909–#915). Approvers are least-privilege and need not hold VTA authority.
- **Signing oracle guarantees**: three-gate authorization documented and pinned (#814), `allowedKeys` per-actor narrowing (#865), **non-extractable internal signing keys** (#995), deterministic did:key from an imported key (#953).
- **ISO mdoc holder**: receive → verify against IACA trust anchors → store → present over OID4VP with a P-256 `ecdsa-jcs-2019` consent receipt (#984–#993).
- **Hardened non-TEE mode** (#835) and **Nitro tenant config over vsock** (#939).
- **Decomposition** of vta-service into eleven subsystem crates (#780–#791).
- **Messaging** now runs on the TDK's reliable delivery layer (`MessagingService` / outbox, #675–#691); agent names end-to-end (`pnm did-mgmt agent-names`).
- **Mobile**: request proofs verified on-device before prompting (#871); device Trust-Task submission with no REST over DIDComm and TSP (#792); `vta-mobile-core` 0.6.18.

### TSP as preferred transport — late June–July 2026

The VTA's transport preference officially flipped to **[[trust-spanning-protocol|TSP]] > DIDComm > REST**. DIDs double as TSP VIDs reusing the existing Ed25519/X25519 keys — no new key material; capability discovery is DID-document-driven (`TSPTransport` service advertised in DID templates, matched by type); TSP runs as a first-class managed service (`ServiceState::Tsp`, enable/disable/rollback via `pnm services`) over the *same* mediator websocket as DIDComm. Feature-gated and opt-in at the time; by August a selectable transport, with TSP-only VTAs supported.

### Personal AI agents — June 2026

The VTA is being positioned as the trust/identity/secrets substrate under AI agent runtimes: `AgentSession` on vta-sdk, the new **`vta-mcp`** MCP server exposing the VTA's signing oracle / secrets vault / discovery to MCP hosts (Claude Desktop named explicitly), an `ai-agent` DID template, a per-context KV store for agent memory, scoped VC issue/revoke, and an ephemeral derive-and-sign trust task.

### Security campaign (P0–P3) — June 2026

The VTA-relevant core of the workspace-wide hardening push: AES-GCM AAD binding of stored values to their keyspace location (defeats ciphertext cut-and-paste by an untrusted Nitro parent); TEE **anti-rollback** (MAC'd integrity manifest + external CAS counter + attestation-gated anchor writer); DIDComm sender authentication; master-seed zeroization; step-up enforcement on vault release / proxy-login / sign-trust-task; fail-closed secret backends; an OpenAPI 3.1 spec for the full VTA surface; audit-trail tamper-evidence hash chain. Secrets backends were extracted into the reusable **`vti-secrets`** crate (Vault, KMS/TEE, Kubernetes Secrets).

### Mobile approver becomes a cryptographic party — July 2026

`vta-mobile-core` reached 0.6.11: push-gateway wake model, step-up **approve-response 0.2** with structured `authorizationContext`, and **signed denial** — the phone now cryptographically signs both outcomes of an authorization decision, not just approvals.

### did:webvh self-hosting — June–July 2026

The VTA serves its own did:webvh log at canonical `did.jsonl` paths, preloads its self-DID into the resolver cache (and re-syncs after runtime DID-log mutations), and backdates/spaces `versionTime` to avoid same-second log-entry collisions.

### Mobile agent (`vta-mobile-core` v0.3.0) — June 2026

The VTA family now includes a UniFFI engine for mobile holders. Two iOS/Android apps share one Rust core:

- **Authenticator** — pocket approver. Receives VTA/RP-pushed `auth/step-up/approve-request/0.1` over DIDComm v2, renders the reason, returns a passkey- or DID-signed approve-response.
- **PNM mobile** — mobile counterpart of the `pnm` CLI: drives the management surface (ACL, contexts, services, DID lifecycle) over the same Trust-Task wire as the CLI.

`DIDCommSession::receive_next(timeout_secs)` on `vta-sdk` adds the unsolicited-inbound primitive the mobile approver needs.

### Credential exchange end-to-end — May–June 2026

The VTA now sits inside the credential-exchange loop as both holder and presenter, not just a signing oracle:

- **BBS (`bbs-2023`) selective disclosure** — VTA receives BBS credentials into the vault and presents them with selective disclosure (feature `bbs`); built on the new `affinidi-bbs` crate in the TDK.
- **DCQL / OpenID4VP 1.0** — full holder query → present path inside the VTA, consent-gated, with ACL-gated holder-key resolution (`HolderKeyProvider`).
- **Live status re-check at present time** (§14.5); status-list credential issuer signature verified on every check.
- **DIDComm credential-exchange handlers** — query, present, issue paths, including deferred approval, sealed issuance, and Trust-Task descriptors.
- **Holder offer → request leg** — answer a credential offer with a key-binding proof (OpenID4VCI key-binding via Ed25519 JWT).

### Hierarchical contexts (slices 1–4) — May 2026

A context ID *is* its `/`-separated path (max depth 8) with ancestry-aware ACL — parent-admin covers the subtree. See [Application Contexts](#application-contexts-now-hierarchical) above.

### Trust Tasks 0.2 + dual-accept — June 2026

A single Trust Task envelope can be accepted at one of four ladder rungs: **device / vault / passkey / step-up**. Released alongside `vta-sdk` 0.10.0. The `provision-integration` flow gained 0.2 dual-accept; the legacy FPN URI is retired.

### v0.6.0 (in flight) — runtime service management

- Unified `pnm services …` CLI for enable / disable / list / rollback on a live VTA
- Snapshot-store / fail-forward semantics
- P0–P5 merged on `main`; P6 (e2e matrix) in PR

### v0.5.0 — 2026-05-04 — `sealed-bootstrap`

- Every secret-bearing transfer to/from the VTA moves as an HPKE-sealed bundle
- Template-driven DID minting
- DIDComm protocol surface can be enabled, disabled, or migrated on a running VTA without rebuilding it
- Refresh tokens single-use (RFC 6749 §10.4)
- `verify_vta_authorization_credential` returns a typestate
- `server_internal_super_admin` replaced with a sealed `InternalAuthority` marker

### v0.4.x — April 2026

- Production-grade DIDComm service v0.2 (lifecycle management, message expiry, problem-report logging)
- TEE deployment hardening
- Client DID documents and capabilities discovery

### v0.3.x — March/April 2026

- SDK integration module
- Imported secrets
- Lightweight DIDComm auth
- Reader role
- Automatic token refresh

### v0.2.0 — March 2026

- TEE / Nitro Enclave support
- Signing oracle
- Backup / restore
- P-256 keys
- Prometheus metrics

The direction has shifted three times: from "make the VTA usable," to "make the VTA's runtime surface mutable in production without downtime or rebuilds," to (mid-2026) broadening *who* the VTA serves — phones as cryptographic approvers, AI agents as first-class clients, enterprises with owner/user separation of duty — then (September 2026) to broadening *what it holds for its human*: identity attributes, memory, application state and shared data rooms — and now (October 2026, Eucalyptus) to closing the door on all of it: one signed Trust-Task surface over TSP, DIDComm and HTTPS, a document's own proof as the only authority, stated key-custody rules, and a backup that is the whole agent.

See also: [[verifiable-trust-infrastructure]], [[bip32-key-derivation]], [[openvtc]], [[trust-tasks]], [[trust-spanning-protocol]], [[verifiable-git-infrastructure]], [[vta-browser-plugin]], [[keyring-wallet]], [[vta-topology]]
