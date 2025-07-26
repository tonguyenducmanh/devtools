export const TDMockHTMLPreview = {
  inputHtml: `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo phân tích tài chính - Công ty cổ phần Hưng Yên JSC - Tập đoàn test_TDManh</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .section {
            scroll-margin-top: 80px;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin-bottom: 30px;
        }
        .floating-nav {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
        }
        @media (max-width: 768px) {
            .floating-nav {
                display: none;
            }
        }
        @media print {
            .floating-nav {
                display: none;
            }
        }
    </style>
</head>
<body class="bg-gray-50 font-sans">
    <!-- Header -->
    <header class="bg-blue-800 text-white py-6 shadow-md">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-2xl md:text-3xl font-bold">Báo cáo phân tích tài chính - Công ty cổ phần Hưng Yên JSC - Tập đoàn test_TDManh</h1>
                    <p class="text-blue-200 mt-1">Đơn vị: Tô Mạnh_G2</p>
                </div>
                <div class="text-right">
                    <p class="text-sm md:text-base bg-blue-700 px-3 py-1 rounded">Ngày tổng hợp: 24/07/2025</p>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
        <!-- Overview Section -->
        <section id="overview" class="section bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex items-center mb-6">
                <i class="fas fa-building text-blue-600 text-2xl mr-3"></i>
                <h2 class="text-xl md:text-2xl font-bold text-gray-800">PHẦN I: TỔNG QUAN VỀ DOANH NGHIỆP</h2>
            </div>

            <div class="grid md:grid-cols-3 gap-6 mb-6">
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 class="font-semibold text-blue-800 mb-2"><i class="fas fa-briefcase mr-2"></i>Lĩnh vực</h3>
                    <p class="text-gray-700">Dịch vụ chăm sóc sức khỏe, sắc đẹp</p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 class="font-semibold text-blue-800 mb-2"><i class="fas fa-calendar mr-2"></i>Kỳ báo cáo</h3>
                    <p class="text-gray-700">Năm 2025</p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 class="font-semibold text-blue-800 mb-2"><i class="fas fa-coins mr-2"></i>Đơn vị tiền tệ</h3>
                    <p class="text-gray-700">Việt Nam Đồng (VND)</p>
                </div>
            </div>

            <h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Thông tin công ty</h3>
            <ul class="list-disc pl-5 text-gray-700 space-y-1">
                <li>Tên công ty: Công ty cổ phần Hưng Yên JSC - Tập đoàn test_TDManh</li>
                <li>Mã số thuế: Chưa được cung cấp</li>
                <li>Địa chỉ: Chưa được cung cấp</li>
                <li>Vị trí thị trường: Chưa có thông tin</li>
            </ul>

            <h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Kiểm tra tính toàn vẹn dữ liệu</h3>
            <ul class="list-disc pl-5 text-gray-700 space-y-1">
                <li>Báo cáo chỉ chứa các cột "Kỳ này" và "Kỳ trước", cả hai đều có giá trị là 0</li>
                <li>Nhiều cột có giá trị "nan" hoặc "Unnamed", có thể do lỗi định dạng hoặc dữ liệu chưa nhập</li>
                <li>Không thể xác định rõ thời gian cụ thể của kỳ báo cáo (ví dụ: Quý nào trong năm 2025)</li>
                <li>Toàn bộ các mục đều có giá trị bằng 0, cho thấy báo cáo chưa được cập nhật dữ liệu hoặc đang ở dạng mẫu</li>
            </ul>
        </section>

        <!-- Financial Analysis Section -->
        <section id="financial" class="section bg-white rounded-lg shadow-md p-6 mb-8">
            <div class="flex items-center mb-6">
                <i class="fas fa-chart-line text-blue-600 text-2xl mr-3"></i>
                <h2 class="text-xl md:text-2xl font-bold text-gray-800">PHẦN II: PHÂN TÍCH TÀI CHÍNH</h2>
            </div>

            <h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Phân tích tài sản</h3>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 class="font-semibold text-green-800 mb-2">Tổng tài sản</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 class="font-semibold text-blue-800 mb-2">Tài sản ngắn hạn</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 class="font-semibold text-purple-800 mb-2">Tài sản dài hạn</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 class="font-semibold text-yellow-800 mb-2">Các khoản phải thu</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
            </div>

            <h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Phân tích nguồn vốn</h3>
            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 class="font-semibold text-red-800 mb-2">Tổng nguồn vốn</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <h4 class="font-semibold text-indigo-800 mb-2">Nợ phải trả</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-teal-50 p-4 rounded-lg border border-teal-200">
                    <h4 class="font-semibold text-teal-800 mb-2">Vốn chủ sở hữu</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
                <div class="bg-pink-50 p-4 rounded-lg border border-pink-200">
                    <h4 class="font-semibold text-pink-800 mb-2">Lợi nhuận chưa phân phối</h4>
                    <p class="text-gray-700">Kỳ này: <span class="font-bold">0 VND</span></p>
                    <p class="text-gray-700">Kỳ trước: <span class="font-bold">0 VND</span></p>
                </div>
            </div>

            <h3 class="text-lg font-semibold text-gray-800 mb-3 mt-6">Các chỉ số tài chính chính</h3>
            <div class="overflow-x-auto mb-6">
                <table class="min-w-full bg-white rounded-lg overflow-hidden">
                    <thead class="bg-blue-600 text-white">
                        <tr>
                            <th class="py-3 px-4 text-left">Chỉ số</th>
                            <th class="py-3 px-4 text-right">Kỳ này</th>
                            <th class="py-3 px-4 text-right">Kỳ trước</th>
                            <th class="py-3 px-4 text-right">Nhận xét</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 px-4">Tỷ số thanh khoản hiện hành</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right text-yellow-500">Không xác định</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 px-4">Tỷ số thanh khoản nhanh</td>
                            <td class="py-3 px-4 text-right">(0 + 0 + 0) / 0</td>
                            <td class="py-3 px-4 text-right">(0 + 0 + 0) / 0</td>
                            <td class="py-3 px-4 text-right text-yellow-500">Không xác định</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 px-4">Tỷ số Nợ / Tổng tài sản</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right text-yellow-500">Không xác định</td>
                        </tr>
                        <tr class="hover:bg-gray-50">
                            <td class="py-3 px-4">Tỷ số Nợ / VCSH</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right">0 / 0</td>
                            <td class="py-3 px-4 text-right text-yellow-500">Không xác định</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Lưu ý quan trọng</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>Báo cáo lưu chuyển tiền tệ và Báo cáo kết quả kinh doanh không có trong tài liệu được cung cấp, do đó không thể phân tích các chỉ số liên quan đến dòng tiền và lợi nhuận hoạt động.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Conclusion Section -->
        <section id="conclusion" class="section bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center mb-6">
                <i class="fas fa-clipboard-check text-blue-600 text-2xl mr-3"></i>
                <h2 class="text-xl md:text-2xl font-bold text-gray-800">PHẦN III: KẾT LUẬN VÀ GỢI Ý</h2>
            </div>

            <div class="grid md:grid-cols-2 gap-6 mb-6">
                <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 class="font-semibold text-red-800 mb-2">Điểm yếu</h3>
                    <ul class="list-disc pl-5 text-gray-700 space-y-1">
                        <li>Báo cáo tài chính hiện tại không chứa dữ liệu thực tế (toàn bộ chỉ tiêu bằng 0), khiến việc đánh giá tình hình tài chính và hoạt động kinh doanh của công ty không thể thực hiện được.</li>
                        <li>Cấu trúc tài sản và nguồn vốn chưa phản ánh hoạt động kinh doanh thực tế, có thể do công ty chưa đi vào vận hành hoặc báo cáo đang ở dạng mẫu chưa hoàn chỉnh.</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 class="font-semibold text-green-800 mb-2">Gợi ý</h3>
                    <ul class="list-disc pl-5 text-gray-700 space-y-1">
                        <li>Yêu cầu kiểm tra và cập nhật lại báo cáo tài chính với dữ liệu đầy đủ và chính xác từ các kỳ kế toán cụ thể để có thể thực hiện phân tích tài chính toàn diện.</li>
                        <li>Nếu công ty đang trong giai đoạn khởi nghiệp hoặc chưa hoạt động, cần xây dựng lộ trình tài chính rõ ràng và theo dõi sát các chỉ số tiền hoạt động kinh doanh.</li>
                    </ul>
                </div>
            </div>

            <div class="mt-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h3 class="text-lg font-semibold text-blue-800 mb-3">Kết luận</h3>
                <p class="text-gray-700 leading-relaxed">
                    Báo cáo Bảng cân đối kế toán của Công ty cổ phần Hưng Yên JSC – Tập đoàn test_TDManh cho thấy toàn bộ các chỉ tiêu tài sản và nguồn vốn đều bằng 0, điều này cho thấy báo cáo có thể đang ở dạng mẫu hoặc chưa được cập nhật dữ liệu thực tế. 
                    Do thiếu dữ liệu cụ thể, việc đánh giá tình hình tài chính và hoạt động kinh doanh của công ty không thể thực hiện được ở thời điểm hiện tại. 
                    Đề xuất: cần yêu cầu bản báo cáo đầy đủ và chính xác để phân tích toàn diện hơn.
                </p>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-6">
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row justify-between items-center">
                <div class="mb-4 md:mb-0">
                    <h3 class="text-lg font-bold">Báo cáo phân tích tài chính - Công ty cổ phần Hưng Yên JSC - Tập đoàn test_TDManh</h3>
                    <p class="text-gray-400">Đơn vị: Tô Mạnh_G2</p>
                </div>
                <div class="text-center md:text-right">
                    <p class="text-gray-400">Ngày tổng hợp: 24/07/2025</p>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>`,
};
