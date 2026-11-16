# ADR-0006: Macro Scope, `call/caller`, Inheritance, and `include` Defaults

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 5 (`v0.3.0`)

## 1. Problem

Template composition (`extends`, `block`, `super()`, `include`, `macro`, `import`, `from ... import`, `call`/`caller`) introduces scoping, trust-propagation, cycle, and method-call-syntax hazards if not explicitly constrained.

## 2. Prior Decisions

- [ADR-0002](0002-expression-grammar-and-truthiness.md): Arbitrary method calls (`obj.method()`) are forbidden in expressions.
- [ADR-0005](0005-loader-root-and-fs-toctou.md) & [ADR-0007](0007-cache-invalidation-and-isolation.md): All template loading is confined to logical names and invalidates `CompileCache` transitively.
- [AGENTS.md](../../AGENTS.md) §5.3, §9.1–9.3: Least privilege for `include`, immutable imported macro namespaces, shared `ResourceBudget` across recursion and `super()`, and no implicit `TrustedMarkup` promotion across trust boundaries.

## 3. Decision

1. **`include` Context Default:** `{% include "..." %}` defaults to `without context` (least privilege). `with context` must be written explicitly and binds a snapshot frame so `{% set %}` inside the included template never mutates the caller's scope.
2. **Inheritance (`extends`, `block`, `super()`):**
   - `extends` is permitted only once at top level; parent templates are resolved through the same `Environment` loader with cycle detection (`GLYPH_RENDER_CYCLE`) and `max_include_depth` accounting.
   - Effective `TrustTier` is the minimum (`min_trust_tier`) across the entire inheritance chain.
   - Top-level `set`, `macro`, `import`, and `from ... import` statements in child templates execute before root layout rendering so child declarations are available to block overrides.
   - `{{ super() }}` renders the next-higher template level's definition of the current block into a `GlyphWriter` sharing the same `BudgetTracker`; calling `super()` without a parent block fails closed (`GlyphRenderError`).
3. **Macro Scope & `call/caller`:**
   - Macros capture an immutable snapshot of top-level bindings from their defining template, never dynamic caller locals.
   - Positional, keyword, and default parameters are checked strictly for arity, duplicate arguments, and unknown keyword names.
   - Macro recursion and `caller()` callbacks share `BudgetTracker` (`max_macro_depth`, `max_output_bytes`, `max_total_ops`).
   - Macros from `Trusted` templates rendering in `OutputMode.Html` emit `SafeHtml` fragments while HTML-escaping untrusted interpolated values inside the macro body; macros from `Restricted`/`Untrusted` templates always return plain `VStr` (escaped by the caller).
4. **Namespace Macro Calls (`import "x.html" as h`):**
   - `h.macro_name(...)` is parsed as a static namespace macro call **only** when `h` was explicitly bound by `{% import ... as h %}` in the same template. All other `.method()` calls remain statically rejected (`GLYPH_SECURITY_POLICY`).
   - Imported namespaces are immutable; `_`-prefixed macros are private and cannot be imported or called across templates.

## 4. Acceptance Criteria

- [x] `examples/blog_layout/main.nox` (Vertical Slice #2) builds and renders cleanly via `noxc run`.
- [x] `tests/composition/composition_test.nox` passes all inheritance, `super()`, cycle, macro arity/recursion, `import`, `call/caller`, trust-tier, and cache invalidation tests.
- [x] `user.save()` and non-import `x.foo()` calls remain rejected by the parser.
