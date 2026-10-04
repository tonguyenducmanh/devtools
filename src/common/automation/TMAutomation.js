import TMAutomationInject from "./TMAutomationInject.js";

function getInjectableMethods() {
  return Object.getOwnPropertyNames(TMAutomationInject.prototype).filter(
    (name) => name !== "constructor",
  );
}

/**
 * Các method CURL dùng cho toàn bộ frontend
 * Created by tdmanh 16/12/2025
 */
class TMAutomation extends TMAutomationInject {
  setGlobalInfoBeforeRequest(options) {
    let me = this;
    window.__tmAPI = window.__tmAPI ?? {};

    let automation = {
      agentURL: options?.agentURL ?? window.__env?.APITesting?.agentServer,
    };

    getInjectableMethods().forEach((name) => {
      automation[name] = me[name].bind(me);
    });

    window.__tmAPI.automation = automation;
    return window.__tmAPI.automation;
  }

  /**
   * Đoạn code build ra script javascript động để chạy request bằng CURL
   * theo kịch bản người dùng tự viết
   */
  buildInjectCode(scenarioCode) {
    let bindings = getInjectableMethods()
      .map((name) => `let ${name} = window.__tmAPI.automation.${name};`)
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

export default new TMAutomation();
