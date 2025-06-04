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
  if (validateCode(sourceCode, formattedCode)) {
    return formattedCode;
  } else {
    console.error("Formatted code does not match the original source code.");
    return null;
  }
}

/**
 * kiểm tra xem code đã format có đúng với code ban đầu không
 * @param {String} sourceCode sql ban đầu
 * @param {String} formattedCode sql sau khi format
 * @returns
 */
function validateCode(sourceCode, formattedCode) {
  // lọc hết khoảng cách giữa các chữ và xuống dòng đi
  let sourceCodeTrim = sourceCode.replace(/\s+/g, "");
  let formatCodeTrim = formattedCode.replace(/\s+/g, "");
  return sourceCodeTrim.compareText(formatCodeTrim);
}
