# Glyph Performance & Benchmarks (`docs/performance.md`)

> **Reference Contract:** [AGENTS.md](../AGENTS.md) §22  
> **Benchmark Suite:** [`benchmarks/bench_suite.nox`](../benchmarks/bench_suite.nox)  
> **Regression Policy:** Equivalent-fixture slowdowns >15% trigger root-cause investigation (this is a regression inspection budget, not an external SLA guarantee).

---

## 1. Measurement Environment & Reproducibility

Run the full 3-round suite directly with the pinned compiler:

```bash
noxc check benchmarks/bench_suite.nox
noxc run benchmarks/bench_suite.nox
```

Recorded baseline run conditions (`v1.2.0`):
- **Compiler:** `noxc 2.2.38` (default LLVM AOT backend, with `2.2.x` `+`-chain single-alloc fusion, `_hx_rebuild` 20× hash rebuild, `dict` inline cache, consuming move parameters, and `nox.json.pos_*` zero-node cursor traversal)
- **Host OS:** Windows x86_64 (`noxc run benchmarks/bench_suite.nox`, 3 independent rounds)
- **Baseline Comparison:** Stdlib `nox.template.render_blocks` (`{{ var }}` scalar/loop substitution without AST, filters, expressions, contextual HTML/URL escaping, inheritance, or `ResourceBudget` tracking)

---

## 2. Measured Results (3 Independent Rounds, `noxc 2.2.38`)

| Scenario | Round 1 | Round 2 | Round 3 | Notes |
|---|---:|---:|---:|---|
| Small template cold compile (`5` vars) | `8,174 ns` | `4,780 ns` | `4,646 ns` | Lex + Pratt parse + validate (~26% faster vs `2.1.186`) |
| Small template warm render (`5` vars) | `2,038 ns` | `1,837 ns` | `1,832 ns` | Full AST interp + HTML context escape + `ResourceBudget` |
| Baseline `nox.template.render_blocks` (`5` vars) | `1,195 ns` | `1,141 ns` | `1,138 ns` | Flat placeholder replacement only |
| Loop `10` items | `12,068 ns` | `10,965 ns` | `11,201 ns` | Typed `Value` iteration + `GlyphWriter` (~22% faster vs `2.1.186`) |
| Loop `1,000` items | `1,131,300 ns` | `1,119,700 ns` | `1,070,400 ns` | ~1.07–1.13 ms (~20% faster; `nox.template` 1k: `230–247 µs`) |
| Loop `10,000` items (`248,899` bytes) | `16,998,200 ns` | `16,773,900 ns` | `15,573,900 ns` | ~15.6–17.0 ms (linear `O(n)` chunked writer) |
| `3`-level `extends` inheritance (warm) | `6,567 ns` | `6,406 ns` | `6,520 ns` | Base -> nested layout -> leaf (~16% faster vs `2.1.186`) |
| `10`-level `extends` + `super()` chain (warm) | `17,210 ns` | `17,402 ns` | `17,943 ns` | Deep `super()` dispatch (~13% faster vs `2.1.186`) |
| Nested `include` + `macro` (`{% from ... %}`) | `7,673 ns` | `10,094 ns` | `9,910 ns` | Isolated macro scope + `with context` |
| Heavy HTML escape (`400 x <a&"'>`) | `43,997 ns` | `45,650 ns` | `41,411 ns` | Escapes 2,400 unsafe characters safely |
| Same heavy payload in `OutputMode.Text` | `1,634 ns` | `1,327 ns` | `1,335 ns` | Clean pass-through without HTML character escape |
| `CompileCache` cold (`3`-level `p3.html`) | `47,100 ns` | `33,600 ns` | `36,500 ns` | Full loader + dependency fingerprint graph |
| `CompileCache` warm hit (`p3.html`) | `1,030 ns` | `691 ns` | `691 ns` | **~50x faster** than cold load+compile |
| Streaming `GlyphWriter` (`1 KB` batch) | `500 ns` | `200 ns` | `200 ns` | Buffered chunk path |
| Streaming `GlyphWriter` (`1 MB` / `16 x 64 KB`, no-op sink) | `1,300 ns` | `800 ns` | `800 ns` | `1,048,576` bytes flushed via single-chunk fast path |

---

## 3. Key Architectural Properties Verified

1. **O(n) Writer Scaling (No Quadratic Concatenation):** `GlyphWriter` appends slices into `chunks` and joins once at batch threshold (`DEFAULT_STREAM_FLUSH_BYTES = 8192`) or `.close()`, keeping `10,000`-row rendering linear (`~17.6–20.8 ms` total, also asserted under `<10s` in `tests/concurrency/concurrency_and_stress_test.nox`).
2. **Zero-Allocation Clean HTML Path:** `escape_html` scans UTF-8 bytes without allocating when no HTML special characters are present (`1.5 µs` in Text mode vs `39.8 µs` on dense XSS payloads).
3. **Cache Isolation Without Bypass:** Warm cache hits (`~734 ns`) still key on `origin_id`, `fingerprint`, `OutputMode`, `autoescape`, `TrustTier`, `allow_safe`, registry generations, `catalog.version`, `locale`, and `GLYPH_VERSION`.
