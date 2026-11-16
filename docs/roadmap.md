# Glyph Development Roadmap (`docs/roadmap.md`)

> Synchronized with [AGENTS.md](../AGENTS.md) §24 and [todo.md](../todo.md).  
> **Honesty Rule:** Only phases whose code, tests, and release gates have been executed and verified are marked complete.

| Phase | Target Version | Scope Summary | Status |
|---|---|---|---|
| **Phase 0** | `v0.0.1-audit` | Toolchain lock (`noxc 2.1.186`), stdlib/language PoCs, `nox.json`, repo & CI/Release scaffolding, `compatibility.md`, `ARCHITECTURE.md`, `ADR-0001` | **Done** (`tests/audit/audit_test.nox`) |
| **Phase 1** | `v0.0.2-core-lexer` | `Value`, `SourceSpan`, typed `GlyphError`, `ResourceBudget`, `Token`, O(n) `Lexer` | **Done** (`tests/value/`, `tests/lexer/`) |
| **Phase 2** | `v0.0.3-parser-ast` | `ADR-0002`, Pratt expression parser, AST, `if`/`for`/`set`, static validation | **Done** (`tests/parser/`, `tests/expression/`) |
| **Phase 3** | `v0.1.0` **(MVP)** | `Environment`, `Template`, `Scope`, chunked `Writer`, default HTML escaping, MVP filters, `MemoryLoader`, Vertical Slice #1 | **Done** (`tests/rendering/`, `tests/security/`, `examples/hello/`) |
| **Phase 4** | `v0.2.0` | `ADR-0005`, `ADR-0007`, `FilesystemLoader`, `include`, `ParseCache`/`CompileCache`, dependency invalidation | Planned |
| **Phase 5** | `v0.3.0` | `ADR-0006`, `extends`, `block`, `super()`, `macro`, `import`, `call/caller`, Vertical Slice #2 | Planned |
| **Phase 6** | `v0.4.0` | `ADR-0003`, `ADR-0004`, `ADR-0012`, contextual HTML/URL/JS/CSS tracker, `TrustedMarkup`, XSS corpus | Planned |
| **Phase 7** | `v0.5.0` | Full built-in filter/test catalog, `FilterSpec` registry, `HelperContext`, cost metering | Planned |
| **Phase 8** | `v0.6.0` | `ADR-0008`, `ADR-0009`, i18n/locale/plural, HTML/Text/XML/MD/JSON/Email modes, streaming `GlyphWriter` | Planned |
| **Phase 9** | `v0.7.0` | `ADR-0010`, `integrations/nyx/`, `integrations/aether/`, `glyph` CLI, diagnostic JSON, Vertical Slice #3 | Planned |
| **Phase 10** | `v1.0.0` **(STABLE)** | Fuzzing, property/differential/mutation/concurrency tests, benchmarks, WASM verification, CI/SBOM, **v1.0 Release Gate** | Planned |
| **Phase 11** | `v1.1.0+` / `v2.0` | `with`/`filter` blocks, component/slot DSL, constant folding, LSP/grammar, Aura export, AOT & sandbox research | Planned |
