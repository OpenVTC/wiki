---
title: "dtg-credentials — Trust Graph Credential Library"
type: entity
tags: [dtg, credentials, library, trust-over-ip, primary, cypress, dogwood]
date-updated: 2026-09-18
repo: https://github.com/OpenVTC/dtg-credentials
---

# dtg-credentials

*Repo: [github.com/OpenVTC/dtg-credentials](https://github.com/OpenVTC/dtg-credentials)*

A Rust library implementing the [[decentralized-trust-graph|Decentralized Trust Graph]] credential types. It provides the data structures, signing/verification logic, digest binding and — since September 2026 — the **chain verifiers** for the [[verifiable-credentials|Verifiable Credentials]] that form the edges of the trust graph and confer authority within it.

## What It Implements

The [[dtg-credential-spec|DTG Core Credentials specification]] from the Trust over IP Foundation's DTG Working Group Credentials Task Force — **v1.0 Working Draft 02** since crate version **0.7.0** (2026-09-08). Latest published release is **0.9.1** (2026-09-09); **0.10.0** is on `main` (CHANGELOG dated 2026-09-11, not yet tagged). Earlier: 0.2.0–0.6.0 tracked WD01 (0.6.0 additionally tracked the then-unmerged VAC/VDC PRs); 0.1.x tracked the informal v0.3. See [[dtg-credentials-overview|DTG Credential Types]] for the full taxonomy.

What the crate does **not** yet implement, all of it post-WD02 work on the spec's `main` (see [[dtg-credential-spec]]): the **VSC** and the removal of the `EndorsementCredential`/`WitnessCredential` type strings; `authority.maxAttenuation` (spec #40); VAC revocation via `credentialStatus` with cascade (spec #39 — `credentialStatus` is modelled and settable but never *resolved*, for any type); and the correlation-scope declaration (spec #30), which the spec itself has not yet given a property name. The README tracks these as explicit notes rather than leaving them silent.

## Architecture

The library grew from two source files to four, plus a second example and a test suite that is "mostly attacks":

- **`lib.rs`** — Core types: `DTGCredential` wrapper, `DTGCommon` (W3C VC structure incl. `id`, `taskContext`, `credentialStatus`, and an `extra` map that preserves unmodelled top-level members through a round trip), `DTGCredentialType` enum (`#[non_exhaustive]`, `PartialEq`), `CredentialSubject` variants (Basic, **Membership**, Endorsement, Witness, **Authority**, **Delegation**; RCard *deprecated*), signing/verification, `validate()`, the digest family (`digest_multibase()` / `digest_multibase_json()`, `verify_digest()`, `digests_match()`, `decode_digest_multibase()`; WD01 `digest()` / `digest_json()` deprecated), and the `DTGCredentialError` enum (`#[non_exhaustive]` since 0.10.0)
- **`create.rs`** — Builder methods for each type (`new_vmc`, `new_vrc`, `new_vic`, `new_vpc`, `new_vec`, `new_vwc`, `new_vac`, `new_vdc`; `new_rcard` deprecated), the edge-completing constructors that read both parties off a received grant (`new_member_vmc_for`, `new_delegate_vdc_for`; the non-`_for` forms deprecated), `attenuate` / `attenuate_from_json`, `redelegate` / `redelegate_from_json`, the binding checks `acknowledges()` / `accepts()`, and `with_id()` / `with_credential_status()`
- **`authority.rs`** — `verify_chain` for VACs: the chain must reach a root issued by the governing party; no link may add an action, widen scope, or outlive its parent; each link's issuer must be its parent's subject; the leaf must grant to the *presenter*; depth ≤ 8; every link carries `validUntil`. Resolution is bearer-side — `parent` is a digest and is never dereferenced
- **`delegation.rs`** — `verify_chain` for VDCs: scope subset, monotone expiry, each link issued by its parent's delegate, depth budget narrowing via `maxDepth`, root issued by the principal, leaf appoints the presenter. Returns what the chain *appoints for* (`VerifiedDelegation { principal, .. }`) and deliberately not whether the act is permitted
- **`examples/`** — `sign_and_verify` (one credential) and `data_room` (a whole data room end to end: VAC to owner, VIC, VMC pair, sealed record, an agent attenuated to strictly less, a service appointed by VDC, epoch rotation on removal)
- **`tests/`** — `authority_chain`, `delegation_chain`, `membership_edge`, `json_bounds`

## Usage

```rust
// Community side: grant membership (set `id` before signing — the proof covers it)
let grant = DTGCredential::new_vmc(community_did, member_did, valid_from, valid_until, false)
    .with_id(format!("urn:uuid:{}", Uuid::new_v4()));
grant.sign(&community_key, None).await?;

// Member side: verify the grant *in its wire form*, then acknowledge it as yourself
verify_grant_with_public_key(&grant_json, &community_public_key, Utc::now())?;
let mut ack = DTGCredential::new_member_vmc_for(&grant_json, &member_did, Utc::now(), valid_until)?;
ack.sign(&member_key, None).await?;

// Either side: is the edge complete (types, mirrored parties, digest)?
assert!(ack.acknowledges(&grant)?);
```

The library supports both W3C VC 1.1 and 2.0, handling field name differences (`issuanceDate`/`validFrom`, `expirationDate`/`validUntil`) transparently via serde deserialization. A recurring theme in the API is **"digest what you received, not what you parsed"**: anything that arrived from a counterparty goes through the `_json` / `_from_json` forms, because a timestamp is normalised on the way out and the re-emitted bytes may hash differently.

## Dependencies

- `affinidi-data-integrity` 0.7 — W3C Data Integrity proof creation/verification (EdDSA JCS 2022)
- `affinidi-secrets-resolver` 0.5 — key management (optional; feature `affinidi-signing`, on by default)
- `serde` / `serde_json` — JSON serialization with camelCase and untagged enum dispatch
- `serde_json_canonicalizer` (JCS / RFC 8785), `sha2` 0.11, `multibase` — digest computation
- `chrono`, `thiserror`, `tracing`
- Dev: `affinidi-tdk` 0.12 (examples' DIDs and signing), `chacha20poly1305`, `rand` (the `data_room` example seals records for real)
- CI (since 0.6.0): GitHub Actions `ci` and `publish` workflows, actions pinned to SHAs, Dependabot; publish checks crates.io for an already-published version before authenticating

## Provenance

Originally developed under `LF-Decentralized-Trust-labs`, migrated to the `OpenVTC` GitHub organization in spring 2026. Author: Glenn Gore (Affinidi). Published on crates.io since 0.1.1 (2026-03-29; 0.1.0 was never published). MSRV 1.95, edition 2024.

## Recent Development

**Why the version went from 0.2.0 to 0.9.1 in thirty days.** Not a re-numbering to match the spec. The crate is on a 0.x line where every minor bump is, by Cargo's rules, a breaking change — and there were eight of them in a row, each with a reason: three were **live interoperability bugs** found by the OpenVTC and VTI consumers (no `id`, an unconstructible member-issued VMC, a digest over re-serialised JSON), one added the **VAC and VDC** while they were still spec drafts, one brought the crate up to **Working Draft 02** (which changed the digest encoding on the wire), two closed **bearer-credential findings** (a VAC or VDC chain accepted from anyone holding a copy), and 0.10.0 added issue-time validation. The one deliberate oddity is 0.9.1, which is API-breaking despite the patch number because 0.9.0 had been published hours earlier with no consumers. The README now carries an **Upgrading** table stating, for every breaking release, that *verifiers move first*.

**Coordinated releases** ([[coordinated-releases]]): the crate is part of **`Dogwood`** — `VTI-Dogwood-RC-1` (2026-08-29) is **0.3.0**; `VTI-Dogwood` (2026-08-30, tag-only "silent" release) and `VTI-Dogwood-R1` (tag created 2026-09-01) both point at the **0.5.0** HEAD. `Cypress` = 0.2.0; `Banyan` = 0.1.3. The Eucalyptus RC-0 (2026-09-17) has not been tagged in this repo.

**On the two divergences flagged at 0.2.0.** The *digest encoding* divergence is resolved — twice over. 0.4.0 fell into line with WD01 (`sha256:<hex>`, over JCS *excluding* `proof`); then WD02 (spec #19) itself moved to the multibase `digestMultibase` form the crate had originally used, and 0.7.0 adopted it — so the encoding is now identical on both sides and compared as decoded bytes. The *undeclared `Option<digest>` gap* is **still open**: `CredentialSubjectWitness::digest_multibase` is `Option<String>` and `new_vwc(...)` still takes `digest: Option<String>`, although the spec has had it REQUIRED on a VWC since WD01 PR #14. The field's rustdoc now says "REQUIRED by the specification", but nothing refuses a VWC built or parsed without one (compare `MissingTaskContext`, which does).

### v0.10.0 — 2026-09-11 (on `main`, untagged) — issue-time validation; answering a grant only on your own behalf (#28, #29)

No signatures change and nothing changes on the wire for a well-formed credential, but several calls now refuse input they used to accept:

- **`new_member_vmc_for(grant, member, ..)` / `new_delegate_vdc_for(grant, delegate, ..)`** replace the non-`_for` forms (deprecated). The old constructors read the answering party off the grant and had nothing to compare it against; the new ones take the identity whose key will sign and refuse a mismatch with `NotTheGrantSubject` — the same shape of fix `verify_chain` got in 0.8.0/0.9.1: the obligation becomes a parameter. Both also refuse an answer that outlives its grant (`OutlivesGrant`).
- **`verify_grant_with_public_key`** (feature `affinidi-signing`) verifies a grant in its wire form before it is answered: proof present and valid, proof's `verificationMethod` belongs to the grant's `issuer`, window well-formed and containing the instant.
- **A validity window must open before it closes** (`InvalidValidityWindow`), enforced by every `Result`-returning constructor, by the new `validate()`, and by `sign()`.
- **Open JSON is bounded in depth** (`MAX_JSON_DEPTH` = 64, `JsonTooDeep`): a `Value` nested a few thousand levels deep in `endorsement`, `credentialStatus` or `extra` overflowed the stack and aborted the process. The check runs ahead of everything that recurses, including `verify_proof_with_public_key`.
- `DTGCredentialError` is now `#[non_exhaustive]` (seven new variants) — the reason this is 0.10.0 rather than 0.9.2.

### v0.9.1 — 2026-09-09 — a VDC is not a bearer credential either; upgrade ordering (#26)

Closes findings #22/#23. `delegation::verify_chain` takes a `presenter` and requires the leaf to appoint it (`NotTheDelegate`) — WD02's *Invocation Binding* rule stated normatively. 0.8.0 had done this for the VAC and left the VDC alone; "delegation is if anything the sharper case: a captured VAC replays whatever it confers; a captured VDC replays *as somebody*." New README **Upgrading** section (verifiers before issuers, for 0.7.0, 0.8.0 and 0.9.1 alike — a 0.6 verifier handed a 0.7 credential reports a *broken chain*, because it compares a digest against an `id`). `BrokenLink` error docs corrected to say `digestMultibase`. **Breaking despite the patch version**, chosen deliberately.

### v0.9.0 — 2026-09-09 — `credentialStatus` settable; `PartialEq` on the type (#24, #25)

Two additive items from the conformance audit (#10). `with_credential_status()` / `set_credential_status()` attach a status entry to a credential being built — a setter rather than a constructor parameter because on a VDC it is CONDITIONAL on a governance-defined freshness window the library cannot know. Neither chain verifier resolves it; revocation remains a live lookup the caller performs.

### v0.8.0 — 2026-09-09 — a VAC is not a bearer credential; `audience` removed (#21)

`authority::verify_chain` already took a `presenter`, but only compared it against the leaf's optional `audience` — so a leaf without one was accepted from **anybody**. It now requires the leaf to grant to `presenter` (`NotThePresenter`), implementing spec PR #41. Both known consumers (`vti-rooms-dtg`'s chain verifier and nomination check) had already hit the gap and re-compared the subject by hand; "two copies of a check is one place for it to be forgotten, so it moves here." **`authority.audience` removed** from the struct, from `attenuate` / `attenuate_from_json` (each loses its trailing `Option<String>`) and from the verifier — it was also being read two incompatible ways (this crate: the presenter; the `rooms/keys/present/0.1` trust task: the host the presentation is *for*; see dtgwg-trust-tasks-tf#414). The destination question belongs to the trust task document's `recipient`.

### v0.7.0 — 2026-09-08 — Working Draft 02: digest encoding, VAC parent digests, and the real VDC (#20)

Both drafts 0.6.0 tracked merged (VAC #29, VDC #19) and the digest encoding changed underneath them; **breaking on the wire and in the API**.

- **Digest encoding**: WD02 replaced `sha256:<hex>` with a base58btc multibase multihash and renamed the property `digest` → **`digestMultibase`**. `digest_multibase()` is un-deprecated and now *excludes* `proof`; `digest_multibase_json()` is its wire-form twin; `digest()` / `digest_json()` deprecated but kept so a migrating caller can recompute an old digest. The old property name `digest` is still accepted on parse; an old *value* fails with `InvalidDigest` rather than a silent mismatch. **Digests are compared as decoded bytes, never strings**; a digest naming an unsupported algorithm is rejected (`UnsupportedDigestAlgorithm`), not treated as a mismatch.
- **`authority.parent` is a digest, not an `id`**: `attenuate` no longer needs the parent to carry an `id` (`AttenuationParentHasNoId` deprecated, never returned); new `attenuate_from_json` for a VAC that arrived from a counterparty.
- **The VDC becomes real**: 0.6.0 had shipped `new_vdc` as a type string over a bare subject. Now `DelegationGrant` (`scope`, `parent`, `maxDepth`, `accepts`), `new_vdc` takes the appointment (non-empty scope, required `valid_until`, optional `max_depth`), `new_delegate_vdc` builds the REQUIRED acceptance from the grant's wire form, `accepts()` checks the binding, `redelegate` / `redelegate_from_json` (re-delegation opt-in via `maxDepth`), and `delegation::verify_chain`.
- **`validUntil` REQUIRED on a VAC and a VDC** (`DateTime<Utc>` not `Option`; verifiers reject `NoExpiry`).
- `DTGCommon::credential_status` modelled and `DTGCommon::extra` preserves unmodelled members — both because a parse-then-re-serialise used to drop them silently and change the digest.
- Dependencies: `sha2` 0.10 → 0.11 (the library had been linking two copies and hashing with the older one), `affinidi-tdk` 0.10 → 0.12 (dev).
- Deliberately not implemented: VAC revocation cascade (#39), `maxAttenuation` (#40); `audience` kept until #41 landed (removed in 0.8.0). Correlation scope (#30): nothing to implement yet — only the retired DID-type names dropped from docs.

### v0.6.0 — 2026-09-03 — the VAC and VDC arrive, tracking spec drafts (#15, #16, #17, #18)

Adds "the two credentials that confer rather than assert", against spec PRs #29 and #19 while still open. `DTGCredentialType::{Authority, Delegation}`, `AuthorityGrant` (`scope`, `actions`, optional `parent`, `audience`), `new_vac` / `new_vdc`, `attenuate`, and **`authority::verify_chain` — "the part that matters"**: anyone can mint a well-formed VAC naming any scope, and it verifies perfectly as a credential; what makes it worthless is that its chain does not reach the governing party. Seven rules, depth bounded at 8, resolution bearer-side (never dereferences `parent`), an empty `actions` list refused at construction and at the deserialization boundary. New `data_room` example. First CI: `ci` and `publish` workflows (#17), and the examples declare `required-features = ["affinidi-signing"]`.

### v0.5.0 — 2026-08-30 — digest the grant a member received, not a parse of it (#14) — `VTI-Dogwood`, `VTI-Dogwood-R1`

0.4.0's `new_member_vmc` took a parsed `DTGCredential` and digested it. `DTGCommon` did not then model `credentialStatus`, which every VMC issued against a status list carries, so parsing a received grant and re-serialising it dropped that member — and the acknowledgement went out carrying a digest over a document the community never issued. Both credentials verify; only the digest comparison fails, with nothing to say why. **BREAKING**: `new_member_vmc` takes the grant as `&serde_json::Value` — the JSON the community sent; new `digest_json()`.

### v0.4.0 — 2026-08-30 — the member-issued VMC becomes expressible; WD01 digest form adopted (#13)

The spec (WD01 #12) defines membership as a *pair* — grant plus an acknowledgement carrying a digest of the grant — but `CredentialSubjectBasic` was `deny_unknown_fields` over `id` alone, so an acknowledgement could not be built or parsed as a VMC at all. New `CredentialSubjectMembership` (with OPTIONAL `digest`), `new_member_vmc()`, `acknowledges()`, and the spec's digest: **`sha256:` + lowercase hex over JCS excluding `proof`** — one computation serving both the acknowledgement and the VWC. **This closed the 0.2.0 encoding divergence**: `digest_multibase()` (which had included `proof` and used multibase) was deprecated and `verify_digest()` switched to the conformant form. **BREAKING**: a `MembershipCredential` now deserializes with `CredentialSubject::Membership` (normalised in `TryFrom<DTGCommon>` because a `{ id, digest }` subject is shape-identical to a VWC's); a VMC whose subject fits none of the shapes is refused.

### v0.3.0 — 2026-08-29 — a credential gets its own `id` (#12) — `VTI-Dogwood-RC-1`

`DTGCommon` had no top-level `id`, so a crate-built credential could not carry one — and **every reciprocal MembershipCredential an OpenVTC member issued was being rejected by the VTC**, with the rejection arriving as a problem-report the member's client discarded, so the failure was silent on both sides. `with_id()` / `set_id()` / `id()`; `id` MUST be set before `sign()` (a test pins that). **BREAKING** only for exhaustive struct literals of `DTGCommon`.

### #11 — 2026-08-28 — `affinidi-tdk` 0.10 (dev) and TDK lock refresh

### v0.2.0 — 2026-08-10 — track DTG Core Credentials WD01 (#8, `feat!`; release notes #9) — `Cypress`

Part of the coordinated **`Cypress`** release ([[coordinated-releases]]; `Cypress` and `VTI-Cypress-RC-1` both point at the 0.2.0 HEAD; `Banyan` = `RC-0` = 0.1.3). The [[verifiable-trust-infrastructure|VTI]] (#916) and [[openvtc]] (#205) moved onto 0.2 the same day — VMC/VEC/VIC bytes were unchanged, so the bump was painless for them.

- **`taskContext` added to `DTGCommon`** (+ accessors). This was a real bug, not just a schema catch-up: `DTGCommon` lacked the field and had no `deny_unknown_fields`, so serde silently *dropped* `taskContext` on deserialise — and because `sign()` serialises the credential, issuers signed a document missing the field while verifiers hashed a different document than the one that was signed.
- **BREAKING**: `new_vwc(issuer, subject, valid_from, valid_until, task_context: String, digest: Option<String>, witness_context)`; deserialising a `WitnessCredential` without `taskContext` fails with the new `DTGCredentialError::MissingTaskContext`; new `Canonicalization(String)` error.
- New VWC digest helpers `digest_multibase()` / `verify_digest()` — at this version the digest covered the referenced VRC *including* its `proof`, over its JCS canonical form.
- `DTGCredentialType::RCard`, `CredentialSubject::RCard`, `CredentialSubjectRCard` and `new_rcard()` **deprecated** (not removed) — the relationship card left the spec for a planned VDS companion.
- **VWC digest divergence, flagged in the README/CHANGELOG at the time.** WD01 said the digest MUST be `sha256:` + lowercase hex; the crate emitted a multibase base58btc multihash (`z…`). *Resolved in 0.4.0 (crate adopts hex form) and then mooted by WD02, which moved the spec to multibase — adopted in 0.7.0.* The second, undeclared gap — `digest` as `Option` although spec PR #14 made it REQUIRED — remains open as of 0.10.0 (see the note at the top of this section).
- History reconstructed: 0.1.2 and 0.1.3 had been published but never recorded; the async `sign()` change actually shipped in 0.1.1 (2026-03-29); placeholder dates replaced with crates.io dates; four rustdoc bare-URL warnings fixed.

### v0.1.3 — 2026-06-07 — data-integrity 0.7 / TDK 0.7

- `affinidi-data-integrity` 0.6 → 0.7
- `affinidi-tdk` 0.6 → 0.7 (dev-dep)
- `sign_and_verify` example migrated to the new TDK config builder (`TDKConfigBuilder::new()` → `TDKConfig::builder()`)
- MSRV bumped to 1.95.0

### v0.1.2 — 2026-04-30

- Bumped to `affinidi-data-integrity` 0.6 and migrated to its new API
- CODEOWNERS for `@OpenVTC/openvtc-maintainers`

### v0.1.1 and earlier — 2026-04 and prior

- Dependency updates: `affinidi-data-integrity` 0.4 → 0.5, `affinidi-tdk` 0.5 → 0.6
- `sign()` made async to align with upstream changes
- Repository URL migration from LF-Decentralized-Trust-labs to OpenVTC
- Crate publishing enablement

See also: [[dtg-credential-spec]], [[dtg-credentials-overview]], [[decentralized-trust-graph]], [[verifiable-credentials]], [[coordinated-releases]]
