# ADR-0012: Threat Model and Isolation Boundaries for User-Created Templates

- **Status:** Accepted (Scope Boundary for `v1.0`)
- **Date:** 2026-11-16
- **Phase:** Phase 6 (`v0.4.0`)

## 1. Problem

An attacker who controls template source text has a far wider attack surface than an attacker who only controls context data (e.g., crafting deeply nested ASTs, large loops, malicious HTML contexts, or `include` probes).

## 2. Decision

Glyph defines three explicit template trust tiers (`TrustTier`):

1. **`Trusted` (Application-Bundled Templates):** Authored and reviewed with application code. Still enforces no arbitrary I/O, no `eval`, no reflection, contextual escaping, and `ResourceBudget`.
2. **`Restricted` (Tenant / Admin-Editable Templates):** Supports opt-in restricted execution via `restricted_defaults()`:
   - Tight `restricted_budget()` (`128 KiB` source, `10,000` loop steps, `1 MiB` output, depth `8`).
   - `|safe`, `|raw`, dynamic `include`, and `<script>` (`HtmlJs`) interpolation are **unconditionally disabled**.
   - `VTrustedMarkup` from context is escaped rather than emitted raw.
3. **`Untrusted` (Hostile Attacker-Controlled Templates):**
   - **Not supported** as a standalone OS/CPU/memory sandbox inside a shared host process in `v1.0`.
   - When combined with `Trusted` parents/children, `min_trust_tier` always selects the most restrictive tier.
   - Multi-tenant hostile template execution requires external host isolation (such as per-tenant `wasm32-freestanding` or OS process boundaries) as planned for Phase 11 research.

## 3. Hostile Multi-Tenant Execution Model (Phase 11 Update)

In hostile multi-tenant workloads where untrusted third-party tenants author arbitrary templates:

1. **In-Process Engine Guarantees:** Setting `TrustTier.Untrusted` + `restricted_budget()` guarantees bounded AST tokens, recursion depth, loop iterations, output bytes, total ops, contextual XSS escaping, and `allow_safe_filter = False`.
2. **Process / WASM Host Isolation Boundary:** CPU preemption, OS memory quotas, and per-tenant isolation **must still** be enforced outside Glyph by running per-tenant renders inside isolated `wasm32-freestanding` / `wasm32-wasi` instances (verified via `examples/wasm_memory/main.nox`) or dedicated OS worker processes with explicit timeouts. Glyph never embeds OS sandboxing syscalls inside `glyph/` core so core remains portable and `--profile freestanding` compatible.

## 4. Acceptance Criteria

- [x] `TrustTier.Restricted` disables `|safe`, dynamic `include`, `<script>` interpolation, and tightens budgets.
- [x] `min_trust_tier` prevents a `Trusted` parent from elevating a `Restricted`/`Untrusted` child or macro.
- [x] `PackageLoader` & `ReadOnlyAdapterLoader` clamp trust tier and redact tenant origins/paths (`TelemetryHook`).
