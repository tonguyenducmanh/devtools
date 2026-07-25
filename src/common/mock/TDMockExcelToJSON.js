export const TDMockExcelToJSON = {
  sheetNames: ["Nhân viên", "Phòng ban"],
  selectedSheet: "Nhân viên",
  outputJSON: `{
  "Nhân viên": [
    {
      "Mã NV": "NV001",
      "Họ tên": "Nguyễn Văn A",
      "Phòng ban": "Kỹ thuật",
      "Chức vụ": "Nhân viên",
      "Lương": "15000000"
    },
    {
      "Mã NV": "NV002",
      "Họ tên": "Trần Thị B",
      "Phòng ban": "Kinh doanh",
      "Chức vụ": "Quản lý",
      "Lương": "25000000"
    },
    {
      "Mã NV": "NV003",
      "Họ tên": "Lê Văn C",
      "Phòng ban": "Kỹ thuật",
      "Chức vụ": "Nhân viên",
      "Lương": "18000000"
    }
  ],
  "Phòng ban": [
    {
      "Mã PB": "PB001",
      "Tên phòng": "Kỹ thuật",
      "Trưởng phòng": "Lê Văn C",
      "Số nhân viên": "15"
    },
    {
      "Mã PB": "PB002",
      "Tên phòng": "Kinh doanh",
      "Trưởng phòng": "Trần Thị B",
      "Số nhân viên": "20"
    }
  ]
}`,
};
