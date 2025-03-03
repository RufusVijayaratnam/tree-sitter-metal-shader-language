/**
 * @file Metal Shader Language (MSL) grammar for tree-sitter
 * @author Rufus Vijayaratnam <rufusvijayaratnam@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

// Common regex

const identifier_rgx = /[a-zA-Z0-9_\-]+/;
const string_literal_rgx = /"([^"\\]|\\.)*"/;
const integer_literal_rgx = /[\+-]?\d+/;
const float_literal_rgx = /[\+-]?\d*\.\d*/;
const char_literal_rgx = /'([^'\\]|\\.)'/;

const newline_rgx = /\r?\n/;

module.exports = grammar({
  name: "metal_shader_language",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $.function_declaration,
      $.preproc_include,
      $.preproc_import,
      $.preproc_define,
      $.preproc_function_definition,
      $.preproc_error,
      $.preproc_warning,
      $.preproc_pragma,
      $.preproc_undef,
      $.preproc_line
    ),

    preproc_include: $ => seq(
      preprocessor("include"),
      choice(
        $.system_library_string,
        $.user_header,
        $.identifier,
        // TODO preprocessor call
      )
    ),

    preproc_import: $ => seq(
      preprocessor("import"),
      choice(
        $.system_library_string,
        $.user_header,
        $.identifier,
        // TODO preprocessor call
      )
    ),

    preproc_define: $ => seq(
      preprocessor("define"),
      $.identifier,
      optional($._literal)
    ),

    preproc_function_definition: $ => seq(
      preprocessor("define"),
      field("name", $.identifier),
      field("parameters", $.preproc_params),
      //field('value', optional($.preproc_arg)),
      token.immediate(newline_rgx),
    ),

    preproc_params: $ => seq(
      token.immediate("("),
      commaSep(choice($.identifier, "...")),
      ")"
    ),

    preproc_error: $ => seq(
      preprocessor("error"),
      optional(optional($.preproc_arg))
    ),

    preproc_warning: $ => seq(
      preprocessor("warning"),
      optional($.preproc_arg)
    ),

    preproc_pragma: $ => seq(
      preprocessor("pragma"),
      optional($.preproc_arg)
    ),

    preproc_line: $ => seq(
      preprocessor("line"),
      $.integer_literal,
      optional($.preproc_arg)
    ),

    preproc_undef: $ => seq(
      preprocessor("undef"),
      $.identifier
    ),

    preproc_arg: _ => token(prec(-1, /\S([^/\n]|\/[^*]|\\\r?\n)*/)),

    system_library_string: $ => seq(
      '<',
      repeat(choice(/[^>\n]/, '\\>')),
      '>'
    ),

    user_header: $ => /"[a-zA-Z0-9_\.\-\/]+"/,

    identifier: $ => identifier_rgx,

    preproc_define_value: $ => /[^\n]+/,
    
    // Declarations

    function_declaration: $ => seq(
      //TODO
      "func"
    ),

    // Literals
    _literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.char_literal,
      $.string_literal
    ),
    integer_literal: $ => new RegExp(integer_literal_rgx),
    float_literal: $ => new RegExp(float_literal_rgx),
    char_literal: $ => new RegExp(char_literal_rgx),
    string_literal: $ => new RegExp(string_literal_rgx)
  }
});

/**
 * Creates a preprocessor alias rule
 * @param {string} command Preprocessor command
 * @returns {AliasRule} 
 */
function preprocessor(command) {
  return alias(new RegExp("#\s*" + command), "#" + command)
}

function commaSep(rule) {
  return seq(rule, optional(seq(",", rule)))
}

function preprocessorContextual(command, validInternals) {
  contextualDirective: $ => seq(
    preprocessor(command),
    repeate(validInternals)
  )
}
