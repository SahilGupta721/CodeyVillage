(function () {
  let lastUrl = "";

  function checkUrl() {
    const url = window.location.href;
    if (url === lastUrl) return;
    lastUrl = url;

    if (!url.includes("/jobTasks/completed/application")) return;

    try {
      chrome.runtime.sendMessage({
        type: "activity",
        payload: {
          type: "job_application",
          source: "workday",
          timestamp: new Date().toISOString(),
          details: { url },
        },
      });
    } catch (err) {
      console.warn("[CS Tracker] Could not send message — reload the page after reloading the extension:", err);
    }
  }

  checkUrl();

  new MutationObserver(checkUrl).observe(document, { subtree: true, childList: true });
})();
