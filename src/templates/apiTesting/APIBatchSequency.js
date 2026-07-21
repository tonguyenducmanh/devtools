// Batch Sequential: Chia nhỏ thành các batch, mỗi batch chạy parallel trên backend
function makeCurlRequest(tenant_id_list_str) {
    let curl = `
      curl -X POST \\
          http://localhost:3000/api/standardized_data_multiple\\
          -H 'Content-Type: application/json' \\
          -H 'cache-control: no-cache' \\
          -d '
              {
                  "tenant_id_list": [
                    ${tenant_id_list_str}
                  ]
              }
          '
      `;
    return curl;
}

async function batchRequests() {
  let allResults = [];
  let tenantIds = [
    "4763ca99-956c-474f-b2fb-a6fea76e9333","18643e98-39e7-4a74-a478-88f38709cc49","7bb9f351-ab46-4c21-98a0-46b45624e9c5"
  ];
  let batchSize = 2;

  for (let i = 0; i < tenantIds.length; i += batchSize) {
    let batchTenantIds = tenantIds.slice(i, i + batchSize);
    // Dynamic construct curl texts cho batch này
    let curlTexts = batchTenantIds.map(id => makeCurlRequest(`"${id}"`));

    // Parallel trên backend trong cùng 1 batch
    let batchResults = await requestMultiCURL(curlTexts);
    allResults.push(...batchResults.map(r => parseResponse(r)));

    // Delay giữa các batch (nếu cần throttle)
    if (i + batchSize < tenantIds.length) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  return allResults;
}
return await batchRequests();
