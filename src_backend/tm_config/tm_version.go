package tm_config

// Version của backend (agent server).
//
// Mỗi lần build, version này được gắn vào binary từ version của package.json
// (xem scripts/tm_version.sh và scripts/build_daemon.sh), giống cách version
// được nạp cho UI qua import.meta.env.PACKAGE_VERSION. API health check trả về
// version này để UI đối chiếu với version của UI.
//
// Dùng var (không phải const) để có thể override khi build:
//   go build -ldflags "-X tm_config.Version=1.2.3"
var Version = "1.0.0"
