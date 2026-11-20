# NOX Capability & Compatibility Matrix (`docs/compatibility.md`)

> **Pinned Audit Compiler:** `noxc 2.2.38`  
> **Audit Date:** 2026-11-20  
> **Rule:** Every capability below is classified strictly by direct observation (`noxc check`, `noxc test`, `noxc build`, `noxc run`), never from memory or Python assumptions.

## Status Key

- **verified**: Compiled and executed with `noxc 2.2.38` in `tests/audit/audit_test.nox` or CLI probes.
- **experimental**: Exists in compiler/stdlib; requires deeper edge-case testing before stable reliance.
- **unavailable**: Forbidden or unsupported in the noted profile/backend/syntax.
- **planned**: Not yet probed; scheduled for its target phase.

---

## 1. Compiler, Backends & Profiles

| Capability | Status | Evidence / Notes |
|---|---|---|
| `noxc check`, `noxc run`, `noxc test` | **verified** | `noxc 2.2.38` executes `*_test.nox` and exits 0 on pass (`17/17` suites). |
| `--backend llvm` (default) | **verified** | Compiles and runs native Windows x64, Linux, macOS, and WASM targets with 2.2.x string-fusion & collection speedups. |
| `--backend qbe` | **verified** | `noxc check --backend qbe glyph/api.nox` reports `no type errors`. |
| `--profile freestanding` | **verified** | Works cleanly without hosted-only/C-backed modules (`nox.fs`, `nox.unicode`, `nox.yyjson`, `nox.xxhash`, `nox.pcre2`, `nox.zstd`). |
| `--target wasm32-freestanding` / `wasm32-wasi` | **verified** | Compiles via LLVM backend (cannot combine `--backend qbe` or `--profile freestanding` with `wasm32-*`). |
| `--strict-spawn-shared` | **verified** | `noxc check --strict-spawn-shared tests/concurrency/concurrency_and_stress_test.nox` passes. |
| `noxc sbom` | **verified** | Emits CycloneDX 1.5 JSON SBOM (`nox:native=false`, `nox:bin=true`) from `nox.json` (`source: "nox"` + `bin`). |
| `noxc sign check` | **verified** | Exits 0 on clean zero-dependency workspace. |
| `nox.json` (`"source": "nox"`, `"bin": {"name","path"}`, `"requires": []`) | **verified** | Validated on `noxc 2.2.38`: `"bin"` requires `"path"` (not `"entry"`) alongside top-level `"entry"`; enables `noxc install` + pure `noxpkg` source badge. |

---

## 2. NOX Language Semantics (Verified Constraints)

| Feature | Status | Observed Behavior |
|---|---|---|
| `enum` tagged unions + `match` | **verified** | Recursive `enum Value` with `list[Value]` and `OrderedDict[str, Value]` compiles, runs, and enforces exhaustiveness. |
| Scalar `match` (`int` / `str` / `bool`) | **verified** (v2.2.37+) | `match st:` on scalar ints/strings (`case 1 | 2:`, `case _:`) compiles & runs on LLVM and QBE. |
| Opt-in `__all__` API boundary | **verified** (v2.2.5+) | Module-level `__all__: list[str] = [...]` blocks cross-module imports of unlisted functions/classes defined in that module at compile time. |
| Closures & function types `(T) -> R` | **verified** | First-class nested closure functions compile and capture immutable outer locals. |
| `class` inheritance for `Exception` | **verified** | Subclasses (`AuditSubError(AuditBaseError)`) can carry custom fields and be caught via base class. |
| `except` type syntax | **verified** | Requires unqualified imported name (`from m import Err` then `except Err as e:`); dotted `except m.Err:` also supported in `2.1.195+`. |
| Variable shadowing in same scope | **unavailable** | Redefining a variable name with a different type in the same scope is rejected (`TypeMismatch`). |
| `break` / `continue` | **unavailable** | Not supported in Nox loops (boolean loop flags remain required). |
| `.append()` on member fields / params | **unavailable** (v2.2.38) | Requires local copy-append-assign (`xs = self.items; xs.append(v); self.items = xs`) in `2.2.38` (`2.2.43` stable list handle is post-`v2.2.38`). |
| Mutually recursive `class` + `enum` | **verified** | `class Expr { kind: ExprKind }` + `enum ExprKind` with `list[Expr]` compiles and passes `match` on LLVM and QBE. |
| Empty list literal `[]` | **verified** | Allowed when explicitly type-annotated (`items: list[T] = []`). |
| Function overloading | **unavailable** | Separate typed function names are required. |
| Parenthesized `from m import (...)` | **verified** (v2.1.195+) | Multiline parenthesized imports compile cleanly (`poc_2238.nox`, `tests/audit/audit_test.nox`). |
| Top-level `while` + `try/except` heap locals | **experimental** (caveat) | Keep complex loop + exception allocations inside `def` functions. |

---

## 3. NOX Standard Library Audit

| Module / Symbol | Status | Profile Notes & Constraints |
|---|---|---|
| `nox.core` (`JsonValue`) | **verified** | `JsonValue` is a built-in type in `nox.core`, **not** `nox.json.JsonValue`. |
| `nox.json` (`parse`, `pos_*`, `JsonWriter`, `as_int`, `number_text`) | **verified** | `pos_root`/`pos_kind`/`pos_len`/`pos_at`/`pos_key`/`pos_int`/`pos_number`/`pos_dump` walk JSON without allocating `JsonValue` nodes; combine `pos_dump` + `_is_int_json_text` to distinguish `1.0`/`1e2` floats from 64-bit ints (`9007199254740993`). |
| `nox.collections` (`OrderedDict[K, V]`, `LRUCache[K, V]`) | **verified** | Pure NOX; freestanding/WASM-safe; benefits from 2.1.188/2.2.8 hash-index & LRU speedups. |
| `nox.strings` (`byte_len`, `byte_at`, `trim`, `replace`, `split`, `join`) | **verified** (with NUL caveat) | **Upstream `v2.2.38` verified caveat:** `runtime/stdlib_shims/strings.zig@v2.2.38` `nox_strings_join_raw` still computes `total_len` with `std.mem.len(p)` (`\0`-terminated) while copying `str_mod.nox_str_slice(p)` (`strByteLen`). Retain `+` (`nox_str_concat`) on NUL-capable template/lexer strings. |
| `nox.unicode` (`upper_tr`, `lower_tr`, `normalize`) | **verified** (hosted) / **unavailable** (freestanding) | Isolated in `glyph/locale.nox` (ASCII normalization fast-path improved in `2.1.185+`). |
| `nox.regex` (`search`, `Match`) | **verified** | Freestanding/WASM-safe subset engine; keep `nox.pcre2` out of core (requires `dynamic_code`, no WASM/mobile). |
| `nox.path` (`safe_join`, `PathError`) | **verified** (hosted) | Pre-reject `/`, `\`, `:`, NUL, `%2e%2e` and redact errors in `FilesystemLoader`. |
| `nox.fs` | **verified** (hosted) | Confined strictly to `loader_fs.nox` and `cli/`; never imported by `glyph/api.nox`. |
| `nox.wasm` (`Limits`, `strict_limits`, `from_bytes_limited`, `Host`) | **verified** (hosted) | Pure-Zig sandboxed WASM interpreter with fuel/pages/depth/table/stack/output caps; enforces ADR-0012 multi-tenant boundaries on hosted targets. |
| `nox.safehttp`, `nox.dns`, `nox.ip` | **verified** (hosted) | Safe host pattern for remote template adapters (SSRF / DNS rebinding / downgrade protection); not imported by core `glyph/`. |
| `nox.yyjson`, `nox.xxhash`, `nox.pcre2`, `nox.zstd` | **verified** (hosted-only C) | Unavailable on WASM/mobile/freestanding; excluded from `glyph/` core to preserve universal portability. |
