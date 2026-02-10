## Project: Developer Utility Tools - Aggregated to Avoid Deploying Each Tool on a Separate Site

This project provides a collection of useful tools for developers, aggregated with the aim of avoiding the need to deploy each tool on a separate website.

This is a Client-Daemon Application.

![alt text](imgs/screenshot.png)

[https://tool.tomanh.com/](https://tool.tomanh.com/)

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

## Configuration

The backend services are configured or default via `config/config.json`.

Frontend-specific configuration can be found at: `public/cfg/config.js`

### Data Storage (SQLite)

This tool uses **SQLite** (Go side) to persist data into a local file.

- **Database File**: `dev_tool.db` (as defined in `config.json`)
- All configurations, user-defined mock APIs, and tool-specific data are stored in this file.
- SQLite is used to ensure portability and ease of backup—everything is contained within your local directory.
