# Cherry-pick code của 1 commit sang nhánh khác
# Chỉ chạy 1 trong các lệnh cherry-pick dưới đây.
# Chạy cả 3 lệnh sẽ lấy trùng code của cùng 1 commit.

# Bước 1: xem tình trạng trước khi làm (chạy để kiểm tra)
git log --oneline -20

# Bước 2: chuyển sang nhánh đích (thay main bằng tên nhánh của bạn)
git switch feature/R90/tdmanh1_123321

# Tuỳ chọn A: lấy code của 1 commit, tự tạo commit mới
git cherry-pick 32729e3b

# Tuỳ chọn B: lấy code của 1 commit nhưng không tạo commit
git cherry-pick --no-commit 32729e3b

# Tuỳ chọn C: lấy code của cả một dải commit
git cherry-pick d1a6aca9..HEAD

# Khi bị conflict: chọn 1 trong 2 lệnh dưới đây
git cherry-pick --continue     # đã sửa file + git add rồi thì chạy lệnh này
git cherry-pick --abort        # muốn huỷ, quay lại trạng thái trước khi cherry-pick
