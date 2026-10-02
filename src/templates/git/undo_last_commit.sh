# Undo commit gần nhất
# Các lệnh dưới đây là CÁC LỰA CHỌN THAY THẾ NHAU, chỉ chạy 1 lệnh duy nhất.
# Chạy cả 4 lệnh reset liên tiếp sẽ mất nhiều commit hơn dự định.

# Bước 1: xem tình trạng trước khi làm (chạy để kiểm tra)
git log --oneline -5

# Tuỳ chọn A: bỏ stage nhưng giữ code trong file
git restore --staged .

# Tuỳ chọn B: bỏ stage + bỏ thay đổi, code trở về đúng commit
git reset --mixed HEAD~1

# Tuỳ chọn C: bỏ stage + xóa luôn code trong file
git reset --hard HEAD~1

# Tuỳ chọn D: giữ code trong staging area để sửa rồi commit lại
git reset --soft HEAD~1
