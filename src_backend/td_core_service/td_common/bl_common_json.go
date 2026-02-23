package td_common

import (
	"encoding/json"
	"reflect"
	"strings"
)

// NormalizeString loại bỏ khoảng trắng và chuyển về chữ thường
func normalizeString(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

// JSONprepareData chuẩn hóa map/slice đệ quy theo các quy tắc yêu cầu
func JSONprepareData(input any) any {
	switch v := input.(type) {
	case map[string]any:
		newMap := make(map[string]any)
		for key, value := range v {
			// Chuẩn hóa key: bỏ khoảng trắng, lowercase
			cleanKey := normalizeString(key)
			newMap[cleanKey] = JSONprepareData(value)
		}
		return newMap
	case []any:
		for i, val := range v {
			v[i] = JSONprepareData(val)
		}
		return v
	case string:
		// Chuẩn hóa value nếu là string
		return normalizeString(v)
	default:
		return v
	}
}

// JSONEquivalent là hàm chính để so sánh 2 chuỗi JSON
func JSONEquivalent(jsonStr1, jsonStr2 string) bool {
	var obj1, obj2 any

	// Step 1: Unmarshal
	if err := json.Unmarshal([]byte(jsonStr1), &obj1); err != nil {
		return false
	}
	if err := json.Unmarshal([]byte(jsonStr2), &obj2); err != nil {
		return false
	}

	// Step 2: Chuẩn hóa đệ quy (Key case, Trimming)
	cleanObj1 := JSONprepareData(obj1)
	cleanObj2 := JSONprepareData(obj2)

	// Step 3: So sánh sâu (Deep Equal)
	// reflect.DeepEqual trong Go không quan tâm thứ tự key trong map
	return reflect.DeepEqual(cleanObj1, cleanObj2)
}
