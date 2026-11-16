<div align="center">

# Glyph

**An independent, statically typed, security-first template engine for the [NOX](https://github.com/mburakmmm/nox-lang) programming language.**

[![CI](https://github.com/mburakmmm/glyph/actions/workflows/ci.yml/badge.svg)](https://github.com/mburakmmm/glyph/actions/workflows/ci.yml)
[![Release](https://github.com/mburakmmm/glyph/actions/workflows/release.yml/badge.svg)](https://github.com/mburakmmm/glyph/actions/workflows/release.yml)
[![NOX Version](https://img.shields.io/badge/NOX-%E2%89%A5%202.1.186-blue.svg)](https://github.com/mburakmmm/nox-lang)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Fail--Closed-critical.svg)](SECURITY.md)

</div>

---

> **Project Status:** **Phase 6 (`v0.4.0`) Complete** — Fail-closed contextual HTML/URL/JS/CSS escaping (`HtmlContextTracker`, `|tojson`, `TrustedMarkup` provenance, URL allowlist + anti-obfuscation) verified (`noxc test`: 11/11 suites passing on LLVM & QBE, freestanding & WASM smoke verified). Next up: Phase 7 (`v0.5.0` Full Built-in Filter/Test Registry & `HelperContext` — see [todo.md](todo.md) and [docs/roadmap.md](docs/roadmap.md)).

---

## Why Glyph?

NOX's built-in `nox.template` provides a minimal string/block placeholder utility. **Glyph** is a separate, standalone, production-grade template engine inspired by Jinja2's productivity while staying faithful to NOX's static typing, ahead-of-time compilation, and strict security boundaries:

- **NOX-First & Pure Core:** Written in native NOX (`glyph/*.nox`) with zero Python/Node runtime dependencies. Core modules never import web frameworks.
- **Data, Not Code:** Templates cannot execute NOX/Python code, `eval`, shell commands, reflection (`__class__`, `__dict__`), or arbitrary I/O.
- **Safe-by-Default & Fail-Closed:** HTML escaping is enabled by default. Output trust (`SafeHtml`, `SafeAttr`, `SafeUrl`, `SafeJs`) is context-tagged; unknown or unsafe contexts fail closed.
- **Bounded Execution:** A shared, non-resettable `ResourceBudget` bounds source bytes, tokens, AST nodes, include/macro/expression depth, loop iterations, output bytes, and total operations.
- **Path-Confined Loaders & Isolated Cache:** `FilesystemLoader` confines templates to a canonical root; cache keys incorporate origin identity, source fingerprint, policy/escape mode, engine version, registry generation, and locale.
- **Portable & Deterministic:** Pure-memory execution paths avoid hosted-only modules so `MemoryLoader` targets (including `wasm32-freestanding` / `wasm32-wasi`) work cleanly.

---

## Architecture Overview

```text
           Application / Nyx / Aether / CLI / WASM Host
                                |
                    optional adapters (integrations/)
                                |
       +------------------- glyph.api -------------------+
       |            Environment / Template              |
       |  Loader + Registry + Policy + Cache + Locale    |
       +------------------------+-----------------------+
                                |
                +---------------+------------------+
                |                                  |
         compile pipeline                     render pipeline
  lexer -> parser -> AST -> validate       AST interpreter -> Writer
                |                                  |
                +-------- Expression IR -----------+
                                |
         Value + Scope + Safety/Escaping + Limits + Errors
                                |
              verified NOX stdlib capabilities
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/adr/0001-min-nox-version-and-value-repr.md](docs/adr/0001-min-nox-version-and-value-repr.md) for architectural decisions and dependency rules.

---

## Verified Toolchain & Quick Checks

Glyph is currently audited against **`noxc 2.1.186`**.

```sh
# Type-check core entry across backends and profiles
noxc check glyph/api.nox
noxc check --backend qbe glyph/api.nox
noxc check --profile freestanding glyph/api.nox

# Run all *_test.nox suites
noxc test

# Run the Phase 3 & 5 examples (Vertical Slices #1 & #2)
noxc run examples/hello/main.nox
noxc run examples/blog_layout/main.nox

# Run the Phase 0 standalone consumer verification
noxc run examples/audit_consumer/main.nox

# Generate CycloneDX 1.5 SBOM
noxc sbom . -o glyph.sbom.json
```

---

## Roadmap & Milestones

| Phase | Target Version | Focus | Status |
|---|---|---|---|
| **Phase 0** | `v0.0.1-audit` | Toolchain lock (`noxc 2.1.186`), capability audit, PoCs, CI/Release, `ADR-0001` | Done |
| **Phase 1** | `v0.0.2-core-lexer` | Typed `Value`, `SourceSpan`, `GlyphError`, `ResourceBudget`, O(n) `Lexer` | Done |
| **Phase 2** | `v0.0.3-parser-ast` | Pratt expression parser, AST, `if`/`for`/`set`, static validation | Done |
| **Phase 3** | `v0.1.0` **(MVP)** | Interpreter, chunked `Writer`, HTML escape, MVP filters, `MemoryLoader` | Done |
| **Phase 4** | `v0.2.0` | `FilesystemLoader` sandbox, `include`, `ParseCache`/`CompileCache` | Done |
| **Phase 5** | `v0.3.0` | `extends`, `block`, `super()`, `macro`, `import`, `call/caller` | Done |
| **Phase 6** | `v0.4.0` | Contextual escaping, URL/JS/CSS denial, `TrustedMarkup`, XSS corpus | Done |
| **Phase 7** | `v0.5.0` | Full built-in filter/test registry, `HelperContext`, cost metering | Planned |
| **Phase 8** | `v0.6.0` | i18n/locale/plural, HTML/Text/XML/MD/JSON/Email modes, Streaming `Writer` | Planned |
| **Phase 9** | `v0.7.0` | `integrations/nyx`, `integrations/aether`, `glyph` CLI, JSON diagnostics | Planned |
| **Phase 10** | `v1.0.0` **(STABLE)** | Fuzzing, race/stress, benchmarks, WASM verification, Release Gate | Planned |
| **Phase 11** | `v1.1.0+` / `v2.0` | `with`/`filter` blocks, component/slot DSL, const-folding, LSP, AOT research | Planned |

Track detailed phase tasks in [todo.md](todo.md) and [docs/roadmap.md](docs/roadmap.md).

---

## Documentation & Governance

- **Project Contract:** [AGENTS.md](AGENTS.md)
- **Task Tracker:** [todo.md](todo.md)
- **NOX Capability Matrix:** [docs/compatibility.md](docs/compatibility.md)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Security Policy:** [SECURITY.md](SECURITY.md)
- **Contributing Guide:** [CONTRIBUTING.md](CONTRIBUTING.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## License

MIT — see [LICENSE](LICENSE).
