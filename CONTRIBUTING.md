# Contributing to Glyph

Thank you for your interest in contributing to **Glyph** (`github.com/mburakmmm/glyph`).

All contributions, refactors, and AI-assisted changes are governed by the project contract in [AGENTS.md](AGENTS.md).

## Core Rules

1. **NOX-first & Verified Capabilities:** Core modules are written in pure NOX (`glyph/*.nox`). Do not invent stdlib or compiler features from memory or Python assumptions. Any external capability must be verified with `noxc check` and `noxc test` and recorded in [docs/compatibility.md](docs/compatibility.md).
2. **Dependency Direction:** `glyph/` (core) must **never** import `integrations/` (`nyx`, `aether`, `aura`) or framework-specific packages. Adapters depend on core, never the reverse.
3. **Security Invariants First:** No shortcut that weakens autoescaping, context boundaries, loader path confinement, error redaction, or `ResourceBudget` will be accepted.
4. **Architectural Decision Records (ADRs):** Significant design decisions follow `docs/adr/NNNN-short-title.md` before implementation.

## Development Workflow

Every development unit follows:

`Specification -> Threat/Boundary Analysis -> Minimal .nox Code -> Positive/Negative/Security Tests -> Performance Check -> Documentation`

### Local Verification Commands

```sh
# Check types across a file or test suite
noxc check tests/audit/audit_test.nox

# Run all *_test.nox tests
noxc test

# Format source files
noxc fmt glyph/version.nox
```

## Pull Request Checklist

- [ ] Scope, risks, and acceptance criteria match [docs/roadmap.md](docs/roadmap.md) and [todo.md](todo.md).
- [ ] `noxc check` and `noxc test` pass after the final edit.
- [ ] New public APIs are documented in `docs/api.md` (with `Stable`/`Experimental`/`Internal` tags).
- [ ] Positive, negative, boundary, and security regression tests are included where applicable.
- [ ] `CHANGELOG.md` and `todo.md` are updated accurately (no incomplete items marked done).
