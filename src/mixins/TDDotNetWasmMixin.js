import tdUtility from "@/common/TDUtility.js";

export default {
  data() {
    return {
      dotnetInitialized: false,
      _dotnetExports: null,
    };
  },
  async mounted() {
    await this.initDotNetWasm();
  },
  methods: {
    /**
     * Khởi tạo .NET 10.0 WASM Runtime
     */
    async initDotNetWasm() {
      if (this.dotnetInitialized) return;
      try {
        let dotnetModule;

        if (import.meta.env.DEV) {
          // Môi trường DEV: Import thông qua alias đã cấu hình trong vite.config.js
          const { dotnet } = await import("@wasm/pkg/dotnet/dotnet.js");
          dotnetModule = dotnet;
        } else {
          // Môi trường PROD: Giấu đường dẫn trong một biến chuỗi
          // Việc này khiến Vite hoàn toàn bỏ qua không quét file này lúc dev nữa
          let APP_VERSION = tdUtility.getAppVersion();
          const prodPath = `/assets-wasm-${APP_VERSION}/dotnet.js`;
          const { dotnet } = await import(/* @vite-ignore */ prodPath);
          dotnetModule = dotnet;
        }

        const { getAssemblyExports } = await dotnetModule
          .withDiagnosticTracing(false)
          .create();

        const exports = await getAssemblyExports("Tools.NetWrapper.dll");
        this._dotnetExports = exports.TDTools.TDToolDotNetWrapper;
        this.dotnetInitialized = true;
      } catch (error) {
        console.error("Failed to load C# WASM Wrapper:", error);
      }
    },
  },
};
