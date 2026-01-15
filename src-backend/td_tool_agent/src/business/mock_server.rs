use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::task::JoinHandle;

#[derive(Clone, Debug)]
pub struct MockRoute {
    request_match: String,
    response: String,
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
        let name = self.name.clone();
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
                                        let http_response = format!(
                                            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: text/plain\r\n\r\n{}",
                                            route.response.len(),
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
        routes.extend(new_routes);
        println!("Added {} new routes to server '{}'", routes.len(), self.name);
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
        routes: Vec<(String, String)>, // Vec của (request_match, response)
    ) -> Result<(), Box<dyn std::error::Error>> {
        let mut servers = self.servers.lock().await;

        // Kiểm tra xem server đã tồn tại chưa
        if let Some(existing_server) = servers.get(&name) {
            // Server đã tồn tại, thêm routes mới vào
            let mock_routes: Vec<MockRoute> = routes
                .into_iter()
                .map(|(req, res)| MockRoute {
                    request_match: req,
                    response: res,
                })
                .collect();

            existing_server.add_routes(mock_routes).await;
            println!("Added routes to existing server '{}'", name);
        } else {
            // Tạo server mới
            let mock_routes: Vec<MockRoute> = routes
                .into_iter()
                .map(|(req, res)| MockRoute {
                    request_match: req,
                    response: res,
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

    pub async fn list_servers(&self) {
        let servers = self.servers.lock().await;

        if servers.is_empty() {
            println!("No active servers");
        } else {
            println!("Active servers:");
            for (name, server) in servers.iter() {
                let routes = server.routes.lock().await;
                println!("  '{}' on port {} with {} routes:", name, server.port, routes.len());
                for (i, route) in routes.iter().enumerate() {
                    println!("    [{}] '{}' -> '{}'", i + 1, route.request_match, route.response);
                }
            }
        }
    }
}
