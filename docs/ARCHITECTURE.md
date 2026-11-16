# Glyph Architecture (`docs/ARCHITECTURE.md`)

> **Status:** Phase 0 Baseline (Design & Verified Dependency Boundaries)  
> **Reference Contract:** [AGENTS.md](../AGENTS.md)

## 1. Layered Architecture & Dependency Direction

Glyph strictly enforces a one-way dependency graph. Core modules under `glyph/` never import web frameworks, network layers, or filesystem side effects outside explicitly isolated loaders.

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

### Hard Dependency Rules

1. `glyph/` **must never** import `integrations/`, `nyx`, `aether`, or `aura`.
2. `glyph/api.nox`, `value.nox`, `lexer.nox`, `parser.nox`, `ast.nox`, `runtime.nox`, `safety.nox`, `limits.nox`, and `loader_memory.nox` avoid hosted-only modules (`nox.fs`, `nox.unicode`) so pure-memory / WASM builds remain viable.
3. `glyph/loader_fs.nox` isolates `nox.fs` and `nox.path` behind canonical root confinement and error redaction.
4. `glyph/locale.nox` isolates `nox.unicode` and explicit locale catalogs without reading process-global state.

## 2. Core Data & Execution Decisions (Phase 0)

- **Value Model:** Tagged union (`enum Value`) backed by `nox.collections.OrderedDict[str, Value]` for deterministic map iteration and `list[Value]` for sequences. `VUndefined` is distinct from `VNull`.
- **Execution Model (v1):** `Source -> Tokens -> AST -> Static Validation -> AST Interpreter -> Chunked Writer`. No runtime code generation, `eval`, or compiler invocation.
- **Error Model:** Typed `GlyphError` hierarchy with stable machine-readable codes, `SourceSpan` (`logical_name`, `line`, `column`, `byte_start`, `byte_end`), and strict redaction of secrets, context values, and physical disk paths.
- **Resource Control:** Shared, non-resettable `ResourceBudget` passed across all child scopes, includes, and macro calls.
