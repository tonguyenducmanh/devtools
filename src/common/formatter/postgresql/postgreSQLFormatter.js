import { generateParser } from "@/common/formatter/postgresql/postgreSQLGenerateParser.js";
import { generateTokenizer } from "@/common/formatter/postgresql/postgreSQLGenerateTokenizer.js";
import { codeGenerator } from "@/common/formatter/postgresql/postgreSQLGeneratorCode.js";
/**
 * Hàm chính để format code
 * @param {string} sourceCode: text cần format
 * @returns
 */
export function formatCode(sourceCode) {
  let tokens = generateTokenizer(sourceCode);
  let ast = generateParser(tokens);
  let formattedCode = codeGenerator(ast);
  return formattedCode;
}
