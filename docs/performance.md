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

Recorded baseline run conditions:
- **Compiler:** `noxc 2.1.186` (default LLVM AOT backend)
- **Host OS:** Windows x86_64 (`noxc run benchmarks/bench_suite.nox`, 3 independent rounds)
- **Baseline Comparison:** Stdlib `nox.template.render_blocks` (`{{ var }}` scalar/loop substitution without AST, filters, expressions, contextual HTML/URL escaping, inheritance, or `ResourceBudget` tracking)

---

## 2. Measured Results (3 Independent Rounds)

| Scenario | Round 1 | Round 2 | Round 3 | Notes |
|---|---:|---:|---:|---|
| Small template cold compile (`5` vars) | `8,798 ns` | `6,310 ns` | `6,430 ns` | Lex + Pratt parse + validate |
| Small template warm render (`5` vars) | `2,189 ns` | `2,035 ns` | `2,062 ns` | Full AST interp + HTML context escape + `ResourceBudget` |
| Baseline `nox.template.render_blocks` (`5` vars) | `1,178 ns` | `1,114 ns` | `1,132 ns` | Flat placeholder replacement only |
| Loop `10` items | `15,006 ns` | `14,120 ns` | `14,664 ns` | Typed `Value` iteration + `GlyphWriter` |
| Loop `1,000` items | `1,505,800 ns` | `1,380,600 ns` | `1,333,000 ns` | ~1.33–1.51 ms (`nox.template` 1k scalar loop: `240–243 µs`) |
| Loop `10,000` items (`248,899` bytes) | `20,849,500 ns` | `19,492,600 ns` | `17,618,500 ns` | ~17.6–20.8 ms (**~13.2x for 10x input**, linear `O(n)` chunked writer) |
| `3`-level `extends` inheritance (warm) | `7,556 ns` | `7,869 ns` | `7,689 ns` | Base -> nested layout -> leaf |
| `10`-level `extends` + `super()` chain (warm) | `20,116 ns` | `19,975 ns` | `20,676 ns` | Deep `super()` dispatch |
| Nested `include` + `macro` (`{% from ... %}`) | `8,389 ns` | `9,386 ns` | `8,166 ns` | Isolated macro scope + `with context` |
| Heavy HTML escape (`400 x <a&"'>`) | `39,811 ns` | `38,452 ns` | `39,776 ns` | Escapes 2,400 unsafe characters safely |
| Same heavy payload in `OutputMode.Text` | `1,486 ns` | `1,565 ns` | `1,478 ns` | Clean pass-through without HTML character escape |
| `CompileCache` cold (`3`-level `p3.html`) | `27,500 ns` | `25,800 ns` | `23,000 ns` | Full loader + dependency fingerprint graph |
| `CompileCache` warm hit (`p3.html`) | `787 ns` | `741 ns` | `734 ns` | **~35x faster** than cold load+compile |
| Streaming `GlyphWriter` (`1 KB` batch) | `3,900 ns` | `400 ns` | `500 ns` | Buffered chunk path |
| Streaming `GlyphWriter` (`1 MB` / `16 x 64 KB`, no-op sink) | `800 ns` | `1,000 ns` | `900 ns` | `1,048,576` bytes flushed via single-chunk fast path |

---

## 3. Key Architectural Properties Verified

1. **O(n) Writer Scaling (No Quadratic Concatenation):** `GlyphWriter` appends slices into `chunks` and joins once at batch threshold (`DEFAULT_STREAM_FLUSH_BYTES = 8192`) or `.close()`, keeping `10,000`-row rendering linear (`~17.6–20.8 ms` total, also asserted under `<10s` in `tests/concurrency/concurrency_and_stress_test.nox`).
2. **Zero-Allocation Clean HTML Path:** `escape_html` scans UTF-8 bytes without allocating when no HTML special characters are present (`1.5 µs` in Text mode vs `39.8 µs` on dense XSS payloads).
3. **Cache Isolation Without Bypass:** Warm cache hits (`~734 ns`) still key on `origin_id`, `fingerprint`, `OutputMode`, `autoescape`, `TrustTier`, `allow_safe`, registry generations, `catalog.version`, `locale`, and `GLYPH_VERSION`.
