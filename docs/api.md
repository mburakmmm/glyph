# Glyph Public API Reference (`docs/api.md`)

> **Version:** `0.1.0` (MVP)  
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
- `render_to_writer(template: Template, context: Context, writer: GlyphWriter, options: RenderOptions, env: Environment) -> RenderResult` — Streams chunks into a `GlyphWriter` under shared `BudgetTracker`.

## 3. Context, Value & Safety (`Experimental` until `v1.0.0`)

- `empty_context() -> Context`
- `context_from_map(entries: OrderedDict[str, Value]) -> Context`
- `context_from_json(raw: str) -> Context` — Parses JSON into `Value` (preserving 64-bit integer precision; never marks JSON strings as `VTrustedMarkup`).
- `escape_html(text: str) -> str` — Escapes `&`, `<`, `>`, `"`, `'` and rejects NUL bytes in HTML output.

## 4. Loaders, Options & Registries (`Experimental` until `v1.0.0`)

- `MemoryLoader` (`put`, `put_with_trust`, `has`, `load`)
- `html_safe_defaults()`, `text_safe_defaults()`, `restricted_defaults()`, `default_render_options(env_opts)`
- `FilterRegistry` (`register` — core security/built-in filters cannot be overridden)
- `ResourceBudget` (`default_budget()`, `restricted_budget()`)

## 5. Error Hierarchy

All errors inherit `GlyphError(Exception)` and carry `code`, `category`, `logical_name` (redacted), `line`, `column`, `span_start_byte`, `span_end_byte`, `safe_hint`, `render_phase`:

`GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`.
