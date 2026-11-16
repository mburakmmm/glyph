# ADR-0010: Nyx & Aether Framework Adapters and Migration Boundaries

- **Status:** Accepted (Phase 9 / `v0.7.0`)
- **Date:** 2026-11-16
- **Related:** `AGENTS.md` §2.18, §17.1–17.2; `integrations/nyx/glyph_nyx.nox`; `integrations/aether/glyph_aether.nox`

## Context

`AGENTS.md` §2.18 requires core `glyph/*` modules to remain completely decoupled from web frameworks: core never imports `nyx`, `aether`, `aura`, or `integrations/*`. Meanwhile, existing `nyx.view.render` helpers in Nyx must continue working unchanged without silent behavior overrides, and HTTP concerns (`Content-Type`, status codes, CSP headers/nonces, streaming preflight) belong to the web framework adapter boundary.

## Decision

1. **Unidirectional Dependency:**
   - All framework integration code lives outside `glyph/` under `integrations/nyx/` and `integrations/aether/`.
   - Automated CI boundary checks fail builds if any `glyph/*.nox` module imports `integrations`, `nyx`, `aether`, or `aura`.
2. **Explicit Opt-In Nyx Adapter (`glyph_nyx`):**
   - `render_view(...)` and `render_view_stream(...)` provide typed `NyxViewResponse` envelopes (`status`, `content_type`, `headers`, `csp_nonce`, `body`).
   - Existing `nyx.view.render` / `render_blocks` / `render_records` behavior is never patched or monkey-substituted.
   - Streaming preflight validates template compilation, initial context resolution, and headers (`X-Content-Type-Options: nosniff`, `Content-Security-Policy` with validated single-line CSP nonce) **before** streaming chunks start.
   - Request objects, cookies, or authorization policies are never implicitly injected into template scope; callers pass explicit typed view-model `Context`.
3. **Explicit Aether Content-Negotiation Adapter (`glyph_aether`):**
   - `negotiate_media_type(accept_header)` selects explicit MIME targets (`text/html`, `text/plain`, `application/xml`) and maps them to `OutputMode.Html`, `OutputMode.Text`, or `OutputMode.Xml`.
   - `application/json` API responses are directed to `nox.json` serialization rather than template rendering.

## Consequences

- `glyph` core stays 100% portable (`wasm32-freestanding`, CLI, serverless, embedded) with zero HTTP server transitive dependencies.
- Migrating Nyx views to Glyph happens incrementally per route using `glyph_nyx.render_view(...)`.
