package util

import "strings"

func ParseHeaders(text string) map[string]string {
	headers := map[string]string{}

	lines := strings.Split(text, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		headers[strings.TrimSpace(parts[0])] =
			strings.TrimSpace(parts[1])
	}

	return headers
}
