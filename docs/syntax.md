# Glyph Template Syntax (`docs/syntax.md`)

> **Phase:** Phase 2 (`v0.0.3-parser-ast`)  
> **Contract:** [AGENTS.md](../AGENTS.md) §6

## 1. Delimiters & Whitespace Control

| Delimiter | Purpose | Whitespace Trim Variants |
|---|---|---|
| `{{ expr }}` | Evaluate expression and emit output (HTML-escaped by default) | `{{- expr -}}` |
| `{% stmt %}` | Control-flow or template structure statement | `{%- stmt -%}` |
| `{# comment #}` | Non-emitted template comment | `{#- comment -#}` |
| `{% raw %}...{% endraw %}` | Verbatim template text (delimiters not parsed) | `{%- raw -%}...{%- endraw -%}` |

- Nested `{% raw %}` inside an open `{% raw %}` block is rejected (`GLYPH_SYNTAX_NESTED_RAW`).
- Unclosed delimiters report exact `logical_name:line:column` of the opening delimiter.
- Invalid UTF-8 sequences anywhere in the template are rejected at lexing (`GLYPH_SYNTAX_INVALID_UTF8`).

## 2. Core Statements (Phase 2)

### Conditionals (`if / elif / else / endif`)
```jinja2
{% if user.active %}
  Active
{% elif user.pending %}
  Pending
{% else %}
  Inactive
{% endif %}
```

### Iteration (`for / else / endfor`)
Single target or 2-target key/value unpacking:
```jinja2
{% for item in items %}
  <li>{{ item.name }}</li>
{% else %}
  <li>Empty</li>
{% endfor %}

{% for key, val in settings %}
  {{ key }}={{ val }}
{% endfor %}
```

### Local Assignment (`set`)
```jinja2
{% set greeting = "Hello " + user.name %}
```
- `set` binds only in the current/local lexical scope; mutating parent or global registry state is forbidden.
- Target must be a plain identifier (never `obj.field` or `arr[0]`).

## 3. Composition Statements (Parsed in Phase 2, Executed in Phases 4–5)

- `{% include "partial.html" %}` (`with context` / `without context`, `ignore missing`)
- `{% extends "base.html" %}` (must appear as the first non-whitespace, non-comment statement at top level)
- `{% block name %}...{% endblock %}` (optional matching block name after `endblock` allowed)
- `{% macro name(a, b=default) %}...{% endmacro %}`
- `{% import "macros.html" as m %}` / `{% from "macros.html" import btn %}`
- `{% call card(title="Hi") %}...{% endcall %}`

## 4. Forbidden Constructs

- No `{% break %}`, `{% continue %}`, `{% do %}`, `{% debug %}`, `eval`, `exec`, `import` of NOX/Python code, or shell commands.
- Parse errors abort compilation: an invalid AST is never passed to the renderer.
