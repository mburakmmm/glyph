# Glyph Template Loaders (`docs/loaders.md`)

> **Version:** `1.2.0` (Updated for NOX `2.2.38`)  
> **ADRs:** [ADR-0005](adr/0005-loader-root-and-fs-toctou.md), [ADR-0013](adr/0013-advanced-blocks-components-and-const-folding.md)

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

### `PackageLoader` & `ReadOnlyAdapterLoader` (`glyph/loader.nox`, `v1.1.0+`)
- `PackageLoader` isolates package templates under `@pkg/...` with `min_trust_tier` clamping and prefixed `origin_id`.
- `ReadOnlyAdapterLoader` wraps caller-provided read callbacks (DB/object storage/remote registry) while validating logical template names and enforcing `trust_floor` without introducing DB or HTTP dependencies into `glyph/` core.

### Hosted Safe Remote Pattern (`nox.safehttp`, NOX `2.2.38+`)
When loading templates from remote tenant/CDN URLs inside a hosted `ReadOnlyAdapterLoader` callback, always route HTTP fetches through `nox.safehttp.request(...)`:
- Blocks private/loopback/link-local/CGNAT/cloud-metadata IPs (SSRF defense).
- Pins connection to validated IP via `connect_ip` (anti-DNS-rebinding) while validating TLS SNI/certificate against the host.
- Drops `Authorization`/`Cookie` on cross-origin redirects and blocks HTTPS→HTTP downgrades by default.
- Always clamp remote templates to `TrustTier.Restricted` or `TrustTier.Untrusted` (`min_trust_tier`).
