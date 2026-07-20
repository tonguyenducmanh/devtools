// Dynamic Parallel: Kết hợp sequential + parallel theo logic runtime
// Ví dụ: Lấy danh sách user -> parallel fetch chi tiết từng user -> parallel fetch orders của mỗi user

let baseUrl = "http://localhost:3000";

// Bước 1: Sequential - Lấy danh sách users
let curlUsers = `curl '${baseUrl}/api/users?limit=10'`;
let usersRes = await requestCURL(curlUsers);
let users = parseResponseCURL(usersRes);

if (!users || !users.data) {
  return { error: "Không lấy được danh sách users" };
}

// Bước 2: Dynamic construct - Tạo curl texts cho từng user detail
let userCurls = users.data.map(u => `curl '${baseUrl}/api/users/${u.id}'`);

// Bước 3: Parallel trên backend - Fetch tất cả user detail cùng lúc
let userDetails = await parallelRequests(userCurls);

// Bước 4: Lấy kết quả, rồi dynamic construct tiếp cho orders
let ordersCurls = [];
let validUsers = [];
for (let i = 0; i < userDetails.length; i++) {
  let detail = parseResponseCURL(userDetails[i]);
  if (detail && detail.data) {
    validUsers.push({ user: users.data[i], detail: detail.data });
    ordersCurls.push(`curl '${baseUrl}/api/users/${users.data[i].id}/orders'`);
  }
}

// Bước 5: Parallel tiếp - Fetch orders của tất cả users
let ordersResults = await parallelRequests(ordersCurls);

// Bước 6: Tổng hợp kết quả
return validUsers.map((u, idx) => ({
  user: u.user,
  detail: u.detail,
  orders: parseResponseCURL(ordersResults[idx]),
}));
