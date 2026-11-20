# Glyph Security Architecture & Threat Model (`docs/security.md`)

> **Version:** `0.4.0` (Phase 6)  
> **ADRs:** [ADR-0003](adr/0003-contextual-html-escaping.md), [ADR-0004](adr/0004-trusted-markup-and-safe-policy.md), [ADR-0005](adr/0005-loader-root-and-fs-toctou.md), [ADR-0012](adr/0012-user-created-templates-threat-model.md)

## 1. Core Security Invariants

1. **Templates are data, not programs:** No NOX/Python execution, `eval`, shell commands, reflection (`__class__`, `__dict__`, `constructor`, `prototype`), or method calls (`obj.save()`).
2. **Fail-closed contextual HTML escaping:** Output context is tracked across `SText` and validated on every `{{ expr }}` output.
3. **Context-tagged trust:** `SafeHtml`, `SafeAttr`, `SafeUrl`, and `SafeJs` are distinct; trust never transfers across incompatible contexts or survives concatenation with untrusted strings.
4. **Monotonic resource budgets:** `ResourceBudget` bounds source bytes, tokens, AST nodes, expression/include/macro depth, loop steps, output bytes, and total operations across all sub-renders.
5. **Path-confined loaders & redacted diagnostics:** Physical host directory paths and context values are never leaked in `GlyphError` messages.

## 2. OutputContext Policy Matrix

| `OutputContext` | Untrusted Value | `SafeHtml` | `SafeAttr` | `SafeUrl` | `SafeJs` |
|---|---|---|---|---|---|
| `HtmlText` | HTML-escaped | Raw (`Trusted`) | Escaped | Escaped | Escaped |
| `HtmlAttributeQuoted` | HTML-attr-escaped | Escaped | Raw (`Trusted`) | Escaped | Escaped |
| `HtmlUrlAttribute` | Scheme-checked + attr-escaped | Scheme-checked + attr-escaped | Scheme-checked + attr-escaped | Scheme-checked + attr-escaped | **Denied** |
| `HtmlJs` (`<script>`) | **Denied** | **Denied** | **Denied** | **Denied** | Allowed (`Trusted` only) |
| `HtmlAttributeUnquoted` | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |
| `HtmlEventHandler` (`on*`) | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |
| `HtmlCss` / `StyleAttribute` | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |
| `HtmlTagOrAttrName` | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |
| `HtmlRawUnsafeAttr` (`srcdoc`) | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |
| `Unknown` | **Denied** | **Denied** | **Denied** | **Denied** | **Denied** |

## 3. URL Allowlist & Bypass Defenses

- Allowed schemes (case-insensitive): `http`, `https`, `mailto`, `tel`, plus relative URLs (no scheme before `/`, `?`, `#`).
- Blocked schemes: `javascript:`, `vbscript:`, `data:`, `file:`, and any unknown scheme.
- Obfuscation checks: Decodes HTML character entities (`&#106;`, `&#x6A;`, `&colon;`), strips/rejects ASCII control bytes (`0x00..0x1F`, `0x7F`), and checks percent-decoded scheme prefixes (`java%73cript:`).
- `srcset` attributes split comma-separated candidates and validate every URL individually.

## 4. `|tojson` JS-in-HTML Contract

`|tojson` serializes `Value` to JSON and escapes `<` (`\u003c`), `>` (`\u003e`), `&` (`\u0026`), `</` (`<\/`), `U+2028` (`\u2028`), and `U+2029` (`\u2029`), returning `MarkupContext.SafeJs`.

## 5. Hostile Multi-Tenant Isolation & Sandboxing (`ADR-0012`, NOX `2.2.38`)

For untrusted user-authored templates (`TrustTier.Untrusted`):
- **In-Process Engine Bounds:** Pair `restricted_defaults()` (`restricted_budget()`, `allow_safe_filter=False`, `allow_dynamic_include=False`, strict contextual XSS checks).
- **WASM Host Isolation (`nox.wasm.Limits`):** Execute tenant render workers inside `--target wasm32-wasi` / `wasm32-freestanding` instances via `nox.wasm.from_bytes_limited` or `Host.open_limited` with `nox.wasm.strict_limits()` (`fuel`, `max_pages`, `max_depth`, `max_table`, `max_stack`, `max_output`). See [examples/wasm_multitenant_host/main.nox](../examples/wasm_multitenant_host/main.nox).
- **OS Process Sandbox (`noxc run --sandbox`):** When executing standalone CLI renders or untrusted template tests on macOS (`sandbox-exec`) or Linux (`bwrap`), prefer `noxc run --sandbox --allow-read=<templates_dir>` to confine filesystem and network syscalls at the OS level.
