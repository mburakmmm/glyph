# ADR-0008: Streaming Writer, Backpressure, Cancellation, and Partial Error Semantics

- **Status:** Accepted (Phase 8 / `v0.6.0`)
- **Date:** 2026-11-16
- **Related:** `AGENTS.md` §8.4, §16.3; `glyph/writer.nox`; `glyph/errors.nox` (`GlyphCancelledError`)

## Context

Rendering large documents (up to the 16 MiB default output budget) by concatenating strings or buffering blindly without flush boundaries degrades latency and prevents timely backpressure or cancellation propagation. Conversely, flushing every character or `{{ expr }}` output causes syscall/callback overhead. In HTTP SSR (Nyx / Aether), headers and status codes cannot be rolled back once the first chunk leaves the server.

## Decision

1. **Dual-Mode Chunk-Buffered `GlyphWriter`:**
   - The default constructor `GlyphWriter(tracker)` preserves pure in-memory chunk accumulation (`bytes_written`, `flush()`, idempotent `close()`, `to_string()`), emitting the exact same byte sequence as streaming mode.
   - `streaming_writer(tracker, sink_fn, cancel_fn, flush_threshold_bytes)` adds an explicit sink callback `(str) -> bool` and cooperative cancellation predicate `() -> bool`.
   - Batches accumulate until `buffered_bytes >= flush_threshold_bytes` (or 512 chunks) before joining once and invoking `sink_fn(batch)`.
2. **Backpressure & Cancellation Semantics:**
   - Every `write(...)` checks `cancel_fn()` upfront; if `True`, `writer.partial_failure` is set and `GlyphCancelledError(GLYPH_CANCELLED, ...)` is raised cleanly before appending more data.
   - If `sink_fn(batch)` returns `False` (downstream backpressure or closed transport), `writer.partial_failure` is recorded and `GlyphRenderError(GLYPH_RENDER_ERROR, ...)` is raised.
   - Every byte written passes through the shared non-resettable `BudgetTracker.consume_output_bytes(...)`.
3. **No Double-Close & Explicit Partial Progress:**
   - `close()` flushes any buffered tail chunk (if non-empty) and marks `closed = True`; repeated `close()` calls are safe no-ops. Calling `write()` after `close()` raises `GlyphRenderError`.
   - `RenderResult` and `GlyphWriter` track `bytes_written`, `bytes_flushed`, `flush_count`, and `completed` so callers know whether an error occurred pre-first-flush (HTTP error page still possible) or mid-stream (abort stream cleanly).

## Consequences

- Streamed vs. buffered outputs are guaranteed byte-for-byte identical when no cancellation or sink failure occurs.
- Web adapters (Phase 9) can run preflight checks before streaming starts and safely handle mid-stream aborts without double-closing sinks.
