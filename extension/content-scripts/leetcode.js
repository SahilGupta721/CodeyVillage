(function () {
  console.log("[CS Tracker] LeetCode content script loaded");
  const seen = new Set();

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected/interceptor.js");
  script.dataset.config = JSON.stringify([
    {
      method: "GET",
      urlPattern: "/submissions/detail/",
      responseField: "status_msg",
      responseValue: "Accepted",
    },
  ]);
  (document.head || document.documentElement).appendChild(script);
  script.remove();

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== "cs-tracker-interceptor") return;

    const { url, body } = event.data;

    const match = url.match(/\/submissions\/detail\/(\d+)\//);
    if (!match) return;
    const submissionId = match[1];

    if (seen.has(submissionId)) return;
    seen.add(submissionId);

    const slugMatch = window.location.pathname.match(/\/problems\/([^/]+)\//);

    try {
      chrome.runtime.sendMessage({
        type: "activity",
        payload: {
          type: "leetcode_accepted",
          source: "leetcode",
          timestamp: new Date().toISOString(),
          details: {
            question_id: body.question_id,
            problem_slug: slugMatch ? slugMatch[1] : null,
            submission_id: submissionId,
            runtime: body.status_runtime,
            memory: body.status_memory,
            lang: body.lang,
          },
        },
      });
    } catch (err) {
      console.warn("[CS Tracker] Could not send message — reload the page after reloading the extension:", err);
    }
  });
})();
