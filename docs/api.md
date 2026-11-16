# Glyph Public API Reference (`docs/api.md`)

> **Version:** `0.6.0` (Phase 8)  
> **Entry Module:** `import glyph.api`  
> **Stability Legend:** `Stable` (contract frozen in SemVer), `Experimental` (v0.x shape subject to refinement before `v1.0`), `Internal` (implementation detail).

---

## 1. Environment & Compilation (`Experimental` until `v1.0.0`)

- `default_environment(loader: MemoryLoader) -> Environment` — Builds an HTML-safe environment (`autoescape=True`, `StrictUndefined`, `allow_safe_filter=False`, `default_budget()`).
- `new_environment(loader: MemoryLoader, options: EnvironmentOptions) -> Environment` — Builds an environment with explicit `EnvironmentOptions`.
- `compile_string(source: str, logical_name: str, env: Environment) -> Template` — Lexes, parses, and statically validates an in-memory template string.
- `get_template(name: str, env: Environment) -> Template` — Loads and compiles a template from `env.loader`.
- `lint(source: str, name: str, env: Environment) -> list[GlyphError]` — Collects syntax, security, validation, and limit diagnostics without executing the template.
- `inspect(template: Template) -> TemplateInfo` — Returns referenced external variables, blocks, includes, macros, and imports.

## 2. Rendering & Writer (`Experimental` until `v1.0.0`)

- `render(template: Template, context: Context, env: Environment) -> str` — Renders with default `RenderOptions` derived from `env.options`.
- `render_with_options(template: Template, context: Context, options: RenderOptions, env: Environment) -> str` — Renders with explicit `RenderOptions` and `ResourceBudget`.
- `render_to_writer(template: Template, context: Context, writer: GlyphWriter, options: RenderOptions, env: Environment) -> RenderResult` — Streams chunks into a buffered or streaming `GlyphWriter` under shared `BudgetTracker`.
- `streaming_writer(tracker: BudgetTracker, sink_fn: (str) -> bool, cancel_fn: () -> bool, flush_threshold_bytes: int) -> GlyphWriter` — Cooperative cancellation (`GlyphCancelledError`), sink backpressure, batch flush, idempotent `.close()`.
- `render_email_pair(subject_tpl, html_tpl, text_tpl, context, base_opts, env) -> EmailMessage` — Renders multipart HTML + PlainText + single-line `EmailSubject` with CR/LF/NUL header-injection blocking.
- `TranslationCatalog`, `LocaleCatalog`, `MissingTranslationPolicy`, `PluralForms`, `default_catalog()` (`env.catalog`, `trans(...)`, `plural(...)`), plus hosted Unicode utilities in `glyph/locale.nox` (`normalize_unicode`, `upper_for_locale`, `lower_for_locale`).
- `OutputMode` profiles: `Html`, `Text`, `Xml`, `Markdown`, `Json`, `EmailSubject`.

## 3. Context, Value & Safety (`Experimental` until `v1.0.0`)

- `empty_context() -> Context`
- `context_from_map(entries: OrderedDict[str, Value]) -> Context`
- `context_from_json(raw: str) -> Context` — Parses JSON into `Value` (preserving 64-bit integer precision; never marks JSON strings as `VTrustedMarkup`).
- `escape_html(text: str) -> str` — Escapes `&`, `<`, `>`, `"`, `'` and rejects NUL bytes in HTML output.
- `trust_html_fragment(html: str) -> Value` — Promotes host-verified HTML to `MarkupContext.SafeHtml` (still downgraded/escaped outside `HtmlText` and stripped under `TrustTier.Restricted`).
- `trust_attr_value(attr: str) -> Value` — Promotes host-verified attribute content to `MarkupContext.SafeAttr`.
- `trust_url(url: str) -> Value` — Validates `url` against the URL scheme allowlist (`http`, `https`, `mailto`, `tel`, relative) and returns `MarkupContext.SafeUrl` (raises `GlyphSecurityError` upfront on unsafe schemes or obfuscation).
- `trust_js_literal(js: str) -> Value` — Promotes host-generated JSON/JS literals to `MarkupContext.SafeJs` (preferred template pattern: `{{ data | tojson }}`).
- `OutputContext` — Enum representing contextual HTML positions (`HtmlText`, `HtmlAttributeQuoted`, `HtmlAttributeUnquoted`, `HtmlUrlAttribute`, `HtmlJs`, `HtmlEventHandler`, `HtmlCss`, `StyleAttribute`, `HtmlTagOrAttrName`, `HtmlRawUnsafeAttr`, `HtmlComment`, `Unknown`).

## 4. Loaders, Cache, Options & Registries (`Experimental` until `v1.0.0`)

- `Loader` (`load`), `MemoryLoader` (`put`, `put_with_trust`, `has`, `load`, `as_loader`)
- `ChoiceLoader` & `PrefixLoader` (composite loaders; `ChoiceLoader` never falls back on security/path confinement errors)
- `FilesystemLoader` (`glyph/loader_fs.nox` — hosted-only, canonical root lock, path traversal & sibling-prefix protection)
- `environment_with_loader(loader: Loader, options: EnvironmentOptions) -> Environment`
- `ParseCache`, `CompileCache`, `clear_cache(env)` (composite policy/version/locale/registry keys + transitive dependency invalidation)
- `html_safe_defaults()`, `text_safe_defaults()`, `restricted_defaults()`, `default_render_options(env_opts)`
- `FilterRegistry` (`register`, `register_with_spec`, `freeze`, `all_specs`) — core built-in filters cannot be overridden; mutations are blocked during active renders.
- `TestRegistry` & `FunctionRegistry` (`register`, `register_with_spec`, `freeze`, `all_specs`) — `is` tests and pure helper functions with `HelperContext` isolation.
- `FilterSpec`, `TestSpec`, `FunctionSpec`, `HelperContext`, `CostClass` & `builtin_filter_specs()`, `builtin_test_specs()`, `builtin_function_specs()`.
- Full built-in catalog reference: [docs/filters.md](filters.md).
- `ResourceBudget` (`default_budget()`, `restricted_budget()`)

## 5. Error Hierarchy

All errors inherit `GlyphError(Exception)` and carry `code`, `category`, `logical_name` (redacted), `line`, `column`, `span_start_byte`, `span_end_byte`, `safe_hint`, `render_phase`:

`GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`.
