let curlOne = `
    curl 'http://localhost:3000/api/get_list_item?limit=5'\\
         --header 'Content-Type: application/json'
`;
let keyReplace = "##item_id##";
let curlTwo = `
    curl 'http://localhost:3000/api/get_detail_item?item_id=${keyReplace}'\\
         --header 'Content-Type: application/json'
`
let responseOne = await requestCURL(curlOne);
let bodyOne = parseResponseCURL(responseOne);
let finalResponeArr = [];
if (bodyOne && bodyOne.data && bodyOne.data.length > 0) {
  for (let i = 0; i < bodyOne.data.length; i++) {
    let item = bodyOne.data[i];
    let tempCurl = curlTwo.replace(keyReplace, item);
    let tempRespone = await requestCURL(tempCurl);
    finalResponeArr.push({
      item_id: item,
      res: parseResponseCURL(tempRespone),
    });
  }
}
return finalResponeArr;
