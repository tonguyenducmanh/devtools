// ====== CẤU HÌNH ======
const CONNECTION_STRING = "điền vào đây"; // copy từ curl gốc
const AUTH_TOKEN = "Bearer đây"; // copy từ curl gốc
const API_URL = "https://example.com/api/query";

const TABLE = "schema.table_name";
const WHERE_CLAUSE = "1=1";
const ORDER_COLUMN = "created_date";
const BATCH_SIZE = 5000;
const CONCURRENCY_CHUNK = 5; // số request gửi song song mỗi đợt

// Build curl string cho 1 câu SQL
function buildCurl(sql) {
  const body = JSON.stringify({
    ConnectionString: CONNECTION_STRING,
    Sql: sql,
  });

  const escapedBody = body.replace(/'/g, `'\\''`);

  return `curl '${API_URL}' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Authorization: ${AUTH_TOKEN}' \
  -H 'Content-Type: application/json' \
  --data-raw '${escapedBody}' \
  --insecure`;
}

// Lấy tổng số dòng bằng COUNT(*)
async function getTotalRows() {
  const sql = `SELECT count(1) AS total FROM ${TABLE} WHERE ${WHERE_CLAUSE} limit 1;`;
  const res = await requestCURL(buildCurl(sql));
  const data = parseResponse(res);

  const rows = data?.Data ?? data?.Result ?? data;

  const firstRow = rows[0];
  const total = firstRow.total ?? firstRow.count ?? firstRow["count(1)"] ?? Object.values(firstRow)[0];

  return parseInt(total, 10);
}

// Paging lấy toàn bộ data
async function fetchAllRows() {
  const totalRows = await getTotalRows();

  const sqlBatches = [];
  for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
    const sql = `SELECT * FROM ${TABLE} WHERE ${WHERE_CLAUSE} ORDER BY ${ORDER_COLUMN} LIMIT ${BATCH_SIZE} OFFSET ${offset};`;
    sqlBatches.push(sql);
  }

  const curlCommands = sqlBatches.map(buildCurl);

  let allRows = [];
  for (let i = 0; i < curlCommands.length; i += CONCURRENCY_CHUNK) {
    const chunk = curlCommands.slice(i, i + CONCURRENCY_CHUNK);
    const responses = await requestMultiCURL(chunk);
    const allData = parseResponseMulti(responses);

    for (const data of allData) {
      const rows = data?.Data ?? data?.Result ?? data;
      if (Array.isArray(rows)) {
        allRows = allRows.concat(rows);
      }
    }
  }

  return allRows;
}

// ====== CHẠY ======
return await fetchAllRows();
