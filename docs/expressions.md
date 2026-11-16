# Glyph Expression Language (`docs/expressions.md`)

> **Phase:** Phase 2 (`v0.0.3-parser-ast`)  
> **ADR:** [ADR-0002](adr/0002-expression-grammar-and-truthiness.md)

## 1. Literals

- **Null:** `null` or `none` (case-sensitive lowercase)
- **Boolean:** `true` or `false` (case-sensitive lowercase)
- **Integer:** `0`, `42`, `-7` (64-bit signed; overflow fails with `GLYPH_EVAL_OVERFLOW`)
- **Float:** `3.14`, `1e5`, `2.5e-2` (`NaN`/`Infinity` fail with `GLYPH_EVAL_TYPE`)
- **String:** `"..."` or `'...'` with `\"`, `\'`, `\\`, `\n`, `\t`, `\r` escapes
- **List:** `[1, 2, item]`
- **Map:** `{"name": "Ada", "count": 1}`

## 2. Precedence Table (Lowest to Highest)

| Level | Operators / Form | Associativity | Notes |
|---|---|---|---|
| 1 | `a if cond else b` | Right | Short-circuit evaluation |
| 2 | `a or b` | Left | Short-circuit evaluation |
| 3 | `a and b` | Left | Short-circuit evaluation |
| 4 | `not x` | Prefix | Returns `VBool` |
| 5 | `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `is [not]` | Non-chaining | `a < b < c` is a syntax error |
| 6 | `+`, `-` | Left | |
| 7 | `*`, `/`, `//`, `%` | Left | Division/mod by zero raises `GLYPH_EVAL_DIV_ZERO` |
| 8 | `+x`, `-x` | Prefix | |
| 9 | `x \| filter(args)` | Left | Registered pure filters only |
| 10 | `x.field`, `x[idx]`, `fn(args)`, `(x)` | Left | `x.method()` and `__*`/`constructor`/`prototype` forbidden |

## 3. Security Rules

1. **No Method Calls:** `x.upper()` is rejected at parse time (`GLYPH_SECURITY_POLICY`). Use `x | upper`.
2. **No Reflection Keys:** Accessing `.__class__`, `.__dict__`, `.__proto__`, `.constructor`, `.prototype`, or any `.__*` key is rejected statically (`GLYPH_SECURITY_REFLECTION`).
3. **Whitelisted Functions:** Top-level calls `fn(...)` resolve only against registered pure helpers (e.g., `range(n)`) or `super()`.
4. **Bounded Nesting:** Deeply nested expressions exceeding `ResourceBudget.max_expr_depth` (default `64`) fail closed with `GLYPH_LIMIT_EXPR_DEPTH`.
