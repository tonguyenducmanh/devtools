use axum::{
    Json, Router,
    extract::State,
    routing::{get, post},
};
use std::{sync::Arc, env};
use td_tool_agent::execute_request;
use td_tool_model::{UIAPIRequest, UIAPIResponse};
use tower_http::cors::{Any, CorsLayer};

struct AppState {
    // todo: bổ sung body
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

    let shared_state = Arc::new(AppState {});

    // CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(health_check))
        .route("/exec", post(exec_call_api))
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
