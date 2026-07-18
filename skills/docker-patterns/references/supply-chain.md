# Container supply chain

Short playbook agents can apply without pinning brittle CLI flags.

## Scan images in CI

Run an image scanner on built artifacts (or on pushed tags) so vulnerabilities surface before deploy. Common tool families: **Docker Scout**, **Trivy**, **Grype**. Wire the scanner your org standardizes on; treat failing gates as policy (severity thresholds, allowed CVE IDs) rather than ad hoc clicks. Prefer pipelines that can consume **VEX** attestations to cut false positives when available.

## SBOM and provenance

Generate **SBOM** and **build provenance** attestation as part of release builds. BuildKit/Buildx adds **provenance by default** (`mode=min`) for modern `docker build`; request SBOM explicitly (`--sbom=true` or attest config). See current Buildx docs for `docker buildx build --attest` rather than copying version-specific flags here.

- [Docker Build attestations](https://docs.docker.com/build/attestations/)

## Signing

**Docker Content Trust / Notary v1 is retired** — do not design new pipelines around DCT. Sign and verify with **Cosign / Sigstore** (or Notation). Sign the image **digest**, not a mutable tag.

Sign release images so consumers can verify publisher and digest. One-line shape (exact flags evolve): sign the digest after push, verify with your org’s key or keyless policy.

## Base image cadence

Moving tags (e.g. `node:22-alpine`) pick up upstream fixes—and upstream breakage. Prefer **scheduled rebuilds** of pinned bases (digest or immutable patch tags) so security patches land on a controlled rhythm; combine with scanner alerts for critical CVEs between rebuilds.
