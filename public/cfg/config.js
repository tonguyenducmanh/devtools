/**
 * File config dùng chung cho toàn bộ ứng dụng frontend, được tiêm thẳng vào index.html
 */
(function (window) {
  window.__env = window.__env || {};
  window.__env.version = "v1.0.9";
  window.__env.defaultValue = {
    theme: "light",
  };
  window.__env.textToQRConfig = {
    maxTextOneChunk: 1000,
    maxHistoryLength: 100,
    maxTitleLength: 50,
  };
  window.__env.githubSource = {
    url: "https://github.com/tonguyenducmanh/utility-for-dev",
  };

  window.__env.jsonParser = {
    showConfigLib: false,
  };

  window.__env.oneTimePasswordAuthen = {
    showDecodedInfo: false,
    autoSave: true,
  };
  window.__env.postgreSQLFormatter = {
    // có tự động viết hoa các từ khóa trong postgreSQL không
    usingUpperCaseKeyWord: true,
    // độ dài của 1 tab
    tabSpace: "    ",
    // danh sách các từ khóa sẽ xuống dòng và tab vào
    listKeyWordBreakLine: [
      "select",
      "where",
      "having",
      "and",
      "or",
      "from",
      "drop",
      "delete",
      "join",
      "update",
      "truncate",
      "begin",
      "end",
    ],
    // danh sách các cụm từ khóa sẽ xuống dòng và tab vào
    listMutipleKeyWordBreakLine: ["group by", "order by", "left join"],
  };
})(this);
