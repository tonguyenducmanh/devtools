export default [
  {
    tooltipKey: "DemoRequestPromode",
    content: `let curlOne = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
\`;

let responseOne = await requestCURL(curlOne);
return responseOne.body;`,
  },
  {
    tooltipKey: "MultipleCurl",
    content: `let curlOne = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
\`;
let keyReplace = "##item_id##";
let curlTwo = \`
    curl 'http://localhost:3000/api/get_detail_item?item_id=$\{keyReplace}'\\
         --header 'Content-Type: application/json'
\`
let responseOne = await requestCURL(curlOne);
let finalResponeArr = [];
if(responseOne && responseOne.data && responseOne.data.length > 0){
    for(let i = 0; i < responseOne.data.length ; i ++){
      let item = responseOne.data[i]
      let tempCurl = curlTwo.replace(keyReplace, item)
      let tempRespone = await requestCURL(tempCurl);
      finalResponeArr.push({
          item_id: item,
          res: tempRespone
      })
    }
}
return finalResponeArr;`,
  },
  {
    tooltipKey: "RunBatchPromiseAll",
    content: `function makeCurlRequest(index) {
  let curl = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
\`;
  return curl;
}
async function concurrentRequests() {
  let curlTexts = [];
  for (let i = 0; i < 50; i++) {
    curlTexts.push(makeCurlRequest(i));
  }
  // Tat ca requests gui ve backend, chay dong thoi bang goroutines
  let results = await parallelRequests(curlTexts);
  return results.map(r => r.body);
}
return await concurrentRequests();`,
  },
  {
    tooltipKey: "APIBatchSequency",
    content: `
function makeCurlRequest(tenant_id_list_str) {
    let curl = \`
      curl -X POST \\
          http://localhost:3000/api/standardized_data_multiple\\
          -H 'Content-Type: application/json' \\
          -H 'cache-control: no-cache' \\
          -d '
              {
                  "tenant_id_list": [
                    \${tenant_id_list_str}
                  ]
              }
          '
      \`;
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
    let tenant_id_list_str = batchTenantIds.map(id => \`"\${id}"\`).join(',');
    const curlStr = makeCurlRequest(tenant_id_list_str);
    const result = await requestCURL(curlStr);
    allResults.push(result);
    if (i + batchSize < tenantIds.length) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  return allResults;
}
return await batchRequests();`,
  },
  {
    tooltipKey: "RetryAPIDelay",
    content: `async function requestWithRetry(curlStr, maxRetries = 3) {
  for(let i = 0; i < maxRetries; i++){
    try {
      let response = await requestCURL(curlStr);
      if(response && !response.error){
        return response;
      }
    } catch(error) {
      console.log(\`Attempt $\{i + 1} failed\`);
      if(i === maxRetries - 1) {
        return { error: "Max retries reached", details: error };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

let curl = \`
    curl 'http://localhost:3000/api/unstable_endpoint'\\
         --header 'Content-Type: application/json'
\`;

return await requestWithRetry(curl);`,
  },
  {
    tooltipKey: "AutoPagination",
    content: `async function fetchAllPages(baseUrl) {
  let allData = [];
  let page = 1;
  let limit = 20;
  let hasNext = true;

  while (hasNext) {
    let curl = \`curl '$\{baseUrl}?page=$\{page}&limit=$\{limit}'\`;
    let res = await requestCURL(curl);
    
    if (res && res.data && res.data.length > 0) {
      allData.push(...res.data);
      page++;
    } else {
      hasNext = false;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return allData;
}
return await fetchAllPages('http://localhost:3000/api/products');`,
  },
  {
    tooltipKey: "DynamicParallel",
    content: `// Dynamic Parallel: ket hop sequential + parallel theo logic runtime
let baseUrl = "http://localhost:3000";

// Buoc 1: Sequential - Lay danh sach users
let curlUsers = \`curl '\${baseUrl}/api/users?limit=10'\`;
let usersRes = await requestCURL(curlUsers);
let users = usersRes.body;

if (!users || !users.data) {
  return { error: "Khong lay duoc danh sach users" };
}

// Buoc 2: Dynamic construct - Tao curl texts cho tung user detail
let userCurls = users.data.map(u => \`curl '\${baseUrl}/api/users/\${u.id}'\`);

// Buoc 3: Parallel tren backend - Fetch tat ca user detail cung luc
let userDetails = await parallelRequests(userCurls);

// Buoc 4: Lay ket qua, roi dynamic construct tiep cho orders
let ordersCurls = [];
let validUsers = [];
for (let i = 0; i < userDetails.length; i++) {
  let detail = userDetails[i].body;
  if (detail && detail.data) {
    validUsers.push({ user: users.data[i], detail: detail.data });
    ordersCurls.push(\`curl '\${baseUrl}/api/users/\${users.data[i].id}/orders'\`);
  }
}

// Buoc 5: Parallel tiep - Fetch orders cua tat ca users
let ordersResults = await parallelRequests(ordersCurls);

// Buoc 6: Tong hop ket qua
return validUsers.map((u, idx) => ({
  user: u.user,
  detail: u.detail,
  orders: ordersResults[idx] ? ordersResults[idx].body : null,
}));`,
  },
];
