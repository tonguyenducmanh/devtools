use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::task::JoinHandle;

#[derive(Clone, Debug)]
pub struct MockRoute {
    pub request_match: String,
    pub method: String,
    pub response: String,
    pub status: u16,
    pub headers: String,
}

#[derive(Clone)]
pub struct MockServer {
    name: String,
    port: u16,
    routes: Arc<Mutex<Vec<MockRoute>>>,
    handle: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl MockServer {
    fn new(name: String, port: u16, routes: Vec<MockRoute>) -> Self {
        MockServer {
            name,
            port,
            routes: Arc::new(Mutex::new(routes)),
            handle: Arc::new(Mutex::new(None)),
        }
    }

    async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        let addr = format!("127.0.0.1:{}", self.port);
        let listener = TcpListener::bind(&addr).await?;
        println!("Mock server '{}' started on {}", self.name, addr);

        let routes = Arc::clone(&self.routes);
        let _name = self.name.clone();
        let port = self.port;

        let task = tokio::spawn(async move {
            loop {
                match listener.accept().await {
                    Ok((mut socket, _)) => {
                        let routes = Arc::clone(&routes);

                        tokio::spawn(async move {
                            let mut buffer = vec![0; 4096];

                            match socket.read(&mut buffer).await {
                                Ok(n) => {
                                    let request = String::from_utf8_lossy(&buffer[..n]);

                                    // Tìm route khớp đầu tiên
                                    let routes_lock = routes.lock().await;
                                    let matched_route = routes_lock.iter().find(|route| {
                                        request.contains(&route.request_match)
                                    }).cloned();
                                    drop(routes_lock); // Giải phóng lock ngay

                                    if let Some(route) = matched_route {
                                        let mut response_headers = route.headers.clone();
                                        if !response_headers.is_empty() && !response_headers.ends_with("\r\n") {
                                            response_headers.push_str("\r\n");
                                        }
                                        
                                        let http_response = format!(
                                            "HTTP/1.1 {} OK\r\nContent-Length: {}\r\nContent-Type: application/json\r\n{}\r\n{}",
                                            route.status,
                                            route.response.len(),
                                            response_headers,
                                            route.response
                                        );
                                        let _ = socket.write_all(http_response.as_bytes()).await;
                                    } else {
                                        let not_found = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\n\r\nNot Found";
                                        let _ = socket.write_all(not_found.as_bytes()).await;
                                    }
                                }
                                Err(e) => eprintln!("Failed to read from socket: {}", e),
                            }
                        });
                    }
                    Err(e) => eprintln!("Failed to accept connection on port {}: {}", port, e),
                }
            }
        });

        *self.handle.lock().await = Some(task);
        Ok(())
    }

    async fn add_routes(&self, new_routes: Vec<MockRoute>) {
        let mut routes = self.routes.lock().await;
        let count = new_routes.len();
        routes.extend(new_routes);
        println!(
            "Added {} new routes to server '{}'",
            count,
            self.name
        );
    }

    async fn stop(&self) {
        if let Some(handle) = self.handle.lock().await.take() {
            handle.abort();
            println!("Mock server '{}' on port {} stopped", self.name, self.port);
        }
    }
}

pub struct MockServerManager {
    servers: Arc<Mutex<HashMap<String, MockServer>>>,
}

impl MockServerManager {
    pub fn new() -> Self {
        MockServerManager {
            servers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn add_server(
        &self,
        name: String,
        port: u16,
        routes: Vec<(String, String, String, u16, String)>, // (request_match, method, response, status, headers)
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut servers = self.servers.lock().await;

        // Kiểm tra xem server đã tồn tại chưa
        if let Some(existing_server) = servers.get(&name) {
            // Server đã tồn tại, thêm routes mới vào
            let mock_routes: Vec<MockRoute> = routes
                .into_iter()
                .map(|(req, method, res, status, headers)| MockRoute {
                    request_match: req,
                    method,
                    response: res,
                    status,
                    headers,
                })
                .collect();

            existing_server.add_routes(mock_routes).await;
            println!("Added routes to existing server '{}'", name);
        } else {
            // Tạo server mới
            let mock_routes: Vec<MockRoute> = routes
                .into_iter()
                .map(|(req, method, res, status, headers)| MockRoute {
                    request_match: req,
                    method,
                    response: res,
                    status,
                    headers,
                })
                .collect();

            let server = MockServer::new(name.clone(), port, mock_routes);
            server.start().await?;
            servers.insert(name.clone(), server);
            println!("Created new mock server '{}'", name);
        }

        Ok(())
    }

    pub async fn remove_server(&self, name: &str) -> Result<(), String> {
        let mut servers = self.servers.lock().await;

        if let Some(server) = servers.remove(name) {
            server.stop().await;
            Ok(())
        } else {
            Err(format!("Server '{}' not found", name))
        }
    }

    pub async fn remove_all(&self) {
        let mut servers = self.servers.lock().await;

        for (_, server) in servers.drain() {
            server.stop().await;
        }
        println!("All servers removed");
    }

    pub async fn list_servers(&self) -> Vec<(String, u16, usize)> {
        let servers = self.servers.lock().await;
        let mut server_list = Vec::new();

        for (name, server) in servers.iter() {
            let routes = server.routes.lock().await;
            server_list.push((name.clone(), server.port, routes.len()));
        }

        server_list
    }
}
