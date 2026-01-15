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

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MockRouteRequest {
    // Đường dẫn match request (e.g., "GET /api/users")
    pub request_match: String,
    // HTTP method (GET, POST, PUT, DELETE, etc.)
    pub method: String,
    // Response body
    pub response: String,
    // Response status code (mặc định 200)
    #[serde(default = "default_status")]
    pub status: u16,
    // Response headers (nối với nhau bởi \n, định dạng "Key: Value")
    #[serde(default)]
    pub headers: String,
}

fn default_status() -> u16 {
    200
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AddMockServerRequest {
    // Tên server
    pub name: String,
    // Port của server
    pub port: u16,
    // Danh sách các routes
    pub routes: Vec<MockRouteRequest>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RemoveMockServerRequest {
    // Tên server cần xóa
    pub name: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MockServerInfoResponse {
    // Tên server
    pub name: String,
    // Port server
    pub port: u16,
    // Số lượng routes
    pub routes_count: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct ApiResponse<T> {
    // Trạng thái thành công
    pub success: bool,
    // Dữ liệu trả về
    pub data: Option<T>,
    // Lỗi (nếu có)
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }
    }
}

impl ApiResponse<String> {
    pub fn err(error: String) -> Self {
        ApiResponse {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}
