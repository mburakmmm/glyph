# ADR-0002: Expression Grammar, Operator Precedence, and Truthiness

- **Status:** Accepted
- **Date:** 2026-11-16
- **Phase:** Phase 2 (`v0.0.3-parser-ast`)

## 1. Problem

Glyph needs a small, safe, predictable expression language that feels natural to Jinja2 users while avoiding Python's dynamic object model, ambiguous operator interactions, and unbounded recursion/allocation hazards.

## 2. Prior Decisions

- [ADR-0001](0001-min-nox-version-and-value-repr.md): `Value` is a statically typed tagged union (`enum Value`) with `VUndefined` distinct from `VNull` and `VMap` backed by `OrderedDict[str, Value]`.
- [AGENTS.md](../../AGENTS.md) §5.2, §7: Dot access is map-field lookup only; method calls (`foo.bar()`) and reflection keys (`__class__`, `__dict__`, `constructor`, `prototype`) are forbidden; `lambda`, `await`, `comprehension`, and arbitrary host calls are excluded.

## 3. Requirements

1. Deterministic Pratt / precedence-climbing expression parser bounded by `max_expr_depth` and `max_ast_nodes`.
2. Explicit precedence for `if/else`, `or`, `and`, `not`, comparisons (`==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `is [not]`), arithmetic (`+`, `-`, `*`, `/`, `//`, `%`), unary (`+`, `-`), filters (`|`), and postfix lookup (`.field`, `[expr]`).
3. Explicit truthiness table separating `VUndefined` from `VNull`.
4. Static rejection of forbidden reflection keys and method-call syntax before execution.

## 4. Decision

### 4.1. Operator Precedence (Lowest to Highest)

1. **Conditional (right-associative):** `or_expr ("if" or_expr "else" conditional)?`
2. **Logical OR (left-associative, short-circuit):** `or`
3. **Logical AND (left-associative, short-circuit):** `and`
4. **Logical NOT (prefix):** `not`
5. **Comparison (non-chaining binary):** `==`, `!=`, `<`, `<=`, `>`, `>=`, `in`, `not in`, `is`, `is not`
   - Chained comparisons such as `1 < x < 10` are rejected at parse time to avoid silent precedence confusion; users write `1 < x and x < 10`.
   - `is [not]` binds its right-hand side as a registered test name with optional `(args)`.
6. **Additive (left-associative):** `+`, `-`
7. **Multiplicative (left-associative):** `*`, `/`, `//`, `%`
8. **Unary (prefix):** `+`, `-`
9. **Filter Pipe (left-associative):** `| ident [ "(" args ")" ]`
10. **Postfix & Primary:** `primary ("." field | "[" expr "]")*`
    - Literals: `null`/`none`, `true`/`false`, `int`, `float`, `string`, `[list]`, `{map}`
    - Identifier: `ident`
    - Parenthesized expression: `(expr)`
    - Whitelisted function call: `ident(args)` (only top-level registered functions or compiler-known intrinsics such as `super()`; `expr.method()` is always rejected).

### 4.2. Truthiness Matrix

| Value | Truthy? | Notes |
|---|---|---|
| `VNull` | `false` | Distinct from `VUndefined` |
| `VUndefined` | Error (`StrictUndefined`) / `false` (`LenientUndefined`) | Default is `StrictUndefined` |
| `VBool(b)` | `b` | |
| `VInt(i)` | `i != 0` | |
| `VFloat(f)` | `f != 0.0` | `NaN`/`Infinity` raise `GlyphTypeError` |
| `VStr(s)` | `len(s) > 0` | `"0"` and `"false"` are truthy (non-empty strings) |
| `VList(xs)` | `len(xs) > 0` | |
| `VMap(m)` | `m.size() > 0` | |
| `VTrustedMarkup(c, _)` | `len(c) > 0` | |
| `VCallable(_)` | `true` | |

## 5. Alternatives Considered & Rejected

- **Chained comparisons (`a < b < c`)**: Rejected to prevent Python-specific multi-evaluation edge cases in AST interpretation and simplify static analysis.
- **Method call syntax (`s.upper()`, `items.append()`)**: Rejected (`AGENTS.md` §7.2); templates use pure filters (`s | upper`) and immutable values.

## 6. Security & Performance Considerations

- `max_expr_depth` (default 64) and `max_ast_nodes` (default 100,000) prevent stack overflow and algorithmic AST blowup on hostile/deeply nested expressions like `((((...))))`.
- Reflection keys (`__*`, `constructor`, `prototype`) and method calls on member expressions (`x.foo()`) are rejected at parse/validation time before rendering starts.
- In `lint()` mode, syntax diagnostics may be collected cleanly, but an invalid AST is never executed for rendering.

## 7. Acceptance Criteria

- [x] `docs/syntax.md` and `docs/expressions.md` document the grammar and truthiness rules.
- [x] `glyph/expressions.nox`, `glyph/ast.nox`, `glyph/parser.nox`, `glyph/validate.nox` pass `noxc check` on LLVM, QBE, and freestanding.
- [x] `tests/parser/` and `tests/expression/` cover precedence, nesting limits, forbidden method calls/reflection, and error priority.
