# Glyph Public API Reference (`docs/api.md`)

> **Version:** `1.2.0` (STABLE, `noxc >= 2.2.38`)  
> **Entry Module:** `import glyph.api`  
> **Stability Legend (`AGENTS.md` §23):**
> - **`Stable`**: Frozen for `v1.x` under SemVer; breaking signature or security-default changes require a MAJOR release and deprecation window.
> - **`Experimental`**: Supported adapter/extension surface whose exact helper options may refine across `v1.x` minor versions.
> - **`Internal`**: Implementation modules outside `glyph/api.nox`; not guaranteed across minor upgrades.

---

## 1. Environment & Compilation (`Stable`)

- `default_environment(loader: MemoryLoader) -> Environment` — Builds an HTML-safe environment (`autoescape=True`, `StrictUndefined`, `allow_safe_filter=False`, `default_budget()`).
- `new_environment(loader: MemoryLoader, options: EnvironmentOptions) -> Environment` — Builds an environment with explicit `EnvironmentOptions`.
- `compile_string(source: str, logical_name: str, env: Environment) -> Template` — Lexes, parses, and statically validates an in-memory template string.
- `get_template(name: str, env: Environment) -> Template` — Loads and compiles a template from `env.loader`.
- `lint(source: str, name: str, env: Environment) -> list[GlyphError]` — Collects syntax, security, validation, and limit diagnostics without executing the template.
- `inspect(template: Template) -> TemplateInfo` — Returns referenced external variables, blocks, includes, macros, and imports.

- `clear_cache(env: Environment)` & `freeze_environment(env: Environment)` — Clears compilation caches or freezes `filters`, `tests`, `functions`, and `catalog` for lock-free shared read-only concurrent renders across `spawn` fibers.
- `EnvironmentOptions.enable_constant_folding` & `fold_ast(ast: TemplateAst)` — Pure, policy/locale-independent constant folding pass (`v1.1.0`; compile-cache isolated).
- `set_telemetry_hook(env: Environment, hook: TelemetryHook)` & `telemetry_hook(on_trace, on_log)` (`TraceEvent`, `RedactedLogEvent`) — Zero-global opt-in tracing and redacted log hooks for Pulse / Obsidian (`v1.1.0`).

## 2. Rendering & Writer (`Stable`)

- `render(template: Template, context: Context, env: Environment) -> str` — Renders with default `RenderOptions` derived from `env.options`.
- `render_with_options(template: Template, context: Context, options: RenderOptions, env: Environment) -> str` — Renders with explicit `RenderOptions` and `ResourceBudget`.
- `render_to_writer(template: Template, context: Context, writer: GlyphWriter, options: RenderOptions, env: Environment) -> RenderResult` — Streams chunks into a buffered or streaming `GlyphWriter` under shared `BudgetTracker`.
- `streaming_writer(tracker: BudgetTracker, sink_fn: (str) -> bool, cancel_fn: () -> bool, flush_threshold_bytes: int) -> GlyphWriter` — Cooperative cancellation (`GlyphCancelledError`), sink backpressure, batch flush, idempotent `.close()`.
- `render_email_pair(subject_tpl, html_tpl, text_tpl, context, base_opts, env) -> EmailMessage` — Renders multipart HTML + PlainText + single-line `EmailSubject` with CR/LF/NUL header-injection blocking.
- `TranslationCatalog`, `LocaleCatalog`, `MissingTranslationPolicy`, `PluralForms`, `default_catalog()` (`env.catalog`, `trans(...)`, `plural(...)`), plus hosted Unicode utilities in `glyph/locale.nox` (`normalize_unicode`, `upper_for_locale`, `lower_for_locale`).
- `OutputMode` profiles: `Html`, `Text`, `Xml`, `Markdown`, `Json`, `EmailSubject`.

## 3. Context, Value & Safety (`Stable`)

- `empty_context() -> Context`
- `context_from_map(entries: OrderedDict[str, Value]) -> Context`
- `context_from_json(raw: str) -> Context` — Parses JSON into `Value` via zero-node `nox.json.pos_*` cursor traversal (`v1.2.0`; preserves 64-bit integer precision; never marks JSON strings as `VTrustedMarkup`).
- `escape_html(text: str) -> str` — Escapes `&`, `<`, `>`, `"`, `'` and rejects NUL bytes in HTML output.
- `trust_html_fragment(html: str) -> Value` — Promotes host-verified HTML to `MarkupContext.SafeHtml` (still downgraded/escaped outside `HtmlText` and stripped under `TrustTier.Restricted`).
- `trust_attr_value(attr: str) -> Value` — Promotes host-verified attribute content to `MarkupContext.SafeAttr`.
- `trust_url(url: str) -> Value` — Validates `url` against the URL scheme allowlist (`http`, `https`, `mailto`, `tel`, relative) and returns `MarkupContext.SafeUrl` (raises `GlyphSecurityError` upfront on unsafe schemes or obfuscation).
- `trust_js_literal(js: str) -> Value` — Promotes host-generated JSON/JS literals to `MarkupContext.SafeJs` (preferred template pattern: `{{ data | tojson }}`).
- `OutputContext` — Enum representing contextual HTML positions (`HtmlText`, `HtmlAttributeQuoted`, `HtmlAttributeUnquoted`, `HtmlUrlAttribute`, `HtmlJs`, `HtmlEventHandler`, `HtmlCss`, `StyleAttribute`, `HtmlTagOrAttrName`, `HtmlRawUnsafeAttr`, `HtmlComment`, `Unknown`).

## 4. Loaders, Cache, Options & Registries (`Stable`)

- `Loader` (`load`), `MemoryLoader` (`put`, `put_with_trust`, `has`, `load`, `as_loader`)
- `ChoiceLoader` & `PrefixLoader` (composite loaders; `ChoiceLoader` never falls back on security/path confinement errors)
- `PackageLoader` & `ReadOnlyAdapterLoader` (`v1.1.0`: `@pkg/...` package prefix isolation, host adapter callback bridge without core I/O, trust clamping)
- `FilesystemLoader` (`glyph/loader_fs.nox`, `__all__`-enforced hosted module — canonical root lock, path traversal & sibling-prefix protection)
- **Hosted Safe Remote Pattern:** Pair `ReadOnlyAdapterLoader` with `nox.safehttp.request` (`v2.2.38+`) for SSRF/DNS-rebinding-safe remote templates (see [docs/loaders.md](loaders.md)).
- **Compile-Time API Enforcement:** Leaf/hosted/adapter modules (`loader_fs.nox`, `locale.nox`, `integrations/*/*.nox`) declare `__all__` (`v2.2.5+`) to prevent internal helper imports across module boundaries.
- `environment_with_loader(loader: Loader, options: EnvironmentOptions) -> Environment`
- `ParseCache`, `CompileCache`, `clear_cache(env)` (composite policy/version/locale/registry keys + transitive dependency invalidation)
- `html_safe_defaults()`, `text_safe_defaults()`, `restricted_defaults()`, `default_render_options(env_opts)`
- `FilterRegistry` (`register`, `register_with_spec`, `freeze`, `all_specs`) — core built-in filters cannot be overridden; mutations are blocked during active renders.
- `TestRegistry` & `FunctionRegistry` (`register`, `register_with_spec`, `freeze`, `all_specs`) — `is` tests and pure helper functions with `HelperContext` isolation.
- `FilterSpec`, `TestSpec`, `FunctionSpec`, `HelperContext`, `CostClass` & `builtin_filter_specs()`, `builtin_test_specs()`, `builtin_function_specs()`.
- Full built-in catalog reference: [docs/filters.md](filters.md).
- `ResourceBudget` (`default_budget()`, `restricted_budget()`)

## 5. Diagnostics, Framework Adapters & CLI (`Stable` Core / `Experimental` Adapters)

- `glyph/diagnostics.nox`: `format_error_human`, `format_error_json`, `format_template_info_json`, `format_template_info_human`, `exit_code_for_error` (`0 OK`, `2 usage`, `3 syntax`, `4 loader`, `5 security`, `6 resource`, `7 runtime`, `8 internal`), plus `SourceMapSpan` & `build_source_map_json`.
- `integrations/nyx/glyph_nyx.nox`: Opt-in `render_view` and preflight `render_view_stream` (see [docs/integration-nyx.md](integration-nyx.md)).
- `integrations/aether/glyph_aether.nox`: Explicit `Accept` content-negotiation adapter (`text/html`, `application/xml`, `text/plain`; see [docs/integration-aether.md](integration-aether.md)).
- `integrations/aura_export/glyph_aura_export.nox`: Opt-in Aura HTML/Text document export helpers (`export_html_document`, `export_plain_text_document`, `export_restricted_snapshot`; never replaces Aura UI widgets).
- `tools/aot_codegen.nox` & `tools/tree-sitter-glyph/grammar.js`: Research PoC `TemplateAst -> .nox` source codegen (ADR-0011) and Tree-sitter syntax grammar (see [docs/tooling.md](tooling.md)).
- `cli/main.nox` (`cli/app.nox`): Hosted `glyph` CLI (`check`, `lint`, `render`, `inspect`, `deps`, `bench`, `version`).

## 6. Error Hierarchy (`Stable`)

All errors inherit `GlyphError(Exception)` and carry `code`, `category`, `logical_name` (redacted), `line`, `column`, `span_start_byte`, `span_end_byte`, `safe_hint`, `render_phase`:

`GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`.

## 7. Stability, SemVer & Deprecation Policy (`AGENTS.md` §23)

- **Semantic Versioning (`v1.0.0`+):** Breaking changes to `Stable` public signatures in `glyph/api.nox`, template escaping defaults, or documented security invariants require a **MAJOR** release.
- **Security Invariant Guarantee:** Weakening default HTML escaping, URL scheme filtering, path confinement, or reflection denial is forbidden in `v1.x` minor/patch releases.
- **Deprecation Window:** Any `Stable` symbol slated for removal or replacement is first marked `Deprecated` across at least one minor `v1.x` release with documented migration notes before removal in the next MAJOR version.
- **`Internal` Modules:** Direct imports of internal helper modules (`glyph/runtime.nox`, `glyph/parser.nox`, `glyph/lexer.nox`, etc.) may evolve across `v1.x` minor releases; applications should import `glyph.api` (plus `glyph.loader_fs` and `glyph.locale` on hosted targets).
