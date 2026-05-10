const LABELS = {
  leetcode_accepted: "LeetCode Accepted",
  github_commit: "GitHub Commit",
  job_application: "Job Application",
};

async function render() {
  const { activityLog = [] } = await chrome.storage.local.get("activityLog");
  const log = document.getElementById("log");

  if (activityLog.length === 0) {
    log.innerHTML = '<p class="empty">No activity tracked yet.</p>';
    return;
  }

  log.innerHTML = activityLog.map((entry) => {
    const label = LABELS[entry.type] || entry.type;
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const payload = JSON.stringify({ type: entry.type, source: entry.source, timestamp: entry.timestamp, details: entry.details }, null, 2);

    return `
      <div class="entry">
        <div class="header">
          <span class="label">${label}</span>
          <span class="time">${time}</span>
        </div>
        <pre class="payload">${payload}</pre>
      </div>
    `;
  }).join("");
}

async function renderGithubStatus() {
  const { githubConnected, githubLogin } = await chrome.storage.local.get(["githubConnected", "githubLogin"]);
  const btn = document.getElementById("connectGithub");
  if (githubConnected) {
    btn.textContent = `GitHub: ${githubLogin}`;
    btn.disabled = true;
  } else {
    btn.addEventListener("click", () => {
      chrome.tabs.create({ url: "http://localhost:3000/auth/github" });
    });
  }
}

renderGithubStatus();
render();
