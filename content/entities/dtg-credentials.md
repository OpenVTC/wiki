---
title: "dtg-credentials — Trust Graph Credential Library"
type: entity
tags: [dtg, credentials, library, trust-over-ip, primary, cypress, dogwood, eucalyptus]
date-updated: 2026-10-07
repo: https://github.com/OpenVTC/dtg-credentials
---

# dtg-credentials

*Repo: [github.com/OpenVTC/dtg-credentials](https://github.com/OpenVTC/dtg-credentials)*

A Rust library implementing the [[decentralized-trust-graph|Decentralized Trust Graph]] credential types. It provides the data structures, signing/verification logic, digest binding, the **chain verifiers** for authority and delegation, and — since 0.12.0 (2026-09-30) — the **Verifiable Statement Credential** with its predicate profiles and the verifier-side **predicate accept list**, for the [[verifiable-credentials|Verifiable Credentials]] that form the edges of the trust graph, annotate its nodes, and confer authority within it.

## What It Implements

The [[dtg-credential-spec|DTG Credentials Core Specification]] from the Trust over IP Foundation's DTG Working Group — **v1.0, Document Status Working Draft 0.6.0** and its frozen v1 credential context `https://registry.trustoverip.org/dtg/context/v1`, since crate version **0.12.0** (2026-09-30). **0.13.0** (2026-10-01) is the version at the coordinated **`VTI-Eucalyptus`** tag ([[coordinated-releases]]); it differs from 0.12.0 only by the move to `affinidi-data-integrity` 0.8 and is byte-identical on the wire. Earlier: 0.7.0–0.11.0 tracked Working Draft 02; 0.2.0–0.6.0 tracked WD01 (0.6.0 additionally tracked the then-unmerged VAC/VDC PRs); 0.1.x tracked the informal v0.3. See [[dtg-credentials-overview|DTG Credential Types]] for the full taxonomy.

Beyond the specification itself, the crate implements the four predicate profiles the **DTG VSC Predicate Registry** (`dtgwg-vsc-registry`, served at `https://registry.trustoverip.org/dtg/vsc/`) currently defines — `endorses/1` (VEC), `witnessed/1` (VWC), `vetted/1` and `presented/1` — and can load the registry's machine-readable `accept-list.json` directly. Only the first two are named by the specification; `vetted/1` appears there as a registry-published counterpart to an informative worked example, and `presented/1` is registry-only.

What the crate does **not** implement, and says so: **revocation is never resolved**. `credentialStatus` is modeled and settable on any type, the VAC and VDC verifiers document the specification's MUST (check status on every chain link that carries one; a revoked VAC withdraws everything attenuated from it), but the live status lookup — and therefore the cascade — is the caller's. Everything else flagged as missing in the previous cycle (the VSC, `authority.maxAttenuation`, the correlation-scope declaration) landed in 0.12.0.

## Architecture

The library grew from two source files to six, plus a second example and a test suite that is "mostly attacks":

- **`lib.rs`** — Core types: `DTGCredential` wrapper, `DTGCommon` (W3C VC structure incl. `id`, **`issuerScope`** (REQUIRED, 0.12.0), `taskContext`, **`taskDigestMultibase`** (0.11.0), `credentialStatus`, and an `extra` map that preserves unmodeled top-level members through a round trip), `IssuerScope { Pairwise, Directed, Public }` (ordered narrowest first, `satisfies(minimum)`), the context constants `W3C_VC_V2_CONTEXT` / `DTG_CONTEXT_V1`, `DTGCredentialType` enum (`#[non_exhaustive]`, `PartialEq`; variants Membership, Relationship, Delegation, Invitation, Persona, **Statement**, Authority), `CredentialSubject` variants (Basic, Membership, Authority, Delegation, **Statement**), signing/verification, `validate()` (re-runs the parse checks over the model, so a credential mutated out of shape through `credential_mut()` is refused before signing), the digest family (`digest_multibase()` / `digest_multibase_json()`, `verify_digest()`, `digests_match()`, `decode_digest_multibase()`, `task_digest_multibase_json()`), and the `DTGCredentialError` enum (`#[non_exhaustive]`; a malformed document is `MalformedCredential` wrapping the serde error)
- **`create.rs`** — Builder methods for each type (`new_vmc`, `new_vrc`, `new_vic`, `new_vpc`, `new_vac`, `new_vdc`, **`new_community_role_vac`**), the edge-completing constructors that read both parties off a received grant (`new_member_vmc_for`, `new_delegate_vdc_for`), `attenuate` / `attenuate_from_json` (now taking the child's `max_attenuation`), `redelegate` / `redelegate_from_json`, the binding checks `acknowledges()` / `accepts()` / `cites_task()`, and `with_id()` / `with_credential_status()` / `with_max_attenuation()` / `with_task_citation()`
- **`statement.rs`** *(new, 0.12.0)* — the VSC: `CredentialSubjectStatement { id, predicate, object, witness_context, extra }`, `StatementObject { Id, DigestMultibase, Value }` (exactly one member), `check_predicate_iri` (absolute IRI in NFC, compared byte for byte — CURIEs, bare terms and relative references are `InvalidPredicate`), the predicate constants `ENDORSES_V1` / `WITNESSED_V1` / `VETTED_V1` / `PRESENTED_V1`, `PredicateProfile::core(iri)` (object kinds, `taskContext` requirement, minimum `issuerScope`), the profile constructors `new_vsc` / `new_endorses_vsc` / `new_witnessed_vsc` / `new_vetted_vsc` / `new_presented_vsc`, and the subject–object checks `witnesses_issuance_of()` / `witnesses_presentation_of()`
- **`accept.rs`** *(new, 0.12.0)* — `PredicateAcceptList`, the verifier's fail-closed configuration: `from_iris([...])` or `from_registry_json(accept_list_json, &[PredicateStatus::…])` over the registry's `accept-list.json`; `accept(&vsc)` matches the predicate exactly (no equivalence followed) and applies the entry's constraints; an unknown constraint member is refused rather than ignored; the envelope's `commit` is what a verifier pins, because the registry does not tag releases
- **`authority.rs`** — `verify_chain` for VACs: the chain must reach a root issued by the governing party; no link may add an action, widen scope, outlive its parent, or raise `maxAttenuation`; each link's issuer must be its parent's subject; the leaf must grant to the *presenter*; depth ≤ 8 and ≤ every ancestor's `maxAttenuation`; every link carries `validUntil`. Resolution is bearer-side — `parent` is a digest and is never dereferenced
- **`delegation.rs`** — `verify_chain` for VDCs: scope subset, monotone expiry, each link issued by its parent's delegate, depth budget narrowing via `maxDepth`, root issued by the principal, leaf appoints the presenter. Returns what the chain *appoints for* (`VerifiedDelegation { principal, .. }`) and deliberately not whether the act is permitted
- **`examples/`** — `sign_and_verify` (one credential) and `data_room` (a whole data room end to end: VAC to owner, VIC, VMC pair, sealed record, an agent attenuated to strictly less, a service appointed by VDC, epoch rotation on removal)
- **`tests/`** — `authority_chain`, `delegation_chain`, `membership_edge`, `json_bounds`, **`predicate_acceptance`**, **`task_citation`** (reproduces the `taskDigestMultibase` printed in the registry's `vetting/session/0.1` — "the test vector is not ours")

## Usage

```rust
// Community side: grant membership (set `id` before signing — the proof covers it).
// A community grant always declares `issuerScope: public`; the constructor fixes it.
let grant = DTGCredential::new_vmc(community_did, member_did, valid_from, valid_until, false)
    .with_id(format!("urn:uuid:{}", Uuid::new_v4()));
grant.sign(&community_key, None).await?;

// Member side: verify the grant *in its wire form*, then acknowledge it as yourself,
// declaring the scope of *your* identifier (the one that signs the acknowledgement)
verify_grant_with_public_key(&grant_json, &community_public_key, Utc::now())?;
let mut ack = DTGCredential::new_member_vmc_for(
    &grant_json, &member_did, IssuerScope::Directed, Utc::now(), valid_until)?;
ack.sign(&member_key, None).await?;

// Either side: is the edge complete (types, mirrored parties, digest)?
assert!(ack.acknowledges(&grant)?);

// A witness: "I observed Alice issue this VRC, in the session she opened with it"
let vwc = DTGCredential::new_witnessed_vsc(
    witness_did, IssuerScope::Public,
    &alices_vrc_json,   // subject := its issuer; object.digestMultibase := its digest
    &session,           // taskContext := its id; taskDigestMultibase := its task digest
    now, None, witness_context)?;
```

The library issues W3C VC 2.0 credentials and also parses 1.1 ones (the specification's legacy profile), provided the W3C context comes first and `DTG_CONTEXT_V1` second; field name differences (`issuanceDate`/`validFrom`, `expirationDate`/`validUntil`) are handled transparently via serde deserialization. A recurring theme in the API is **"digest what you received, not what you parsed"**: anything that arrived from a counterparty goes through the `_json` / `_from_json` forms, because a timestamp is normalized on the way out and the re-emitted bytes may hash differently. A second theme, since 0.12.0, is that **the profile constructors read the parts that must agree off the documents themselves** — subject and digest from the edge credential, `taskContext` and `taskDigestMultibase` from the session document — so a pair of members that the specification requires to match cannot be set to disagree.

## Dependencies

- `affinidi-data-integrity` 0.8 — W3C Data Integrity proof creation/verification (EdDSA JCS 2022); 0.7 → 0.8 in 0.13.0, because `DataIntegrityProof`, `SignOptions`, `VerifyOptions` and `DataIntegrityError` are part of this crate's API
- `affinidi-secrets-resolver` 0.5 — key management (optional; feature `affinidi-signing`, on by default)
- `serde` / `serde_json` — JSON serialization with camelCase and untagged enum dispatch
- `serde_json_canonicalizer` (JCS / RFC 8785), `sha2` 0.11, `multibase` — digest computation
- `unicode-normalization` — NFC check on predicate IRIs (new in 0.12.0)
- `chrono`, `thiserror`, `tracing`
- Dev: `affinidi-tdk` 0.22 (examples' DIDs and signing; 0.12 → 0.14 in #30, → 0.16 in 0.12.0, → 0.22 in 0.13.0), `chacha20poly1305`, `rand` (the `data_room` example seals records for real)
- CI (since 0.6.0): GitHub Actions `ci` and `publish` workflows, actions pinned to SHAs, Dependabot; publish checks crates.io for an already-published version before authenticating

## Provenance

Originally developed under `LF-Decentralized-Trust-labs`, migrated to the `OpenVTC` GitHub organization in spring 2026. Author: Glenn Gore (Affinidi). Published on crates.io since 0.1.1 (2026-03-29; 0.1.0 was never published). MSRV 1.95, edition 2024.

## Recent Development

**Why the version went from 0.2.0 to 0.13.0 in eight weeks.** Not a re-numbering to match the spec. The crate is on a 0.x line where every minor bump is, by Cargo's rules, a breaking change — and there were eleven of them in a row, each with a reason: three were **live interoperability bugs** found by the OpenVTC and VTI consumers (no `id`, an unconstructible member-issued VMC, a digest over re-serialized JSON), one added the **VAC and VDC** while they were still spec drafts, one brought the crate up to **Working Draft 02** (which changed the digest encoding on the wire), two closed **bearer-credential findings** (a VAC or VDC chain accepted from anyone holding a copy), 0.10.0/0.11.0 added issue-time validation and the `taskDigestMultibase` binding to a Trust Task document, **0.12.0 crossed to the v1 context** (the first release where *nothing* an older release emitted is accepted — there is no upgrade ordering, because the specification declares pre-Implementers-Draft credentials non-conformant), and 0.13.0 followed `affinidi-data-integrity` to 0.8. The one deliberate oddity is 0.9.1, which is API-breaking despite the patch number because 0.9.0 had been published hours earlier with no consumers. The README carries an **Upgrading** table for every breaking release — *verifiers move first* for the WD02 line, *issuers and verifiers together, then re-issue* for 0.12.

**Coordinated releases** ([[coordinated-releases]]): **`VTI-Eucalyptus`** (tag created 2026-10-07) points at the **0.13.0** release commit (#35, 2026-10-01) — the first Eucalyptus-series tag in this repository; `VTI-Eucalyptus-RC-0` (2026-09-17) was never tagged here. The crate is also part of **`Dogwood`** — `VTI-Dogwood-RC-1` (2026-08-29) is **0.3.0**; `VTI-Dogwood` (2026-08-30, tag-only "silent" release) and `VTI-Dogwood-R1` (tag created 2026-09-01) both point at the **0.5.0** HEAD. `Cypress` = 0.2.0; `Banyan` = 0.1.3. Per-release git tags exist for 0.6.0–0.9.1 and 0.11.0–0.13.0; **0.10.0 was never published to crates.io or tagged** — its changes shipped inside 0.11.0.

**On the two divergences flagged at 0.2.0 — both now closed.** The *digest encoding* divergence was resolved twice over: 0.4.0 fell into line with WD01 (`sha256:<hex>`, over JCS *excluding* `proof`); then WD02 (spec #19) itself moved to the multibase `digestMultibase` form the crate had originally used, and 0.7.0 adopted it — so the encoding is identical on both sides and compared as decoded bytes. The *undeclared `Option<digest>` gap* — a VWC constructible and parseable without the digest the specification had made REQUIRED since WD01 #14 — was carried through 0.11.0 (`new_vwc_for_session` took it as required, but `new_vwc` and the parsed `CredentialSubjectWitness` did not) and **closed in 0.12.0 by removing the type**: a VWC is now a `StatementCredential` under `witnessed/1`, whose profile admits only a `digestMultibase` object, so a statement without one fails at parse, in `validate()` and in `sign()` (`ProfileViolation`), and `new_witnessed_vsc` reads the digest off the edge credential rather than accepting it as a parameter.

### v0.13.0 — 2026-10-01 — `affinidi-data-integrity` 0.8 (#35) — `VTI-Eucalyptus`

`DataIntegrityProof`, `SignOptions`, `VerifyOptions` and `DataIntegrityError` are part of this crate's API, so the move 0.7 → 0.8 is breaking even though nothing changes on the wire — credentials and proofs are byte-identical to 0.12. 0.8 is the [[affinidi-tdk|TDK]]'s correctly versioned re-release of 0.7.14 (which had moved `affinidi-bbs` to 0.4 as a patch; TDK #912/#916); a caller still on data-integrity 0.7 would see two proof types, so both move together. Dev-dependency `affinidi-tdk` 0.16 → 0.22.

### v0.12.0 — 2026-09-30 — the v1 context: `issuerScope`, the VSC, predicate acceptance, `maxAttenuation` (#33, #34)

**Why.** Between 09-10 and 09-30 the specification ([[dtg-credential-spec]]) went from Working Draft 02 to Document Status 0.6.0 and pinned a frozen credential context at the registry. Every credential this release emits differs on the wire from what 0.11 emitted, and every credential 0.11 emitted is refused here — **a wire break with no upgrade ordering**, deliberately: the specification makes credentials issued before its Implementers Draft non-conformant, so there is no legacy alias to stage through. Upgrade a deployment's issuers and verifiers together and re-issue what they hold; every digest changes, so acknowledgements, attenuations and acceptances are re-derived too.

- **The context.** `@context` is `["https://www.w3.org/ns/credentials/v2", "https://registry.trustoverip.org/dtg/context/v1", …]` (`W3C_VC_V2_CONTEXT`, `DTG_CONTEXT_V1`); `https://firstperson.network/credentials/dtg/v1` is gone and not accepted as an alias. A parse requires the W3C context first and the DTG context second, compared as exact strings (`InvalidContext`). `type` must hold `VerifiableCredential`, `DTGCredential` and exactly one concrete subtype — `PersonhoodCredential` accepted only as the non-authoritative hint on a `MembershipCredential`; anything else (a second subtype, a duplicate, a retired type) is `InvalidType`, reported by name. The WD01 wire name `digest` is no longer accepted.
- **`issuerScope`** (spec #68): `IssuerScope { Pairwise, Directed, Public }` is a REQUIRED top-level member; a credential without it does not parse. Every constructor takes it except where the specification fixes it — `new_vmc` and `new_community_role_vac` always declare `public` (a grant declaring anything else is refused with `IssuerScopeTooNarrow`; `new_member_vmc_for` refuses a grant not declaring `public` with `NotAMembershipGrant`).
- **The VSC.** `DTGCredentialType::Statement`, `CredentialSubjectStatement { id, predicate, object, witness_context, extra }`, `StatementObject { Id, DigestMultibase, Value }` (exactly one). `check_predicate_iri` holds a predicate to an absolute IRI in NFC, byte for byte — `dtg:witnessed`, a bare term, a relative reference or whitespace is `InvalidPredicate`. The four registry profiles are constants (`ENDORSES_V1`, `WITNESSED_V1`, `VETTED_V1`, `PRESENTED_V1`) with `PredicateProfile::core(iri)` giving each one's object kinds, `taskContext` requirement and minimum `issuerScope` (`witnessed/1`, `vetted/1` and `presented/1` refuse `pairwise`); a core statement is held to its profile at parse, in `validate()` and so in `sign()`. The witnessed and presented constructors take the referenced credential in wire form and read the subject from it — its `issuer`, or its `credentialSubject.id` — so the profile's subject–object rule holds by construction; `witnesses_issuance_of()` / `witnesses_presentation_of()` are the verifier's side of the same rule.
- **Predicate acceptance.** `PredicateAcceptList`, failing closed: `from_iris([...])`, or `from_registry_json` over the registry's `accept-list.json` filtered by `PredicateStatus`; `accept(&vsc)` validates the statement, matches its predicate exactly (no equivalence followed), and applies the entry's constraints. An unknown member of a predicate entry is *refused*, since it may be a constraint this version cannot apply; unknown build metadata on the envelope is ignored; the envelope's `commit` is what a verifier pins.
- **VAC `maxAttenuation`** (spec #40) and **role VACs**: `AuthorityGrant::max_attenuation`, `with_max_attenuation(n)`, `attenuate` refusing a child of a `0` parent or one above `n − 1`, and `verify_chain` enforcing both the per-link rule (`RaisesMaxAttenuation`) and the per-ancestor depth (`ExceedsMaxAttenuation`) — before this, a spec-conformant VAC carrying `maxAttenuation` did not parse at all. `new_community_role_vac(community, member, role, …)` is a `public` VAC with `scope` the community DID and `actions` `["role:<role>"]` — the replacement for the role endorsements that used to ride in a VEC.
- **Removed**: `EndorsementCredential`, `WitnessCredential` and `RCardCredential` (types, subjects, `new_vec`, `new_vwc`, `new_vwc_for_session`, `new_rcard`) — credentials of those types are refused at parse; `WitnessContext` stays as the `witnessed/1` subject member. Also removed: the long-deprecated `new_member_vmc` / `new_delegate_vdc`, and `impl Default for DTGCommon` (a default would have to invent an `issuerScope`).
- **Also breaking**: `issuer_scope` parameters on `new_vrc` / `new_vic` / `new_vpc` / `new_vac` / `new_vdc` / the `_for` constructors / `attenuate` / `redelegate`; `attenuate` gains a trailing `max_attenuation: Option<u32>`; `AuthorityError` gains two variants and `DTGCredentialError` eight (`MissingTaskDigest`, `InvalidContext`, `InvalidType`, `IssuerScopeTooNarrow`, `InvalidPredicate`, `ProfileViolation`, `PredicateNotAccepted`, `MalformedAcceptList`); a malformed document is `MalformedCredential` wrapping the serde error; `WitnessContext` omits unset members instead of serializing `null`. The README's *Upgrading from 0.11* table maps every old call to its new form — a role `EndorsementCredential` becomes `new_community_role_vac(...)`, a vetting one `new_vetted_vsc(...)`, a `new_vwc_for_session(...)` call `new_witnessed_vsc(...)`.
- **Consumers**: this is the release the Trust Tasks side conformed to in trust-tasks-rs 0.25 ("conform vetting, member and endorsement credentials to DTG VSC/VAC and the predicate registry", dtgwg-trust-tasks-tf #691, 09-30) — the same change that moved every TDK messaging crate a minor.

### v0.11.0 — 2026-09-22 — `taskDigestMultibase`: a credential binds to the Trust Task document it cites (#31, #32)

The first published release since 0.9.1 (0.10.0 was never published), so it carries 0.10.0's changes too. **Why.** `witness/session/submit` (dtgwg-trust-tasks-tf) requires the VWC the witness delivers to carry `taskContext` equal to the `id` of the `witness/session` document that opened the session *and* `taskDigestMultibase` equal to that document's task digest — an `id` locates the exchange, only the digest binds the credential to it, "because anyone can write a different document reusing the `id`." The spec side was then still a proposal (cred-spec #56, merged the same day).

- `DTGCommon::task_digest_multibase` (API break: a new public field; `..Default::default()` construction unaffected). A VWC without one still deserialized at this version, since every VWC issued before lacked it; an older release carried the member through a round trip in `extra`, so there was no upgrade ordering.
- `task_digest_multibase_json(document)`: the document with its **top-level** `proof` removed (a `proof` inside `payload` stays), JCS, sha2-256 multihash, base58btc — named separately from `digest_multibase_json` because Trust Tasks also defines a *step digest* that includes the `proof`, and the two must not stand in for each other.
- `new_vwc_for_session(issuer, subject, …, &session, digest, witness_context)` read both members off the `witness/session` document (so the pair could not disagree), took the edge digest as REQUIRED, and refused a document that was not the opening `witness/session` — a `#response`, a `submit`, or one whose `threadId` is not its own `id` (`NotAWitnessSession`). `new_vwc` deprecated. (Both were removed again eight days later in 0.12.0, superseded by `new_witnessed_vsc`.)
- `with_task_citation(&document)` / `cites_task(&document)` on any type — e.g. a `vetting/session` statement — comparing decoded multihash bytes; a credential with no `taskDigestMultibase` is `Ok(false)`, never an `id`-only match. `taskContext` re-documented as the `id` of the document that initiated the innermost exchange (Trust Tasks §4.9.1), not a `threadId`.
- `tests/task_citation.rs` reproduces the `taskDigestMultibase` printed in `vetting/session/0.1`. #30 (09-19) had moved the dev-dependency `affinidi-tdk` 0.12 → 0.14.

### v0.10.0 — 2026-09-11 (never published; shipped inside 0.11.0) — issue-time validation; answering a grant only on your own behalf (#28, #29)

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
- `DTGCommon::credential_status` modeled and `DTGCommon::extra` preserves unmodelled members — both because a parse-then-re-serialize used to drop them silently and change the digest.
- Dependencies: `sha2` 0.10 → 0.11 (the library had been linking two copies and hashing with the older one), `affinidi-tdk` 0.10 → 0.12 (dev).
- Deliberately not implemented: VAC revocation cascade (#39), `maxAttenuation` (#40); `audience` kept until #41 landed (removed in 0.8.0). Correlation scope (#30): nothing to implement yet — only the retired DID-type names dropped from docs.

### v0.6.0 — 2026-09-03 — the VAC and VDC arrive, tracking spec drafts (#15, #16, #17, #18)

Adds "the two credentials that confer rather than assert", against spec PRs #29 and #19 while still open. `DTGCredentialType::{Authority, Delegation}`, `AuthorityGrant` (`scope`, `actions`, optional `parent`, `audience`), `new_vac` / `new_vdc`, `attenuate`, and **`authority::verify_chain` — "the part that matters"**: anyone can mint a well-formed VAC naming any scope, and it verifies perfectly as a credential; what makes it worthless is that its chain does not reach the governing party. Seven rules, depth bounded at 8, resolution bearer-side (never dereferences `parent`), an empty `actions` list refused at construction and at the deserialization boundary. New `data_room` example. First CI: `ci` and `publish` workflows (#17), and the examples declare `required-features = ["affinidi-signing"]`.

### v0.5.0 — 2026-08-30 — digest the grant a member received, not a parse of it (#14) — `VTI-Dogwood`, `VTI-Dogwood-R1`

0.4.0's `new_member_vmc` took a parsed `DTGCredential` and digested it. `DTGCommon` did not then model `credentialStatus`, which every VMC issued against a status list carries, so parsing a received grant and re-serialising it dropped that member — and the acknowledgement went out carrying a digest over a document the community never issued. Both credentials verify; only the digest comparison fails, with nothing to say why. **BREAKING**: `new_member_vmc` takes the grant as `&serde_json::Value` — the JSON the community sent; new `digest_json()`.

### v0.4.0 — 2026-08-30 — the member-issued VMC becomes expressible; WD01 digest form adopted (#13)

The spec (WD01 #12) defines membership as a *pair* — grant plus an acknowledgement carrying a digest of the grant — but `CredentialSubjectBasic` was `deny_unknown_fields` over `id` alone, so an acknowledgement could not be built or parsed as a VMC at all. New `CredentialSubjectMembership` (with OPTIONAL `digest`), `new_member_vmc()`, `acknowledges()`, and the spec's digest: **`sha256:` + lowercase hex over JCS excluding `proof`** — one computation serving both the acknowledgement and the VWC. **This closed the 0.2.0 encoding divergence**: `digest_multibase()` (which had included `proof` and used multibase) was deprecated and `verify_digest()` switched to the conformant form. **BREAKING**: a `MembershipCredential` now deserializes with `CredentialSubject::Membership` (normalized in `TryFrom<DTGCommon>` because a `{ id, digest }` subject is shape-identical to a VWC's); a VMC whose subject fits none of the shapes is refused.

### v0.3.0 — 2026-08-29 — a credential gets its own `id` (#12) — `VTI-Dogwood-RC-1`

`DTGCommon` had no top-level `id`, so a crate-built credential could not carry one — and **every reciprocal MembershipCredential an OpenVTC member issued was being rejected by the VTC**, with the rejection arriving as a problem-report the member's client discarded, so the failure was silent on both sides. `with_id()` / `set_id()` / `id()`; `id` MUST be set before `sign()` (a test pins that). **BREAKING** only for exhaustive struct literals of `DTGCommon`.

### #11 — 2026-08-28 — `affinidi-tdk` 0.10 (dev) and TDK lock refresh

### v0.2.0 — 2026-08-10 — track DTG Core Credentials WD01 (#8, `feat!`; release notes #9) — `Cypress`

Part of the coordinated **`Cypress`** release ([[coordinated-releases]]; `Cypress` and `VTI-Cypress-RC-1` both point at the 0.2.0 HEAD; `Banyan` = `RC-0` = 0.1.3). The [[verifiable-trust-infrastructure|VTI]] (#916) and [[openvtc]] (#205) moved onto 0.2 the same day — VMC/VEC/VIC bytes were unchanged, so the bump was painless for them.

- **`taskContext` added to `DTGCommon`** (+ accessors). This was a real bug, not just a schema catch-up: `DTGCommon` lacked the field and had no `deny_unknown_fields`, so serde silently *dropped* `taskContext` on deserialize — and because `sign()` serialises the credential, issuers signed a document missing the field while verifiers hashed a different document than the one that was signed.
- **BREAKING**: `new_vwc(issuer, subject, valid_from, valid_until, task_context: String, digest: Option<String>, witness_context)`; deserialising a `WitnessCredential` without `taskContext` fails with the new `DTGCredentialError::MissingTaskContext`; new `Canonicalization(String)` error.
- New VWC digest helpers `digest_multibase()` / `verify_digest()` — at this version the digest covered the referenced VRC *including* its `proof`, over its JCS canonical form.
- `DTGCredentialType::RCard`, `CredentialSubject::RCard`, `CredentialSubjectRCard` and `new_rcard()` **deprecated** (not removed) — the relationship card left the spec for a planned VDS companion.
- **VWC digest divergence, flagged in the README/CHANGELOG at the time.** WD01 said the digest MUST be `sha256:` + lowercase hex; the crate emitted a multibase base58btc multihash (`z…`). *Resolved in 0.4.0 (crate adopts hex form) and then mooted by WD02, which moved the spec to multibase — adopted in 0.7.0.* The second, undeclared gap — `digest` as `Option` although spec PR #14 made it REQUIRED — stayed open through 0.11.0 and was closed in 0.12.0 by the VWC's replacement with the `witnessed/1` statement profile (see the note at the top of this section).
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

See also: [[dtg-credential-spec]], [[dtg-credentials-overview]], [[statement-credential]], [[correlation-scope]], [[authority-credential]], [[delegation-credential]], [[trust-task-context-binding]], [[decentralized-trust-graph]], [[verifiable-credentials]], [[coordinated-releases]]
