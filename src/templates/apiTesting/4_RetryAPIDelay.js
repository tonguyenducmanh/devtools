// ====== CẤU HÌNH ======
const CURL = `curl 'http://localhost:3000/api/data'`;
const MAX_RETRIES = 3;
const DELAY_MS = 1000;

// Gọi API có retry
async function fetchWithRetry(curlStr) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      let res = await requestCURL(curlStr);
      let data = parseResponse(res);
      if (data && !data.error) return data;
    } catch (e) {
      if (i < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS * (i + 1)));
      }
    }
  }
  return null;
}

return await fetchWithRetry(CURL);
