# NOX Capability & Compatibility Matrix (`docs/compatibility.md`)

> **Pinned Audit Compiler:** `noxc 2.1.186`  
> **Audit Date:** 2026-11-16  
> **Rule:** Every capability below is classified strictly by direct observation (`noxc check`, `noxc test`, `noxc build`, `noxc run`), never from memory or Python assumptions.

## Status Key

- **verified**: Compiled and executed with `noxc 2.1.186` in `tests/audit/audit_test.nox` or CLI probes.
- **experimental**: Exists in compiler/stdlib; requires deeper edge-case testing before stable reliance.
- **unavailable**: Forbidden or unsupported in the noted profile/backend/syntax.
- **planned**: Not yet probed; scheduled for its target phase.

---

## 1. Compiler, Backends & Profiles

| Capability | Status | Evidence / Notes |
|---|---|---|
| `noxc check`, `noxc run`, `noxc test` | **verified** | `noxc 2.1.186` executes `*_test.nox` and exits 0 on pass (`tests/audit/audit_test.nox`). |
| `--backend llvm` (default) | **verified** | Compiles and runs native Windows x64 binaries and tests. |
| `--backend qbe` | **verified** | `noxc check --backend qbe glyph/api.nox` reports `no type errors`. |
| `--profile freestanding` | **verified** | Works with QBE backend; rejects hosted-only modules such as `nox.unicode`. |
| `--target wasm32-freestanding` / `wasm32-wasi` | **verified** | Compiles via LLVM backend (cannot combine `--backend qbe` or `--profile freestanding` with `wasm32-*`). |
| `--strict-spawn-shared` | **verified** | `noxc check --strict-spawn-shared glyph/api.nox` passes. |
| `noxc sbom` | **verified** | Emits deterministic CycloneDX 1.5 JSON SBOM from `nox.json`. |
| `noxc sign check` | **verified** | Exits 0 on clean zero-dependency workspace. |
| `nox.json` (`requires: []`) | **verified** | Zero-dependency manifest accepted by `noxc update` / `noxc fetch` / `noxc sbom`. |

---

## 2. NOX Language Semantics (Verified Constraints)

| Feature | Status | Observed Behavior |
|---|---|---|
| `enum` tagged unions + `match` | **verified** | Recursive `enum Value` with `list[Value]` and `OrderedDict[str, Value]` compiles, runs, and enforces exhaustiveness. |
| Closures & function types `(T) -> R` | **verified** | First-class nested closure functions compile and capture immutable outer locals. |
| `class` inheritance for `Exception` | **verified** | Subclasses (`AuditSubError(AuditBaseError)`) can carry custom fields and be caught via base class. |
| `except` type syntax | **verified** | Requires unqualified imported name (`from m import Err` then `except Err as e:`); dotted `except m.Err:` is a syntax error. |
| Variable shadowing in same scope | **unavailable** | Redefining a variable name with a different type in the same scope is rejected (`TypeMismatch`). |
| `break` / `continue` | **unavailable** | Not supported in Nox loops (`collections.nox` confirms boolean loop flags are required). |
| `.append()` on member fields | **unavailable** | Requires local copy-append-assign (`xs = self.items; xs.append(v); self.items = xs`). |
| Empty list literal `[]` | **verified** | Allowed when explicitly type-annotated (`items: list[T] = []`). |
| Function overloading | **unavailable** | Separate typed function names are required. |

---

## 3. NOX Standard Library Audit

| Module / Symbol | Status | Profile Notes & Constraints |
|---|---|---|
| `nox.core` (`JsonValue`) | **verified** | `JsonValue` is a built-in type in `nox.core`, **not** `nox.json.JsonValue`. |
| `nox.json` (`parse`, `get`, `as_int`, `number_text`, `is_*`, `as_bool`) | **verified** | Preserves 64-bit integer precision via `number_text` / `as_int`. |
| `nox.collections` (`OrderedDict[K, V]`, `LRUCache[K, V]`) | **verified** | Pure NOX (no `extern def`); works in freestanding profile; deterministic insertion order. |
| `nox.strings` (`byte_len`, `byte_at`, `trim`, `replace`, `split`, `join`) | **verified** | `len(s)` counts UTF-8 codepoints; `nox.strings.byte_len(s)` counts raw UTF-8 bytes (`"ğ"` = 1 vs 2). |
| `nox.unicode` (`upper_tr`, `lower_tr`, `normalize`) | **verified** (hosted) / **unavailable** (freestanding) | Must remain isolated in optional/locale layer (`glyph/locale.nox`), never imported unconditionally by core if freestanding compatibility is required. |
| `nox.regex` (`search`, `Match`) | **verified** | Supports bounded matching; byte-indexed spans; `rx_match != None` works cleanly. |
| `nox.path` (`safe_join`, `PathError`) | **verified** (with host caveat) | Rejects `..` traversal; **caveat:** treats leading `/etc/passwd` as `<root>/etc/passwd` and includes physical path in `PathError.message`. Glyph `FilesystemLoader` must pre-reject `/`, `\`, drive letters, UNC, NUL, `%2e%2e` and redact error messages. |
| `nox.fs` | **experimental** | Hosted filesystem I/O only; must stay confined to `loader_fs.nox` and never enter `wasm`/`freestanding` builds. |
| `nox.test` (`assert_eq_*`, `assert_true`, `TestSuite`) | **verified** | Works natively with `noxc test`. |
| `nox.template` | **verified** (baseline only) | Separate stdlib simple string/block renderer; Glyph does **not** modify or silently wrap it. |
| `nyx` (`>= 0.29.0`) | **planned** | Adapter contract to be verified in Phase 9 without importing `nyx` into `glyph/`. |
| `aether` | **planned** | Content-negotiation adapter to be verified in Phase 9. |
