# ADR-0007: Cache Invalidation, Composite Keys, and Policy Isolation

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 4 (`v0.2.0`)

## 1. Problem

Caching compiled templates by `logical_name` alone causes severe correctness and security bugs: stale templates after edits, cross-policy bypass (a `Text` or `allow_safe=True` template served to an `Html`/`Restricted` render), cross-tenant contamination, and stale parent templates when an included partial changes.

## 2. Prior Decisions

- [AGENTS.md](../../AGENTS.md) §2.10, §12: Cache keys must include origin identity, fingerprint, mode/autoescape/policy, engine version, registry generation, and locale. Render state must never be stored in cached artifacts.

## 3. Decision

1. **Two-Level Cache (`glyph/cache.nox`):**
   - `ParseCache`: `LRUCache[str, TemplateAst]` keyed by `origin_id + "|" + fingerprint + "|" + GLYPH_VERSION`.
   - `CompileCache`: `LRUCache[str, CompileCacheEntry]` keyed by `origin_id + "|" + fingerprint + "|" + output_mode + "|" + autoescape + "|" + trust_tier + "|" + allow_safe + "|" + allow_dynamic_include + "|" + filters_gen + "|" + tests_gen + "|" + functions_gen + "|" + locale + "|" + GLYPH_VERSION`.
2. **Dependency Graph Validation:**
   - Each `CompileCacheEntry` stores a list of `DepFingerprint` records (`logical_name`, `origin_id`, `fingerprint`) for all statically known `include` / composition dependencies.
   - On cache lookup, `Environment` re-checks each dependency's current `fingerprint` via `loader.load(...)`; any mismatch invalidates the cached parent entry and forces recompilation.
3. **Bounded Memory:** Both caches use `nox.collections.LRUCache` with explicit `max_entries` (default 256) and `CompileCache` enforces an additional `max_total_bytes` cap.
4. **Immutable Artifacts:** Cached `Template` objects hold only immutable AST, `TemplateInfo`, `fingerprint`, and `TrustTier`; per-render `RenderScope`, `BudgetTracker`, and `GlyphWriter` are always allocated fresh per render.

## 4. Acceptance Criteria

- [x] Updating a template or included partial invalidates the cached entry immediately.
- [x] Changing `OutputMode`, `autoescape`, `TrustTier`, `allow_safe_filter`, `locale`, or `FilterRegistry.generation` yields distinct cache keys with zero policy bleed.
- [x] LRU eviction keeps cache size within configured bounds.
