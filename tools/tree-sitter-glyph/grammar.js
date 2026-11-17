// Tree-sitter grammar specification for Glyph (.glyph / .html.glyph) templates (Phase 11).
// Covers expressions, statements (including with/filter/component/slot), comments, raw blocks, and trim controls.
module.exports = grammar({
  name: "glyph",

  extras: () => [/[ \t\r\n]/],

  rules: {
    template: ($) =>
      repeat(
        choice(
          $.comment,
          $.raw_block,
          $.expression_tag,
          $.statement_tag,
          $.text
        )
      ),

    text: () => token(prec(-1, /[^{]+|\{/)),

    comment: () => token(seq("{#", /[^#]*#+([^}#][^#]*#+)*/, "}")),

    raw_block: () =>
      seq(
        /\{%-?\s*raw\s*-?%\}/,
        repeat(/[^\{]+|\{[^%]/),
        /\{%-?\s*endraw\s*-?%\}/
      ),

    expression_tag: ($) =>
      seq(
        choice("{{-", "{{"),
        optional($._expr),
        choice("-}}", "}}")
      ),

    statement_tag: ($) =>
      seq(
        choice("{%-", "{%"),
        $.keyword,
        repeat(choice($._expr, $.identifier, "=", ",", ":")),
        choice("-%}", "%}")
      ),

    keyword: () =>
      choice(
        "if",
        "elif",
        "else",
        "endif",
        "for",
        "in",
        "endfor",
        "set",
        "include",
        "extends",
        "block",
        "endblock",
        "macro",
        "endmacro",
        "import",
        "from",
        "as",
        "call",
        "endcall",
        "with",
        "endwith",
        "filter",
        "endfilter",
        "component",
        "endcomponent",
        "slot",
        "endslot",
        "ignore",
        "missing",
        "context",
        "without"
      ),

    _expr: ($) =>
      choice(
        $.string,
        $.number,
        $.boolean,
        $.null_literal,
        $.identifier,
        $.pipe_operator,
        $.operator,
        $.punctuation
      ),

    string: () =>
      choice(
        seq('"', repeat(/[^"\\]|\\./), '"'),
        seq("'", repeat(/[^'\\]|\\./), "'")
      ),

    number: () => /\d+(\.\d+)?/,
    boolean: () => choice("true", "false", "True", "False"),
    null_literal: () => choice("null", "none", "None"),
    identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,
    pipe_operator: () => "|",
    operator: () =>
      choice(
        "==",
        "!=",
        "<=",
        ">=",
        "<",
        ">",
        "//",
        "+",
        "-",
        "*",
        "/",
        "%",
        "and",
        "or",
        "not",
        "is"
      ),
    punctuation: () => choice("(", ")", "[", "]", "{", "}", ".", ",", ":", "="),
  },
});
