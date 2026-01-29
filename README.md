## Project: Developer Utility Tools - Aggregated to Avoid Deploying Each Tool on a Separate Site

This project provides a collection of useful tools for developers, aggregated with the aim of avoiding the need to deploy each tool on a separate website.

This is a Client-Daemon Application.

[https://tool.tomanh.com/](https://tool.tomanh.com/)

---

## Setup

```bash
npm i
```

## Running the Project

### Web Version (Frontend)

```bash
npm run web:dev
npm run web:build
```

### API / Daemon (Backend)

To build all backend services:

```bash
chmod 777 ./build_all.sh
./build_all.sh
```

---

## Configuration

The backend services are configured or default via `config/config.json`.

### Configuration File (`config/config.json`)

```json
{
  "database_name": "tool_tomanh.db",
  "api_config": {
    "port": 7777,
    "enable_trace": false
  },
  "web_config": {
    "port": 1403,
    "enable_trace": false
  },
  "mock_api_config": {
    "port": 8888,
    "enable_trace": false
  }
}
```

### Data Storage (SQLite)

This tool uses **SQLite** (Go side) to persist data into a local file.
- **Database File**: `tool_tomanh.db` (as defined in `config.json`)
- All configurations, user-defined mock APIs, and tool-specific data are stored in this file.
- SQLite is used to ensure portability and ease of backup—everything is contained within your local directory.

---

## Command Line Flags

You can override the configuration file settings using command line flags.

### Daemon App (Runs both API and Web)

```bash
./daemon_app -api-port=7777 -web-port=1403 -mock-port=8888 -api-trace=false -web-trace=false
```

- `-api-port`: Port for the API agent
- `-api-trace`: Enable detailed logging for the API
- `-web-port`: Port for the Web server
- `-web-trace`: Enable detailed logging for the Web server
- `-mock-port`: Port for the Mock API server

### API App (Standalone API)

```bash
./api_app -port=7777 -mock_port=8888 -trace=false
```

- `-port`: Port for the API agent
- `-mock_port`: Port for the Mock API server
- `-trace`: Enable detailed logging for the API server

---

## UI Configuration

Frontend-specific configuration can be found at:
- `public/cfg/config.js`
- Backend configuration: `config/config.json`
