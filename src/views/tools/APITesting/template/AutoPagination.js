async function fetchAllPages(baseUrl) {
  let allData = [];
  let page = 1;
  let limit = 20;
  let hasNext = true;

  while (hasNext) {
    let curl = `curl '${baseUrl}?page=${page}&limit=${limit}'`;
    let res = await requestCURL(curl);
    let body = parseResponseCURL(res);

    if (body && body.data && body.data.length > 0) {
      allData.push(...body.data);
      page++;
    } else {
      hasNext = false;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  return allData;
}
return await fetchAllPages('http://localhost:3000/api/products');
