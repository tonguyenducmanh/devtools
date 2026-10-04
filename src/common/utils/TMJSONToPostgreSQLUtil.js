/**
 * Utility chung cho chuyển đổi JSON sang PostgreSQL scripts.
 * Dùng được ở cả component Vue và promode (không phụ thuộc Vue instance).
 */

const STRING_JOIN = ", ";
const STRING_JOIN_BREAKLINE = ";\n";
const NULL_VALUE = "null";

/**
 * Kiểm tra xem input có phải string không
 */
function checkIsText(input) {
  return typeof input === "string" || input instanceof String;
}

/**
 * Trả về text kèm ''
 */
function getStringText(text) {
  return `'${text}'`;
}

/**
 * Build CREATE TABLE script từ source JSON array
 * @param {Array} source - mảng JSON objects (dùng 3 sample đầu để detect type)
 * @param {Object} config - { tableName, primaryKeyField }
 * @returns {string}
 */
function buildCreateTableScript(source, config) {
  let createTableScript = "";
  if (source && Array.isArray(source) && config?.tableName) {
    let samples = source.slice(0, 3);
    let columns = Object.keys(samples[0]).map((key) => {
      let isPrimaryKey = key === config.primaryKeyField;
      let values = samples
        .map((record) => record[key])
        .filter((v) => v !== null);

      let dataType = "text";
      if (values.every((v) => typeof v === "number")) {
        dataType = values.every((v) => Number.isInteger(v))
          ? "integer"
          : "text";
      } else if (values.every((v) => typeof v === "boolean")) {
        dataType = "boolean";
      } else if (
        values.every(
          (v) =>
            typeof v === "string" &&
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
              v,
            ),
        )
      ) {
        dataType = "uuid";
      } else if (
        values.every(
          (v) =>
            typeof v === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(v),
        )
      ) {
        dataType = "timestamp";
      }
      return `${key} ${dataType}${isPrimaryKey ? " not null" : " null"}`;
    });

    const primaryKeyConstraint = config.primaryKeyField
      ? `, primary key ("${config.primaryKeyField}")`
      : "";

    createTableScript = `create table if not exists ${
      config.tableName
    } (\n  ${columns.join(",\n  ")}${primaryKeyConstraint}\n)`;
  }
  return createTableScript;
}

/**
 * Build INSERT scripts cho toàn bộ source
 * @param {Array} source - mảng JSON objects
 * @param {Object} config - { tableName, schemaName }
 * @returns {string[]}
 */
function buildInsertAllScript(source, config) {
  let insertScripts = [];
  if (source && Array.isArray(source) && config?.tableName) {
    source.forEach((item) => {
      let allKeyFields = Object.keys(item);
      if (allKeyFields?.length > 0) {
        let insertFieldText = allKeyFields.join(STRING_JOIN);
        let insertValues = [];
        allKeyFields.forEach((key) => {
          if (key && item.hasOwnProperty(key)) {
            let valueInsert = item[key];
            if (valueInsert == null) {
              insertValues.push(NULL_VALUE);
            } else if (checkIsText(valueInsert)) {
              insertValues.push(getStringText(valueInsert));
            } else {
              insertValues.push(valueInsert);
            }
          }
        });
        let insertValuesText = insertValues.join(STRING_JOIN);
        let schemaPrefix = config.schemaName ? `${config.schemaName}.` : "";
        let insertScript = `insert into ${schemaPrefix}${config.tableName} (${insertFieldText}) values (${insertValuesText})`;
        insertScripts.push(insertScript);
      }
    });
  }
  return insertScripts;
}

/**
 * Build DELETE script xóa dữ liệu cũ theo primary key
 * @param {Array} source - mảng JSON objects
 * @param {Object} config - { tableName, schemaName, primaryKeyField }
 * @returns {string}
 */
function buildDeleteAllScript(source, config) {
  let deleteScript = "";
  if (
    source &&
    Array.isArray(source) &&
    config &&
    config.primaryKeyField &&
    config.tableName
  ) {
    let allPrimaryValue = source.map((x) => x[config.primaryKeyField]);
    if (allPrimaryValue?.length > 0) {
      let tempPrimaryValue = allPrimaryValue[0];
      let arrayPrimaryDelete = "";
      if (checkIsText(tempPrimaryValue)) {
        arrayPrimaryDelete = allPrimaryValue
          .map((x) => getStringText(x))
          .join(STRING_JOIN);
      } else {
        arrayPrimaryDelete = allPrimaryValue.join(STRING_JOIN);
      }
      let schemaPrefix = config.schemaName ? `${config.schemaName}.` : "";
      deleteScript = `delete from ${schemaPrefix}${config.tableName} where ${config.primaryKeyField} in (${arrayPrimaryDelete})`;
    }
  }
  return deleteScript;
}

/**
 * Hàm chính: chuyển JSON sang PostgreSQL script hoàn chỉnh
 * @param {Array|Object} source - JSON input (object hoặc array)
 * @param {Object} config - { tableName, schemaName, primaryKeyField, enableCreateTable, enableDeleteScript }
 * @returns {string} - PostgreSQL script
 */
function jsonToPostgreSQL(source, config) {
  let script = "";
  let input = [];
  if (!Array.isArray(source)) {
    input = [source];
  } else {
    input = source;
  }

  if (input && Array.isArray(input)) {
    let createTableScript = config.enableCreateTable
      ? buildCreateTableScript(input, config)
      : "";
    let deleteScript = config.enableDeleteScript
      ? buildDeleteAllScript(input, config)
      : null;
    let insertScripts = buildInsertAllScript(input, config);
    if (insertScripts && Array.isArray(insertScripts)) {
      let arrayScript = [];
      if (createTableScript) {
        arrayScript.push(createTableScript);
      }
      if (deleteScript) {
        arrayScript.push(deleteScript);
      }
      arrayScript = [...arrayScript, ...insertScripts];
      script = arrayScript.join(STRING_JOIN_BREAKLINE);
      if (script) {
        script += STRING_JOIN_BREAKLINE;
      }
    }
  }
  return script;
}

export {
  jsonToPostgreSQL,
  buildCreateTableScript,
  buildInsertAllScript,
  buildDeleteAllScript,
  checkIsText,
  getStringText,
};
