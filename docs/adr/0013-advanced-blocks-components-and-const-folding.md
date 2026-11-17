# ADR-0013: Advanced Blocks (`with`, `filter`), Components/Slots, `namespace()`, Constant Folding, Loaders, and Telemetry Hooks

- **Status:** Accepted
- **Date:** 2026-11-17
- **Phase:** 11 (`v1.1.0`)

## Context

Phase 11 expands Glyph beyond `v1.0.0` STABLE primitives while preserving every security, determinism, and dependency boundary invariant in `AGENTS.md` §2, §7.3, §9.4, and §19.

## Decisions

### 1. `{% with ... %}` and `{% filter ... %}`

- `{% with a = expr, b = expr %}...{% endwith %}` evaluates RHS expressions in the enclosing scope before pushing a child lexical frame, executes the body, and pops the frame cleanly even on error (`finally`-style unwind). Parent scope mutation is prohibited.
- `{% filter name(args...) %}...{% endfilter %}` renders its body into an isolated sub-writer that **inherits** the active `BudgetTracker`, `TrustTier`, and `HtmlContextTracker` output mode (escaped HTML/Text according to current context), applies the registered pure filter to the resulting string, and emits the filtered result under normal escaping rules unless the filter returns explicit `TrustedMarkup` **and** active policy permits it (`allow_raw_in_template` in `TrustTier.Trusted`; forbidden in `TrustTier.Restricted`). `filter safe` / `filter raw` never bypass contextual escaping in untrusted/restricted tiers.

### 2. `{% component "tpl" k=v %}...{% slot "name" %}...{% endslot %}{% endcomponent %}` vs `macro` / `call`

- **Comparison:** `macro` + `call/caller` shares a compiled module namespace and passes a single anonymous `caller()` callback. `component` targets a separate logical template path resolved via `Loader` with **named props** (`k=v` evaluated in caller scope) and **multiple named slots** (`{% slot "header" %}...{% endslot %}` plus an optional implicit `"default"` slot).
- **Security & Isolation:**
  - Components execute target templates in a **fresh isolated scope** populated only with explicit props and caller-rendered slot markups (never implicit parent variables).
  - Target templates resolve through the same canonical `Loader` and inherit `min_trust_floor` (`TrustTier.Restricted` cannot escalate to `Trusted`) and shared `BudgetTracker` (recursion/include depth counts toward `max_include_depth`).
  - Dynamic component names require `EnvironmentOptions.allow_dynamic_include = True`.
  - Components are strictly **SSR text/HTML composition** (`AGENTS.md` §9.4); they have no retained UI widget tree or DOM/Aura runtime semantics.

### 3. `namespace(...)` Scoped Accumulator

- Built-in pure helper `namespace(k=v, ...)` creates an explicitly marked mutable-in-scope `VMap`-backed container bounded by `max_collection_items` and `BudgetTracker`. Mutations occur only via explicit `set ns.key = val`? Wait — Glyph `set` binds local names, so `namespace` stays compatible with existing expression semantics via explicit `set ns = ns.with("k", val)` or pure `ns_set(ns, "k", val)` / field access without adding arbitrary object attribute mutation to the AST! Wait: let's keep `SSet` simple (`{% set ns = ns.set(...) %}` or a clear helper / `set ns.field = ...` if validated solely on explicit `VNamespace`). Even cleaner and safer: a dedicated `VMap`-like namespace constructor `namespace(...)` plus scoped mutation `{% set ns.key = expr %}` allowed **only** when target resolves to a namespace marker (`__glyph_ns__`), leaving ordinary maps/structs immutable!

### 4. Pure Constant Folding (`glyph/const_fold.nox`)

- Controlled by `EnvironmentOptions.enable_constant_folding: bool` (included in `build_compile_cache_key`).
- **Allowlist (Pure & Policy-Independent Only):** Literal arithmetic (`+`, `-`, `*`, `//`, `%` when non-zero & checked for overflow; division by zero or overflow is left unfolded to preserve runtime error spans), unary `+`/`-`/`not`, boolean `and`/`or` on constant bools, comparisons (`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `is`) on pure literals, constant-condition ternary `a if true else b` (when branches are validated), and constant-condition `if` simplification is kept out of AST unless pure expression-level.
- **Strict Denylist:** NEVER fold `trans`, `plural`, `date`, `datetime`, `relative_time`, `currency`, `percent`, `number`, `normalize_unicode`, `slugify`, `upper`, `lower` (locale-sensitive!), `escape`, `forceescape`, `safe`, `raw`, `tojson`, `urlencode`, or any non-pure/policy-sensitive node.
- **Verification Gate:** Differential tests assert `render(fold=True) == render(fold=False)` across mixed expressions, locales, and error cases.

### 5. `PackageLoader` & `ReadOnlyAdapterLoader` (`glyph/loader.nox`)

- `PackageLoader` wraps an inner `Loader` (or static source map) scoped to a validated package prefix, preventing cross-package escape.
- `ReadOnlyAdapterLoader` wraps host read-only lookup callbacks (`load_source(logical_name) -> SourceRecord`) without importing DB/HTTP packages into `glyph/`, enforcing `validate_logical_template_name`, `TrustTier`, and `redact_logical_name`.

### 6. Opt-In Telemetry Hooks (`glyph/telemetry.nox`)

- `TelemetryHook` / `TraceEvent` (`glyph.compile`, `glyph.load`, `glyph.render`, `glyph.include`, `glyph.macro`) & `RedactedLogEvent` for Pulse/Obsidian adapters.
- Default is zero-allocation no-op (`None`); never uses process globals; logs only logical template names (redacted), phase, duration_ms, cache hit/miss, and error code — **never** context values, secrets, raw source, or disk paths.
