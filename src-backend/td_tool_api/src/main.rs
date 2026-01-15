use axum::{
    Json, Router,
    extract::State,
    routing::{get, post, delete},
};
use std::{sync::Arc, env};
use td_tool_agent::{execute_request, mock_server::MockServerManager};
use td_tool_model::{
    UIAPIRequest, UIAPIResponse, AddMockServerRequest, RemoveMockServerRequest,
    MockServerInfoResponse, ApiResponse,
};
use tower_http::cors::{Any, CorsLayer};

struct AppState {
    mock_server_manager: Arc<MockServerManager>,
}

fn get_port_from_args() -> u16 {
    let args: Vec<String> = env::args().collect();

    args.iter()
        .position(|arg| arg == "--port")
        .and_then(|i| args.get(i + 1))
        .and_then(|p| p.parse::<u16>().ok())
        .unwrap_or(7777) // port mặc định
}

#[tokio::main]
async fn main() {
    let port = get_port_from_args();
    let addr = format!("0.0.0.0:{}", port);

    let shared_state = Arc::new(AppState {
        mock_server_manager: Arc::new(MockServerManager::new()),
    });

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/exec", post(exec_call_api))
        .route("/mock-server/add", post(add_mock_server))
        .route("/mock-server/remove", delete(remove_mock_server))
        .route("/mock-server/list", get(list_mock_servers))
        .route("/mock-server/remove-all", delete(remove_all_mock_servers))
        .with_state(shared_state)
        .layer(cors);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Không bind được port");

    println!("API đang chạy tại http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Ok"
}

async fn exec_call_api(
    State(_state): State<Arc<AppState>>,
    Json(body): Json<UIAPIRequest>,
) -> Json<UIAPIResponse> {
    let response = execute_request(body).await;
    let res = response.expect("Đã có lỗi xảy ra");
    Json(res)
}

async fn add_mock_server(
    State(state): State<Arc<AppState>>,
    Json(body): Json<AddMockServerRequest>,
) -> Json<ApiResponse<String>> {
    let routes: Vec<(String, String, String, u16, String)> = body
        .routes
        .into_iter()
        .map(|route| {
            (
                route.request_match,
                route.method,
                route.response,
                route.status,
                route.headers,
            )
        })
        .collect();

    match state
        .mock_server_manager
        .add_server(body.name.clone(), body.port, routes)
        .await
    {
        Ok(_) => Json(ApiResponse::ok(format!(
            "Server '{}' added successfully",
            body.name
        ))),
        Err(e) => Json(ApiResponse::err(format!("Failed to add server: {}", e))),
    }
}

async fn remove_mock_server(
    State(state): State<Arc<AppState>>,
    Json(body): Json<RemoveMockServerRequest>,
) -> Json<ApiResponse<String>> {
    match state.mock_server_manager.remove_server(&body.name).await {
        Ok(_) => Json(ApiResponse::ok(format!(
            "Server '{}' removed successfully",
            body.name
        ))),
        Err(e) => Json(ApiResponse::err(e)),
    }
}

async fn list_mock_servers(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<Vec<MockServerInfoResponse>>> {
    let servers = state.mock_server_manager.list_servers().await;
    let response: Vec<MockServerInfoResponse> = servers
        .into_iter()
        .map(|(name, port, routes_count)| MockServerInfoResponse {
            name,
            port,
            routes_count,
        })
        .collect();
    Json(ApiResponse::ok(response))
}

async fn remove_all_mock_servers(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<String>> {
    state.mock_server_manager.remove_all().await;
    Json(ApiResponse::ok("All servers removed successfully".to_string()))
}
