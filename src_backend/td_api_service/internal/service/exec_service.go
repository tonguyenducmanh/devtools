package service

import (
	"bytes"
	"context"
	"crypto/tls"
	"io"
	"net/http"
	"strings"

	"td_api_service/internal/util"
	"td_api_service/model"
)

func Execute(ctx context.Context, req model.UIRequest) (*model.APIResponse, error) {
	var body io.Reader
	if strings.TrimSpace(req.BodyText) != "" {
		body = bytes.NewBufferString(req.BodyText)
	}

	httpReq, err := http.NewRequestWithContext(
		ctx,
		strings.ToUpper(req.HttpMethod),
		req.ApiURL,
		body,
	)
	if err != nil {
		return nil, err
	}

	for k, v := range util.ParseHeaders(req.HeadersText) {
		httpReq.Header.Set(k, v)
	}

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		},
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		select {
		case <-ctx.Done():
			return &model.APIResponse{
				Status:     499,
				StatusText: "CANCELLED",
				Body:       "Request cancelled by user",
			}, nil
		default:
			return nil, err
		}
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	return &model.APIResponse{
		Status:     resp.StatusCode,
		StatusText: resp.Status,
		Headers:    resp.Header,
		Body:       string(respBody),
	}, nil
}
