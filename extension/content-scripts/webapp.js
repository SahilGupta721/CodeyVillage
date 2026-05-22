(function () {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "codey-village-auth") {
      const { uid, idToken, username } = event.data;
      chrome.runtime.sendMessage({ type: "firebase_auth", uid, idToken, username });
    }

    if (event.data?.type === "codey-village-signout") {
      chrome.runtime.sendMessage({ type: "firebase_signout" });
    }

    if (event.data?.type === "codey-village-github-connected") {
      chrome.runtime.sendMessage({ type: "github_connected", githubUsername: event.data.githubUsername });
    }
  });
})();
