const WEB_APP_URL = "http://localhost:3001";
const BACKEND_URL = "http://localhost:8000";

const LABELS = {
  leetcode_accepted: "LeetCode Accepted",
  github_commit: "GitHub Commit",
  job_application: "Job Application",
};

async function init() {
  const { firebaseUid, firebaseUsername } = await chrome.storage.local.get([
    "firebaseUid",
    "firebaseUsername",
  ]);

  if (!firebaseUid) {
    renderLoginGate();
  } else {
    renderMain(firebaseUid, firebaseUsername);
  }
}

function renderLoginGate() {
  document.getElementById("auth-section").innerHTML = `
    <div class="auth-title">🏝️ ProductivityIsland</div>
    <p class="auth-sub">Sign in to start tracking your grind.</p>
    <button id="loginBtn">Sign in with Google</button>
  `;
  document.getElementById("loginBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: WEB_APP_URL + "/auth" });
  });
}

async function renderMain(uid, username) {
  // Render shell immediately using cached coin value
  const { coins: cachedCoins = 0 } = await chrome.storage.local.get("coins");

  document.getElementById("auth-section").innerHTML = `
    <div class="user-row">
      <span class="user-name">🏝️ ${username || "Player"}</span>
      <span class="coin-count" id="coinCount">🪙 ${cachedCoins}</span>
      <button id="signoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("main-section").style.display = "block";

  document.getElementById("signoutBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(["firebaseUid", "firebaseIdToken", "firebaseUsername", "coins"]);
    window.location.reload();
  });

  // Populate log immediately from local storage
  await renderLog();

  // Fetch live data from backend in the background — updates UI when ready
  fetchCoinsFromBackend(uid).then((coins) => {
    const el = document.getElementById("coinCount");
    if (el) el.textContent = `🪙 ${coins}`;
  });

  fetchGithubStatus(uid).then((githubLogin) => {
    const btn = document.getElementById("connectGithub");
    if (!btn) return;
    if (githubLogin) {
      btn.textContent = `GitHub: @${githubLogin}`;
      btn.disabled = true;
    } else {
      btn.addEventListener("click", () => {
        chrome.tabs.create({ url: `${WEB_APP_URL}/lobby` });
      });
    }
  });
}

async function fetchCoinsFromBackend(uid) {
  try {
    const res = await fetch(`${BACKEND_URL}/coins/${uid}`);
    if (res.ok) {
      const data = await res.json();
      await chrome.storage.local.set({ coins: data.coins });
      return data.coins;
    }
  } catch {}
  const { coins = 0 } = await chrome.storage.local.get("coins");
  return coins;
}

async function fetchGithubStatus(uid) {
  try {
    const res = await fetch(`${BACKEND_URL}/users/${uid}`);
    if (res.ok) {
      const data = await res.json();
      return data.github_username || null;
    }
  } catch {}
  return null;
}

async function renderLog() {
  const { activityLog = [] } = await chrome.storage.local.get("activityLog");
  const log = document.getElementById("log");

  if (activityLog.length === 0) {
    log.innerHTML = '<p class="empty">No activity tracked yet.</p>';
    return;
  }

  log.innerHTML = activityLog
    .map((entry) => {
      const label = LABELS[entry.type] || entry.type;
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const payload = JSON.stringify(
        { type: entry.type, source: entry.source, timestamp: entry.timestamp, details: entry.details },
        null,
        2
      );
      return `
      <div class="entry">
        <div class="header">
          <span class="label">${label}</span>
          <span class="time">${time}</span>
        </div>
        <pre class="payload">${payload}</pre>
      </div>
    `;
    })
    .join("");
}

init();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if ("firebaseUid" in changes || "firebaseUsername" in changes) {
    window.location.reload();
    return;
  }
  if ("coins" in changes) {
    const el = document.getElementById("coinCount");
    if (el) el.textContent = `🪙 ${changes.coins.newValue ?? 0}`;
  }
});
