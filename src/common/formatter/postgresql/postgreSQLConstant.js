class postgreSQLConstant {
  tokenType = {
    // dấu đóng mở ngoặc
    parenthesis: "parenthesis",
    // từ khóa
    keyword: "keyword",
    // dấu chấm phẩy ;
    semicolon: "semicolon",
    // dấu phẩy ,
    semi: "semi",
    // bình luận trong code
    comment: "comment",
    // xuống dòng
    newLine: "newLine",
    // số vd 123
    number: "number",
    // chữ cái vd "123"
    text: "text",
  };
  astType = {
    // chương trình
    program: "program",
    // bọc biểu thức bằng ()
    callExpression: "callExpression",
    // từ khóa
    keyword: "keyword",
    // dấu chấm phẩy ;
    semicolon: "semicolon",
    // dấu phẩy ,
    semi: "semi",
    // bình luận trong code
    comment: "comment",
    // xuống dòng
    newLine: "newLine",
    // số vd 123
    number: "number",
    // chữ cái vd "123"
    text: "text",
  };
  keywords = {
    SLASHCHAR: "/",
    ASTERISKCHAR: "*",
    OPENPARENTHESISCHAR: "(",
    CLOSEPARENTHESISCHAR: ")",
    EMPTYPARENTHESIS: "()",
    SEMICOLONCHAR: ";",
    SEMICHAR: ",",
    HYPHENCHAR: "-",
    ASTERISKANDSLASH: "*/",
    APOSTROPHECHAR: "'",
    SPACECHAR: " ",
    BREAKLINECHAR: "\n",
    NUMBERS: /[0-9]/,
    WHITESPACE: /\s/,
    BREAKLINE: `
`,
    NEWLINE: /\n/,
    LETTERSCONTAINNUM: /^[a-z_.:*%><=0-9]+$/i,
  };
}

export default new postgreSQLConstant();
