# Developer Tooling, Diagnostics, Source Maps & Telemetry

> **Version:** `1.2.0` (`noxc 2.2.38`+) Tooling Guide.

## 1. Glyph CLI (`cli/main.nox`)

Install globally via `nox.json` `"bin"` (`noxc 2.2.38+`) or build locally:

```bash
noxc install github.com/mburakmmm/glyph
# or locally:
noxc build -o glyph-cli cli/main.nox
```

Supported subcommands:

- `glyph check [--root <dir>] [--format human|json] <template>`: Parse + static validate without executing template logic.
- `glyph lint [--root <dir>] [--format human|json] <template>`: Collect parse/security/nesting diagnostics with redacted logical paths.
- `glyph render [--root <dir>] [--context <file.json> | --context-json <json>] [--mode html|text|xml|md|json|email_subject] [--trust trusted|restricted] [--locale <loc>] [--format human|json] [--out <file>] <template>`: Execute safely in bounded `Environment`.
- `glyph inspect [--root <dir>] [--format human|json] <template>` & `glyph deps`: Print `TemplateInfo` and transitive dependencies.
- `glyph bench [--root <dir>] [--iterations <n>] [--context-json <json>] [--format human|json] <template>`: Local micro-benchmark.
- `glyph version [--format human|json]`

For OS-level syscall confinement on macOS (`sandbox-exec`) or Linux (`bwrap`), run CLI workloads under `noxc run --sandbox --allow-read=<templates_dir> cli/main.nox -- ...`.

Exit codes (from `glyph/diagnostics.nox`):

| Code | Category |
|---|---|
| `0` | Success (`EXIT_OK`) |
| `2` | CLI Usage (`EXIT_USAGE`) |
| `3` | Syntax Error (`EXIT_SYNTAX`) |
| `4` | Loader Error (`EXIT_LOADER`) |
| `5` | Security Policy Violation (`EXIT_SECURITY`) |
| `6` | Resource Budget Exhausted (`EXIT_RESOURCE`) |
| `7` | Runtime / Undefined / Type / Extension Error (`EXIT_RUNTIME`) |
| `8` | Internal Error (`EXIT_INTERNAL`) |

## 2. Source Maps & Diagnostics (`glyph/diagnostics.nox`)

- `SourceSpan` tracks `logical_name`, `line`, `column`, `span_start_byte`, `span_end_byte`.
- `format_error_json(err)` emits machine-readable structured diagnostics with `redacted: true` (never exposing disk paths or context secrets).
- `build_source_map_json(logical_name, spans)` serializes `SourceMapSpan` records for editor/LSP overlays.

## 3. Editor Syntax Grammar (`tools/tree-sitter-glyph/grammar.js`)

Provides Tree-sitter highlighting rules for:

- Output delimiters (`{{ ... }}`, `{{- ... -}}`)
- Statement blocks (`{% ... %}`, `{%- ... -%}`) including `if`, `for`, `set`, `include`, `extends`, `block`, `macro`, `call`, `with`, `filter`, `component`, `slot`
- Comments (`{# ... #}`) and verbatim `{% raw %}...{% endraw %}` blocks

## 4. Telemetry & Logging Hooks (`glyph/telemetry.nox`)

For **Pulse** / **Obsidian** observability without global state:

```nox
import glyph.api
from glyph.api import TelemetryHook, TraceEvent, RedactedLogEvent, telemetry_hook, set_telemetry_hook

def on_trace(ev: TraceEvent) -> None:
    print(ev.phase + " tpl=" + ev.template_name + " hit=" + str(ev.cache_hit))

def on_log(ev: RedactedLogEvent) -> None:
    print(ev.level + " " + ev.error_code)

set_telemetry_hook(env, telemetry_hook(on_trace, on_log))
```

All `template_name` fields are normalized via `redact_logical_name`; user context data and disk paths are never logged.

## 5. AOT Codegen PoC (`tools/aot_codegen.nox`)

Implements ADR-0011 by lowering a verified static subset of `TemplateAst` (`SText`, `SOutput`, `SIf`, `SFor`, `SSet`) into standalone type-safe `.nox` modules with built-in `BudgetTracker` enforcement and no `noxc` compiler patches.
