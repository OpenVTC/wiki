# OpenVTC Ecosystem Wiki

A wiki covering the **OpenVTC** ecosystem — an open-source stack for
**Verifiable Trust Communities**: groups of people and organizations who
establish, verify, and audit trust relationships without relying on a central
authority.

> Live site: <https://OpenVTC.github.io/wiki>

## What This Wiki Is About

OpenVTC exists to address the **Know Your Developer** problem: how do you know
that a contributor to an open-source project is who they claim to be — that
their commit history is genuine, that they're not a sock puppet, and,
increasingly, that they're even human?

Rather than delegating identity to centralized gatekeepers (Google, employers,
governments), the OpenVTC ecosystem takes a **first-person** approach. Trust is
built from the ground up through real relationships between real people,
expressed as cryptographically verifiable credentials. The question becomes not
just *"who are you?"* but *"can I verify you're a real person through a chain
of real human relationships?"*

## Audience

The wiki is written for both internal team members and external newcomers. It
aims to be approachable to readers with light technical skills while remaining
substantive for deeply technical ones. The tone is narrative and conceptual —
leading with motivations and the big picture before diving into specifics.

## How This Wiki Is Maintained

This is an **LLM-maintained wiki**. Source material — upstream repositories,
specifications, design documents — is ingested by an LLM agent, which extracts
key concepts, updates entity pages, revises cross-references, and keeps a
"Recent Development" log on every entity page.

The wiki is a persistent, compounding artifact: knowledge is compiled once and
then kept current, rather than re-derived on every query.

## Tech Stack

The site is published with [Quartz](https://quartz.jzhao.xyz/) and hosted on
GitHub Pages. Wiki pages are plain Markdown with `[[wiki-link]]` style
cross-references and YAML frontmatter, rendered by Quartz into a static site
with backlinks, graph view, and full-text search.
