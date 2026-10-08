package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type BilingualWebRequest struct {
	URL string `json:"url"`
}

func FetchBilingualWeb(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req BilingualWebRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.URL == "" {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	targetURL, err := url.Parse(req.URL)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid URL",
		})
		return
	}

	client := &http.Client{Timeout: 30 * time.Second}
	htmlReq, _ := http.NewRequest("GET", req.URL, nil)
	htmlReq.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(htmlReq)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Failed to fetch URL",
		})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Failed to read HTML",
		})
		return
	}

	htmlStr := string(bodyBytes)

	// Inject <base> tag and worker patch after <head> or at the beginning
	baseTag := fmt.Sprintf(`<base href="%s://%s" />`, targetURL.Scheme, targetURL.Host)
	if targetURL.Path != "" {
		basePath := targetURL.Path
		if !strings.HasSuffix(basePath, "/") {
			lastSlash := strings.LastIndex(basePath, "/")
			if lastSlash >= 0 {
				basePath = basePath[:lastSlash+1]
			}
		}
		baseTag = fmt.Sprintf(`<base href="%s://%s%s" />`, targetURL.Scheme, targetURL.Host, basePath)
	}

	injection := baseTag

	headIdx := strings.Index(strings.ToLower(htmlStr), "<head>")
	if headIdx != -1 {
		insertPos := headIdx + 6
		htmlStr = htmlStr[:insertPos] + injection + htmlStr[insertPos:]
	} else {
		htmlStr = injection + htmlStr
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    htmlStr,
	})
}

type TranslateBatchRequest struct {
	Texts      []string `json:"texts"`
	TargetLang string   `json:"targetLang"`
}

func TranslateTextBatch(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req TranslateBatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.TargetLang == "" {
		req.TargetLang = "vi"
	}

	separator := " \n|||\n "
	joinedText := strings.Join(req.Texts, separator)

	translatedText := translateText(joinedText, req.TargetLang)
	translatedArr := strings.Split(translatedText, separator)

	for i := range translatedArr {
		translatedArr[i] = strings.TrimSpace(translatedArr[i])
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    translatedArr,
	})
}

func translateText(text string, targetLang string) string {
	encodedText := url.QueryEscape(text)
	apiURL := fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=%s&dt=t&q=%s", targetLang, encodedText)

	resp, err := http.Get(apiURL)
	if err != nil {
		return text
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return text
	}

	var result []interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return text
	}

	if len(result) > 0 {
		inner, ok := result[0].([]interface{})
		if !ok {
			return text
		}

		var fullTranslatedText string
		for _, item := range inner {
			arr, ok := item.([]interface{})
			if ok && len(arr) > 0 {
				str, ok := arr[0].(string)
				if ok {
					fullTranslatedText += str
				}
			}
		}
		if fullTranslatedText != "" {
			return fullTranslatedText
		}
	}

	return text
}
