# Rollback về 1 commit cụ thể
# Các lệnh dưới đây là CÁC LỰA CHỌN THAY THẾ NHAU, chỉ chạy 1 nhóm duy nhất.
# Chạy hết sẽ hỏng repo.

# Bước 1: xem tình trạng trước khi làm (chạy để kiểm tra)
git branch --show-current
git log --oneline -20

# Tuỳ chọn A: xóa hẳn toàn bộ commit sau 32729e3b (chạy 2 lệnh này)
git reset --hard 32729e3b43a417c17c6bd05807398c0c01491f84
git push origin main --force-with-lease

# Tuỳ chọn B: rollback 1 commit gần nhất, không cần ghi hash (chạy 1 lệnh này)
git reset --hard HEAD~1
# nếu đã push lên GitHub thì thêm: git push origin main --force-with-lease

# Tuỳ chọn C: giữ nguyên lịch sử cũ, dùng khi làm việc chung (chạy 2 lệnh này)
git revert --no-commit 32729e3b43a417c17c6bd05807398c0c01491f84..HEAD
git push origin main
