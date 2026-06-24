import * as monaco from "monaco-editor";

const DARK_THEME_RULES = [
  { token: "namespace", foreground: "66d9ef" },
  { token: "variable", foreground: "f8c555" },
  { token: "type", foreground: "66d9ef" },
  { token: "function", foreground: "a6e22e" },
  { token: "property", foreground: "fd971f" },
  { token: "string.sql", foreground: "e6db74" },
];

const LIGHT_THEME_RULES = [
  { token: "namespace", foreground: "2674b8" },
  { token: "variable", foreground: "c04e01" },
  { token: "type", foreground: "2674b8" },
  { token: "function", foreground: "50a14f" },
  { token: "property", foreground: "d9730d" },
  { token: "string.sql", foreground: "8b7500" },
];

export function getPgsqlThemeRules(isDark) {
  return isDark ? DARK_THEME_RULES : LIGHT_THEME_RULES;
}

let _allSchemas = new Set();
let _allTables = new Set();
let _allFunctionNames = new Set();
let _pgKeywordSet = new Set();
let _monarchRegistered = false;
let _semanticRegistered = false;

const BUILTIN_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
  "DELETE", "CREATE", "ALTER", "DROP", "GRANT", "REVOKE",
  "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN", "LIKE", "ILIKE",
  "IS", "NULL", "TRUE", "FALSE", "PRIMARY", "KEY", "FOREIGN", "REFERENCES",
  "CASCADE", "RESTRICT", "UNIQUE", "CHECK", "DEFAULT", "CONSTRAINT",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS", "FULL", "ON",
  "AS", "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET",
  "DISTINCT", "ALL", "UNION", "INTERSECT", "EXCEPT",
  "CASE", "WHEN", "THEN", "ELSE", "END", "BEGIN", "COMMIT", "ROLLBACK",
  "TRANSACTION", "RETURNING", "WITH", "RECURSIVE", "LATERAL",
  "DO", "IF", "ELSIF", "LOOP", "WHILE", "FOR", "FOREACH", "EXECUTE",
  "OPEN", "CLOSE", "FETCH", "MOVE", "DECLARE",
  "RETURN", "RETURNS", "CALL", "LANGUAGE", "IMMUTABLE", "STABLE", "VOLATILE",
  "STRICT", "LEAKPROOF", "PARALLEL", "COST", "ROWS", "SECURITY", "INVOKER",
  "DEFINER", "CALLED", "CONTAINS", "SQL", "NO", "DATA",
  "PARTITION", "RANGE", "UNBOUNDED", "PRECEDING",
  "FOLLOWING", "CURRENT", "ROW", "FILTER", "OVER",
  "EXPLAIN", "ANALYZE", "BUFFERS", "VERBOSE", "TIMING",
  "VACUUM", "CLUSTER", "REINDEX", "TRUNCATE",
  "COMMENT", "OWNER", "STORAGE",
  "LOGGED", "UNLOGGED", "TEMPORARY", "TEMP",
  "SIMILAR", "REGEXP",
  "ARRAY", "ROW",
  "BEFORE", "AFTER", "INSTEAD", "OF",
  "DEFERRABLE", "INITIALLY", "DEFERRED", "IMMEDIATE",
  "REFRESH", "CONCURRENTLY",
  "LISTEN", "NOTIFY", "UNLISTEN",
  "LOAD", "SET", "RESET", "SHOW",
  "COPY", "STDIN", "STDOUT", "DELIMITER", "CSV", "HEADER", "QUOTE", "ESCAPE",
  "FREEZE", "FORCE",
  "PREPARE", "DEALLOCATE",
  "SAVEPOINT", "RELEASE", "TO",
  "ABORT",
  "LOCK", "NOWAIT", "SHARE", "EXCLUSIVE",
  "CHECKPOINT", "IMPORT", "OPTIONS",
  "CURRENT_USER", "SESSION_USER", "ADMIN",
  "PRIVILEGES", "ALL", "PUBLIC",
  "TABLESAMPLE", "SYSTEM", "BERNOULLI",
  "NATURAL", "USING", "CROSS", "APPLY",
  "NEXT", "PRIOR", "FIRST", "LAST", "ABSOLUTE", "RELATIVE",
  "FORWARD", "BACKWARD", "SCROLL", "WITHOUT", "HOLD",
  "BINARY", "INSENSITIVE",
  "CONNECT", "DISCONNECT",
  "CHARACTER", "CHAR", "NCHAR", "VARYING",
  "NATIONAL", "LARGE", "OBJECT", "CLOB", "BLOB",
  "ANY", "SOME", "EVERY",
  "CONVERT", "TRANSLATE", "OVERLAY", "POSITION", "SUBSTRING", "TRAILING",
  "LEADING", "BOTH", "TREAT", "TRIM",
  "COALESCE", "GREATEST", "LEAST",
  "NULLIF", "NVL", "NVL2",
  "EXTRACT", "CHAR_LENGTH", "CHARACTER_LENGTH",
  "OCTET_LENGTH", "BIT_LENGTH", "CARDINALITY",
  "ABS", "CEIL", "CEILING", "FLOOR", "MOD", "POWER", "SQRT",
  "EXP", "LN", "LOG", "ROUND", "TRUNC", "SIGN",
  "SIN", "COS", "TAN", "ASIN", "ACOS", "ATAN", "ATAN2",
  "DEGREES", "RADIANS", "PI",
  "WIDTH_BUCKET",
  "RANDOM", "SETSEED",
  "COUNT", "SUM", "AVG", "MIN", "MAX",
  "ARRAY_AGG", "STRING_AGG", "JSON_AGG", "JSONB_AGG",
  "XMLAGG", "GROUPING",
  "RANK", "DENSE_RANK", "ROW_NUMBER", "NTILE", "LEAD", "LAG",
  "FIRST_VALUE", "LAST_VALUE", "NTH_VALUE",
  "PERCENT_RANK", "CUME_DIST", "PERCENTILE_CONT", "PERCENTILE_DISC",
  "CORR", "COVAR_POP", "COVAR_SAMP", "REGR_SLOPE", "REGR_INTERCEPT",
  "STDDEV", "STDDEV_POP", "STDDEV_SAMP", "VARIANCE", "VAR_POP", "VAR_SAMP",
  "CAST", "OPERATOR",
  "MEMBER",
  "ENCRYPTED", "UNENCRYPTED", "PASSWORD", "VALID", "UNTIL",
  "INHERIT", "NOINHERIT", "CREATEDB", "NOCREATEDB",
  "CREATEROLE", "NOCREATEROLE", "SUPERUSER", "NOSUPERUSER",
  "LOGIN", "NOLOGIN",
  "BYPASSRLS", "NOBYPASSRLS",
  "CONNECTION", "LIMIT",
  "SESSION", "LOCAL",
  "AT", "TIME", "ZONE", "TIMEZONE",
  "ISOLATION", "LEVEL", "SERIALIZABLE", "REPEATABLE", "READ",
  "COMMITTED", "UNCOMMITTED",
  "CONSTRAINTS",
  "SESSION", "AUTHORIZATION",
  "XMLCOMMENT", "XMLCONCAT", "XMLELEMENT", "XMLFOREST",
  "XMLPARSE", "XMLPI", "XMLROOT", "XMLSERIALIZE", "XMLTABLE",
  "JSON_OBJECT", "JSON_ARRAY", "JSON_SCALAR", "JSON_SERIALIZE",
  "JSON_TABLE", "JSON_VALUE", "JSON_QUERY", "JSON_EXISTS",
  "MERGE", "MATCHED",
  "UPSERT", "CONFLICT", "NOTHING",
  "OVERRIDING", "VALUE",
  "IDENTITY", "GENERATED", "ALWAYS", "BY", "DEFAULT",
];

const PLPGSQL_KEYWORDS = [
  "THEN", "ELSE", "ELSIF", "ELSEIF",
  "EXIT", "CONTINUE", "WHEN",
  "RAISE", "EXCEPTION", "DETAIL", "HINT", "ERRCODE",
  "PERFORM", "GET", "DIAGNOSTICS",
  "NOTICE", "WARNING", "DEBUG", "INFO", "LOG",
  "NEW", "OLD",
  "INTO", "STRICT",
  "FOUND", "ROW_COUNT",
  "TG_OP", "TG_NAME", "TG_WHEN", "TG_LEVEL", "TG_RELID",
  "TG_RELNAME", "TG_TABLE_NAME", "TG_TABLE_SCHEMA",
  "TG_NARGS", "TG_ARGV",
  "COLLATE",
  "TRANSFORM", "VARIADIC",
  "OUT", "INOUT", "IN",
  "ARGUMENT", "MODE",
  "PLPGSQL",
];

const BUILTIN_OBJECT_KEYWORDS = [
  "TABLE", "VIEW", "INDEX", "FUNCTION", "TRIGGER", "PROCEDURE",
  "SCHEMA", "DATABASE", "SEQUENCE", "DOMAIN", "TYPE", "EXTENSION",
  "ENUM", "CURSOR", "TABLESPACE", "SERVER", "WRAPPER",
  "POLICY", "PUBLICATION", "SUBSCRIPTION", "REPLICATION", "SLOT",
  "STATISTICS", "ROLE", "EVENT",
  "HANDLER", "VALIDATOR", "WINDOW",
  "MATERIALIZED",
];

const BUILTIN_TYPE_KEYWORDS = [
  "INTEGER", "INT", "SMALLINT", "BIGINT", "TINYINT",
  "SERIAL", "BIGSERIAL", "SMALLSERIAL",
  "NUMERIC", "DECIMAL", "DEC", "REAL", "FLOAT", "DOUBLE", "PRECISION",
  "CHAR", "VARCHAR", "TEXT", "BPCHAR",
  "BOOLEAN", "BOOL",
  "DATE", "TIME", "TIMESTAMP", "TIMESTAMPTZ", "INTERVAL",
  "UUID", "JSON", "JSONB", "BYTEA", "XML", "ARRAY",
  "GEOMETRY", "GEOGRAPHY", "POINT", "LINE", "LSEG", "BOX",
  "PATH", "POLYGON", "CIRCLE",
  "TSVECTOR", "TSQUERY",
  "INET", "CIDR", "MACADDR", "PG_LSN",
  "MONEY", "OID",
  "INT4RANGE", "INT8RANGE", "NUMRANGE",
  "TSRANGE", "TSTZRANGE", "DATERANGE",
  "INT4MULTIRANGE", "INT8MULTIRANGE", "NUMMULTIRANGE",
  "TSMULTIRANGE", "TSTMULTIRANGE", "DATEMULTIRANGE",
];

function buildMonarchDefinition() {
  const allKeywords = [
    ...new Set([
      ...BUILTIN_KEYWORDS,
      ...PLPGSQL_KEYWORDS,
      ...Array.from(_pgKeywordSet).map((k) => k.toUpperCase()),
    ]),
  ];

  const allTypeKeywords = [...new Set([
    ...BUILTIN_TYPE_KEYWORDS,
    ...BUILTIN_OBJECT_KEYWORDS,
  ])];

  return {
    defaultToken: "",
    ignoreCase: true,
    tokenPostfix: ".pgsql",
    brackets: [
      { open: "(", close: ")", token: "delimiter.parenthesis" },
    ],
    keywords: allKeywords,
    builtinFunctions: [],
    typeKeywords: allTypeKeywords,
    tokenizer: {
      root: [
        { include: "@comments" },
        { include: "@whitespace" },
        { include: "@numbers" },
        { include: "@strings" },
        { include: "@operators" },
        [/[a-zA-Z_][a-zA-Z0-9_]*/, {
          cases: {
            "@typeKeywords": "type",
            "@keywords": "keyword",
            "@builtinFunctions": "predefined",
            "@default": "identifier",
          },
        }],
        [/[;,.()]/, "delimiter"],
      ],
      comments: [
        [/--.*$/, "comment"],
        [/\/\*/, { token: "comment.quote", next: "@comment" }],
      ],
      comment: [
        [/[^*/]+/, "comment"],
        [/\*\//, { token: "comment.quote", next: "@pop" }],
        [/./, "comment"],
      ],
      whitespace: [
        [/[ \t\r\n]+/, "white"],
      ],
      numbers: [
        [/(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?/, "number"],
      ],
      strings: [
        [/'/, { token: "string", next: "@string" }],
        [/\$[a-zA-Z_][a-zA-Z0-9_]*\$/, { token: "string.sql", next: "@pgCode" }],
      ],
      string: [
        [/[^']+/, "string"],
        [/''/, "string"],
        [/'/, { token: "string", next: "@pop" }],
      ],
      pgCode: [
        [/\$[a-zA-Z_][a-zA-Z0-9_]*\$/, { token: "string.sql", next: "@pop" }],
        { include: "@comments" },
        { include: "@whitespace" },
        { include: "@numbers" },
        { include: "@strings" },
        { include: "@operators" },
        [/[a-zA-Z_][a-zA-Z0-9_]*/, {
          cases: {
            "@typeKeywords": "type",
            "@keywords": "keyword",
            "@builtinFunctions": "predefined",
            "@default": "identifier",
          },
        }],
        [/[;,.()]/, "delimiter"],
      ],
      operators: [
        [/[<>=!~:&|+\-*/%^#]+/, "operator"],
      ],
    },
  };
}

export function registerPgsqlLanguage() {
  if (_monarchRegistered) return;
  monaco.languages.register({ id: "pgsql" });
  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);
  _monarchRegistered = true;
  registerSemanticProvider();
}

const semanticLegend = {
  tokenTypes: [
    "comment", "string", "keyword", "number", "operator",
    "namespace", "type", "function", "variable", "property",
  ],
  tokenModifiers: [],
};

function _extractAliases(text, outMap) {
  const clauseRe = /(?:from|join)\s+/gi;
  const tableAliasRe = /^(?:\w+\.)?(\w+)(?:\s+as)?\s+(\w+)$/i;
  const clauseEndRe = /\b(?:where|group\s+by|order\s+by|having|limit|offset|returning|union|intersect|except)\b/i;
  let clauseMatch;

  while ((clauseMatch = clauseRe.exec(text)) !== null) {
    const after = clauseMatch.index + clauseMatch[0].length;
    const endRest = text.slice(after).search(clauseEndRe);
    const end = endRest === -1 ? text.length : after + endRest;
    const block = text.slice(after, end);
    const parts = block.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      const m = trimmed.match(tableAliasRe);
      if (m) {
        outMap.set(m[2].toLowerCase(), m[1].toLowerCase());
      }
    }
  }
}

function registerSemanticProvider() {
  if (_semanticRegistered) return;
  _semanticRegistered = true;

  monaco.languages.registerDocumentSemanticTokensProvider("pgsql", {
    getLegend() {
      return semanticLegend;
    },

    provideDocumentSemanticTokens(model) {
      const lines = model.getLinesContent();
      const data = [];
      const fullText = model.getValue();

      const aliasToTable = new Map();
      _extractAliases(fullText, aliasToTable);

      const kwSet = _pgKeywordSet;
      let prevLine = 0;
      let prevChar = 0;

      let inBlockComment = false;
      let inSingleString = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        let pos = 0;
        const len = line.length;

        while (pos < len) {
          if (inBlockComment) {
            const closeIdx = line.indexOf("*/", pos);
            if (closeIdx === -1) break;
            pos = closeIdx + 2;
            inBlockComment = false;
            continue;
          }

          if (inSingleString) {
            const closeIdx = line.indexOf("'", pos);
            if (closeIdx === -1) break;
            pos = closeIdx + 1;
            if (pos < len && line[pos] === "'") {
              pos++;
              continue;
            }
            inSingleString = false;
            continue;
          }

          const ch = line[pos];
          const nextCh = pos + 1 < len ? line[pos + 1] : "";

          if (ch === "-" && nextCh === "-") break;
          if (ch === "/" && nextCh === "*") {
            inBlockComment = true;
            pos += 2;
            continue;
          }
          if (ch === "'") {
            inSingleString = true;
            pos++;
            continue;
          }

          if (/[a-zA-Z_]/.test(ch)) {
            const wordMatch = line.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
            if (wordMatch) {
              const word = wordMatch[0];
              const offset = pos;
              const length = word.length;
              const lowerWord = word.toLowerCase();

              pos += length;

              let type = null;

              if (aliasToTable.has(lowerWord)) {
                type = "variable";
              } else if (_allFunctionNames?.has(lowerWord)) {
                const after = line.slice(offset + length).trimStart();
                if (after.startsWith("(")) {
                  type = "function";
                }
              } else if (_allSchemas?.has(lowerWord)) {
                if (line[offset + length] === ".") {
                  type = "namespace";
                }
              } else {
                const charBefore = line[offset - 1] || "";
                if (charBefore === "." && _allTables?.has(lowerWord)) {
                  type = "type";
                }
              }

              if (!type && kwSet.has(lowerWord)) {
                type = "keyword";
              }

              if (type) {
                const typeIndex = semanticLegend.tokenTypes.indexOf(type);
                if (typeIndex !== -1) {
                  data.push(
                    i - prevLine,
                    prevLine === i ? offset - prevChar : offset,
                    length,
                    typeIndex,
                    0,
                  );
                  prevLine = i;
                  prevChar = offset;
                }
              }
              continue;
            }
          }

          if (/\d/.test(ch)) {
            const numMatch = line.slice(pos).match(/^\d+(\.\d+)?/);
            if (numMatch) {
              pos += numMatch[0].length;
              continue;
            }
          }

          pos++;
        }
      }

      return {
        data: new Uint32Array(data),
        resultId: null,
      };
    },

    releaseDocumentSemanticTokens() {},
  });
}

const _reservedTypeSet = new Set(
  [...BUILTIN_TYPE_KEYWORDS, ...BUILTIN_OBJECT_KEYWORDS].map((k) => k.toLowerCase()),
);

export function updatePgsqlIntellisenseData(data) {
  if (!data) return;

  const keywords = data?.keywords?.rows ?? [];
  _pgKeywordSet = new Set(
    keywords
      .map((k) => String(k.word).toLowerCase())
      .filter(Boolean)
      .filter((k) => !_reservedTypeSet.has(k)),
  );

  const tableRows = data?.tables?.rows ?? [];
  _allSchemas = new Set();
  _allTables = new Set();
  tableRows.forEach((row) => {
    _allSchemas.add(row.table_schema);
    _allTables.add(row.table_name);
  });

  const functionRows = data?.functions?.rows ?? [];
  _allFunctionNames = new Set(
    functionRows.map((fn) => String(fn.function_name).toLowerCase()),
  );

  const definition = buildMonarchDefinition();
  monaco.languages.setMonarchTokensProvider("pgsql", definition);

  monaco.editor.getModels().forEach((model) => {
    if (model.getLanguageId() === "pgsql") {
      monaco.editor.setModelLanguage(model, "pgsql");
    }
  });
}

export function clearPgsqlIntellisenseData() {
  _allSchemas = new Set();
  _allTables = new Set();
  _allFunctionNames = new Set();
  _pgKeywordSet = new Set();
}
