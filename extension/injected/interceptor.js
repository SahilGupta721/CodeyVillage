(function () {
  const rules = JSON.parse(document.currentScript.dataset.config);
  console.log("[CS Tracker] Interceptor injected, rules:", rules);

  // --- Wrap fetch ---
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const request = args[0];
    const url = typeof request === "string" ? request : request.url;
    const method = (args[1]?.method || request?.method || "GET").toUpperCase();

    const response = await originalFetch.apply(this, args);

    for (const rule of rules) {
      if (rule.method === method && url.includes(rule.urlPattern)) {
        response.clone().json().then((body) => {
          if (rule.responseField && body[rule.responseField] !== rule.responseValue) return;
          window.postMessage(
            { source: "cs-tracker-interceptor", url, method, body },
            "*"
          );
        }).catch(() => {});
      }
    }

    return response;
  };

  // --- Wrap XMLHttpRequest ---
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._csMethod = method.toUpperCase();
    this._csUrl = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("readystatechange", function () {
      if (this.readyState !== 4) return;
      for (const rule of rules) {
        if (rule.method === this._csMethod && this._csUrl?.includes(rule.urlPattern)) {
          let body;
          try { body = JSON.parse(this.responseText); } catch { return; }
          if (rule.responseField && body[rule.responseField] !== rule.responseValue) return;
          window.postMessage(
            { source: "cs-tracker-interceptor", url: this._csUrl, method: this._csMethod, body },
            "*"
          );
        }
      }
    });
    return originalSend.apply(this, args);
  };
})();
