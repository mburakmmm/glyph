# ADR-0003: Contextual HTML Escaping and Unsafe Context Denial

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 6 (`v0.4.0`)

## 1. Problem

HTML entity escaping (`&`, `<`, `>`, `"`, `'`) protects `HtmlText` and quoted HTML attributes, but fails to prevent XSS in URL attributes (`javascript:`), unquoted attributes, `<script>` blocks, `on*` event handlers, `<style>`/`style=` CSS sinks, `srcdoc`, and dynamic tag/attribute names.

## 2. Prior Decisions

- [AGENTS.md](../../AGENTS.md) §2.3–2.4, §10.1–10.4: Contextual escaping is required; unknown/ambiguous or unsafe contexts must fail closed rather than silently guessing.
- [ADR-0001](0001-min-nox-version-and-value-repr.md) & [ADR-0002](0002-expression-grammar-and-truthiness.md): Core remains pure NOX, freestanding-safe, and deterministic.

## 3. Decision

1. **`OutputContext` State Machine (`glyph/safety.nox`):**
   - `HtmlContextTracker` scans static `SText` segments incrementally during HTML-autoescaped rendering to classify every `{{ expr }}` output site into:
     `HtmlText`, `HtmlAttributeQuoted`, `HtmlAttributeUnquoted`, `HtmlUrlAttribute`, `HtmlJs`, `HtmlEventHandler`, `HtmlCss`, `StyleAttribute`, `HtmlTagOrAttrName`, `HtmlComment`, `HtmlRawUnsafeAttr`, or `Unknown`.
2. **Fail-Closed Policy for Unsafe Contexts:**
   - `HtmlAttributeUnquoted`, `HtmlEventHandler` (`on*`), `HtmlCss` (`<style>`), `StyleAttribute` (`style=`), `HtmlTagOrAttrName`, `HtmlRawUnsafeAttr` (`srcdoc`), and `Unknown` **always reject interpolation** with `GlyphSecurityError(GLYPH_SECURITY_CONTEXT)`.
   - `HtmlJs` (`<script>`) rejects all interpolation by default except explicit `MarkupContext.SafeJs` (such as `|tojson` with JS-in-HTML escaping) in `TrustTier.Trusted` templates.
   - `HtmlComment` rejects `--` and `>` breakout sequences in interpolated values.
3. **URL Attribute Enforcement (`href`, `src`, `action`, `formaction`, `poster`, `cite`, `data`, `xlink:href`, `srcset`):**
   - Rejects ASCII control bytes (`0x00..0x1F`, `0x7F`) and backslashes (`\`).
   - Normalizes HTML character references and percent-escapes before checking the scheme so `&#106;avascript:`, `java\tscript:`, and `java%73cript:` are caught and rejected.
   - Allows only `http`, `https`, `mailto`, `tel`, and relative URLs without a scheme; HTML-escapes the attribute value.
4. **Control-Flow Divergence:** If `{% if %}` branches or `{% for %}` loop bodies leave the HTML tracker in mismatched states, the tracker transitions conservatively to `Unknown` (fail-closed).

## 4. Acceptance Criteria

- [ ] Adversarial XSS corpus (`tests/security/contextual_xss_test.nox`) blocks unquoted attrs, `on*`, `style=`, `<style>`, `srcdoc`, dynamic tags/attrs, obfuscated `javascript:`/`vbscript:`/`data:` URLs, and raw `<script>` interpolation.
- [ ] `|tojson` escapes `<`, `>`, `&`, `</`, `U+2028`, and `U+2029` for safe embedding.
