function makeCurlRequest(index) {
  let curl = `
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
`;
  return curl;
}
async function concurrentRequests() {
  let promises = [];
  for (let i = 0; i < 50; i++) {
    const curlStr = makeCurlRequest(i);
    promises.push(requestCURL(curlStr));
  }
  let results = await Promise.all(promises);
  return results.map(r => parseResponseCURL(r));
}
return await concurrentRequests();
