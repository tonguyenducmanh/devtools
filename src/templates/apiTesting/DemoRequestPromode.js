let curlOne = `
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
`;

let responseOne = await requestCURL(curlOne);
return parseResponse(responseOne);
