// test việc đọc dữ liệu từ nhiều file json, sau đó build ra file result json từ cùng cấp thư mục
import fs from "fs";
import path from "path";

try {
  // đọc file
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  let data1Raw = fs.readFileSync(path.join(__dirname, "data1.json"), "utf8");
  let data2Raw = fs.readFileSync(path.join(__dirname, "data2.json"), "utf8");
  let list1 = JSON.parse(data1Raw);
  let list2 = JSON.parse(data2Raw);

  // test việc tạo result
  let combinedList = list1.map((item1) => {
    let item2 = list2.find((item2) => item2.id === item1.id);
    return {
      id: item1.id,
      name: item1.name,
      role: item2 ? item2.role : "N/A",
    };
  });

  // lưu vào file result
  let resultPath = path.join(__dirname, "result.json");
  fs.writeFileSync(resultPath, JSON.stringify(combinedList, null, 2), "utf8");
} catch (error) {
  console.error("Đã xảy ra lỗi:", error.message);
}
