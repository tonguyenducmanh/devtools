async function requestWithRetry(curlStr, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      let response = await requestCURL(curlStr);
      let body = parseResponseCURL(response);
      if (body && !body.error) {
        return body;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed`);
      if (i === maxRetries - 1) {
        return { error: "Max retries reached", details: error };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

let curl = `
    curl 'http://localhost:3000/api/unstable_endpoint'\\
         --header 'Content-Type: application/json'
`;

return await requestWithRetry(curl);
