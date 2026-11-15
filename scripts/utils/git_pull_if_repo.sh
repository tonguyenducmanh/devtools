#!/bin/sh
# Cập nhật source trước khi build wasm: đi vào từng repo và chạy `git pull origin`
# NẾU thư mục đó thực sự là một git repo (có .git nằm ngay trong thư mục), rồi mới build.
#
# Quy tắc:
# - Luôn đứng trên NHÁNH MẶC ĐỊNH của origin (origin/HEAD). Nếu repo đang ở
#   detached HEAD (do trước đây bị checkout theo commit pin) thì tự fetch origin,
#   xác định nhánh mặc định rồi checkout sang nhánh đó TRƯỚC khi pull.
# - Chỉ pull khi bản thân thư mục là repo riêng (có .git), tránh nhầm với repo cha
#   đang chứa project (src_wasm/... cũng nằm trong git của devtools).
# - Pull/checkout thất bại KHÔNG làm dừng build, chỉ cảnh báo rồi tiếp tục.
#
# Cách dùng:
#   . "$(dirname "$0")/../../scripts/git_pull_if_repo.sh"
#   tm_git_pull_if_repo "$EXTERNAL_DIR"

tm_git_pull_if_repo() {
    tm_dir="$1"
    if [ -z "$tm_dir" ] || [ ! -d "$tm_dir" ]; then
        return 0
    fi

    if [ ! -e "$tm_dir/.git" ]; then
        echo "Bỏ qua (không phải git repo riêng): $tm_dir"
        return 0
    fi

    echo "Đang cập nhật source trong: $tm_dir"

    # Nhánh hiện tại (rỗng nếu đang detached HEAD)
    tm_branch="$(git -C "$tm_dir" symbolic-ref --short HEAD 2>/dev/null || true)"

    # Đang detached HEAD -> quay về nhánh mặc định của origin
    if [ -z "$tm_branch" ]; then
        echo "Đang ở detached HEAD, chuyển về nhánh mặc định của origin..."
        git -C "$tm_dir" fetch origin --quiet 2>/dev/null || true
        tm_branch="$(git -C "$tm_dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
        if [ -z "$tm_branch" ] || [ "$tm_branch" = "HEAD" ]; then
            git -C "$tm_dir" remote set-head origin -a >/dev/null 2>&1 || true
            tm_branch="$(git -C "$tm_dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#^origin/##')"
        fi
        if [ -z "$tm_branch" ] || [ "$tm_branch" = "HEAD" ]; then
            echo "Cảnh báo: không xác định được nhánh mặc định trong $tm_dir (bỏ qua pull)." >&2
            return 0
        fi
        if ! git -C "$tm_dir" checkout "$tm_branch" 2>/dev/null; then
            echo "Cảnh báo: không checkout được nhánh '$tm_branch' trong $tm_dir (bỏ qua pull)." >&2
            return 0
        fi
        echo "Đã chuyển sang nhánh mặc định: $tm_branch"
    fi

    # Pull nhánh đang đứng
    if git -C "$tm_dir" pull origin "$tm_branch"; then
        echo "Đã cập nhật: $tm_dir (nhánh $tm_branch)"
    else
        echo "Cảnh báo: 'git pull origin $tm_branch' thất bại trong $tm_dir (bỏ qua, tiếp tục build)." >&2
    fi

    return 0
}