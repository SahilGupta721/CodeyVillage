const WEB_APP_URL = "https://gdg-hacks-3.vercel.app";
const BACKEND_URL = "https://gdg-hacks3.onrender.com";

const COIN_VALUES = { leetcode_accepted: 50, github_commit: 25, job_application: 25 };

const ENTRY_ICONS = {
  leetcode_accepted: "⚡",
  github_commit: "📦",
  job_application: "💼",
};

function formatSlug(slug) {
  if (!slug) return "Problem";
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

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
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- water -->
      <ellipse cx="32" cy="52" rx="26" ry="7" fill="#0f2744"/>
      <ellipse cx="32" cy="52" rx="26" ry="7" fill="url(#water)"/>
      <!-- island -->
      <ellipse cx="32" cy="46" rx="18" ry="6" fill="#c9a84c"/>
      <ellipse cx="32" cy="44" rx="14" ry="4" fill="#e0b85a"/>
      <!-- trunk -->
      <path d="M32 44 Q30 34 28 24" stroke="#7c5c2a" stroke-width="2.5" stroke-linecap="round"/>
      <!-- leaves -->
      <path d="M28 24 Q18 18 16 10" stroke="#2d9e4e" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 24 Q22 16 24 8"  stroke="#34b85a" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 24 Q30 14 34 10" stroke="#2d9e4e" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 24 Q36 18 40 14" stroke="#34b85a" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 24 Q38 22 42 20" stroke="#2d9e4e" stroke-width="2" stroke-linecap="round"/>
      <!-- sun -->
      <circle cx="50" cy="14" r="5" fill="#fbbf24"/>
      <defs>
        <linearGradient id="water" x1="6" y1="52" x2="58" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e3a5f"/>
          <stop offset="50%" stop-color="#1d4ed8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#1e3a5f"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="brand">Codey Village</div>
    <p class="auth-sub">Code. Earn coins. Beat your friends.</p>
    <button id="loginBtn">Sign in with Google</button>
  `;
  document.getElementById("loginBtn").addEventListener("click", () => {
    chrome.tabs.create({ url: WEB_APP_URL + "/auth" });
  });
}

async function renderMain(uid, username) {
  const { coins: cachedCoins = 0 } = await chrome.storage.local.get("coins");

  document.getElementById("auth-section").innerHTML = `
    <div class="user-row">
      <span class="user-name">
        <svg width="16" height="16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline;vertical-align:middle;margin-right:4px">
          <ellipse cx="32" cy="52" rx="26" ry="7" fill="#0f2744"/>
          <ellipse cx="32" cy="46" rx="18" ry="6" fill="#c9a84c"/>
          <ellipse cx="32" cy="44" rx="14" ry="4" fill="#e0b85a"/>
          <path d="M32 44 Q30 34 28 24" stroke="#7c5c2a" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M28 24 Q18 18 16 10" stroke="#2d9e4e" stroke-width="2" stroke-linecap="round"/>
          <path d="M28 24 Q30 14 34 10" stroke="#34b85a" stroke-width="2" stroke-linecap="round"/>
          <path d="M28 24 Q38 22 42 20" stroke="#2d9e4e" stroke-width="2" stroke-linecap="round"/>
          <circle cx="50" cy="14" r="5" fill="#fbbf24"/>
        </svg>${username || "Player"}</span>
      <span class="coin-badge" id="coinCount">🪙 ${cachedCoins}</span>
      <button id="signoutBtn">Sign out</button>
    </div>
  `;
  document.getElementById("main-section").style.display = "block";

  document.getElementById("signoutBtn").addEventListener("click", async () => {
    await chrome.storage.local.remove(["firebaseUid", "firebaseIdToken", "firebaseUsername", "coins", "githubUsername"]);
    window.location.reload();
  });

  await renderLog(uid);

  const { githubUsername: cachedGithub } = await chrome.storage.local.get("githubUsername");
  const btn = document.getElementById("connectGithub");
  if (cachedGithub && btn) {
    btn.innerHTML = `<span class="gh-dot connected"></span>@${cachedGithub}`;
    btn.disabled = true;
    btn.classList.add("connected");
  } else if (btn) {
    btn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
      Connect GitHub`;
    btn.addEventListener("click", () => {
      chrome.tabs.create({ url: `${WEB_APP_URL}/lobby` });
    });
  }

  fetchCoinsFromBackend(uid).then((coins) => {
    const el = document.getElementById("coinCount");
    if (el) el.textContent = `🪙 ${coins}`;
  });

  fetchGithubStatus(uid).then((githubLogin) => {
    const btn = document.getElementById("connectGithub");
    if (!btn || btn.disabled) return;
    if (githubLogin) {
      btn.innerHTML = `<span class="gh-dot connected"></span>@${githubLogin}`;
      btn.disabled = true;
      btn.classList.add("connected");
      chrome.storage.local.set({ githubUsername: githubLogin });
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

function buildEntryHTML(entry) {
  const coins = COIN_VALUES[entry.type] ?? 0;
  const icon = ENTRY_ICONS[entry.type] ?? "•";
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let title = "";
  let sub = "";

  if (entry.type === "leetcode_accepted") {
    title = formatSlug(entry.details?.problem_slug);
    const parts = [entry.details?.lang, entry.details?.runtime].filter(Boolean);
    sub = parts.join(" · ");
  } else if (entry.type === "github_commit") {
    title = "GitHub Commit";
    sub = entry.details?.repo || "";
  } else if (entry.type === "job_application") {
    title = "Job Applied";
    const match = (entry.details?.url || "").match(/\/\/([^.]+)/);
    sub = match ? match[1] : "";
  }

  return `
    <div class="entry">
      <span class="entry-icon">${icon}</span>
      <div class="entry-body">
        <span class="entry-title">${title}</span>
        ${sub ? `<span class="entry-sub">${sub}</span>` : ""}
      </div>
      <div class="entry-meta">
        <span class="entry-coins">+${coins} 🪙</span>
        <span class="entry-time">${time}</span>
      </div>
    </div>
  `;
}

async function renderLog(uid) {
  const log = document.getElementById("log");
  if (!log) return;

  const { activityLog: localLog = [] } = await chrome.storage.local.get("activityLog");

  // Fetch backend ledger (includes webhook-triggered events like GitHub commits)
  let backendEntries = [];
  if (uid) {
    try {
      const res = await fetch(`${BACKEND_URL}/coins/${uid}/recent?limit=20`);
      if (res.ok) backendEntries = await res.json();
    } catch {}
  }

  // Normalise backend entries to same shape as local entries
  const backendNormalised = backendEntries.map((e) => ({
    type: e.activity_type,
    timestamp: e.timestamp,
    details: e.details || {},
    source: "backend",
  }));

  // Merge: deduplicate by type+timestamp (backend is authoritative)
  const localFiltered = localLog.filter((local) =>
    !backendNormalised.some((b) => b.type === local.type && Math.abs(new Date(b.timestamp) - new Date(local.timestamp)) < 5000)
  );

  const merged = [...backendNormalised, ...localFiltered]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 30);

  if (merged.length === 0) {
    log.innerHTML = '<p class="empty">No activity yet — solve a problem to start!</p>';
    return;
  }

  log.innerHTML = merged.map(buildEntryHTML).join("");
}

init();

let prevLogLength = 0;
chrome.storage.local.get("activityLog").then(({ activityLog = [] }) => {
  prevLogLength = activityLog.length;
});

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
  if ("activityLog" in changes) {
    const newLog = changes.activityLog.newValue ?? [];
    if (newLog.length > prevLogLength) {
      playDing();
      prevLogLength = newLog.length;
    }
    chrome.storage.local.get("firebaseUid").then(({ firebaseUid }) => renderLog(firebaseUid));
  }
});
