# ADR-0011: Ahead-of-Time `TemplateAst` to Typed NOX Source Codegen

- **Status:** Accepted (Research PoC in `tools/aot_codegen.nox`)
- **Date:** 2026-11-17
- **Phase:** 11 (`v1.1.0`)

## Context

`AGENTS.md` §3 (`RESEARCH`) and §24 ask for a feasibility assessment and optional proof-of-concept for ahead-of-time compilation from parsed `TemplateAst` to statically typed `.nox` source code **without** modifying `noxc` or adding compiler plugins.

## Decision

1. **No Compiler Patches:** Codegen emits standard NOX 2.x source code (`tools/aot_codegen.nox`) that uses existing `glyph.api` value/escaping/writer primitives (`write_escaped`, `Value`, `BudgetTracker`, `escape_html`), compiling cleanly with unmodified `noxc check` / `noxc build` / `noxc run`.
2. **Scoped PoC Subset:** The PoC compiles deterministic HTML/Text templates covering:
   - Static text segments (`SText`)
   - Output expressions (`SOutput`) with compile-time HTML escaping (preserving `TrustTier` & `escape_html`)
   - Lexical `{% set %}` bindings (`SSet`), `{% if %}`/`elif`/`else` (`SIf`), and `{% for %}` loops (`SFor`) over `Value`
   - Literal, identifier, lookup, unary, arithmetic, comparison, and boolean expressions plus pure string/length filters
   - Explicit `BudgetTracker` checks before loops and writes so generated code obeys the same DoS bounds as the interpreter
3. **Non-Goals for `v1.1.0`:**
   - Dynamic `include`, cross-template inheritance merging, arbitrary runtime plugin macros, and context-sensitive HTML attribute state machine inference remain interpreted in `glyph.runtime` unless lowered explicitly via whole-program specialization in a future `v2.0` pass.
4. **Equivalence Contract:** Any template accepted by `aot_codegen` must produce byte-for-byte identical output to `Environment.render_str(...)` on both positive inputs and budget/overflow errors.

## Consequences

- Zero impact on `glyph/` core runtime size or `--profile freestanding` compatibility (`tools/aot_codegen.nox` sits in `tools/`).
- Establishes a reproducible baseline for future static template bundles without runtime parser overhead.
