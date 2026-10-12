# Giảm dung lượng repo bằng cách gỡ file rác khỏi TOÀN BỘ lịch sử git
#
# ⚠️ CẢNH BÁO: đây là thao tác KHÔNG THỂ HOÀN TÁC.
#    - Mọi commit sẽ đổi SHA (kể cả commit của người khác).
#    - Bắt buộc force-push lên remote.
#    - Xoá tag có thể KÉO THEO mất GitHub Release + binary đính kèm.
#    - Chỉ làm khi chắc chắn KHÔNG có ai đang pull nhánh đó.
#
# Nguyên tắc: chỉ gỡ thứ KHÔNG CÒN trong code hiện tại (binary build,
# artifact, thư mục đã đổi tên). Xem danh sách trước ở Bước 1.

# Bước 1: xem tình trạng trước khi làm (chạy để kiểm tra)
git count-objects -vH
du -sh .git

# Liệt kê blob > 1 MB đang tồn tại trong lịch sử (tìm binary bị commit nhầm)
git rev-list --objects --all \
  | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' \
  | awk '$1=="blob" && $2>1000000 {printf "%7.1f MB  %s\n", $2/1048576, $3}' \
  | sort -rn

# Xoá file đang được .gitignore khỏi index mà KHÔNG xoá file trên đĩa
# (-r đệ quy, --cached chỉ gỡ khỏi index, -q im lặng)
git rm -r --cached src_wasm/pkg -q

# Bước 2: cài git-filter-repo (chỉ 1 lần)
pip install --user git-filter-repo

# Bước 3: gỡ file/thư mục khỏi TOÀN BỘ lịch sử
#   --invert-paths = giữ lại mọi thứ TRỪ path nêu
#   --force = bỏ qua yêu cầu clone sạch
# Thay đường dẫn bên dưới bằng thứ THỰC SỰ cần gỡ.
git filter-repo \
  --path src_wasm/pkg \
  --path public/_framework \
  --path src_backend/td_app \
  --path src/extension \
  --path legacy \
  --invert-paths \
  --force

# Nhiều path hơn thì cứ thêm --path <đường-dẫn> liên tiếp
git filter-repo --path dist --path out --invert-paths --force

# Chỉ muốn gỡ 1 file trong 1 commit cụ thể (giữ nguyên phần còn lại):
git filter-repo --path-file ../ten_file.txt --invert-paths --force

# Bước 4: filter-repo XOÁ luôn remote "origin" — phải khai báo lại
git remote add origin https://github.com/<owner>/<repo>.git

# Bước 5: kiểm tra trước khi push
git log --oneline -3
git status
git count-objects -vH
du -sh .git

# Xác nhận không còn file cần gỡ (kết quả phải bằng 0)
git rev-list --objects --all | grep -c "src_wasm/pkg"

# Quét magic bytes \0asm để tìm binary WebAssembly còn sót
git rev-list --objects --all \
  | git cat-file --batch-check='%(objectname) %(objecttype) %(objectsize) %(rest)' \
  | awk '$2=="blob" && $3>20000 {print $1, $4}' \
  | while read -r sha path; do
      magic=$(git cat-file blob "$sha" | head -c 4 | od -An -tx1 | tr -d ' \n')
      [ "$magic" = "0061736d" ] && echo "WASM CÒN: $path"
    done

# Bước 6: đẩy lịch sử mới lên remote

# ⚠️ GHI ĐÈ có kiểm tra — an toàn hơn, hủy nếu có người khác vừa push
git push origin main --force-with-lease

# Cách mạnh tay: luôn ghi đè, không kiểm tra gì cả
git push origin main --force

# Xoá tag cũ — CẢNH BÁO: GitHub sẽ XOÁ LUÔN Release đính kèm tag đó
# Kiểm tra release nào đang tồn tại trước:
curl -sS https://api.github.com/repos/<owner>/<repo>/releases | grep tag_name
git push origin --delete v1.0.0 v1.0.1

# Bước 7: dọn rác local cho gọn (an toàn, không ảnh hưởng lịch sử đã push)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
du -sh .git