# ADR-0004: `TrustedMarkup` Provenance and `|safe` Policy

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 6 (`v0.4.0`)

## 1. Problem

A raw string or generic "safe" flag cannot safely cross HTML text, attribute, URL, and JavaScript contexts. Furthermore, allowing `|safe` in default templates lets mistakes or untrusted template edits bypass escaping.

## 2. Prior Decisions

- [AGENTS.md](../../AGENTS.md) §2.4–2.5, §10.3: Trust must be context-labeled (`SafeHtml`, `SafeAttr`, `SafeUrl`, `SafeJs`); `SafeHtml` is not automatically safe in attributes, URLs, or scripts; concatenation with untrusted strings taints trust; `|safe` is disabled by default.

## 3. Decision

1. **Context-Tagged Trust (`MarkupContext`):**
   - `SafeHtml`: Unescaped **only** in `HtmlText` (escaped in `HtmlAttributeQuoted`, URL-validated in `HtmlUrlAttribute`, rejected in `HtmlJs`).
   - `SafeAttr`: Unescaped **only** in `HtmlAttributeQuoted` (escaped in `HtmlText`).
   - `SafeUrl`: Permitted in `HtmlUrlAttribute` (after NUL/scheme sanity check and attribute encoding), escaped in `HtmlText`.
   - `SafeJs`: Permitted **only** in `HtmlJs` (`<script>`) in `TrustTier.Trusted` templates; escaped in `HtmlText`/`HtmlAttributeQuoted`.
2. **Host-Only Provenance:** Host NOX code promotes verified values via explicit `trust_html_fragment`, `trust_attr_value`, `trust_url`, `trust_js_literal` helpers in `glyph.api` (or `|tojson` producing `SafeJs`). JSON inputs (`context_from_json`) never produce `VTrustedMarkup`.
3. **Trust Downgrade Rules:**
   - Any string concatenation (`+`), `join`, `upper`, `lower`, or `forceescape` strips `TrustedMarkup` back to plain `VStr` (or `SafeHtml` after re-escaping for `forceescape`).
   - `Restricted` and `Untrusted` templates ignore `VTrustedMarkup` bypasses (`|safe` disabled and `SafeHtml` escaped) so trust never escalates inside lower-trust templates.

## 4. Acceptance Criteria

- [ ] `SafeHtml` inside `href`, `title`, or `<script>` never bypasses URL validation, attribute escaping, or JS rejection.
- [ ] Concatenating `SafeHtml + VStr` downgrades to `VStr` and gets escaped on output.
- [ ] `|safe` remains disabled under `html_safe_defaults()` and `TrustTier.Restricted`.
