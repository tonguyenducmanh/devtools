// Bước 1: Lấy danh sách items (sequential)
let curlOne = `
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
`;

let responseOne = await requestCURL(curlOne);
let bodyOne = parseResponse(responseOne);

// Bước 2: Dynamic construct curl texts từ kết quả bước 1
let keyReplace = "##item_id##";
let curlTemplate = `
    curl 'http://localhost:3000/api/get_detail_item?item_id=${keyReplace}'\\
         --header 'Content-Type: application/json'
`;

let curlTexts = [];
let itemIds = [];
if (bodyOne && bodyOne.data && bodyOne.data.length > 0) {
  for (let i = 0; i < bodyOne.data.length; i++) {
    let item = bodyOne.data[i];
    curlTexts.push(curlTemplate.replace(keyReplace, item));
    itemIds.push(item);
  }
}

// Bước 3: Fetch tất cả detail đồng thời trên backend
let detailResults = await requestMultiCURL(curlTexts);

// Bước 4: Map kết quả về dạng chuẩn
return itemIds.map((itemId, idx) => ({
  item_id: itemId,
  res: parseResponse(detailResults[idx]),
}));
