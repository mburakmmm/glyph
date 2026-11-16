# Aether Integration Guide (`docs/integration-aether.md`)

> **Adapter Module:** `import integrations.aether.glyph_aether` (`integrations/aether/glyph_aether.nox`)  
> **Decision Record:** [ADR-0010](adr/0010-nyx-adapter-and-migration-rules.md)

## Overview

`integrations/aether/glyph_aether.nox` provides explicit HTTP `Accept` content negotiation across template formats while preserving strict format boundaries:

| `Accept` Header | Content-Type | Template Extension | Glyph `OutputMode` |
|---|---|---|---|
| `text/html` / `*/*` | `text/html; charset=utf-8` | `.html` | `OutputMode.Html` (contextual escaping enabled) |
| `application/xml` / `text/xml` | `application/xml; charset=utf-8` | `.xml` | `OutputMode.Xml` (XML escaping + control/structural guards) |
| `text/plain` | `text/plain; charset=utf-8` | `.txt` | `OutputMode.Text` (unescaped text under budgets) |
| `application/json` | Rejected (`GlyphExtensionError`) | — | Directed to `nox.json` serializer per `AGENTS.md` §17.2 |

## Security Boundaries

- Request headers, auth tokens, and RBAC contexts are **not** implicitly bound to template scope.
- `Vary: Accept` and `X-Content-Type-Options: nosniff` are automatically populated on every `AetherResponse`.
