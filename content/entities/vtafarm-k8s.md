---
title: "vtafarm-k8s — VTA Farm cluster (OpenTofu on Hetzner)"
type: entity
tags: [vta-farm, hosting, kubernetes, vault, opentofu, hetzner, infrastructure, secondary, deployment]
date-updated: 2026-09-18
repo: https://github.com/ic3software/vtafarm-k8s
---

# vtafarm-k8s — VTA Farm cluster (OpenTofu on Hetzner)

*Repo: [github.com/ic3software/vtafarm-k8s](https://github.com/ic3software/vtafarm-k8s)*

vtafarm-k8s is the ground the Farm stands on: OpenTofu stacks, a Makefile and thirteen runbooks that take an empty Hetzner Cloud project to a running [[vtafarm]] + [[vtafarm-api]], with HashiCorp Vault underneath. It is the **sysop deploy stream** that [[vti-setup]] retired its systemd docs in favour of in the Cypress pass and labelled "coming soon" — Kubernetes, Vault as the secret store, TLS from cert-manager — now real, and generic enough that anyone with a Hetzner token and a Cloudflare zone can run their own Farm. In the [[vta-topology]] vocabulary, this is how you become a Verifiable Trust Service Provider.

## Why this shape

The README states the premise in one line: *"Vault keeps the master seed of every VTA encrypted and separated per user, which is what makes a farm safe enough to run vtafarm on."* A [[verifiable-trust-agent|VTA]]'s seed is the root of every key the user will ever have ([[bip32-key-derivation]]), so a multi-tenant host has to answer where that seed rests and who can reach it. The answer here is a three-peer Raft **farm Vault** with one policy and one Kubernetes-auth role per user namespace, seeds at `secret/vta/user-<id>/session-<id>/master-seed`, and each tenant pod authenticating with its own ServiceAccount JWT bound to its own namespace. The API's bootstrap policy can create and delete tenant access but has *no read capability on any seed*.

A Vault cannot unseal itself after a restart, and a farm whose pods block on a human every reboot is not highly available. So a second, single-pod **transit Vault** holds one `autounseal` key: it is initialised with Shamir keys (5 shares, threshold 3) and unsealed by hand once; the farm Vault unseals against it thereafter. The runbook is candid that an in-cluster transit Vault protects data at rest and removes the manual step but does not defend against full compromise of a running cluster — the token that unwraps the farm's root key lives in that cluster. Moving to a cloud KMS is a one-stanza change. Initialisation and unsealing are deliberately *not* in OpenTofu so recovery keys and root tokens never land in state.

## What It Does

Five stacks, applied in order; each waits on the one before:

| Stack | Builds | Once per |
|-------|--------|----------|
| `01-infra` | 3-node HA **k3s** on Hetzner (`cx23`, nbg1, spread placement, private network, load balancer, etcd snapshots to Object Storage every 6 h) | organisation |
| `02-rancher` | **Rancher** on that cluster, with cert-manager and Let's Encrypt | organisation |
| `03-rke2-clusters/<name>` | an **RKE2** cluster Rancher creates for a farm (`cx33` servers, canal CNI, Traefik ingress, hcloud CCM/CSI) — or a single-node **dev** cluster (#21) | farm |
| `04-vtafarm-platform/<name>` | **cert-manager**, **Longhorn** storage (one replica per volume, daily S3 backups) and the **two Vaults** | farm |
| `05-vtafarm-app/<name>` | the **vtafarm** and **vtafarm-api** Helm charts from GHCR, the wildcard TLS chart, generated JWT and DB secrets | farm |

All state lives in a locked S3 backend on Hetzner Object Storage (#15), one state file per cluster directory; `terraform.tfvars` files are synced through the same bucket rather than committed. The Makefile fronts everything (`make new-rke2-cluster CLUSTER=…`, `make apply-vtafarm-platform …`, `make vault-bootstrap … TARGET=farm|transit`, `make kubeconfig-merge-rke2 …`). The whole management layer costs about **€38/month**; a farm cluster adds its own nodes.

The thirteen runbooks are the sysop's manual the wiki was waiting for: `vault.md` (init, unseal, the isolation model, day-2), `backup-restore.md` (four failure scenarios and a drill, #19), `cluster-migration.md` (moving a live farm — database, Vault and tenants — to a new cluster, #18), upgrades for every layer, operations, testing (the HA failover test), troubleshooting, teardown, cost, remote state, an OpenTofu primer, and `design-decisions.md`, which explains every pin.

## Components

| Path | Role |
|------|------|
| `stacks/01-infra`, `02-rancher` | management layer, built once |
| `stacks/03…05/_template` | per-cluster scaffolds instantiated by `scripts/new-*.sh` |
| `modules/rke2-custom-cluster` | Rancher-managed RKE2 on Hetzner, rolling upgrades with concurrency 1, drain config (#20), stable machine plans (#23) |
| `modules/vtafarm-platform` | cert-manager, Longhorn + backup chart, farm Vault and transit Vault (with an in-cluster PKI chart) |
| `modules/vtafarm-app` | the two application Helm releases and the TLS chart |
| `scripts/` | `vault-bootstrap.sh` (took over the API's bootstrap), etcd snapshot/restore, OS and package upgrades, cluster migration, kubeconfig helpers |

**Pinned versions** (`design-decisions.md` explains each): k3s **v1.35.7** and Rancher **2.14.3** (the newest k3s Rancher's chart accepts); RKE2 **v1.35.7+rke2r1**; cert-manager **v1.21.1**; Longhorn **1.12.1**; Vault Helm chart **0.33.0**; hcloud CCM 1.34.0 / CSI 2.22.1; OpenTofu ≥ 1.12; Ubuntu 24.04. Application versions are the two chart versions in stack 05's tfvars (`vtafarm_version`, `vtafarm_api_version`), each chart's `appVersion` being its image tag.

## Dependencies & relationships

Produces the cluster, Vault and `vtafarm-api-vault` Secret that [[vtafarm-api]] requires before it will start, and installs [[vtafarm]] beside it. The VTA, mediator, DID-hosting and VTC images those provision come from GHCR and are chosen per session, not here. Hetzner Cloud and Cloudflare are hard dependencies today. Nothing in this repo is specific to the project's own `firstperson.dev` farm; the domain and credentials are inputs.

## Recent Development

No tagged releases — it is infrastructure, applied from `main`. 32 commits since 2026-08-10, almost all in the three weeks around the first published Farm releases.

- **09-11** avoid RKE2 machine-plan churn (#23). **09-04** Apache-2.0 + DCO (#22).
- **08-30** single-node RKE2 **dev mode** (#21); drain configured (#20).
- **08-22 → 08-27** locked S3 state backend (#15); helm provider 3.x (#16); Longhorn S3 backups (#17); **live-farm migration** (#18); backup/restore drills (#19).
- **08-19 → 08-21** **stack 05 installs the applications**; **Vault migrated in from vtafarm-api (#11)** with its upgrade runbook; Rancher owns Traefik; Longhorn at one replica; README trimmed (#13).
- **08-12 → 08-16** Object Storage backups and Ubuntu upgrades (#1); Rancher-managed RKE2 hosts (#2); CLAUDE.md (#6); Terraform → **OpenTofu** (#7); rolling package upgrades (#8).
- **08-10/11** first commit; a 3-node k3s HA cluster running Rancher on Hetzner (nbg1, `cx23`); bootstrap, CCM and certificate-order fixes.

### Maturity and known gaps

Young but already exercised by migrations and drills. Single region, Hetzner-only, Cloudflare-only DNS; Longhorn at one replica trades durability for cost (S3 backups are the safety net); the transit-Vault seal is explicitly interim pending a cloud KMS; and the Farm is not a TEE — for hardware-isolated keys the VTA's Nitro mode remains a separate, self-hosted path.

See also: [[vtafarm]], [[vtafarm-api]], [[vti-setup]], [[vta-topology]], [[verifiable-trust-agent]], [[verifiable-trust-infrastructure]]
