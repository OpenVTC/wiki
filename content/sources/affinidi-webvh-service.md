---
title: "Source: affinidi-webvh-service"
type: source-summary
tags: [source, secondary, affinidi, webvh, did-hosting]
date-updated: 2026-04-30
repo: https://github.com/affinidi/affinidi-webvh-service
---

# Source: affinidi-webvh-service

**Repo**: [affinidi/affinidi-webvh-service](https://github.com/affinidi/affinidi-webvh-service)
**Type**: Secondary
**Latest version**: v0.5.0

## Summary

Production infrastructure for did:webvh hosting and management. Six crates: server, witness, watcher, control plane, all-in-one daemon, and shared library. DIDComm-authenticated inter-service communication. Deep VTA integration for bootstrap.

## Key Wiki Page

- [[affinidi-webvh-service]]

## Recent Activity

- **v0.5.0 — DIDComm control-plane integration** (Apr 13): the control plane now communicates with services over DIDComm
- **Architecture simplification** (Apr 12): removed in-tree CLI/tasks/VTA-cache; now consumes the published `vta-sdk` from crates.io
- **Daemon parity with standalone server + control** (Apr 13): the all-in-one daemon now offers the same surface as the split deployment; ACL routes normalized; shared fjall stores opened once to avoid lock contention
- Security: dependabot alerts cleared; duplicate /api/health route removed
- Internal: CLAUDE.md added with daemon parity guidelines
