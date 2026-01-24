package config

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

/**
 * lấy ra cấu hình config
 */
func GetConfigGlobal() *TDCenterConfig {
	oneLock.Do(func() {
		path, _ := findConfigUpwards()

		data, _ := os.ReadFile(path)

		currentConfig := DefaultConfig()

		_ = json.Unmarshal(data, &currentConfig)

		configGlobal = &currentConfig
	})

	return configGlobal
}

/**
 * tìm ra file config đang nằm ở thư mục nào
 */
func findConfigUpwards() (string, error) {
	dir, err := os.Executable()
	if err != nil {
		return "", err
	}

	for {
		candidate := filepath.Join(dir, "config", "config.json")
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}
		candidate = filepath.Join(dir, "config.json")
		if _, err := os.Stat(candidate); err == nil {
			return candidate, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", os.ErrNotExist
}
