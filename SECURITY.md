# Security Policy — Glyph

## Security Philosophy

Glyph treats templates as **data, not programs**, and follows a **fail-closed, safe-by-default** design:

- HTML output escaping is **enabled by default**.
- Arbitrary NOX/Python code execution, `eval`, `import`, reflection (`__class__`, `__dict__`), and implicit I/O inside templates are explicitly forbidden.
- Trust is **context-tagged** (`SafeHtml`, `SafeAttr`, `SafeUrl`, `SafeJs`); trust in one context never promotes safety in another (for example, `SafeHtml` is not safe inside a URL attribute or `<script>` block).
- `FilesystemLoader` confines template resolution inside a canonical root directory and rejects path traversal, sibling-prefix escapes, UNC/drive escapes, and symlink escapes.
- Render execution is bounded by a shared, non-resettable `ResourceBudget` (source bytes, tokens, AST nodes, depth, loop steps, output bytes, total operations).

## Threat Model & Support Tiers

| Tier | Description | Support |
|---|---|---|
| **Trusted templates** | Application-bundled templates reviewed by developers | Full supported core features (still no arbitrary I/O or eval) |
| **Restricted templates** | Admin/tenant-editable templates with strict policy | Opt-in restricted mode (no `|safe`, no dynamic includes, tight budgets) |
| **Untrusted hostile templates** | Arbitrary attacker-controlled template source | **Not supported** as a standalone sandbox in `v1.0`; requires external host/WASM/process isolation |

For detailed specifications, see [AGENTS.md](AGENTS.md) (§2, §10, §11), [docs/security.md](docs/security.md), and the security ADRs ([ADR-0003](docs/adr/0003-contextual-html-escaping.md), [ADR-0004](docs/adr/0004-trusted-markup-and-safe-policy.md), [ADR-0012](docs/adr/0012-user-created-templates-threat-model.md)).

## Reporting a Vulnerability

Please **do not** open a public GitHub Issue for security vulnerabilities.

Instead, report vulnerabilities privately through GitHub Security Advisories:

- **GitHub Security Advisories:** <https://github.com/mburakmmm/glyph/security/advisories/new>

When reporting, please include:

1. Glyph version / commit hash and `noxc --version` output.
2. Minimal `.nox` reproduction and template payload.
3. Expected security invariant vs. actual behavior.
4. Impact assessment (XSS, path traversal, DoS/budget bypass, cache poisoning, secret leak in errors, etc.).
