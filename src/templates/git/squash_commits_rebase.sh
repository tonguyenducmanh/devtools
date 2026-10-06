# Gộp nhiều commit thành 1 commit bằng interactive rebase
# Các lệnh bên dưới là CÁC LỰA CHỌN THAY THẾ NHAU, chỉ chạy 1 nhóm duy nhất.
# Chạy cả rebase lẫn reset sẽ hỏng repo.
# git push --force sẽ GHI ĐÈ lịch sử commit trên remote.
# Chỉ dùng khi chắc chắn KHÔNG có ai khác đang pull nhánh đó.

# Bước 1: xem tình trạng trước khi làm (chạy để kiểm tra)
git branch --show-current
git log --oneline -20

# Bước 2: gộp N commit gần nhất vào 1
# Thay 5 bằng số commit muốn gộp (gộp 3 commit gần nhất => HEAD~3)
git rebase -i HEAD~5

# Trong editor mở ra, sửa danh sách ở dòng lệnh đầu tiên của mỗi commit:
#   pick abc1234 commit 1
#   pick def5678 commit 2
#   pick ghi9012 commit 3
#
# Đổi TỪ KHÓA của các commit muốn gộp vào commit ngay trên nó:
#   squash  = gộp code VÀO commit trên, có gộp cả message (mở editor viết lại message)
#   fixup    = gộp code vào commit trên, BỎ message của commit sau
#   drop    = xóa hẳn commit này (kèm code của nó)
#   reword  = đổi message của commit đó
#   edit    = dừng lại ở commit đó để sửa code thủ công
#
# Ví dụ gộp 3 commit gần nhất thành 1:
#   pick abc1234 commit 1
#   squash def5678 commit 2
#   fixup ghi9012 commit 3
#
# Lưu file rồi thoát editor (:wq với vim, hoặc Ctrl+S rồi thoát nano).
# Với squash: xoá dòng message cũ, viết 1 message duy nhất, lưu và thoát.

# Bước 3: đẩy lịch sử mới lên remote (chạy 1 trong 2 lệnh dưới đây)

# Cách an toàn: chỉ ghi đè nếu chưa có ai push thêm lên nhánh này
git push origin main --force-with-lease

# Cách mạnh tay: luôn ghi đè, không kiểm tra gì cả
git push origin main --force

# Khi rebase bị lỗi conflict, chọn 1 trong 2 lệnh dưới đây
git rebase --continue     # đã sửa file + git add rồi thì chạy lệnh này
git rebase --abort        # muốn huỷ, quay lại trạng thái trước khi rebase

# Gộp CHÍNH XÁC một khoảng commit bất kỳ (vd: gộp 10 commit gần nhất)
git rebase -i HEAD~10

# Gộp từ 1 commit cụ thể trở đi tới HEAD
git rebase -i 32729e3b