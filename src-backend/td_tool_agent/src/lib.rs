use serde_json;
use std::collections::HashMap;
use td_tool_model::{UIAPIRequest, UIAPIResponse};

fn parse_headers(text: &str) -> HashMap<String, String> {
    let mut headers = HashMap::new();

    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        // splitN tương đương SplitN(..., 2) trong Go
        let mut parts = line.splitn(2, ':');

        let key = match parts.next() {
            Some(k) => k.trim(),
            None => continue,
        };

        let value = match parts.next() {
            Some(v) => v.trim(),
            None => continue,
        };

        headers.insert(key.to_string(), value.to_string());
    }

    headers
}

/**
Thực hiện gọi nối API
*/
pub async fn execute_request(body: UIAPIRequest) -> Result<UIAPIResponse, String> {
    let url = body.api_url;
    let method = body.http_method;
    let headers_raw = body.headers_text;
    let body = body.body_text;
    let headers = parse_headers(&headers_raw);
    // Tạo HTTP client
    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true) // Cho phép self-signed certificates
        .build()
        .map_err(|e| format!("Failed to create client: {}", e))?;

    // Build request
    let mut request_builder = match method.to_lowercase().as_str() {
        "get" => client.get(&url),
        "post" => client.post(&url),
        "put" => client.put(&url),
        "delete" => client.delete(&url),
        "patch" => client.patch(&url),
        "head" => client.head(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };

    // Thêm headers
    for (key, value) in headers {
        request_builder = request_builder.header(&key, &value);
    }

    // Thêm body
    if let Some(body_text) = body {
        request_builder = request_builder.body(body_text);
    }

    // Build request
    let request = request_builder
        .build()
        .map_err(|e| format!("Failed to build request: {}", e))?;

    // Execute với cancel support
    let response_future = client.execute(request);

    tokio::select! {
        result = response_future => {
            match result {
                Ok(response) => {
                    let status = response.status().as_u16();

                    // Parse response headers
                    let mut response_headers = HashMap::new();
                    for (key, value) in response.headers() {
                        if let Ok(value_str) = value.to_str() {
                            response_headers.insert(
                                key.to_string(),
                                value_str.to_string()
                            );
                        }
                    }

                    // Get response body
                    let body = response.text().await
                        .map_err(|e| format!("Failed to read response body: {}", e))?;

                    Ok(UIAPIResponse {
                        status,
                        headers: serde_json::to_string(&response_headers).expect("False to parse header"),
                        body,
                    })
                }
                Err(e) => Err(format!("Request failed: {}", e)),
            }
        }
    }
}
