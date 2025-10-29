/**
 * các method TDWasm dùng cho toàn bộ frontend
 * Created by tdmanh1 30.05.2024
 */
class TDWasm {
  initWasmRuntime = async () => {
    try {
      // import blazor webassembly
      if (window && !window.__dotnet_runtime) {
        const { dotnet } = await import(
          /* webpackChunkName: "dotnet" */
          "/public/_framework/dotnet.js"
        );
        const runtime = await dotnet.create();
        runtime.setModuleImports("globalThis", globalThis);
        // gán runtime vào window để các module khác có thể dùng
        window.__dotnet_runtime = runtime;
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo Blazor WebAssembly:", error);
    }

    // demo gọi hàm từ blazor wasm
    // const { getAssemblyExports } = runtime;
    // const exports = await getAssemblyExports("Tools.NetWrapper.dll");
    // const { ToolsTensor } = exports.Tools.NetWrapper;
    // // 1. Chuẩn bị đối tượng JavaScript
    // const inputData = {
    //   // Mảng float (Number trong JS)
    //   FirstVector: [1.0, 2.0, 3.0, 4.0],
    //   SecondVector: [5.0, 6.0, 7.0, 8.0],
    // };

    // // 2. Marshalling: Chuyển đối tượng JS thành chuỗi JSON
    // const jsonString = JSON.stringify(inputData);

    // try {
    //   // 3. Gọi hàm C# đã export
    //   const resultString = ToolsTensor.CosinSimilarity(jsonString);

    //   // 4. Xử lý kết quả (Vì C# trả về float.ToString() là một chuỗi)
    //   const similarity = parseFloat(resultString);

    //   console.log("Input Data:", inputData);
    //   console.log("JSON Sent to C#:", jsonString);
    //   console.log("Result (string from C#):", resultString);
    //   console.log("Cosin Similarity:", similarity); // Kết quả là một số (float)
    // } catch (error) {
    //   console.error("Lỗi khi gọi CosinSimilarity từ C#:", error);
    // }
    // debugger;
  };
}

export default new TDWasm();
