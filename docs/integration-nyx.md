# Nyx Integration Guide (`docs/integration-nyx.md`)

> **Adapter Module:** `import integrations.nyx.glyph_nyx` (`integrations/nyx/glyph_nyx.nox`)  
> **Decision Record:** [ADR-0010](adr/0010-nyx-adapter-and-migration-rules.md)

## Overview

Glyph integrates with Nyx **strictly as an opt-in adapter**:

- Core `glyph/` modules never import `nyx` or `integrations/nyx`.
- Existing `nyx.view.render`, `render_blocks`, and `render_records` behavior is **never silently modified**.
- HTTP status codes, `Content-Type`, `X-Content-Type-Options: nosniff`, `Cache-Control`, single-line validated CSP nonces (`Content-Security-Policy`), and streaming preflight live in `glyph_nyx`.

## Buffered View Rendering

```nox
import glyph.api
import integrations.nyx.glyph_nyx
from integrations.nyx.glyph_nyx import NyxViewOptions, NyxViewResponse

resp: NyxViewResponse = integrations.nyx.glyph_nyx.render_view("views/profile.html", ctx, env, vopts)
```

## Streaming SSR With Preflight

`render_view_stream(...)` validates response headers/CSP nonces and compiles the template **before** invoking `on_headers(status, headers)`:

- If compilation or template loading fails before `on_headers`, your Nyx handler can still safely emit a clean HTTP 404/500 response.
- Once streaming begins, batches flush cleanly through `glyph.api.streaming_writer(...)`, propagating cancellation (`GlyphCancelledError`) and downstream backpressure (`GlyphRenderError`).

## Migration Checklist (Nyx -> Glyph)

1. Bundle page/layout templates inside a canonical root (`FilesystemLoader`) or memory loader.
2. Replace ad-hoc `nyx.view.render` calls opt-in route by route with `glyph_nyx.render_view(...)`.
3. Pass explicit typed JSON/map view-model `Context` (never inject raw request/session/auth objects).
4. Use `| tojson` inside `<script nonce="{{ csp_nonce }}">` and host `trust_url(...)` / `trust_html_fragment(...)` only for verified host fragments.
