// ====== CẤU HÌNH ======
const BASE_URL = "http://localhost:3000";

// Bước 1: Lấy danh sách users
let usersRes = await requestCURL(`curl '${BASE_URL}/api/users?limit=10'`);
let usersData = parseResponse(usersRes);
let users = usersData?.data ?? [];

// Bước 2: Parallel - Lấy chi tiết từng user cùng lúc
let detailCurls = users.map(u => `curl '${BASE_URL}/api/users/${u.id}'`);
let detailsRes = await requestMultiCURL(detailCurls);

// Bước 3: Parallel - Lấy orders của từng user cùng lúc
let orderCurls = users.map(u => `curl '${BASE_URL}/api/users/${u.id}/orders'`);
let ordersRes = await requestMultiCURL(orderCurls);

// Bước 4: Tổng hợp kết quả
let results = [];
for (let i = 0; i < users.length; i++) {
  results.push({
    user: users[i],
    detail: parseResponse(detailsRes[i]),
    orders: parseResponse(ordersRes[i]),
  });
}

return results;
