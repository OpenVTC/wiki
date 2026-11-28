---
title: "Community Governance: Boards and Elections"
type: concept
tags: [vtc, community, governance, elections, voting, boards, notifications, pcs, privacy, fig]
date-updated: 2026-11-28
sources: [verifiable-trust-infrastructure, openvtc, keyring-wallet, keyring-bifold, vta-browser-plugin]
---

# Community Governance: Boards and Elections

## Why a community needs to decide things together

Up to Eucalyptus, a [[verifiable-trust-community|Verifiable Trust Community]] could admit people, vet them, give them roles and require a second approver before an administrator did anything consequential. What it could not do was ask its *members* anything. Choosing a chair, agreeing on a code of conduct, deciding which sessions a meetup should run: every one of these fell back on a show of hands in a video call or a form on someone else's server. The form's operator learns who voted for what, and nothing ties the answers to the community's real membership.

The `VTI-Fig` release (2026-11-27) closes that gap with two connected pieces: **elections**, for polls, surveys and binding votes, and **boards**, where members propose ideas and each accepted idea becomes its own election. Both are built around one goal. The community should be able to prove that only its members voted, each of them once, while nobody can work out how any individual voted.

## Elections: two parties that never compare notes

The design splits an election between two parties that are deliberately kept apart (VTI #2239, 2026-10-21; requirements VTI-VOT-001 – 100):

- **The community is the registrar.** It decides who may vote, from its own records at the moment a member asks, and issues each eligible member one **ticket**. The ticket is *blind*: the community signs a request it cannot open, so it never sees the ticket it made.
- **A ballot box casts and counts.** It is a separate host service, `vti-voting-service`, and never part of the community's own process. It accepts a cast signed by a key made for that one cast, keeps the public (or private) board of ballots, and publishes the count. It holds no roster and never learns who holds which ticket.

The community knows who took a ticket but never sees a ballot. The ballot box sees every ballot but never learns whose it is. Linking a voter to a vote would need the two operators to collude, so members are told before they take a ticket who runs the ballot box and whether the same operator runs both (`Disclosure`, VTI-VOT-090). The ticket cryptography comes from the same [[zero-knowledge-proofs|Predicate Credential System]] that powers hidden [[peer-identity-vetting|vetting]]: the `vti-voting` crate (0.23.1 at Fig) provides "unlinkable voting tickets, casts bound to their ballot, and the ballot box's one-ballot-per-ticket check".

The member's own [[verifiable-trust-agent|VTA]] does the voter's work. It signs the reads and the ticket request as the member, unblinds the ticket, builds the cast under a fresh key, and keeps a receipt. Because the community knows when it issued a ticket and the ballot box knows when a cast arrived, a cast sent straight after its ticket could be matched by timing. So taking a ticket and voting are separate steps, and the client sends the cast after a random pause. Three secrecy levels are served:

- `open`
- `sealed`, where ballots are encrypted to a key that at least two independent trustees form together
- `tallied-encrypted`, where only totals are ever decrypted

The community verifies every step of the trustees' key ceremony and never accepts a key the ballot box merely reports (#845, #2254).

What Fig added on top:

- **A guided manifest builder** in the admin console (#2364). It walks an administrator through about, questions, who votes, schedule and counting, and checks as it goes everything the community would otherwise refuse. It ends on a plain-language summary and the digest that every ticket and vote is bound to. `cnm elections manifest init` and `check` do the same offline (#2365).
- **Voting from the member portal through the wallet** (#2367). The ballot is filled in the [[vta-browser-plugin|VTA Wallet]]'s own window, never on the community's page, because the portal is the community's code and the community must never see a ballot.
- **Credential rolls** (#2395). Eligibility is *proven at the moment the ticket is claimed*, not fixed when the election is called. The claimant presents a membership credential for the party the election is put to: the community itself, one of its groups, or a member party such as another community or a [[verifiable-trust-network|network]]. Someone who joins after the election is called can vote, and someone removed since cannot. One consequence is that the community cannot state the size of the electorate, so it reports turnout against the tickets it issued.
- **Checking a vote after close** (#2460). `pnm elections verify` and the wallet (plugin #420) ask the ballot box for an inclusion proof of each of the member's casts against the board "head" the community kept at close. A cast that is missing is reported, and the VTA keeps the receipt as evidence for 30 days.
- **Privacy for written answers.** A free-text answer can identify its author by what it says, so text answers are released only once `textReleaseThreshold` ballots are counted, and never in a running count. The threshold may now go as low as 1 (#2379), but 10 or more is advised. Below 10, the builder, the election page and every client warn first (OpenVTC #515, plugin #407).

**Notifications travel through the member's agent.** An election put to the members of a member party has to reach people the calling community does not list. Fig adds a general notification family, `notifications/notify` and `notifications/relay` (Trust Tasks #1012, VTI #2397, #2405). A community holds a notification only from a party it has a relationship with: an ACL entry, a relationship credential in force, or a network it has joined and acknowledged. Administrators can relay it to a group's members, and the notice is then held in each member's own VTA. Neither the community nor the member learns anything just from a notification being held.

The voting service guide says plainly where things stand. Every secrecy level runs end to end against a VTC over a mediator in the test suite, but the service has not yet run on deployed infrastructure. The ballot cryptography is unaudited protocol code over audited group operations: "fine for polls and surveys; have it reviewed before a binding election".

## Boards: an unconference wall

A **board** is a shared space where members propose ideas, leave notes and vote on each idea through an election of its own (VTI #2420, 2026-11-04; VTI-BRD-001 – 080; `vtc/boards/*` 0.1, Trust Tasks #1025). The VTI documentation's own picture is an unconference wall: members pin up session ideas, a facilitator puts the good ones to a show of hands, and once the hands are counted the facilitator fills the timetable.

- **Ideas and notes are signed and attributed.** Everyone who can see the board sees who wrote what.
- **Accepting an idea opens an ordinary election** from the board's template, which sets the question, secrecy, revote rule and ballot box. The board shows each election's stage, how many ballots are on its public board (refreshed every 30 minutes) and the result once tallied. It never shows or records who took a ticket or voted.
- **Results inform, facilitators decide.** Selecting an idea, optionally into a timetable slot, is a facilitator's decision made with the result in view. If the decision departs from the board's published selection rule, the facilitator has to give a reason. Selecting an idea grants nothing.
- **Facilitators** can be appointed per board by any existing facilitator (#2459). The appointment is a grant of `vtc.boards.manage` qualified to that one board, recorded on the appointee's ACL entry. If the person who made the appointment leaves the community or stops facilitating, the appointment goes to the community's action list for the administrators to re-affirm, the same machinery that governs the [[verifiable-trust-community|second-approver rule]].
- **Closing a board ends its voting** (#2444). An election that is open is closed early and counted as it stands, and one not yet open is cancelled. A closed board can be deleted, but each of its elections keeps a **tombstone** for a configurable retention period (365 days by default), so a result can still be checked after the board is gone (#2455, #2486).

The [[vta-browser-plugin|wallet]] can take every ticket for a board in one decision (`elections.takeTickets`, plugin #413), and the console groups elections by the board they came from (#2445). `pnm boards` and `cnm boards` are the command-line surfaces (#2431).

## The clients

Governance is designed so that every client can take part without holding any of the community's secrets:

- **[[openvtc|OpenVTC]]** votes in a community's elections (#514, 2026-11-01), handles thresholds below 10 with a warning first (#515), and supports credential rolls and notified elections (#519).
- **The [[vta-browser-plugin|VTA Wallet]]** exposes `window.vtaWallet.elections` to a community's portal (#404). It runs one ballot window that shows each step and remembers the vote (#406), presents a membership only once the member has chosen to (#409), and lists held notifications (#411).
- **[[keyring-wallet|Keyring]]** ([[keyring-bifold]]) brings community polls to the phone as a voter with a blind ticket (#884, 2026-11-02). Polls waiting for the member appear on Messages beside room offers (#894), and the vote is carried on in the background while each step is shown (#1155).

## The wire

The Trust Task registry ([[trust-tasks]]) carries the families involved:

- `voting/*`: the ballot box's ballot, board, election, result and trustee tasks
- `vtc/elections/*`: the registrar side
- `vta/pcs/voter/*` and `vta/pcs/vote*`: the voter's agent
- `vtc/boards/*` 0.1
- `notifications/*`

All of them were first published between 2026-10-19 and 2026-11-05 (Trust Tasks #834, #845, #1008 – #1011, #1025, #1032, #1044). Every call is a signed Trust Task, like everything else a VTC serves. The one sessionless door is the HTTPS endpoint on which the ballot box accepts casts, because a key made for a single cast has no messaging session to receive a reply on, and opening one would give the mediator the voter's address and timing.

## Where it stands

Elections and boards ship in `VTI-Fig` behind the VTC's `voting` build feature, which is off by default because it brings in the arkworks PCS stack. Badges, the community's recognition layer, build on the same groups and boards: an automatic badge can count `ideasSelected` and `electionTickets` (never whether a ballot was cast, which the community cannot know). See the badges section of [[verifiable-trust-community]]. Not yet done, by the documentation's own account: a ballot box on deployed infrastructure and a review of the ballot cryptography.

See also: [[verifiable-trust-community]], [[peer-identity-vetting]], [[zero-knowledge-proofs]], [[data-rooms]], [[verifiable-trust-network]], [[trust-tasks]]
