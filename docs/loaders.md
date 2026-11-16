# Glyph Template Loaders (`docs/loaders.md`)

> **Version:** `0.2.0` (Phase 4)  
> **ADR:** [ADR-0005](adr/0005-loader-root-and-fs-toctou.md)

## 1. Overview

Loaders resolve logical template names (e.g. `"pages/home.html"`) into immutable `SourceRecord` entries (`logical_name`, `content`, `origin_id`, `fingerprint`, `trust_tier`). Loaders perform source resolution only; parsing, validation, and caching belong to `Environment` and `CompileCache`.

## 2. Built-in Loaders

### `MemoryLoader` (`glyph/loader_memory.nox`)
- Pure in-memory `OrderedDict[str, SourceRecord]`.
- Freestanding and `wasm32-freestanding` compatible.
- `put(name, content)` and `put_with_trust(name, content, trust_tier)`.

### `FilesystemLoader` (`glyph/loader_fs.nox`)
- **Hosted profile only** (imports `nox.fs` and `nox.path`; excluded from `glyph/api.nox` to preserve WASM/freestanding builds).
- Confines all lookups inside a canonical root directory.
- Rejects `/`, `\`, drive letters (`C:`), UNC paths, `..`, `.`, NUL bytes, `%2e`/`%2f`/`%5c`, sibling-prefix escapes, and symlinks pointing outside root.
- Redacts canonical OS paths from `GlyphLoadError`.

### `ChoiceLoader` & `PrefixLoader` (`glyph/loader.nox`)
- `ChoiceLoader` tries an ordered list of `Loader` instances, advancing **only** on `GLYPH_LOADER_NOT_FOUND`. Security or path-confinement errors terminate immediately.
- `PrefixLoader` maps explicit prefixes (e.g. `"email/"`) to dedicated loaders so distinct trust zones never mix.
