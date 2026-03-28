# Đường dẫn tuyệt đối hoặc tương đối tính từ thư mục chạy script
ROOT_DIR=$(pwd)
MODULE_DIR="$ROOT_DIR/src_wasm/iron_rdp"

# Di chuyển vào thư mục wasm
cd $MODULE_DIR
chmod 777 ./build.sh
./build.sh