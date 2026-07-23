import TDAutomationInject from "./TDAutomationInject.js";
/**
 * Các method CURL dùng cho toàn bộ frontend
 * Created by tdmanh 16/12/2025
 */
class TDAutomation extends TDAutomationInject {
  setGlobalInfoBeforeRequest(options) {
    let me = this;
    window.__tdAPI = window.__tdAPI ?? {};

    let apiTesting = {
      agentURL: options?.agentURL ?? window.__env?.APITesting?.agentServer,
    };

    let methodNames = Object.getOwnPropertyNames(
      TDAutomationInject.prototype,
    ).filter((name) => name !== "constructor");
    methodNames.forEach((name) => {
      apiTesting[name] = me[name].bind(me);
    });

    window.__tdAPI.apiTesting = apiTesting;
    return window.__tdAPI.apiTesting;
  }

  /**
   * Đoạn code build ra script javascript động để chạy request bằng CURL
   * theo kịch bản người dùng tự viết
   */
  buildInjectCode(scenarioCode) {
    let methodNames = Object.getOwnPropertyNames(
      TDAutomationInject.prototype,
    ).filter((name) => name !== "constructor");

    let bindings = methodNames
      .map((name) => `let ${name} = window.__tdAPI.apiTesting.${name};`)
      .join("\n");

    return `
${bindings}
let result = 
(async () => {
  ${scenarioCode}
})();
return result;`;
  }
}

export default new TDAutomation();
