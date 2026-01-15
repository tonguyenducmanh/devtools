use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UIAPIRequest {
    // Tên của API
    pub api_url: String,
    // Method của API
    pub http_method: String,
    // dánh sách các header của api, nối với nhau bởi \n
    pub headers_text: String,
    // nội dung body gọi api
    pub body_text: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UIAPIResponse {
    // loại status response
    pub status: u16,
    // header response
    pub headers: String,
    // body response
    pub body: String,
}
