# Glyph Built-in Filters, Tests, Functions & Extension Contracts (`docs/filters.md`)

> **Version:** `0.5.0` (Phase 7)  
> **Contract:** `AGENTS.md` §13 — Pure, deterministic, `BudgetTracker`-bounded, `HelperContext`-isolated.

---

## 1. Registry & `HelperContext` Contract

Every filter, `is` test, and helper function is described by a `FilterSpec`, `TestSpec`, or `FunctionSpec` containing:

- `namespace_name` / `name` (namespaced syntax supported: `x | ui.badge`, `x is mathx.ten`)
- `min_args` / `max_args`
- `input_types` / `result_type`
- `is_pure` / `is_deterministic`
- `allowed_contexts`
- `needs_locale`
- `cost_class` (`Trivial`, `Linear`, `QuadraticBounded`, `Sorting`)
- `maximum_expansion` (caps output expansion per invocation against `BudgetTracker.budget.max_output_bytes` and `MAX_FILTER_OUTPUT_BYTES = 1 MiB`)
- `min_trust_tier`

### Isolation & Mutation Policy

1. Custom extensions registered via `register_with_spec` receive `HelperContext` (`locale`, `output_mode`, `autoescape`, `undefined_policy`, `trust_tier`, `tracker`, and bounded `diagnostics`), **never** the mutable `RenderScope`.
2. Core built-in filters, tests, and functions cannot be overridden (`GlyphExtensionError`).
3. `FilterRegistry`, `TestRegistry`, and `FunctionRegistry` **fail closed** against `.register(...)` / `.register_with_spec(...)` calls **during any active render** (`active_renders > 0`) or after host `.freeze()`.
4. Every registration increments `registry.generation`, which is embedded into `CompileCache` composite keys (`ADR-0007`).

---

## 2. Built-in Filter Catalog

### 2.1. Escaping & Output Policies

| Filter | Args | Cost | Notes & Security Boundaries |
|---|---|---|---|
| `escape` / `e` | none | `Linear` | Idempotent for `MarkupContext.SafeHtml`; produces `SafeHtml`. |
| `forceescape` | none | `Linear` | Always re-escapes `&`, `<`, `>`, `"`, `'`, even on `SafeHtml`. |
| `tojson` | none | `Linear` | Emits `MarkupContext.SafeJs`; escapes `<`, `>`, `&`, `U+2028`, `U+2029`. Bounded depth (64). |
| `xml_escape` | none | `Linear` | Escapes XML entities and rejects illegal XML 1.0 control bytes (`GLYPH_SECURITY_CONTEXT`). |
| `safe` / `raw` | none | `Trivial` | **Disabled by default.** Requires `allow_safe_filter=True` **and** `TrustTier.Trusted`. |

### 2.2. Strings & Markdown

| Filter | Signature | Notes |
|---|---|---|
| `upper`, `lower`, `capitalize`, `title` | `()` | Deterministic locale casing (`tr`/`az` `i↔İ`, `I↔ı` supported cleanly). |
| `trim` | `()` | Trims leading/trailing whitespace. |
| `replace` | `(old, new, count=-1)` | Non-empty `old`; enforces `MAX_FILTER_OUTPUT_BYTES` expansion guard. |
| `truncate` | `(length=255, killwords=false, end="...")` | UTF-8 codepoint safe truncation. |
| `wordcount` | `()` | Counts whitespace-delimited words (`int`). |
| `indent` | `(width=4, first=false, blank=false)` | `0 <= width <= 64`; expansion bounded. |
| `center`, `pad` | `(width=80, fillchar=" ")`, `(width, fillchar=" ", align="left")` | `0 <= width <= 4096`; 1-char `fillchar`; expansion bounded. |
| `striptags` | `()` | **Plain-text tag removal only.** Not an HTML sanitizer; returns `VStr` (still HTML-escaped) and logs a warning to `HelperContext.diagnostics`. |
| `normalize_unicode` | `(form="NFC")` | Validates `NFC`/`NFD`/`NFKC`/`NFKD`; freestanding core is ASCII-exact with diagnostic warning for unhooked non-ASCII. |
| `urlencode` | `()` | Percent-encodes UTF-8 bytes per RFC 3986 unreserved set. |
| `slugify` | `(separator="-")` | Deterministic ASCII + Turkish transliteration slug. |
| `md_escape` | `()` | Escapes CommonMark ASCII punctuation for safe literal Markdown text. |

### 2.3. Collections (Max 10,000 items, Shared `BudgetTracker`)

| Filter | Signature | Notes |
|---|---|---|
| `length`, `first`, `last`, `reverse` | `()` | `first`/`last` fail closed (`GLYPH_EVAL_OUT_OF_RANGE`) on empty collections/strings. |
| `sort` | `(reverse=false, attribute="")` | Rejects heterogeneous element comparisons (`GLYPH_EVAL_TYPE`); blocks `__*`/`constructor`/`prototype`. |
| `unique` | `(attribute="")` | Preserves first-seen order. |
| `join` | `(d="")` | Bounded output expansion check. |
| `map` | `(attribute="...")` | Field lookup only via `map_get`; never invokes dynamic methods or metadata keys. |
| `select`, `reject` | `(attribute=..., value=...)` or `(test, value=...)` | Pure filtering via attribute truthiness/equality or approved predicates (`odd`, `even`, `defined`, `undefined`, `none`, `divisibleby`). |
| `batch`, `slice` | `(linecount, fill_with=?)`, `(slices, fill_with=?)` | Bounded chunk/slice splitting with optional fill item. |
| `sum`, `min`, `max` | `(attribute="", start=0)`, `(attribute="")` | Checked integer overflow; `min`/`max` reject empty or heterogeneous lists. |
| `groupby` | `(attribute)` | Returns ordered list of `{"grouper": str, "list": [...]}`. |
| `dictsort` | `(by="key", reverse=false, case_sensitive=false)` | Sorts `VMap` into `[[k, v], ...]`. |

### 2.4. Numbers, Locale Formatting & Explicit Dates

| Filter | Signature | Notes |
|---|---|---|
| `abs`, `round`, `int`, `float`, `string`, `default` | — | Checked overflow (`abs(INT64_MIN)` error), finite-float validation, optional `default`. |
| `number`, `currency`, `percent` | `(decimals=-1)`, `(symbol="$", decimals=2)`, `(decimals=0)` | Deterministic separator formatting keyed by `HelperContext.locale` (e.g. `en-US` `1,234.50` vs `tr-TR` `1.234,50`). |
| `filesize` | `(binary=false)` | SI (`KB`/`MB`...) or IEC (`KiB`/`MiB`...) formatting. |
| `date`, `datetime` | `(format="%Y-%m-%d")`, `(format="%Y-%m-%d %H:%M:%S")` | Deterministic UTC formatting from Unix seconds `int` or ISO-8601 string; **never reads OS clock**. |
| `relative_time` | `(ref=...)` | Requires explicit `ref` timestamp; fails closed if `ref` is omitted. |

---

## 3. Built-in `is` Tests & Functions

- **Type & State Tests:** `defined`, `undefined`, `none`/`null`, `boolean`, `true`, `false`, `number`, `integer`, `float`, `string`, `sequence`, `mapping`, `iterable`, `empty`
- **Numeric & Equality Tests:** `odd`, `even`, `divisibleby(n)`, `equalto(v)`, `in(seq)`
- **Safety Provenance Tests:** `escaped`, `safe_for('html'|'attr'|'url'|'js')` (only true under `TrustTier.Trusted`; `safe_for('url')` also re-verifies URL scheme rules)
- **Built-in Functions:** `range([start,] stop[, step])` (capped at 10,000 items, `step != 0`)
