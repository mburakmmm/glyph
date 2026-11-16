# ADR-0001: Minimum NOX Version and Tagged `Value` / AST Representation

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 0 (`v0.0.1-audit`)

## 1. Problem

Glyph requires a deterministic, statically typed representation for dynamic template data (`Value`) and AST nodes without relying on Python-style `Any`, runtime reflection, or unverified compiler extensions. It also needs a pinned minimum `noxc` compiler version backed by working code.

## 2. Prior Decisions

- [AGENTS.md](../AGENTS.md) §0.1, §2, §5, §26: Core must be pure NOX, avoid `Any`, separate `Undefined` from `Null`, preserve 64-bit JSON integer precision, and remain portable to memory-only / WASM targets.

## 3. Requirements

1. Represent `Null`, `Undefined`, `Bool`, `Int`, `Float`, `String`, `List[Value]`, ordered `Map[str, Value]`, and future `TrustedMarkup` / `Callable` variants cleanly in NOX.
2. Support deterministic map iteration order.
3. Compile cleanly under LLVM, QBE, and WASM targets without external native shims.
4. Establish a verified minimum `noxc` compiler baseline.

## 4. NOX Capability Proof

Verified on `noxc 2.1.186` via [tests/audit/audit_test.nox](../../tests/audit/audit_test.nox) and [glyph/api.nox](../../glyph/api.nox):

- Recursive `enum Value` containing `list[Value]` and `nox.collections.OrderedDict[str, Value]` compiles, type-checks, and passes `match` exhaustiveness checking.
- `nox.collections.OrderedDict` is pure NOX (no `extern def`), preserves insertion order, and passes `--profile freestanding`.
- `JsonValue` is a built-in type from `nox.core` (`nox.json.number_text` preserves `9007199254740993`).
- `noxc check`, `noxc test`, `--backend qbe`, `--profile freestanding`, and `--target wasm32-freestanding` (LLVM) all succeeded on Phase 0 probes.
- Hosted-only `nox.unicode` is rejected under `--profile freestanding`, confirming that Unicode locale features must live in a separate module (`glyph/locale.nox`) rather than core `value`/`api`.

## 5. Decision

1. **Minimum Compiler Version:** Pin `noxc >= 2.1.186` for Glyph core development and CI (re-evaluated only if a later compiler feature becomes required and verified).
2. **`Value` Representation:** Use NOX `enum Value` (tagged union) with `OrderedDict[str, Value]` for maps and `list[Value]` for sequences. Keep `VUndefined` as an explicit variant distinct from `VNull`.
3. **AST Representation:** Use NOX `enum` tagged unions for AST/expression nodes combined with explicit `SourceSpan` structs, taking advantage of compile-time exhaustiveness checking in `match`.
4. **Core Module Purity:** Keep `glyph/version.nox`, `glyph/api.nox`, `value.nox`, `lexer.nox`, `parser.nox`, `ast.nox`, and `runtime.nox` free of `nox.fs` and `nox.unicode` imports.

## 6. Alternatives Considered & Rejected

- **Class hierarchy with dynamic casting / reflection:** Rejected — NOX has no arbitrary runtime reflection, and `enum` + `match` enforces compile-time variant exhaustiveness.
- **Native `dict[str, Value]`:** Rejected — native `dict` restricts key/value types (`int`/`bool`/`str`/`float`), whereas `OrderedDict[str, Value]` works directly inside `enum Value` and guarantees deterministic iteration order.

## 7. Security & Performance Considerations

- `OrderedDict` uses an open-addressed hash index (amortized O(1) lookup) in pure NOX and preserves insertion order deterministically.
- `enum Value` ensures template expressions can only inspect explicitly modeled variants and map fields—never host object internals or `__class__`/`__dict__`.

## 8. Acceptance Criteria

- [x] `noxc check glyph/api.nox` passes on LLVM, QBE, and freestanding profiles.
- [x] `noxc test` passes [tests/audit/audit_test.nox](../../tests/audit/audit_test.nox).
- [x] Standalone consumer [examples/audit_consumer/main.nox](../../examples/audit_consumer/main.nox) builds and runs via `noxc run`.
