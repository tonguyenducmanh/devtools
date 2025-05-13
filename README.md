## Project: Developer Utility Tools - Aggregated to Avoid Deploying Each Tool on a Separate Site

This project provides a collection of useful tools for developers, aggregated with the aim of avoiding the need to deploy each tool on a separate website.

Two versions are supported: web version (Vue + Vite) and app version (Electron + Vue + Vite).

List of Supported Features:

```
Code comparison (similar to GitHub pull request)
Recursive JSON parse
Base64 to image
Image to Base64
Generate PostgreSQL insert scripts into the database from JSON data
Text to multiple QR codes
Multiple QR codes to a single text
Recursive value mapping by key of two JSON objects (nested objects are also mapped)
Download VSCode extension (legacy)
Generate random UUIDv4
Generate OTP (TOTP)
```

Feature Demos:

![alt text](img/demo_otp.png)

Application-wide configuration can be accessed by entering the following command in the console:

```
window.__env
```

Global objects are injected in the `renderer.js` file, for example: `$tdCache = import TDCache.js`, `$tdEnum = import TDEnum.js`.

The `[mock.js](src/common/mock/mock.js)` file will be used to fake data for each tool.
