## Project: Developer Utility Tools - Aggregated to Avoid Deploying Each Tool on a Separate Site

This project provides a collection of useful tools for developers, aggregated with the aim of avoiding the need to deploy each tool on a separate website.

Two versions are supported: web version (Vue + Vite) and app version (Tauri + Vue + Vite).

[https://tool.tomanh.com/](https://tool.tomanh.com/)

To setup this project

```
npm i
```

To Run and Build project local

For web version

```
npm run web:dev
```

```
npm run web:build
```

For desktop version

```
npm run desktop:dev
```

```
npm run desktop:build
```

For api agent

```
cd ./src-backend/td_tool_api/
cargo build --release
```
