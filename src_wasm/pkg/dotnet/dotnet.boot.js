export const config = /*json-start*/{
  "mainAssemblyName": "Tools.NetWrapper.dll",
  "resources": {
    "hash": "sha256-ULv+YR9wxWCVMNVv5C2+bSuaPyPoIPFK/MLLYsqgMy0=",
    "jsModuleNative": [
      {
        "name": "dotnet.native.js"
      }
    ],
    "jsModuleRuntime": [
      {
        "name": "dotnet.runtime.js"
      }
    ],
    "wasmNative": [
      {
        "name": "dotnet.native.wasm",
        "hash": "sha256-2Os7D7owemodPn0Obg5pKiZmhL6dKF5xzg4J6eyUGX8="
      }
    ],
    "wasmSymbols": [
      {
        "name": "dotnet.native.js.symbols"
      }
    ],
    "coreAssembly": [
      {
        "virtualPath": "System.Private.CoreLib.wasm",
        "name": "System.Private.CoreLib.wasm",
        "hash": "sha256-STGMDaxglYxauGxBOkzA6lK3zNl1Qh052zAk/eYrywo="
      },
      {
        "virtualPath": "System.Runtime.InteropServices.JavaScript.wasm",
        "name": "System.Runtime.InteropServices.JavaScript.wasm",
        "hash": "sha256-8sLPigJG/lC5XBVLcMl4jkh6z3uCvR4XGzJQTQkJ4Fo="
      }
    ],
    "assembly": [
      {
        "virtualPath": "Npgsql.wasm",
        "name": "Npgsql.wasm",
        "hash": "sha256-oXms7fWbf7ou19k2yC7Vy1wJUedQ9SdugiY2gN0mnLY="
      },
      {
        "virtualPath": "System.Collections.Concurrent.wasm",
        "name": "System.Collections.Concurrent.wasm",
        "hash": "sha256-dIh1mlx6QKr9Is51rQFVLJRcPSIbX82B5jYA4lxv5Vk="
      },
      {
        "virtualPath": "System.ComponentModel.Primitives.wasm",
        "name": "System.ComponentModel.Primitives.wasm",
        "hash": "sha256-PS9U2NWgozPTJ1eg6Nq6EBOpnsqctHZZ+awYNVOaKnA="
      },
      {
        "virtualPath": "System.ComponentModel.TypeConverter.wasm",
        "name": "System.ComponentModel.TypeConverter.wasm",
        "hash": "sha256-pnElD2NSCujyv5i99odE86m1M/urDgpQOcwCfxEHmtM="
      },
      {
        "virtualPath": "System.Data.Common.wasm",
        "name": "System.Data.Common.wasm",
        "hash": "sha256-49lEB39nJXTCUSalU9KKzwj2AnMsSn0kpMTbqU+HiWM="
      },
      {
        "virtualPath": "System.IO.Pipelines.wasm",
        "name": "System.IO.Pipelines.wasm",
        "hash": "sha256-7N+scuN8nmiU+QbLyZpP/FeRS5FYzMOKMTSW7NAJetA="
      },
      {
        "virtualPath": "System.Memory.wasm",
        "name": "System.Memory.wasm",
        "hash": "sha256-fFZcVQ+L6p4m9W6FyJm+PUadT/m6eIWPi12nkr6+9Gs="
      },
      {
        "virtualPath": "System.Text.Encodings.Web.wasm",
        "name": "System.Text.Encodings.Web.wasm",
        "hash": "sha256-rELIEiGL/VhmkBfSywQ2HMdxEWtm9oEH7rDYFBFdjLA="
      },
      {
        "virtualPath": "System.Text.Json.wasm",
        "name": "System.Text.Json.wasm",
        "hash": "sha256-sVjaOBu68/JKd+a11Ryo572T1SYdsJG5MjZdq6uSYmY="
      },
      {
        "virtualPath": "System.Text.RegularExpressions.wasm",
        "name": "System.Text.RegularExpressions.wasm",
        "hash": "sha256-474T4dsZyOBv7P0FPkn7MC79SqKrGpqqZqnmmCb/Zds="
      },
      {
        "virtualPath": "Tools.NetWrapper.wasm",
        "name": "Tools.NetWrapper.wasm",
        "hash": "sha256-lSkX5qZf9INcc7tM7tHOK67/b1evh4BphbL7rPxIBmw="
      }
    ]
  },
  "debugLevel": 0,
  "globalizationMode": "invariant",
  "runtimeConfig": {
    "runtimeOptions": {
      "configProperties": {
        "Microsoft.Extensions.DependencyInjection.VerifyOpenGenericServiceTrimmability": true,
        "System.ComponentModel.DefaultValueAttribute.IsSupported": false,
        "System.ComponentModel.Design.IDesignerHost.IsSupported": false,
        "System.ComponentModel.TypeConverter.EnableUnsafeBinaryFormatterInDesigntimeLicenseContextSerialization": false,
        "System.ComponentModel.TypeDescriptor.IsComObjectDescriptorSupported": false,
        "System.Data.DataSet.XmlSerializationIsSupported": false,
        "System.Diagnostics.Debugger.IsSupported": false,
        "System.Diagnostics.Metrics.Meter.IsSupported": false,
        "System.Diagnostics.Tracing.EventSource.IsSupported": false,
        "System.Globalization.Invariant": true,
        "System.TimeZoneInfo.Invariant": false,
        "System.Globalization.PredefinedCulturesOnly": true,
        "System.Linq.Enumerable.IsSizeOptimized": true,
        "System.Net.Http.EnableActivityPropagation": false,
        "System.Net.Http.WasmEnableStreamingResponse": true,
        "System.Net.SocketsHttpHandler.Http3Support": false,
        "System.Reflection.Metadata.MetadataUpdater.IsSupported": false,
        "System.Resources.ResourceManager.AllowCustomResourceTypes": false,
        "System.Resources.UseSystemResourceKeys": true,
        "System.Runtime.CompilerServices.RuntimeFeature.IsDynamicCodeSupported": true,
        "System.Runtime.InteropServices.BuiltInComInterop.IsSupported": false,
        "System.Runtime.InteropServices.EnableConsumingManagedCodeFromNativeHosting": false,
        "System.Runtime.InteropServices.EnableCppCLIHostActivation": false,
        "System.Runtime.InteropServices.Marshalling.EnableGeneratedComInterfaceComImportInterop": false,
        "System.Runtime.Serialization.EnableUnsafeBinaryFormatterSerialization": false,
        "System.StartupHookProvider.IsSupported": false,
        "System.Text.Encoding.EnableUnsafeUTF7Encoding": false,
        "System.Text.Json.JsonSerializer.IsReflectionEnabledByDefault": false,
        "System.Threading.Thread.EnableAutoreleasePool": false
      }
    }
  }
}/*json-end*/;