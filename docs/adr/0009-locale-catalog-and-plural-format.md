# ADR-0009: Deterministic Locale Catalog, Pluralization Rules, and Contextual Parameter Escaping

- **Status:** Accepted (Phase 8 / `v0.6.0`)
- **Date:** 2026-11-16
- **Related:** `AGENTS.md` §14, §20; `glyph/catalog.nox`; `glyph/locale.nox`

## Context

Template localization must be deterministic across OSes, serverless workers, and WASM environments. Reading process-global `LC_ALL` / OS timezone / host locale settings or fetching remote catalogs during rendering would violate determinism, break multi-tenant isolation, and poison compile caches. Furthermore, translation strings themselves may contain interpolated parameters (`{name}`) or HTML metacharacters, which must never become XSS vectors.

## Decision

1. **Explicit Locale & Read-Only Catalog:**
   - Locale selection uses explicit `RenderOptions.locale` / `EnvironmentOptions.default_locale` (never OS environment globals).
   - `TranslationCatalog` holds read-only per-locale `LocaleCatalog` entries, a `default_locale`, a `MissingTranslationPolicy` (`Strict`, `FallbackSource`, `ReturnKey`), and a monotonic `version` counter.
   - `catalog.version` is included in `build_compile_cache_key(...)` so catalog updates invalidate dependent compiled cache entries cleanly.
2. **Explicit Fallback Chain:**
   - `locale_fallback_chain(locale, default_locale)` normalizes `_` to `-`, tries the exact tag (e.g. `tr-TR`), then the base language tag (`tr`), then `default_locale` without duplicate lookups.
3. **Data-Driven Pluralization (Honest Scope):**
   - `plural_category(locale, count)` implements an explicit, deterministic rule table supporting `one` vs `other` rules (e.g. `n == 1` for `en`/`de`/`es`/`tr`, `0` and `1` for `fr`, and `PluralForms` with optional exact `zero`/`one`/`other` forms). Glyph explicitly avoids claiming full ICU/CLDR coverage in core.
4. **Contextual Parameter & Message Escaping:**
   - Translated strings are **not** implicitly promoted to `TrustedMarkup`.
   - `trans(key, ...)` and `plural(key, count, ...)` substitute `{param}` placeholders and format output as plain `Value.VStr`, which passes through `render_contextual_value(...)` for the active `OutputMode` and `HtmlContextTracker` (e.g. escaping both message text and parameter values in HTML/XML modes, or checking CR/LF in `EmailSubject` mode).

## Consequences

- `glyph/catalog.nox` remains 100% pure-memory and `--profile freestanding` / `wasm32-freestanding` safe.
- Hosted-only Unicode normalization (`nox.unicode.normalize`, `upper_tr`, `lower_tr`) stays cleanly isolated in `glyph/locale.nox` per `.github/workflows/ci.yml` boundary policy.
