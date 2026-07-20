// 50 requests chạy đồng thời trên Go backend (goroutines)
function makeCurlRequest(index) {
  let curl = `
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
`;
  return curl;
}

async function concurrentRequests() {
  let curlTexts = [];
  for (let i = 0; i < 50; i++) {
    curlTexts.push(makeCurlRequest(i));
  }
  // Tất cả requests được gửi về backend, chạy đồng thời bằng goroutines
  let results = await parallelRequests(curlTexts);
  return results.map(r => parseResponseCURL(r));
}
return await concurrentRequests();
