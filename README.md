## Project: Developer Utility Tools - Aggregated to Avoid Deploying Each Tool on a Separate Site

This project provides a collection of useful tools for developers, aggregated with the aim of avoiding the need to deploy each tool on a separate website.

This is Client-Deamon Application

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

To build api/daemon app

```
chmod 777 ./build_all.sh
./build_all.sh
```

api flag

```
-port=1234: port for api agent
```

deamon flag

```
-api-port=1234: port for api agent
-api-trace=true: enable trace for api agent
-web-port=8080: port for web app
-web-trace=true: enable trace for web app
```
