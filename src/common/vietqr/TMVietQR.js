/**
 * Sinh chuỗi payload mã QR chuyển khoản VietQR chuẩn NAPAS247 / EMVCo
 * (QR_Format_T&C_v1.0_VN_092021).
 *
 * Logic port từ https://github.com/Ngochiendev/vietqr-core (MIT License,
 * `src/VietQR.Core/Emv/VietQr.cs`): hỗ trợ QR tĩnh/động, chuyển đến tài khoản
 * (QRIBFTTA) hoặc thẻ (QRIBFTTC), khử dấu tiếng Việt nội dung, validate BIN.
 * Danh mục ngân hàng lấy từ `banks.json` của cùng repo (76 ngân hàng).
 * Chuỗi tĩnh (không số tiền) khớp bộ test của
 * https://github.com/openhoangnc/vietqr (MIT License).
 */

export function crc16(str) {
  let crc = 0xffff;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  crc = crc & 0xffff;
  return crc.toString(16).padStart(4, "0").toUpperCase();
}

/**
 * Khử dấu tiếng Việt thành chữ không dấu chuẩn ngân hàng (NAPAS yêu cầu
 * nội dung không dấu), lọc ký tự điều khiển.
 */
export function removeVietnameseDiacritics(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[\x00-\x1f\x7f]/g, "")
}

const pad2zero = (num) => {
  if (num < 1 || num > 99) {
    throw new Error(
      `Độ dài trường TLV (${num}) vượt quá giới hạn 99 ký tự của chuẩn EMVCo/NAPAS`,
    );
  }
  return num.toString().padStart(2, "0");
};

/**
 * Sinh chuỗi payload EMVCo cho app banking quét.
 *
 * @param {Object} input
 * @param {string} input.bankId        Mã BIN ngân hàng (đúng 6 chữ số)
 * @param {string} input.accountId     Số tài khoản / số thẻ (1-25 ký tự)
 * @param {number|string} [input.amount] Số tiền VNĐ (>0, tối đa 13 chữ số).
 *   Có số tiền → QR động (Tag 01 = "12"), không → QR tĩnh ("11").
 * @param {string} [input.description] Nội dung chuyển khoản (tối đa 25 ký tự,
 *   tự khử dấu tiếng Việt)
 * @param {boolean} [input.isCard]     true = chuyển đến thẻ (QRIBFTTC),
 *   mặc định chuyển đến tài khoản (QRIBFTTA)
 * @returns {string} Chuỗi payload kèm CRC16
 */
export function makeVietQRContent(input) {
  let bankId = (input.bankId || "").trim();
  let accountId = (input.accountId || "").trim();

  if (!/^\d{6}$/.test(bankId)) {
    throw new Error("Mã ngân hàng (BIN) bắt buộc phải là đúng 6 chữ số");
  }
  if (!accountId || accountId.length > 25) {
    throw new Error(
      "Số tài khoản/thẻ không được rỗng và tối đa 25 ký tự theo chuẩn NAPAS",
    );
  }

  // Tag 38: thông tin định danh người thụ hưởng (mục 5.2.3.2)
  let sub00 = "00" + pad2zero(bankId.length) + bankId;
  let sub01 = "01" + pad2zero(accountId.length) + accountId;
  let beneficiaryOrg = "01" + pad2zero(sub00.length + sub01.length) + sub00 + sub01;
  let serviceCode = input.isCard ? "0208QRIBFTTC" : "0208QRIBFTTA";
  let tag38Value = "0010A000000727" + beneficiaryOrg + serviceCode;
  let consumerAccountInformation =
    "38" + pad2zero(tag38Value.length) + tag38Value;

  // Tag 01: "11" QR tĩnh, "12" QR động (có số tiền)
  let pointOfInitiationMethod = "010211";

  let transactionAmount = "";
  let amountStr = input.amount == null ? "" : String(input.amount).trim();
  if (amountStr) {
    if (!/^\d{1,13}$/.test(amountStr) || Number(amountStr) === 0) {
      throw new Error(
        "Số tiền chỉ nhập số, tối đa 13 chữ số và lớn hơn 0",
      );
    }
    transactionAmount = "54" + pad2zero(amountStr.length) + amountStr;
    pointOfInitiationMethod = "010212";
  }

  // Tag 62: dữ liệu bổ sung — sub 08 nội dung chuyển khoản
  let additionalDataFieldTemplate = "";
  let description = input.description ? input.description.trim() : "";
  if (description) {
    let clean = removeVietnameseDiacritics(description);
    if (clean.length > 25) clean = clean.slice(0, 25);
    if (clean) {
      let inner = "08" + pad2zero(clean.length) + clean;
      additionalDataFieldTemplate = "62" + pad2zero(inner.length) + inner;
    }
  }

  let content =
    "000201" +
    pointOfInitiationMethod +
    consumerAccountInformation +
    "5303704" +
    transactionAmount +
    "5802VN" +
    additionalDataFieldTemplate +
    "6304";

  return content + crc16(content);
}
