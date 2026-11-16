# Changelog

All notable changes to **Glyph** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.3-parser-ast] - 2026-11-16

### Added
- `docs/adr/0002-expression-grammar-and-truthiness.md` (ADR-0002), `docs/syntax.md`, and `docs/expressions.md`.
- `glyph/expressions.nox` & `glyph/ast.nox`: Immutable tagged-union AST and expression nodes (`Expr`, `ExprKind`, `Stmt`, `StmtKind`, `TemplateAst`) with `SourceSpan`.
- `glyph/parser.nox`: Two-stage statement nesting + Pratt/precedence-climbing expression parser (`if/elif/else`, `for/else`, `set`, `include`, `extends`, `block`, `macro`, `import`, `from`, `call`), `max_expr_depth`/`max_ast_nodes` bounds, chained comparison rejection, method-call/reflection rejection, and `lint_tokens`.
- `glyph/validate.nox`: Static validator and `TemplateInfo` extractor (duplicate block checks, top-level `extends`, `super()` placement, dynamic include policy, external variable tracking).
- Phase 2 test suites: `tests/parser/parser_test.nox` and `tests/expression/expression_test.nox`.

## [0.0.2-core-lexer] - 2026-11-16

### Added
- `glyph/errors.nox`: Typed `GlyphError` hierarchy (`GlyphSyntaxError`, `GlyphUndefinedError`, `GlyphTypeError`, `GlyphSecurityError`, `GlyphLoadError`, `GlyphLimitError`, `GlyphRenderError`, `GlyphExtensionError`, `GlyphCancelledError`), `SourceSpan`, `RelatedSpan`, stable error codes, and path redaction (`redact_logical_name`, `format_public_error`).
- `glyph/limits.nox`: `ResourceBudget` (`default_budget()`, `restricted_budget()`) and shared non-resettable `BudgetTracker`.
- `glyph/value.nox`: Tagged-union `Value` (`VNull`, `VUndefined`, `VBool`, `VInt`, `VFloat`, `VStr`, `VList`, `VMap`, `VTrustedMarkup`, `VCallable`), `JsonValue` conversion preserving 64-bit integers, strict truthiness/stringify rules, reflection key blocking (`__class__`, `__dict__`, `constructor`, `prototype`), NaN/Inf rejection, and overflow-checked integer arithmetic.
- `glyph/token.nox` and `glyph/lexer.nox`: O(n) single-pass UTF-8-validating lexer with byte/codepoint `SourceSpan` tracking, whitespace trimming (`{{-`, `-}}`, `{%-`, `-%}`, `{#-`, `-#}`), comments, `{% raw %}...{% endraw %}` (nested raw rejected), string escapes, and `ResourceBudget` enforcement.
- Phase 1 tests: `tests/value/value_test.nox` and `tests/lexer/lexer_test.nox` (including 200-case deterministic fuzz smoke).

## [0.0.1-audit] - 2026-11-16

### Added
- Phase 0 feasibility & NOX `2.1.186` capability audit (`docs/compatibility.md`).
- Project manifest (`nox.json`), lock/packaging baseline, and core module entry (`glyph/version.nox`, `glyph/api.nox` audit skeleton).
- Architecture and roadmap baseline (`docs/ARCHITECTURE.md`, `docs/roadmap.md`, `docs/adr/0001-min-nox-version-and-value-repr.md`).
- Phase 0 Proof-of-Concept & audit test suite (`tests/audit/*_test.nox`) and standalone consumer verification (`examples/audit_consumer/`).
- GitHub repository scaffolding (`README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `.github/` templates, CI and Release workflows).
