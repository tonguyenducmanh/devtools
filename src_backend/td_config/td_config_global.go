package td_config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

var (
	// cấu hình config global static
	configGlobal *TDCenterConfig
	oneLock      sync.Once
)

// lấy ra cấu hình config
func GetConfigGlobal() *TDCenterConfig {
	oneLock.Do(func() {
		currentConfig := DefaultConfig()
		path, err := findConfigUpwards()

		if err != nil {
			// Trường hợp KHÔNG tìm thấy file: Tiến hành khởi tạo file mặc định
			// Lấy đường dẫn file thực thi để đặt file config ngay bên cạnh
			exePath, _ := os.Executable()
			defaultPath := filepath.Join(filepath.Dir(exePath), "config.json")

			// Ghi file mặc định
			data, _ := json.MarshalIndent(currentConfig, "", "  ")
			_ = os.WriteFile(defaultPath, data, 0644)

			configGlobal = &currentConfig
			return
		}

		// Trường hợp tìm thấy file: Đọc và Unmarshal như bình thường
		data, err := os.ReadFile(path)
		if err == nil {
			_ = json.Unmarshal(data, &currentConfig)
		}

		configGlobal = &currentConfig
	})

	return configGlobal
}

func findConfigUpwards() (string, error) {
	// Lưu ý: os.Executable() trả về đường dẫn đầy đủ của file thực thi
	// Chúng ta cần lấy thư mục chứa nó bằng filepath.Dir
	exePath, err := os.Executable()
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(exePath)

	for {
		// Kiểm tra trong thư mục /config/config.json
		candidate1 := filepath.Join(dir, "config", "config.json")
		if _, err := os.Stat(candidate1); err == nil {
			return candidate1, nil
		}

		// Kiểm tra file config.json ngay tại thư mục hiện hành
		candidate2 := filepath.Join(dir, "config.json")
		if _, err := os.Stat(candidate2); err == nil {
			return candidate2, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", os.ErrNotExist
}
