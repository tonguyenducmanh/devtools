package service

import (
	"crypto/rand"
	"fmt"
)

/**
 * Tạo UUID v4
 */
func GenUUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return ""
	}

	// Thiết lập các bit cho phiên bản 4 (v4) theo RFC 4122
	// 1. Thiết lập 4 bit cao của byte thứ 7 thành 0100 (v4)
	b[6] = (b[6] & 0x0f) | 0x40
	// 2. Thiết lập 2 bit cao của byte thứ 9 thành 10 (variant 1)
	b[8] = (b[8] & 0x3f) | 0x80

	return fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
