# C# tool WASM Build

## Mô tả

Folder này chứa source code C# để build 1 số thư viện thành WebAssembly (WASM).

## Yêu cầu

1. NET sdk 10 trở lên

2. chạy dotnet workload restore

## Build

Chạy script build:

```bash
cd iron_rdp
./build.sh
```

Kết quả build sẽ được xuất ra thư mục `../pkg/` (tức `src_wasm/pkg/`)

## Sử dụng

Sau khi build, import WASM module trong Vue component:

```javascript

khai báo trong data:

dotnetInitialized: false,
_dotnetExports: null,

trong mounted:

async mounted() {
  // Tự động kích hoạt tải .NET WASM phục vụ chạy tool theo nhu cầu
  await this.initDotNetWasm();
},


/**
  * Khởi tạo .NET 10.0 WASM Runtime
  */
async initDotNetWasm() {
  if (this.dotnetInitialized) return;
  try {
    const { dotnet } = await import("@wasm/pkg/dotnet/dotnet.js");
    const { getAssemblyExports } = await dotnet
      .withDiagnosticTracing(false)
      .create();

    const exports = await getAssemblyExports("Tools.NetWrapper.dll");
    this._dotnetExports = exports.TDTools.TDToolDotNetWrapper;
    this.dotnetInitialized = true;
  } catch (error) {
    console.error("Failed to load C# WASM Wrapper:", error);
  }
},

ví dụ sử dụng

// Thực hiện lệnh convert từ C#
const jsonResult = this._dotnetExports.ConvertNpgSQLConnection(
  this.textInput.trim(),
);

```

Đảm bảo `vite.config.js` có alias:

```javascript
alias: {
  "@wasm": fileURLToPath(new URL("./src_wasm", import.meta.url)),
}
```
