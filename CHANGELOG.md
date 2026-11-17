# Changelog

All notable changes to **Glyph** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-17

### Added
- `tests/fuzz/fuzz_and_property_test.nox`: Property-based AST roundtrip equivalence, independent differential reference expression evaluator, escaper idempotence & `forceescape` double-escape properties, 500-sample arbitrary-byte `compile_string`/`lint` fuzzing, and 5 explicit parser/limit/security/loader mutation gates.
- `tests/concurrency/concurrency_and_stress_test.nox`: Concurrent `1/4/16`-task `spawn` waves sharing a frozen `Environment` under `--strict-spawn-shared`, 64-wave mixed `OutputMode`/`TrustTier`/locale isolation, 320-template LRU eviction & 25-cycle transitive invalidation stress, and 10,000-row O(n) streaming writer verification.
- `glyph/api.nox` & `glyph/environment.nox`: Added `freeze_environment(env)` and made frozen `FilterRegistry`, `TestRegistry`, and `FunctionRegistry` skip shared `active_renders` counter writes during concurrent renders.
- `benchmarks/bench_suite.nox` & `docs/performance.md`: Reproducible 3-round benchmark suite comparing cold compile, warm render, 10/1K/10K loops, 3/10-level inheritance, include+macro, dense HTML escaping vs Text mode, cache hit/miss, streaming `GlyphWriter`, and stdlib `nox.template` baseline.
- `examples/wasm_memory/main.nox`, `examples/static_site/main.nox`, and `docs/testing.md`.
- Marked `Stable` / `Experimental` / `Internal` API stability tiers and SemVer deprecation policy in `docs/api.md` for `v1.0.0`.

### Changed
- Bumped `GLYPH_VERSION` and `nox.json` to `1.0.0`.
- Fixed NUL-safe string literal part concatenation (`_concat_parts_safe`) in `glyph/lexer.nox` (`noxc 2.1.186` `nox.strings.join` workaround documented in `docs/compatibility.md`).

## [0.7.0] - 2026-11-16

### Added
- `docs/adr/0010-nyx-adapter-and-migration-rules.md` (ADR-0010), `docs/integration-nyx.md`, and `docs/integration-aether.md`.
- `integrations/nyx/glyph_nyx.nox` & `examples/nyx/main.nox`: Opt-in `render_view` and preflight `render_view_stream` (HTTP `Content-Type`, `X-Content-Type-Options: nosniff`, single-line validated CSP nonce, never patches `nyx.view.render`).
- `integrations/aether/glyph_aether.nox` & `examples/aether/main.nox`: Explicit HTTP `Accept` content-negotiation adapter (`text/html`, `application/xml`, `text/plain`; directs `application/json` to `nox.json`).
- `glyph/diagnostics.nox`, `cli/app.nox`, `cli/main.nox`: Structured human/JSON diagnostic formatting with physical path redaction, deterministic CLI exit codes (`0, 2, 3, 4, 5, 6, 7, 8`), and `glyph` CLI (`check`, `lint`, `render` with JSON-only context, `inspect`, `deps`, `bench`, `version`).
- `tests/integration/integration_and_cli_test.nox` (Vertical Slice #3) and updated CI matrix in `.github/workflows/ci.yml` + `docs/compatibility.md` + `docs/api.md`.

## [0.6.0] - 2026-11-16

### Added
- `docs/adr/0008-streaming-writer-and-partial-errors.md` (ADR-0008) and `docs/adr/0009-locale-catalog-and-plural-format.md` (ADR-0009).
- `glyph/catalog.nox` (freestanding-safe) & `glyph/locale.nox` (hosted `nox.unicode`): `TranslationCatalog`, `LocaleCatalog`, `MissingTranslationPolicy`, fallback chains (`tr-TR -> tr -> en`), deterministic rule-based `plural()`, contextual escaping of `trans()`/`plural()` interpolated parameters, and `catalog.version` cache invalidation in `glyph/cache.nox`.
- `glyph/options.nox`, `glyph/safety.nox`, `glyph/value.nox`, `glyph/email.nox`: `OutputMode.Xml` structural + illegal control-char guards (dynamic XML tags/attributes and unquoted attrs rejected), `OutputMode.Json` safe serializer, `OutputMode.Markdown`, `OutputMode.EmailSubject` (blocks `\r`, `\n`, `\0` header injection), and `render_email_pair(...)` + `examples/email/main.nox`.
- `glyph/writer.nox`: `streaming_writer(tracker, sink_fn, cancel_fn, flush_threshold_bytes)` with batched flushing, downstream backpressure (`GlyphRenderError`), cooperative cancellation (`GlyphCancelledError`), idempotent `.close()`, `bytes_flushed`/`flush_count`, and 16 MiB output cap parity.
- `tests/locale/i18n_profiles_streaming_test.nox` and updated `docs/api.md`.

## [0.5.0] - 2026-11-16

### Added
- `glyph/helpers.nox`: `CostClass`, `FilterSpec`, `TestSpec`, `FunctionSpec`, and isolated `HelperContext` (locale, immutable policy, shared `BudgetTracker`, bounded diagnostics — never exposes `RenderScope`).
- `glyph/filters_text.nox`, `glyph/filters_collections.nox`, `glyph/filters.nox`: Full pure/deterministic built-in filter catalog (`capitalize`, `title`, `trim`, `replace`, `truncate`, `wordcount`, `indent`, `center`, `pad`, `striptags`, `normalize_unicode`, `urlencode`, `slugify`, `forceescape`, `xml_escape`, `md_escape`, `first`, `last`, `reverse`, `sort`, `unique`, `map`, `select`, `reject`, `batch`, `slice`, `sum`, `min`, `max`, `groupby`, `dictsort`, `abs`, `round`, `int`, `float`, `string`, `number`, `currency`, `percent`, `filesize`, `date`, `datetime`, explicit-`ref` `relative_time`).
- `glyph/tests_registry.nox` & `glyph/functions.nox`: Full `is` test catalog (`iterable`, `odd`, `even`, `divisibleby`, `equalto`, `in`, `escaped`, `safe_for`, `true`, `false`), `register_with_spec`, `all_specs`, core override rejection, active-render mutation lock, and `.freeze()`.
- `glyph/parser.nox` & `glyph/value.nox` & `glyph/runtime.nox`: Namespaced `| ns.filter` / `is ns.test` syntax, shared `check_not_undef` / `values_equal` / `values_compare` / `values_contains` helpers, and render-scoped registry locking.
- `docs/filters.md`, updated `docs/api.md`, and `tests/filters/filters_tests_registry_test.nox`.

## [0.4.0] - 2026-11-16

### Added
- `docs/adr/0003-contextual-html-escaping.md` (ADR-0003), `docs/adr/0004-trusted-markup-and-safe-policy.md` (ADR-0004), `docs/adr/0012-user-created-templates-threat-model.md` (ADR-0012), `docs/security.md`, and updated `SECURITY.md` + `docs/api.md`.
- `glyph/safety.nox` & `glyph/runtime.nox`: Stateful `HtmlContextTracker` & `OutputContext` fail-closed contextual escaping across static text, interpolations, `if`/`for` divergence guards, `block`/`super()`, `macro`/`call`, and `include` boundaries.
- URL allowlist enforcement (`http`, `https`, `mailto`, `tel`, relative paths) rejecting HTML entity/percent/control/backslash/`//` smuggling and validating each `srcset` candidate URL.
- Denial of unsafe HTML positions (`HtmlAttributeUnquoted`, `HtmlEventHandler`, `HtmlCss`, `StyleAttribute`, `HtmlTagOrAttrName`, `HtmlRawUnsafeAttr` `srcdoc`, `HtmlComment` `--`/`>` breakouts, raw `<script>` values, and `Unknown`).
- `glyph/filters.nox` & `glyph/api.nox`: Protected `|tojson` filter emitting `MarkupContext.SafeJs` (escaping `<`, `>`, `&`, `U+2028`, `U+2029`) and host promotion helpers `trust_html_fragment`, `trust_attr_value`, `trust_url`, `trust_js_literal`.
- `tests/security/contextual_xss_test.nox`: Adversarial XSS, URL smuggling, `|tojson`, provenance isolation, and `TrustTier.Restricted` regression suite.

## [0.3.0] - 2026-11-16

### Added
- `docs/adr/0006-macro-scope-caller-and-includes.md` (ADR-0006).
- `glyph/inheritance.nox`: Multi-level `{% extends %}`, `{% block %}`, `{{ super() }}` block override chains, cycle detection, and `TrustTier` floor propagation.
- `glyph/macros.nox`: `{% macro %}` (positional, keyword, default args, lexical capture), `{% import "..." as h %}`, `{% from "..." import ... %}`, private `_macro` boundary enforcement, `{% call %}` / `caller()`, and `max_macro_depth` recursion bounds.
- `glyph/parser.nox` & `glyph/environment.nox`: Static namespace call support (`h.macro(...)` only for explicit `{% import %}` aliases, while preserving method-call denial on values) and transitive `CompileCache` invalidation for `extends` and `imports`.
- `examples/blog_layout/main.nox` (Vertical Slice #2) and `tests/composition/composition_test.nox`.

## [0.2.0] - 2026-11-16

### Added
- `docs/adr/0005-loader-root-and-fs-toctou.md` (ADR-0005), `docs/adr/0007-cache-invalidation-and-isolation.md` (ADR-0007), and `docs/loaders.md`.
- `glyph/loader.nox`: `Loader` closure-backed interface, `validate_logical_template_name` (blocks `/`, `\`, drives, UNC, `.`, `..`, NUL, `%2e`/`%2f`/`%5c`), `ChoiceLoader` (no fallback on confinement errors), and `PrefixLoader` (trust-zone isolation).
- `glyph/loader_fs.nox`: Hosted-only `FilesystemLoader` with canonical root confinement, `nox.path.safe_join` + post-canonicalization verification, anonymized root origin hash, and redacted `GlyphLoadError` messages.
- `glyph/cache.nox`: Bounded `ParseCache` and `CompileCache` using composite keys (`origin_id`, `fingerprint`, `OutputMode`, `autoescape`, `TrustTier`, `allow_safe_filter`, `allow_dynamic_include`, registry generations, `locale`, `GLYPH_VERSION`) and transitive dependency invalidation.
- `glyph/runtime.nox` & `glyph/environment.nox`: `{% include %}` execution (`without context` default, `with context` isolated frame copy, `ignore missing`, cycle detection `GLYPH_RENDER_CYCLE`, shared `max_include_depth` budget, and `TrustTier` floor enforcement).
- Phase 4 tests: `tests/loaders/loader_test.nox` and `tests/cache/cache_test.nox`.

## [0.1.0] - 2026-11-16 (MVP)

### Added
- `glyph/options.nox`: `OutputMode`, `TrustTier`, `EnvironmentOptions`, `RenderOptions` (`html_safe_defaults()`, `text_safe_defaults()`, `restricted_defaults()`).
- `glyph/scope.nox`: `Context` (`empty_context`, `context_from_map`, `context_from_json`), `RenderScope` lexical scope chain, and `loop` metadata.
- `glyph/writer.nox`: Chunk-buffered `GlyphWriter` and `RenderResult` with `max_output_bytes` enforcement.
- `glyph/safety.nox`: O(n) `escape_html` (zero-alloc clean path), NUL-byte rejection in HTML output, and context-tagged `VTrustedMarkup` rendering rules.
- `glyph/filters.nox`, `glyph/tests_registry.nox`, `glyph/functions.nox`: MVP built-in filters (`escape`/`e`, `default`, `length`, `join`, `upper`, `lower`, policy-gated `safe`), built-in tests (`defined`, `undefined`, `none`, `empty`, type predicates), and bounded `range()`.
- `glyph/loader.nox` & `glyph/loader_memory.nox`: `SourceRecord` and pure-memory `MemoryLoader`.
- `glyph/runtime.nox` & `glyph/environment.nox` & `glyph/api.nox`: AST interpreter, reusable `Template`, `Environment`, `compile_string`, `get_template`, `render`, `render_with_options`, `render_to_writer`, `lint`, `inspect`.
- `examples/hello/main.nox` (Vertical Slice #1), `docs/api.md`, `tests/rendering/render_test.nox`, and `tests/security/mvp_security_test.nox`.

## [0.0.3-parser-ast] - 2026-11-16

### Added
- `docs/adr/0002-expression-grammar-and-truthiness.md` (ADR-0002), `docs/syntax.md`, and `docs/expressions.md`.
- `glyph/expressions.nox` & `glyph/ast.nox`: Immutable tagged-union AST and expression nodes (`Expr`, `ExprKind`, `Stmt`, `StmtKind`, `TemplateAst`) with `SourceSpan`.
- `glyph/parser.nox`: Two-stage statement nesting + Pratt/precedence-climbing expression parser (`if/elif/else`, `for/else`, `set`, `include`, `extends`, `block`, `macro`, `import`, `from`, `call`), `max_expr_depth`/`max_ast_nodes` bounds, chained comparison rejection, method-call/reflection rejection, and `lint_tokens`.
- `glyph/validate.nox`: Static validator and `TemplateInfo` extractor (duplicate block checks, top-level `extends`, `super()` placement, dynamic include policy, external variable tracking).
- Phase 2 test suites: `tests/parser/parser_test.nox` and `tests/expression/expression_test.nox`.

## [0.0.2-core-lexer] - 2026-11-16

### Added
- `glyph/errors.nox`: Typed `GlyphError` hierarchy (`GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`), `SourceSpan`, `RelatedSpan`, stable error codes, and path redaction (`redact_logical_name`, `format_public_error`).
- `glyph/limits.nox`: `ResourceBudget` (`default_budget()`, `restricted_budget()`) and shared non-resettable `BudgetTracker`.
- `glyph/value.nox`: Tagged-union `Value` (`VNull`, `VUndefined`, `VBool`, `VInt`, `VFloat`, `VStr`, `VList`, `VMap`, `VTrustedMarkup`, `VCallable`), `JsonValue` conversion preserving 64-bit integers, strict truthiness/stringify rules, reflection key blocking (`__class__`, `__dict__`, `constructor`, `prototype`), NaN/Inf rejection, and overflow-checked integer arithmetic.
- `glyph/token.nox` and `glyph/lexer.nox`: O(n) single-pass UTF-8-validating lexer with byte/codepoint `SourceSpan` tracking, whitespace trimming (`{{-`, `-}}`, `{%-`, `-%}`, `{#-`, `-#}`), comments, `{% raw %}...{% endraw %}` (nested raw rejected), string escapes, and `ResourceBudget` enforcement.
- Phase 1 tests: `tests/value/value_test.nox` and `tests/lexer/lexer_test.nox` (including 200-case deterministic fuzz smoke).

## [0.0.1-audit] - 2026-11-16

### Added
- Phase 0 feasibility & NOX `2.1.186` capability audit (`docs/compatibility.md`).
- Project manifest (`nox.json`), lock/packaging baseline, and core module entry (`glyph/version.nox`, `glyph/api.nox` audit skeleton).
- Architecture and roadmap baseline (`docs/ARCHITECTURE.md`, `docs/roadmap.md`, `docs/adr/0001-min-nox-version-and-value-repr.md`).
- Phase 0 Proof-of-Concept & audit test suite (`tests/audit/*_test.nox`) and standalone consumer verification (`examples/audit_consumer/`).
- GitHub repository scaffolding (`README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `.github/` templates, CI and Release workflows).
