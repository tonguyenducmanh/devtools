chmod 777 ./scripts/build_web_for_daemon.sh
chmod 777 ./scripts/build_api.sh
chmod 777 ./scripts/build_daemon.sh
./scripts/build_web_for_daemon.sh
./scripts/build_api.sh
./scripts/build_daemon.sh

# Copy toàn bộ nội dung config vào output
ROOT_DIR=$(pwd)
OUTPUT_DIR="$ROOT_DIR/out"
CONIG_DIR="$ROOT_DIR/config"

cp -r "$CONIG_DIR"/. "$OUTPUT_DIR"/