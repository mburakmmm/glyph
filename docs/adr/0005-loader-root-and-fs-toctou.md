# ADR-0005: Loader Root Confinement and Filesystem TOCTOU Boundary

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 4 (`v0.2.0`)

## 1. Problem

Loading templates from disk introduces path traversal (`../`), encoded traversal (`%2e%2e`), Windows drive/UNC escapes (`C:\`, `\\server\share`), sibling-prefix collisions (`/srv/tpl` vs `/srv/tpl_secret`), symlink escapes, and physical path leakage in error messages.

## 2. Prior Decisions

- [AGENTS.md](../../AGENTS.md) §2.6, §2.12, §11: `FilesystemLoader` must only read under an authorized canonical root, must never leak physical paths in public errors, and must stay isolated from WASM/freestanding core paths.
- [docs/compatibility.md](../compatibility.md): Verified on `noxc 2.1.186` that `nox.path.safe_join("/root", "/etc/passwd")` maps `/etc/passwd` to `<root>/etc/passwd` and includes the physical path inside `PathError.message`.

## 3. Decision

1. **Logical Name Pre-Validation (`glyph/loader.nox`):** Before any filesystem call, `validate_logical_template_name` rejects empty names, NUL (`0x00`), leading `/` or `\`, backslashes `\`, Windows drive prefixes (`:`), UNC prefixes, `.` / `..` segments, and case-insensitive percent-encoded traversal sequences (`%2e`, `%2f`, `%5c`).
2. **Canonical Root Lock (`glyph/loader_fs.nox`):**
   - `FilesystemLoader` canonicalizes `root_dir` on construction and requires an existing directory.
   - `load(name)` runs `validate_logical_template_name`, `nox.path.safe_join`, a second `nox.path.canonicalize` + `nox.fs.is_file` verification, and `nox.fs.read_to_string`.
   - `PathError` and `FsError` messages are caught and replaced with redacted `GlyphLoadError` messages referencing only the safe `logical_name`.
3. **Composite Loader Trust Separation (`ChoiceLoader`, `PrefixLoader`):**
   - `ChoiceLoader` only tries the next loader on `GLYPH_LOADER_NOT_FOUND`. Security or path-confinement errors (`GLYPH_LOADER_OUTSIDE_ROOT`) fail immediately without falling back.
4. **Freestanding Isolation:** `glyph/loader_fs.nox` is kept out of `glyph/api.nox` imports so pure-memory and `wasm32-freestanding` targets compile without `nox.fs`.
5. **TOCTOU Boundary (Documented Limitation):** NOX 2.1.186 stdlib does not expose `openat(dirfd, ...)` / `O_NOFOLLOW` descriptor-pinned file opens. Therefore, `FilesystemLoader` is designed for application-managed template directories and does **not** claim protection against a local attacker with write access racing symlinks between `safe_join` and `read_to_string`.

## 4. Acceptance Criteria

- [x] `FilesystemLoader` blocks `..`, `%2e%2e`, `/etc/passwd`, `C:\...`, `\\unc\...`, sibling-prefix paths, NUL bytes, and symlinks pointing outside root.
- [x] `GlyphLoadError` messages never contain the canonical host directory path.
- [x] `ChoiceLoader` does not fall back after a `GLYPH_LOADER_OUTSIDE_ROOT` error.
- [x] `glyph/api.nox` still passes `--profile freestanding` and `--target wasm32-freestanding`.
