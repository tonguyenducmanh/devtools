export default [
  {
    scriptName: "01 demo request promode",
    content: `let curlOne = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json
\`;

let responseOne = await requestCURL(curlOne);
return responseOne;`,
  },
  {
    scriptName: "02 multiple curl",
    content: `let curlOne = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json
\`;
let keyReplace = "##item_id##";
let curlTwo = \`
    curl 'http://localhost:3000/api/get_detail_item?item_id=$\{keyReplace}'\\
         --header 'Content-Type: application/json
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
    scriptName: "03 run batch promiss all",
    content: `function makeCurlRequest(index) {
  let curl = \`
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json
\`;
  return curl;
}
async function concurrentRequests() {
  let promises = [];
  for (let i = 0; i < 50; i++) {
    const curlStr = makeCurlRequest(i);
    promises.push(requestCURL(curlStr));
  }
  let results = await Promise.all(promises);
  return results;
}
return await concurrentRequests();`,
  },
  {
    scriptName: "04 retry time",
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
         --header 'Content-Type: application/json
\`;

return await requestWithRetry(curl);`,
  },
];
