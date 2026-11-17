# Glyph Testing & Verification Strategy (`docs/testing.md`)

> **Contract:** [AGENTS.md](../AGENTS.md) §21 & §27  
> **Test Runner:** `noxc test` (real AOT-compiled `*_test.nox` executables; zero Python mocks)

---

## 1. Running the Verification Suite

```bash
# Run all *_test.nox suites
noxc test

# Type-check with LLVM, QBE, freestanding, and concurrent shared-mutation lint
noxc check glyph/api.nox
noxc check --backend qbe glyph/api.nox
noxc check --profile freestanding glyph/api.nox
noxc check --strict-spawn-shared tests/concurrency/concurrency_and_stress_test.nox

# Run WASM freestanding target check
noxc build --target wasm32-freestanding -o dist/wasm_memory.wasm examples/wasm_memory/main.nox
```

---

## 2. Test Suites & Coverage Matrix

Every feature and security boundary carries positive, negative, boundary, and adversarial coverage:

| Suite | File | Scope & Invariants |
|---|---|---|
| **Audit / PoC** | `tests/audit/audit_test.nox` | Toolchain capabilities (`JsonValue`, closures, exceptions, `OrderedDict`/`LRUCache`, `nox.unicode`, `nox.regex`, `nox.path.safe_join`) |
| **Value & Limits** | `tests/value/value_test.nox` | Tagged `Value` conversions, 64-bit integer precision, truthiness table, `Undefined != Null`, reflection key blocking, overflow/div0, `ResourceBudget` |
| **Lexer** | `tests/lexer/lexer_test.nox` | O(n) tokenization, UTF-8/CRLF byte & codepoint spans, trims, comments, nested `raw` rejection, NUL handling, 200+32 fuzz cases |
| **Parser & Validation** | `tests/parser/parser_test.nox` | Pratt precedence, unclosed/mismatched tags, recursion bounds (`max_expr_depth`, `max_ast_nodes`), reflection & method-call denial, `lint` diagnostics |
| **Expressions** | `tests/expression/expression_test.nox` | Arithmetic, floor division/modulo, short-circuit `and`/`or`, conditional ternary, `in`/`not in`, chained comparison denial |
| **Rendering & MVP Security** | `tests/rendering/render_test.nox`, `tests/security/mvp_security_test.nox` | Vertical Slice #1, lexical scoping, loop metadata, default HTML escaping, NUL output rejection, budget saturation |
| **Loaders** | `tests/loaders/loader_test.nox` | `MemoryLoader`, `FilesystemLoader` canonical confinement, traversal/UNC/drive/sibling-prefix/symlink escapes, `ChoiceLoader` non-fallback on confinement errors, `PrefixLoader` trust-zone isolation, `include` cycles |
| **Cache** | `tests/cache/cache_test.nox` | Composite cache keys (`origin_id`, `fingerprint`, `OutputMode`, `autoescape`, `TrustTier`, `allow_safe`, registry generations, `locale`, `catalog.version`), transitive invalidation |
| **Composition** | `tests/composition/composition_test.nox` | Multi-level `extends`, `block`, `super()`, `macro` positional/keyword/default args, `import`/`from`, `_private` denial, `call`/`caller()`, recursion limits |
| **Contextual XSS Gate** | `tests/security/contextual_xss_test.nox` | `HtmlContextTracker` across branches/macros/includes, URL scheme allowlist + entity/percent/control/`//` anti-smuggling, `srcset`, `\|tojson` (`SafeJs`), `<script>`/`style`/`on*`/unquoted-attr/dynamic-name blocking, `TrustTier.Restricted` |
| **Filters, Tests & Helpers** | `tests/filters/filters_tests_registry_test.nox` | Built-in filters/tests/functions, `HelperContext` isolation, cost metering, core override denial, active-render/freeze lock |
| **i18n, Profiles & Streaming** | `tests/locale/i18n_profiles_streaming_test.nox` | `TranslationCatalog`, locale fallback (`tr-TR -> tr`), `trans`/`plural` contextual escaping, Turkish casing, `Text`/`Xml`/`Markdown`/`Json`/`EmailSubject` modes, `streaming_writer` parity, backpressure, cancellation, 16 MiB cap |
| **Ecosystem & CLI** | `tests/integration/integration_and_cli_test.nox` | Nyx `render_view` / `render_view_stream`, Aether `Accept` negotiation, CLI subcommands (`check`, `lint`, `render`, `inspect`, `deps`, `bench`, `version`), redacted JSON/human diagnostics, exit codes (`0, 2..8`) |
| **Property, Differential, Fuzz & Mutation** | `tests/fuzz/fuzz_and_property_test.nox` | AST roundtrip equivalence, differential reference expression evaluator, escaper idempotence/`forceescape`, 500 arbitrary-byte fuzz cases (`compile_string` + `lint`), parser/limit/security/loader mutation gates |
| **Concurrency & Stress** | `tests/concurrency/concurrency_and_stress_test.nox` | 1/4/16 `spawn` tasks sharing a frozen `Environment` (`--strict-spawn-shared`), 64-wave mixed mode/trust/locale isolation, 320-entry LRU cache eviction, 25-cycle transitive invalidation, 10k-row linear streaming writer |

---

## 3. Release Gates (`v1.0.0`)

1. **Zero skipped security tests:** All security regression tests in `mvp_security_test.nox`, `contextual_xss_test.nox`, `loader_test.nox`, and `fuzz_and_property_test.nox` must pass 100% without relaxed assertions.
2. **Core isolation:** Static CI boundary check ensures `glyph/` never imports `integrations/`, `nyx`, `aether`, or `aura`, and `nox.fs` / `nox.unicode` stay confined to `loader_fs.nox` and `locale.nox`.
3. **4-Target Cross-Platform CI + WASM + SBOM:** `Linux x86_64`, `Linux ARM64`, `macOS ARM64`, `Windows x86_64`, and `wasm32-freestanding` must all pass cleanly.
